export type DocumentCategory =
	| 'ID_PROOF'
	| 'ADDRESS_PROOF'
	| 'EDUCATIONAL'
	| 'EXPERIENCE'
	| 'OFFER_LETTER'
	| 'CONTRACT'
	| 'PAYSLIP'
	| 'POLICY'
	| 'OTHER';

export interface DocumentRow {
	id: string;
	title: string;
	category: DocumentCategory;
	isConfidential: boolean;
	createdAt: string;
	currentVersion: {
		id: string;
		fileUrl: string;
		mimeType: string | null;
		fileSize: number | null;
	} | null;
}
