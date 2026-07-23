import { Prisma, PrismaClient } from '@prisma/client';
import { isProduction } from '../config/env.js';
import { currentActorId } from '../lib/requestContext.js';

/**
 * Models are grouped by which lifecycle fields they actually declare (see
 * schema.prisma header comment) — computed from the DMMF instead of
 * hardcoded so a new model automatically gets the right behavior the moment
 * it declares `deletedAt`/`createdBy`/`updatedBy`.
 */
function modelsWithField(fieldName: string): Set<string> {
  return new Set(
    Prisma.dmmf.datamodel.models
      .filter((m) => m.fields.some((f) => f.name === fieldName))
      .map((m) => m.name),
  );
}

const softDeleteModels = modelsWithField('deletedAt');
const createdByModels = modelsWithField('createdBy');
const updatedByModels = modelsWithField('updatedBy');

function withNotDeletedFilter(where: Record<string, unknown> | undefined) {
  if (where && Object.prototype.hasOwnProperty.call(where, 'deletedAt')) {
    // Caller explicitly asked about deletedAt (e.g. an admin "show deleted" view) — respect it.
    return where;
  }
  return { ...where, deletedAt: null };
}

/**
 * The one PrismaClient the rest of the app should import. Enforces two
 * conventions globally so no module/controller/service has to remember them:
 *
 *  1. Soft delete — reads on any model with `deletedAt` are automatically
 *     scoped to non-deleted rows unless the caller explicitly filters on
 *     `deletedAt` itself. `delete`/`deleteMany` on such models throw,
 *     pointing callers at `softDelete()`/`softDeleteMany()` below instead —
 *     loud failure beats a silently-wrong hard delete.
 *  2. Audit stamping — `createdBy`/`updatedBy` are auto-filled from the
 *     current request's actor (see lib/requestContext.ts) when the caller
 *     didn't already set them.
 */
function createExtendedPrismaClient() {
  const base = new PrismaClient({
    log: isProduction ? ['error', 'warn'] : ['error', 'warn'],
  });

  return base.$extends({
    name: 'atyantik-conventions',
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (softDeleteModels.has(model)) {
            (args as { where?: Record<string, unknown> }).where = withNotDeletedFilter(
              (args as { where?: Record<string, unknown> }).where,
            );
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (softDeleteModels.has(model)) {
            (args as { where?: Record<string, unknown> }).where = withNotDeletedFilter(
              (args as { where?: Record<string, unknown> }).where,
            );
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (softDeleteModels.has(model)) {
            (args as { where?: Record<string, unknown> }).where = withNotDeletedFilter(
              (args as { where?: Record<string, unknown> }).where,
            );
          }
          return query(args);
        },
        async aggregate({ model, args, query }) {
          if (softDeleteModels.has(model)) {
            (args as { where?: Record<string, unknown> }).where = withNotDeletedFilter(
              (args as { where?: Record<string, unknown> }).where,
            );
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          const result = await query(args);
          if (softDeleteModels.has(model) && result && (result as { deletedAt?: unknown }).deletedAt) {
            return null;
          }
          return result;
        },
        async findUniqueOrThrow({ model, args, query }) {
          const result = await query(args);
          if (softDeleteModels.has(model) && result && (result as { deletedAt?: unknown }).deletedAt) {
            throw new Prisma.PrismaClientKnownRequestError(
              `No ${model} found matching the given criteria (soft-deleted).`,
              { code: 'P2025', clientVersion: Prisma.prismaVersion.client },
            );
          }
          return result;
        },
        async create({ model, args, query }) {
          const data = args.data as Record<string, unknown>;
          const actorId = currentActorId();
          if (actorId && createdByModels.has(model) && data.createdBy === undefined) {
            data.createdBy = actorId;
          }
          if (actorId && updatedByModels.has(model) && data.updatedBy === undefined) {
            data.updatedBy = actorId;
          }
          return query(args);
        },
        async update({ model, args, query }) {
          const actorId = currentActorId();
          if (actorId && updatedByModels.has(model)) {
            const data = args.data as Record<string, unknown>;
            if (data.updatedBy === undefined) data.updatedBy = actorId;
          }
          return query(args);
        },
        async updateMany({ model, args, query }) {
          const actorId = currentActorId();
          if (actorId && updatedByModels.has(model)) {
            const data = args.data as Record<string, unknown>;
            if (data.updatedBy === undefined) data.updatedBy = actorId;
          }
          return query(args);
        },
        async delete({ model, query, args }) {
          if (softDeleteModels.has(model)) {
            throw new Error(
              `${model}.delete() is disabled — this model is soft-deletable. Use softDelete(prisma, '${model}', where) from src/db/prisma.ts instead.`,
            );
          }
          return query(args);
        },
        async deleteMany({ model, query, args }) {
          if (softDeleteModels.has(model)) {
            throw new Error(
              `${model}.deleteMany() is disabled — this model is soft-deletable. Use softDeleteMany(prisma, '${model}', where) from src/db/prisma.ts instead.`,
            );
          }
          return query(args);
        },
      },
    },
  });
}

export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>;

declare global {
  var __atyantikPrisma: ExtendedPrismaClient | undefined;
  var __atyantikPrismaRaw: PrismaClient | undefined;
}

/** The extended client — import this everywhere in modules/services/repositories. */
export const prisma: ExtendedPrismaClient = globalThis.__atyantikPrisma ?? createExtendedPrismaClient();

/**
 * The type of the `tx` argument inside `prisma.$transaction(async (tx) => ...)`.
 * NOT the same nominal type as `Prisma.TransactionClient` — the extension
 * changes the client's shape — so any function taking a transaction client as
 * a parameter (e.g. a service split into several `tx`-scoped helpers) should
 * type it as `PrismaTransaction`, not `Prisma.TransactionClient`.
 */
export type PrismaTransaction = Parameters<Parameters<ExtendedPrismaClient['$transaction']>[0]>[0];

/**
 * Unextended escape hatch for genuine hard deletes (GDPR erasure, data
 * retention jobs). Restricted by convention + an ESLint restricted-import
 * rule to `src/jobs/**` — never import this from a module/controller.
 */
export const prismaRaw: PrismaClient = globalThis.__atyantikPrismaRaw ?? new PrismaClient();

if (!isProduction) {
  globalThis.__atyantikPrisma = prisma;
  globalThis.__atyantikPrismaRaw = prismaRaw;
}

function delegateFor(model: Prisma.ModelName) {
  const delegateName = model.charAt(0).toLowerCase() + model.slice(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (prisma as any)[delegateName];
}

/**
 * Soft-deletes a single row. `model` must be a Prisma model name that
 * declares `deletedAt` (e.g. "Employee") — every module's repository should
 * call this instead of `prisma.<model>.delete()`, which throws by design.
 */
export async function softDelete(model: Prisma.ModelName, id: string): Promise<void> {
  await delegateFor(model).update({ where: { id }, data: { deletedAt: new Date() } });
}

/** Soft-deletes every row matching `where`. */
export async function softDeleteMany(
  model: Prisma.ModelName,
  where: Record<string, unknown>,
): Promise<{ count: number }> {
  return delegateFor(model).updateMany({ where, data: { deletedAt: new Date() } });
}
