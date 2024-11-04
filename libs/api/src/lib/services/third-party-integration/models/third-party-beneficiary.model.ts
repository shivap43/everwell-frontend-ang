import { ThirdPartyBeneficiaryType } from "../enums";

export interface ThirdPartyBeneficiary {
    name: string;
    type: ThirdPartyBeneficiaryType;
    percentOfBenefit: string;
}
