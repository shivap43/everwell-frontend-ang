import {
    Carrier,
    ProductSelection,
    PlansEligibility,
    CarrierFormWithCarrierInfo,
    RegionNames,
    CarrierSetupStatus,
    DeletePlanChoice,
    RSLIEligibility,
    ThirdPartyPlatformRequirement,
} from "@empowered/api";
import { ActivatedRoute } from "@angular/router";
import { SafeHtml } from "@angular/platform-browser";
import { OfferingSteps } from "./constants/initial-offering-steps.model";
import { PanelModel, Exceptions, PlanChoice, CountryState, Plan, Product, StatusType, PlanYear } from "@empowered/constants";

export interface BenefitsOfferingStateModel {
    allProducts: Product[];
    allCarriers: Carrier[];
    panelProducts: PanelModel[];
    eligiblePlans: Plan[];
    planChoices: PlanChoice[];
    planCarriers: number[];
    planEligibilty: PlansEligibility[];
    mpGroup: number;
    benefitOferingStates: CountryState[];
    productChoices: ProductSelection[];
    defaultStep: number;
    approvedCarrierForms: CarrierFormWithCarrierInfo[];
    unApprovedCarrierForms: CarrierFormWithCarrierInfo[];
    region: RegionNames[];
    combinations: any[];
    exitPopupStatus?: boolean;
    unApprovedPlanChoices: PlanChoice[];
    unApprovedProductChoices: ProductSelection[];
    unapprovedPanelProducts: PanelModel[];
    userNewPlanYearChoice: boolean;
    newPlanYearId: number;
    newplanYearPanel: PanelModel[];
    newPlanYearProductChoice: ProductSelection[];
    userPlanChoices: PlanChoice[];
    carrierSetupStatuses: CarrierSetupStatus[];
    managePlanYearChoice: string;
    productsTabView: any[];
    newPlanYearDetail: PlanYear;
    defaultStates: CountryState[];
    hasApprovalAppeared: ApprovalToasterStatus[];
    offeringSteps: OfferingSteps;
    eligibleEmployees: number;
    isNewPlanYear?: boolean;
    newPlanYearSelection: string;
    approvedProductChoices: ProductSelection[];
    rsliEligibility: RSLIEligibility;
    errorMessageKey?: string;
    submitApprovalToasterStatus?: ApprovalToasterStatus[];
    isAccountTPP: boolean;
    exceptions?: Exceptions[];
    thirdPartyRequirement: ThirdPartyPlatformRequirement;
    attributeId: number;
    currentPlanYearId?: number;
}
// eslint-disable-next-line max-classes-per-file
export interface PlanPanelModel {
    plan: Plan;
    planChoice: PlanChoice;
    states: CountryState[];
    planEligibilty: PlansEligibility;
}
export interface CoveragePeriodPanel {
    product: Product;
    carrier: Carrier;
    plans: PlanPanelModel[];
    taxBenefitType?: string;
}

export interface ApprovalToasterStatus {
    mpGroup: number;
    hasToasterAppeared?: boolean;
    isSubmitToasterClosed?: boolean;
}

export interface RemovePlansDialogData {
    route: ActivatedRoute;
    mpGroup: number;
    deletedPlan: DeletePlanChoice;
    choiceId: number;
    continuous: boolean;
    enrollmentStartDate: string;
    enrollmentEndDate?: string;
    planDetails: PlanDetailModel;
    productDetails: ProductDetailModel;
}

export interface PlanDetailModel {
    plan: PlanChoice;
    state: string;
    statesTooltip: string;
    planYear?: PlanYear;
    planChoice: PlanChoiceDetail;
    planStatus: string;
    planTooltipValue: SafeHtml;
    planHighAlert: boolean;
    planLowAlertTooltip: string;
}
export interface PlanChoiceDetail {
    planChoiceId: number;
    priceSet: boolean;
    enrollmentsExist: boolean;
}
export interface ProductDetailModel {
    productName: string;
    policyOwnershipType: string;
    carrierName: string;
    carrierId: number;
    plansCount: number;
    plans: PlanDetailModel[];
    planYear: string;
    planYearToolTip: string;
    planYears: number;
    planYearCount: string;
    planLowAlert: boolean;
    planLowAlertTooltip: boolean;
    productHighAlert: boolean;
    approvalStatus: string;
}
export interface AlertModel {
    status: StatusType;
    plans?: number;
}
