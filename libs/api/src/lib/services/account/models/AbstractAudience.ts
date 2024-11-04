export interface AudienceGroup {
    id?: number;
    audiences?: AbstractAudience[];
}

export interface AbstractAudience {
    readonly id?: number;
    type: AudienceType;
}

export type AudienceType =
    | "ORG"
    | "CLAZZ"
    | "REGION"
    | "SSN"
    | "EMPLOYEE_ID"
    | "EMPLOYMENT_STATUS"
    | "ENROLLMENT_PRODUCT"
    | "ENROLLMENT_PLAN"
    | "QUALIFIER"
    | "ENROLLMENT_QUESTION_RESPONSE";
