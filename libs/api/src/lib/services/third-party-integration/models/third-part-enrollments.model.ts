import { ThirdPartyBeneficiary } from "./third-party-beneficiary.model";

export interface ThirdPartyEnrollments {
    identifier?: string;
    product?: string;
    plan?: string;
    planSeries?: string;
    policyNumber?: string;
    coverageStartDate?: string;
    coverageLevel?: string;
    taxStatus?: string;
    productPrice?: number;
    memberPortion?: number;
    isRider?: boolean;
    isRiderOf?: string;
    approvalStatus?: string;
    benefitAmount?: number;
    paymentMethod?: string;
    assistingProducerNationalProducerNumber?: string;
    beneficiaries?: ThirdPartyBeneficiary[];
}
