import { baseConfig } from '@atyantik/config/eslint.base.js';

export default [
  ...baseConfig,
  {
    rules: {
      // src/db/prisma.ts is the one sanctioned place for prismaRaw usage;
      // everything else should import { prisma } and go through the
      // soft-delete/audit-stamping extension.
      'no-restricted-imports': [
        'warn',
        {
          paths: [
            {
              name: '../db/prisma.js',
              importNames: ['prismaRaw'],
              message: 'prismaRaw is reserved for src/jobs/** hard-delete/retention jobs.',
            },
          ],
        },
      ],
    },
  },
];
