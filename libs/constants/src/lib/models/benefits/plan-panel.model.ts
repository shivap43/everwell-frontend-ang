import { PolicyOwnershipType, TaxStatus, VasFunding } from "../../enums";
import { CountryState, Rider } from "../api";

export interface PlanPanel {
    selected: boolean;
    isPlanDisabled?: boolean;
    managePlanYear?: boolean;
    productId: string | number;
    productIdNumber: string;
    productName: string;
    planId: number;
    planName: string;
    planChoiceId: number;
    planYearId?: number;
    continous: boolean;
    enrollmentEndDate: string;
    carrierId: number;
    carrier: string;
    riders: Rider[];
    states: CountryState[];
    cafeteria: boolean;
    cafeteriaEligible: boolean;
    preTaxEligible: boolean;
    taxStatus: TaxStatus;
    defaultTaxStatus: TaxStatus;
    taxStatusReadOnly: boolean;
    agentAssisted: boolean;
    agentAssistedDisabled: boolean;
    vasFunding: VasFunding;
    policyOwnershipType: PolicyOwnershipType;
    eligibility?: boolean;
    isRelianceStdPlan?: boolean;
    isEmpFundedPlanDisabled?: boolean;
    isAutoEnrollable: boolean;
}
