import { Document } from "@empowered/constants";

export interface MemberNote {
    id?: number;
    text: string;
    createDate?: string;
    updateDate?: string;
    updateAdminId?: number;
    documentIds?: number[];
    createAdmin?: object;
    updateAdmin?: object;
    documents?: Document[];
    formInfo?: FormInfo;
}

export interface FormInfo {
    id?: number;
    signed?: boolean;
    type?: string;
    signedOn?: string;
}
