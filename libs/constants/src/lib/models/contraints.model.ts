import { Operation } from "./../enums/operation.enum";

export enum BenefitAmountType {
    NEW_BUSINESS_GI_AMOUNT = "NEW_BUSINESS_GI_AMOUNT",
    CONVERSION_GI_AMOUNT = "CONVERSION_GI_AMOUNT",
    NONE = "NONE",
}
export interface Contraints {
    type: string;
    operation: Operation;
    value: string;
    questionId?: number;
    planId?: number;
    benefitAmountType?: BenefitAmountType;
}
