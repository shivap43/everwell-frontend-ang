export interface MemberQualifierType {
    id: number;
    memberType: string;
    qualifierCode: string;
}

export interface MemberQualifier {
    value: string; // true/false
    validity: MemberQualifierValidity;
    id?: number;
}

export interface MemberQualifierValidity {
    effectiveStarting: string; // YYYY-MM-DD
    expiresAfter?: string; // YYYY-MM-DD, must be after effectiveStarting
}
