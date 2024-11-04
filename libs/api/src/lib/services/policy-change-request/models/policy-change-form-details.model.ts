import { SupportingDocumentsModel } from "./sopporting-documents.model";
import { AffectedPolicies } from "./affected-policies.model";

export interface PolicyChangeFormDetailsModel {
    affectedPolicies: AffectedPolicies[];
    description: string;
    supportingDocuments: SupportingDocumentsModel[];
    memberId: number;
    cifNumber: string;
}
