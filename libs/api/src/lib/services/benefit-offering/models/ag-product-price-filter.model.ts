export interface AgProductPriceFilter {
    planId: number;
    memberMappings: MemberMappings[];
}
export interface MemberMappings {
    ageMaxOption: number;
    ageMinOption: number;
    memberType: MemberTypeEnum;
    tobaccoStatusOptions: string[];
}
export enum MemberTypeEnum {
    "EMPLOYEE" = "EMPLOYEE",
    "CHILD" = "CHILD",
    "SPOUSE" = "SPOUSE",
}
