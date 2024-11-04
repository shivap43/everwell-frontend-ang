import { SafeResourceUrl } from "@angular/platform-browser";
import { MissingInfoType, PolicyOwnershipType, TaxStatus } from "../../enums";
import { Characteristics } from "../../enums/charactaristics.enum";
import { Eligibility } from "../../enums/eligibility.enum";
import { CoverageLevelRule } from "../coverage-level-rule.model";
import { Validity } from "../validity.model";
import { Carrier } from "./carrier.model";
import { GetPlan, PlanYear } from "./plan-year.model";
import { Product } from "./product.model";
import { AllowedState, CountryState } from "./state.model";

export interface Plan {
    id: number; // (global plan Id)
    name: string;
    adminName: string;
    productId?: number;
    carrierId: number;
    policySeries?: string;
    sunsetDate?: string;
    characteristics?: Characteristics[];
    dependentPlanIds?: number[];
    dependentPlans?: Plan[];
    planSeriesId?: number;
    missingEmployerFlyer: boolean;
    /**
     * Used to sort Plans / PlanOfferings when being displayed
     */
    displayOrder: number;
    mutuallyExclusivePlanIds?: number[];
    policyOwnershipType?: PolicyOwnershipType;
    product?: Product;
    carrier?: AccountCarrier;
    pricingModel?: string;
    pricingEditable?: boolean;
    enrollable?: boolean;
    taxStatus?: TaxStatus;
    taxStatusReadOnly?: boolean;
    cafeteriaEligible?: boolean;
    vasFunding?: VasFunding;
    riders?: Rider[];
    agentAssisted?: boolean;
    agentAssistedDisabled?: boolean;
    planEligibility?: PlansEligibility;
    description: string;
    carrierNameOverride?: string;
    planYearId?: number;
    states?: CountryState[];
    plan?: GetPlan;
    tppAlert?: string;
    ridersTooltipInfo?: string;
    planYear?: PlanYear;
    stateTooltipInfo?: string;
    rider?: boolean;
    pricing?: Pricing;
    planPriceSelection?: number[];
    // Denotes whether the plan is selected to be included in the Quick Quote rate sheet.
    rateSheetSelection?: boolean;
    // id of shopping cart item (plan), differs from id
    itemId?: number;
    coverageLevels?: CoverageLevel[];
    planDetails?: PlanDetailsBase;
    selectedEliminationPeriod?: number[];
    // stores price selections for multiple dependent ages/elimination periods
    multiplePlanPriceSelections?: Record<number, number[]>;
    shortName?: string;
    planSeriesCategory?: string;
}

export interface PlansEligibility {
    planId: number;
    eligibility: Eligibility;
    inEligibleReason?: string;
    allowedStates: AllowedState[];
}

export interface CoveragePeriod {
    effectiveStarting: string;
    expiresAfter?: string;
}

export interface PlanDetailsBase {
    planDetailItems?: PlanDetails[];
    minAge?: number;
    maxAge?: number;
    validity?: Validity;
    minEligibleSubscribers?: number;
    maxEligibleSubscribers?: number;
    lowestBasePremium?: number;
    requiredPriceRateProperties?: MissingInfoType[];
}

export interface PlanDetails {
    name: string;
    value: string;
    coverageDetailDisplayName: string;
    coverageDetailDisplayValue: string;
    valueType: "BOOLEAN" | "STRING" | "INTEGER" | "CURRENCY" | "PERCENTAGE" | "MONTHS";
    network: "IN_NETWORK" | "OUT_OF_NETWORK";
}

export interface CoverageLevel {
    id?: number;
    name?: string;
    /**
     * @deprecated
     */
    displayOrder?: number;
    eliminationPeriod?: string;
    iconLocation?: string;
    icon?: SafeResourceUrl;
    retainCoverageLevel?: boolean;
    rule?: CoverageLevelRule;
    spouseCovered?: boolean;
}

export interface Pricing {
    benefitAmountInfo: BenefitAmountInfo;
    coverageLevelPricing: CoverageLevelPricing[];
    riders: QuickQuoteRider[];
}

export interface BenefitAmountInfo {
    benefitIncrement?: number;
    defaultBenefitAmount?: number;
    matchBasePlan?: boolean;
    maxBenefitAmount?: number;
    minBenefitAmount?: number;
    readOnly?: boolean;
    restrictedBenefitAmounts?: number[];
}

export interface CoverageLevelPricing {
    coverageLevel: CoverageLevel;
    price: number;
    benefitAmount?: number;
    eliminationPeriod: boolean;
    missingInfo?: string[];
    errorInfo?: string[];
    childAge?: number;
}

export interface QuickQuoteRider {
    benefitAmountInfos: BenefitAmountInfo[];
    coverageLevelPricing: CoverageLevelPricing[];
    plan: Plan;
}

export interface Rider {
    name: string;
}

export interface AccountCarrier {
    id: number;
    name: string;
}

enum VasFunding {
    HQ = "HQ",
    EMPLOYER = "EMPLOYER",
    EMPLOYEE = "EMPLOYEE",
}

export interface AgentInfo {
    partyKey: string;
    fullName: string;
    writingNumber?: string;
    email: string;
}

export interface RefreshEligibleInfo {
    refreshAllowed: boolean;
    requiresBenefitOfferingRenewal: boolean;
}

export interface PlanProductInfo {
    aflacAgentInformation: AgentInfo[];
    allProducts: Product[];
    allCarriers: Carrier[];
    agHardStopErrors: string;
}

export interface BenefitFilter {
    productId: string;
    riders?: string[];
    carriers?: string[];
    states?: string[];
}
