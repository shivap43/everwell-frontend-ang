export interface CaseBuilderAdmin {
    id: number;
    name: string;
    validity: {
        effectiveStarting: string;
        expiresAfter: string;
    };
}

export interface CaseBuilder {
    id: number;
    name: string;
    caseBuilderId: number;
    caseBuilder: CaseBuilderDetails;
    validity: {
        effectiveStarting: string;
        expiresAfter: string;
    };
}

export interface CaseBuilderDetails {
    id: number;
    name: string;
    validity: {
        effectiveStarting: string;
        expiresAfter: string;
    };
    caseBuilder: {
        id: number;
        name: string;
        validity: {
            effectiveStarting: "";
            expiresAfter: "";
        };
    };
    activateMenu: boolean;
    disableRemove: boolean;
}

export interface CaseBuilderRequest {
    id: number;
    caseBuilderId: number;
    validity: {
        effectiveStarting: string;
        expiresAfter: string;
    };
}
