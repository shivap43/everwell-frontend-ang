import { Validity } from "@empowered/constants";

export type Resource = CompanyResource | BenefitResource;

interface ResourceBase {
    readonly id?: number;
    name: string;
    /**
     * readOnly after initial creation of Resource
     */
    resourceType: ResourceType;
    description: string;
    link?: string;
    documentId?: number;
    documentName?: string;
    readonly fileType?: FileType;
    audienceGroupingId?: number;
    visibilityValidity?: Validity;
    employeeAcceptanceDate?: Date | string;
}
interface CompanyResource extends ResourceBase {
    type: "COMPANY";
    category: string;
}

interface BenefitResource extends ResourceBase {
    type: "BENEFIT";
    productId: number;
    carrierId: number;
}

export enum ResourceType {
    FILE = "FILE",
    VIDEO = "VIDEO",
    URL = "URL",
}

export enum FileType {
    PDF = "PDF",
    TEXT = "TEXT",
    WORD_DOCUMENT = "WORD_DOCUMENT",
    EXCEL = "EXCEL",
    CSV = "CSV",
    OTHER = "OTHER",
}
