export interface NavItem {
	label: string;
	href: string;
	icon: string;
	/** Permission key required to see this item; omitted = visible to any authenticated user. */
	permission?: string;
}

export interface NavSection {
	label: string;
	items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
	{
		label: 'Overview',
		items: [{ label: 'Dashboard', href: '/dashboard', icon: 'bi-speedometer2' }]
	},
	{
		label: 'People',
		items: [
			{ label: 'Employees', href: '/employees', icon: 'bi-people', permission: 'employee:read' },
			{ label: 'Attendance', href: '/attendance', icon: 'bi-calendar-check' },
			{ label: 'Leave', href: '/leave', icon: 'bi-airplane' },
			{ label: 'Payroll', href: '/payroll', icon: 'bi-cash-coin' },
			{ label: 'Performance', href: '/performance', icon: 'bi-graph-up-arrow' },
			{ label: 'Timesheets', href: '/timesheets', icon: 'bi-clock-history' }
		]
	},
	{
		label: 'Workplace',
		items: [
			{ label: 'Assets', href: '/assets', icon: 'bi-laptop' },
			{ label: 'Announcements', href: '/announcements', icon: 'bi-megaphone' },
			{ label: 'Helpdesk', href: '/helpdesk', icon: 'bi-life-preserver' },
			{ label: 'Learning', href: '/learning', icon: 'bi-mortarboard' },
			{ label: 'Expenses', href: '/expenses', icon: 'bi-receipt' },
			{ label: 'Travel', href: '/travel', icon: 'bi-suitcase' },
			{ label: 'Documents', href: '/documents', icon: 'bi-folder2-open' }
		]
	},
	{
		label: 'Talent',
		items: [
			{
				label: 'Recruitment',
				href: '/recruitment',
				icon: 'bi-person-badge',
				permission: 'recruitment:read'
			},
			// Exit Management is a self-service page (submit your own resignation —
			// see requireAuth() with no permission arg on its base route) — NOT
			// gated behind the admin-only exit:read permission, unlike Recruitment above.
			{ label: 'Exit Management', href: '/exit', icon: 'bi-box-arrow-right' }
		]
	},
	{
		label: 'Insights',
		items: [{ label: 'Reports', href: '/reports', icon: 'bi-bar-chart', permission: 'report:read' }]
	},
	{
		label: 'Administration',
		items: [
			{
				label: 'Company Setup',
				href: '/admin/company',
				icon: 'bi-building',
				permission: 'company_setting:read'
			},
			{
				label: 'Departments',
				href: '/admin/departments',
				icon: 'bi-diagram-3',
				permission: 'department:read'
			},
			{
				label: 'Roles & Permissions',
				href: '/admin/roles',
				icon: 'bi-shield-lock',
				permission: 'role:read'
			},
			{
				label: 'Audit Logs',
				href: '/admin/audit-logs',
				icon: 'bi-journal-text',
				permission: 'audit_log:read'
			},
			{
				label: 'Projects',
				href: '/admin/projects',
				icon: 'bi-kanban',
				permission: 'timesheet:approve'
			}
		]
	}
];
