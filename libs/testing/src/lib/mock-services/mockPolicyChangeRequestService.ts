import { of } from "rxjs";

export const mockPolicyChangeRequestService = {
    getListChangeForms: (mpGroup?: number, memberId?: number) => of(),
    refreshListChangeForms: (mpGroup?: number, memberId?: number) => of(),
    getPolicyChangeForm: (formId: number) => of(),
    getPolicyChangeFormDetails: (formId: number) => of(),
    downloadPolicyChangeRequests: (mpGroup?: number) => of(),
    searchPolicies: (searchparams: any) => of(),
    uploadSupportiveTransactionDocuments: (
        file: File,
        mpGroup: number,
        memberId: number,
        cifNumber: string,
        allowMultiPartFile?: boolean,
    ) => of(),
    addTransactionDocumentsToForm: (formId: number, transactionDocumentIds: number[]) => of(),
    getListChangeForm: (mpGroup: number, memberId: number) => of(),
    savePolicyChangeRequest: (signature: string, forms: any, policyHolderDetails: any) => of(),
    savePolicyChangeRequestMemeber: (forms: any, groupId: number, memberId: number, signature: string, policyNumber?: string) => of(),
    getPolicyChangeTransactionDocument: (transactionDocumentId: number) => of(),
    downloadPolicyChangeTransactionDocument: (transactionDocumentId: any) => of(),
};
