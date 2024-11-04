import { Admin } from "./admin.model";

export interface Document {
    readonly id: number;
    fileName: string;
    description: string;
    type: DocumentType;
    reportType: ReportType;
    uploadDate: string;
    uploadAdminId: number;
    uploadAdmin?: Admin;
    status: DocumentStatus;
}

export interface Documents {
    content: DocumentContent[];
    empty: boolean;
    first: boolean;
    last: boolean;
    // eslint-disable-next-line id-denylist
    number: number;
    numberOfElements: number;
    pageable: string;
    size: number;
    sort: SortObj;
    totalElements: number;
    totalPages: number;
}

export interface SortObj {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
}
export interface DocumentContent {
    id: number;
    fileName: string;
    status: string;
    type: string;
    uploadAdmin: Admin;
    uploadDate: string;
}
export type DocumentType = "CENSUS" | "REPORT" | "TPI_TECHNICAL_DOCUMENT" | "PLAN_DOCUMENT";
export type ReportType = "DEMOGRAPHICS" | "ENROLLMENT" | "DEDUCTIONS" | "PDA" | "COMMISSIONS";
export type DocumentStatus = "PROCESSING" | "FAILED" | "COMPLETE";
