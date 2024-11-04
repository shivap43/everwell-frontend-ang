import { DependencyTypes, MissingInfoType, PlanType } from "../enums";
import { CoverageLevel } from "./api";
import { BuyUpOptions } from "./buyup-options.model";
import { DisablePlanPanel } from "./disable-plan-panel.model";
import { EnrollmentBeneficiary } from "./enrollment-beneficiary.model";
import { EnrollmentRequirement } from "./enrollmentRequirement.model";
import { Enrollments } from "./enrollments.model";
import { GetCartItems } from "./getCartItems.model";
import { MoreSettings } from "./moreSettings.model";
import { PlanOffering } from "./planOffering.model";
import { PlanOfferingPricing } from "./planOfferingPricing.model";
import { RiderCart } from "./rider-cart.model";

export interface PlanOfferingPanel extends PlanOffering {
    cost?: number;
    totalCost?: number;
    adjustments?: number;
    inCart?: boolean;
    selectedPricing?: PlanOfferingPricing;
    aflacPolicyFeePricing?: PlanOfferingPricing;
    selectedCoverage?: CoverageLevel;
    riderAmount?: number;
    hsaFsaAmount?: number;
    hsaFsaCoverage?: string;
    coverageLevel?: CoverageLevel[];
    planPricing?: PlanOfferingPricing[];
    filteredPlanPricing?: PlanOfferingPricing[];
    ridersData?: PlanOfferingPanel[];
    isCoverageSection?: boolean;
    isEliminationPeriodSection?: boolean;
    isBenefitAmountSection?: boolean;
    isRiderSection?: boolean;
    isHsaSection?: boolean;
    isJuvenileSection?: boolean;
    minHSA?: number;
    maxHSA?: number;
    contributionYear?: string;
    enrollmentStatus?: string;
    cartItem?: GetCartItems;
    enrollment?: Enrollments;
    showSummary?: boolean;
    supplementary?: boolean;
    disable?: DisablePlanPanel;
    companyProvided?: boolean;
    vasPlan?: boolean;
    stackable?: boolean;
    autoEnroll?: boolean;
    buyUp?: BuyUpOptions;
    BASE_PRICE_DATA?: TableModel[];
    columns?: any;
    dataSource?: any;
    displayedColumns?: any;
    benefitAmountValue?: string;
    benefitAmounts?: number[];
    type?: PlanType;
    coverageLevelMapping?: CoverageLevel[][];
    isRiderSelected?: boolean;
    riderCartItem?: RiderCart;
    riderTableData?: TableModel[];
    riderCoverageName?: string;
    checkRiderUpdated?: boolean;
    tooltipMessage?: any;
    link?: string;
    selectedDependentAge?: string;
    resetDependentAge?: string;
    returnOfPremiumRider?: boolean;
    brokerSelected?: boolean;
    dependentOn?: DependencyTypes.BASE | DependencyTypes.RIDER;
    enrollmentRequirements?: EnrollmentRequirement[];
    benefitDollarData?: TableModel[];
    editCoverage?: boolean;
    coverageStartFunction?: string;
    childAge?: number;
    genericPlan?: boolean;
    addOnRider?: string;
    riderDetails?: PlanOfferingPanel;
    expired?: boolean;
    crossBorderRestrict?: boolean;
    beneficiaries?: EnrollmentBeneficiary[];
    riderPlanDependencyText?: string;
    reinstateEnded?: boolean;
    reistateEndedPlan?: boolean;
    moreSettingsObject?: MoreSettings;
    hasDuplicatePlan?: boolean;
    missingInformation?: MissingInfoType;
    hideEditButton?: boolean;
}
export interface TableModel {
    [key: number]: string;
}
