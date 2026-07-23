export type AnnouncementAudience =
	'ALL_EMPLOYEES' | 'DEPARTMENT' | 'BRANCH' | 'ROLE' | 'SPECIFIC_EMPLOYEES';

export interface Announcement {
	id: string;
	title: string;
	body: string;
	audience: AnnouncementAudience;
	publishAt: string;
	expiresAt: string | null;
	isPinned: boolean;
	attachments: { id: string; fileUrl: string; fileName: string; mimeType: string | null }[];
	createdAt: string;
}
