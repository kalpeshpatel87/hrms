import { PrismaClient, SalaryComponentType, ComponentCalculationType, HolidayType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL ?? 'kalpeshpatel@atyantik.com';
const SUPER_ADMIN_INITIAL_PASSWORD = process.env.SUPER_ADMIN_INITIAL_PASSWORD ?? 'ChangeMe@12345';

// module -> actions. Kept as data (not hardcoded per-route) so new actions/modules
// can be added later purely by re-running the seed.
const PERMISSION_MATRIX: Record<string, string[]> = {
  employee: ['create', 'read', 'update', 'delete', 'export'],
  department: ['create', 'read', 'update', 'delete'],
  designation: ['create', 'read', 'update', 'delete'],
  branch: ['create', 'read', 'update', 'delete'],
  team: ['create', 'read', 'update', 'delete'],
  shift: ['create', 'read', 'update', 'delete'],
  holiday: ['create', 'read', 'update', 'delete'],
  role: ['create', 'read', 'update', 'delete'],
  permission: ['read', 'update'],
  company_setting: ['read', 'update'],
  audit_log: ['read', 'export'],
  attendance: ['create', 'read', 'update', 'approve', 'export'],
  leave: ['create', 'read', 'update', 'delete', 'approve', 'export'],
  payroll: ['create', 'read', 'update', 'approve', 'export'],
  performance: ['create', 'read', 'update', 'delete'],
  timesheet: ['create', 'read', 'update', 'approve'],
  asset: ['create', 'read', 'update', 'delete'],
  announcement: ['create', 'read', 'update', 'delete'],
  exit: ['create', 'read', 'update', 'approve'],
  recruitment: ['create', 'read', 'update', 'delete'],
  helpdesk: ['create', 'read', 'update', 'delete'],
  learning: ['create', 'read', 'update', 'delete'],
  expense: ['create', 'read', 'update', 'approve'],
  travel: ['create', 'read', 'update', 'approve'],
  document: ['create', 'read', 'update', 'delete'],
  report: ['read', 'export'],
};

// Self-service actions the EMPLOYEE role gets, scoped to their own records —
// ownership checks (e.g. "leave:create" only for the requester's own employeeId)
// are enforced in the service layer, not by a separate permission row.
const EMPLOYEE_SELF_SERVICE: Array<{ module: string; action: string }> = [
  { module: 'employee', action: 'read' },
  { module: 'holiday', action: 'read' },
  { module: 'announcement', action: 'read' },
  { module: 'attendance', action: 'create' },
  { module: 'attendance', action: 'read' },
  { module: 'leave', action: 'create' },
  { module: 'leave', action: 'read' },
  { module: 'payroll', action: 'read' },
  { module: 'timesheet', action: 'create' },
  { module: 'timesheet', action: 'read' },
  { module: 'asset', action: 'read' },
  { module: 'performance', action: 'read' },
  { module: 'helpdesk', action: 'create' },
  { module: 'helpdesk', action: 'read' },
  { module: 'expense', action: 'create' },
  { module: 'expense', action: 'read' },
  { module: 'travel', action: 'create' },
  { module: 'travel', action: 'read' },
  { module: 'document', action: 'read' },
  { module: 'learning', action: 'read' },
];

async function seedPermissions() {
  const permissions = Object.entries(PERMISSION_MATRIX).flatMap(([module, actions]) =>
    actions.map((action) => ({ module, action, key: `${module}:${action}` })),
  );

  await Promise.all(
    permissions.map((p) =>
      prisma.permission.upsert({
        where: { key: p.key },
        create: p,
        update: {},
      }),
    ),
  );

  return prisma.permission.findMany();
}

async function seedRoles(allPermissions: Awaited<ReturnType<typeof seedPermissions>>) {
  const superAdminRole = await prisma.role.upsert({
    where: { slug: 'super_admin' },
    create: {
      name: 'Super Admin',
      slug: 'super_admin',
      description: 'Full access to every module. Only assigned to the company super administrator.',
      isSystem: true,
    },
    update: {},
  });

  const employeeRole = await prisma.role.upsert({
    where: { slug: 'employee' },
    create: {
      name: 'Employee',
      slug: 'employee',
      description: 'Employee self-service access only. No administrative permissions.',
      isSystem: true,
    },
    update: {},
  });

  await Promise.all(
    allPermissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: permission.id } },
        create: { roleId: superAdminRole.id, permissionId: permission.id },
        update: {},
      }),
    ),
  );

  const employeePermissionIds = allPermissions.filter((p) =>
    EMPLOYEE_SELF_SERVICE.some((sp) => sp.module === p.module && sp.action === p.action),
  );

  await Promise.all(
    employeePermissionIds.map((permission) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: employeeRole.id, permissionId: permission.id } },
        create: { roleId: employeeRole.id, permissionId: permission.id },
        update: {},
      }),
    ),
  );

  return { superAdminRole, employeeRole };
}

async function seedCompany() {
  return prisma.company.upsert({
    where: { id: 'atyantik-technologies' },
    create: {
      id: 'atyantik-technologies',
      name: 'Atyantik Technologies Pvt. Ltd.',
      legalName: 'Atyantik Technologies Private Limited',
      addressLine1: '501, Privilege Avenue',
      addressLine2: 'Atlantis Lane, Dr. Vikram Sarabhai Marg',
      city: 'Vadodara',
      state: 'Gujarat',
      country: 'India',
      postalCode: '390023',
      timezone: 'Asia/Kolkata',
      defaultCurrency: 'INR',
    },
    update: {},
  });
}

async function seedBranch(companyId: string) {
  return prisma.branch.upsert({
    where: { companyId_code: { companyId, code: 'HQ' } },
    create: {
      companyId,
      name: 'Head Office - Vadodara',
      code: 'HQ',
      addressLine1: '501, Privilege Avenue',
      addressLine2: 'Atlantis Lane, Dr. Vikram Sarabhai Marg',
      city: 'Vadodara',
      state: 'Gujarat',
      country: 'India',
      postalCode: '390023',
      timezone: 'Asia/Kolkata',
    },
    update: {},
  });
}

async function seedDepartment(companyId: string) {
  return prisma.department.upsert({
    where: { companyId_code: { companyId, code: 'ADMIN' } },
    create: { companyId, name: 'Administration', code: 'ADMIN' },
    update: {},
  });
}

async function seedDesignation(departmentId: string) {
  const existing = await prisma.designation.findFirst({ where: { title: 'Super Administrator', departmentId } });
  if (existing) return existing;
  return prisma.designation.create({
    data: { title: 'Super Administrator', level: 100, departmentId },
  });
}

async function seedShift(companyId: string) {
  const existing = await prisma.shift.findFirst({ where: { companyId, name: 'General Shift' } });
  if (existing) return existing;
  return prisma.shift.create({
    data: {
      companyId,
      name: 'General Shift',
      startTime: '09:30',
      endTime: '18:30',
      breakMinutes: 60,
      weekOffDays: ['SATURDAY', 'SUNDAY'],
      gracePeriodMinutes: 10,
    },
  });
}

async function seedSuperAdmin(params: {
  companyId: string;
  branchId: string;
  departmentId: string;
  designationId: string;
  shiftId: string;
  superAdminRoleId: string;
}) {
  const passwordHash = await bcrypt.hash(SUPER_ADMIN_INITIAL_PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: SUPER_ADMIN_EMAIL },
    create: {
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      isEmailVerified: true,
      isActive: true,
      mustChangePassword: true,
    },
    update: {},
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: params.superAdminRoleId } },
    create: { userId: user.id, roleId: params.superAdminRoleId, assignedBy: user.id },
    update: {},
  });

  const employee = await prisma.employee.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      employeeCode: 'ATY-0001',
      firstName: 'Kalpesh',
      lastName: 'Patel',
      companyId: params.companyId,
      branchId: params.branchId,
      departmentId: params.departmentId,
      designationId: params.designationId,
      shiftId: params.shiftId,
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      dateOfJoining: new Date(),
    },
    update: {},
  });

  await prisma.department.update({
    where: { id: params.departmentId },
    data: { headEmployeeId: employee.id },
  });

  return { user, employee };
}

async function seedLeaveTypes(companyId: string) {
  const types = [
    { code: 'ANNUAL', name: 'Annual Leave', quota: 18 },
    { code: 'CASUAL', name: 'Casual Leave', quota: 12 },
    { code: 'SICK', name: 'Sick Leave', quota: 12 },
    { code: 'MATERNITY', name: 'Maternity Leave', quota: 182 },
    { code: 'PATERNITY', name: 'Paternity Leave', quota: 15 },
    { code: 'LOP', name: 'Loss of Pay', quota: 0 },
    { code: 'COMP_OFF', name: 'Comp Off', quota: 0 },
  ];

  const created = [];
  for (const t of types) {
    const leaveType = await prisma.leaveType.upsert({
      where: { companyId_code: { companyId, code: t.code } },
      create: {
        companyId,
        code: t.code,
        name: t.name,
        isPaid: t.code !== 'LOP',
        requiresApproval: true,
        allowNegativeBalance: false,
      },
      update: {},
    });

    if (t.quota > 0) {
      const existingPolicy = await prisma.leavePolicy.findFirst({ where: { companyId, leaveTypeId: leaveType.id } });
      if (!existingPolicy) {
        await prisma.leavePolicy.create({
          data: {
            companyId,
            leaveTypeId: leaveType.id,
            applicableEmploymentTypes: ['FULL_TIME'],
            annualQuota: t.quota,
            accrualFrequency: 'ANNUAL',
            effectiveFrom: new Date(new Date().getFullYear(), 0, 1),
          },
        });
      }
    }
    created.push(leaveType);
  }
  return created;
}

async function seedHolidays(companyId: string) {
  const year = new Date().getFullYear();
  const holidays: Array<{ name: string; date: string; type: HolidayType }> = [
    { name: "New Year's Day", date: `${year}-01-01`, type: 'NATIONAL' },
    { name: 'Republic Day', date: `${year}-01-26`, type: 'NATIONAL' },
    { name: 'Holi', date: `${year}-03-14`, type: 'REGIONAL' },
    { name: 'Independence Day', date: `${year}-08-15`, type: 'NATIONAL' },
    { name: 'Gandhi Jayanti', date: `${year}-10-02`, type: 'NATIONAL' },
    { name: 'Diwali', date: `${year}-11-08`, type: 'NATIONAL' },
    { name: 'Christmas', date: `${year}-12-25`, type: 'NATIONAL' },
  ];

  for (const h of holidays) {
    const existing = await prisma.holiday.findFirst({ where: { companyId, name: h.name, date: new Date(h.date) } });
    if (!existing) {
      await prisma.holiday.create({
        data: { companyId, name: h.name, date: new Date(h.date), type: h.type },
      });
    }
  }
}

async function seedSalaryComponents(companyId: string) {
  const components = [
    { code: 'BASIC', name: 'Basic Salary', type: SalaryComponentType.EARNING, calc: ComponentCalculationType.PERCENTAGE_OF_CTC },
    { code: 'HRA', name: 'House Rent Allowance', type: SalaryComponentType.EARNING, calc: ComponentCalculationType.PERCENTAGE_OF_BASIC },
    { code: 'CONVEYANCE', name: 'Conveyance Allowance', type: SalaryComponentType.EARNING, calc: ComponentCalculationType.FIXED },
    { code: 'SPECIAL_ALLOWANCE', name: 'Special Allowance', type: SalaryComponentType.EARNING, calc: ComponentCalculationType.FORMULA },
    { code: 'BONUS', name: 'Bonus', type: SalaryComponentType.EARNING, calc: ComponentCalculationType.FIXED },
    { code: 'PF_EMPLOYEE', name: 'Provident Fund (Employee)', type: SalaryComponentType.DEDUCTION, calc: ComponentCalculationType.PERCENTAGE_OF_BASIC },
    { code: 'PF_EMPLOYER', name: 'Provident Fund (Employer)', type: SalaryComponentType.EMPLOYER_CONTRIBUTION, calc: ComponentCalculationType.PERCENTAGE_OF_BASIC },
    { code: 'ESI', name: 'Employee State Insurance', type: SalaryComponentType.DEDUCTION, calc: ComponentCalculationType.PERCENTAGE_OF_CTC },
    { code: 'PROFESSIONAL_TAX', name: 'Professional Tax', type: SalaryComponentType.DEDUCTION, calc: ComponentCalculationType.FIXED },
    { code: 'INCOME_TAX', name: 'Income Tax (TDS)', type: SalaryComponentType.DEDUCTION, calc: ComponentCalculationType.FORMULA },
  ];

  for (const c of components) {
    await prisma.salaryComponent.upsert({
      where: { companyId_code: { companyId, code: c.code } },
      create: { companyId, code: c.code, name: c.name, type: c.type, calculationType: c.calc, isTaxable: c.type === 'EARNING' },
      update: {},
    });
  }
}

async function main() {
  console.log('Seeding Atyantik EMS...');

  const allPermissions = await seedPermissions();
  const { superAdminRole } = await seedRoles(allPermissions);
  const company = await seedCompany();
  const branch = await seedBranch(company.id);
  const department = await seedDepartment(company.id);
  const designation = await seedDesignation(department.id);
  const shift = await seedShift(company.id);

  const { user } = await seedSuperAdmin({
    companyId: company.id,
    branchId: branch.id,
    departmentId: department.id,
    designationId: designation.id,
    shiftId: shift.id,
    superAdminRoleId: superAdminRole.id,
  });

  await seedLeaveTypes(company.id);
  await seedHolidays(company.id);
  await seedSalaryComponents(company.id);

  console.log('Seed complete.');
  console.log(`Super Admin: ${user.email} (initial password set from SUPER_ADMIN_INITIAL_PASSWORD env var, must be changed on first login)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
