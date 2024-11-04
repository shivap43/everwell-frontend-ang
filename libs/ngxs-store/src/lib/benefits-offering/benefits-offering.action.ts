/* eslint-disable max-classes-per-file */
import { ProductSelection, CarrierFormResponse, RegionNames, CarrierSetupStatus } from "@empowered/api";
import { ApprovalToasterStatus } from "./benefits-offering.model";
import { PanelModel, PlanChoice, CountryState, PlanYear } from "@empowered/constants";
import { OfferingSteps } from "./constants/initial-offering-steps.model";

export class SetAllProducts {
    static readonly type = "[BenefitsOfferingStateModel] setAllProducts";
}

export class SetAllCarriers {
    static readonly type = "[BenefitsOfferingStateModel] setAllCarriers";
}
export class SetPlanChoices {
    static readonly type = "[BenefitsOfferingStateModel] SetPlanChoices";
    constructor(public useUnapproved: boolean) {}
}

export class SetDefaultPlanChoices {
    static readonly type = "[BenefitsOfferingStateModel] SetDefaultPlanChoices";
}

export class SetEligibleEmployees {
    static readonly type = "[BenefitsOfferingStateModel] SetEligibleEmployees";
    constructor(public eligibleEmployees: number) {}
}

export class SetNewPlanYearSelection {
    static readonly type = "[BenefitsOfferingStateModel] SetNewPlanYearSelection";
    constructor(public newPlanYear: string) {}
}

export class SetAllEligiblePlans {
    static readonly type = "[BenefitsOfferingStateModel] setAllEligiblePlans";
    constructor(public states: string[], public accountType: string) {}
}

export class GetProductsPanel {
    static readonly type = "[BenefitsOfferingStateModel] GetProductsPanel";
}

export class GetEligibleEmployees {
    static readonly type = "[BenefitsOfferingStateModel] GetEligibleEmployees";
}
export class UpdateProductsPanel {
    static readonly type = "[BenefitsOfferingStateModel] UpdateProductsPanel";
    constructor(public panelProducts: PanelModel[]) {}
}
export class MapProductChoiceToPanelProduct {
    static readonly type = "[BenefirOfferingStateModel] MapProductChoiceToPanelProduct";
    constructor(public selectedProducts: ProductSelection[]) {}
}
export class MapPlanChoicesToPanelProducts {
    static readonly type = "[BenefirOfferingStateModel] MapPlanChoicesToPanelProducts";
    constructor() {}
}
export class SetBenefitsStateMPGroup {
    static readonly type = "[BenefitsOfferingStateModel] SetBenefitsStateMPGroup";
    constructor(public mpGroup: number) {}
}
export class DiscardPlanChoice {
    static readonly type = "[BenefitsOfferingStateModel] DiscardPlanChoice";
    constructor() {}
}
export class SetPlanEligibility {
    static readonly type = "[BenefitsOfferingStateModel] SetPlanEligibility";
    constructor() {}
}
export class SetLandingFlag {
    static readonly type = "[BenefitsOfferingStateModel] SetLandingFlag";
}
export class UpdateBenefitsOfferingState {
    static readonly type = "[BenefitsOfferingStateModel] UpdateBenefitsOfferingState";
    constructor(public states: CountryState[]) {}
}
export class SetCarrierForms {
    static readonly type = "[BenefitsOfferingStateModel] SetCarrierForms";
    constructor(public useUnapproved: boolean, public initialFlow: boolean) {}
}
export class SaveCarrierFormResponses {
    // Makes an API call
    static readonly type = "[BenefitsOfferingStateModel] SaveCarrierFormResponses";
    constructor(
        public responses: CarrierFormResponse[],
        public carrierId: number,
        public carrierFormId: number,
        public useUnapproved: boolean,
    ) {}
}
export class SetRegions {
    static readonly type = "[BenefitsOfferingStateModel] SetRegions";
    constructor(public regionList: RegionNames[]) {}
}

export class SetProductCombinations {
    static readonly type = "[BenefitsOfferingStateModel] SetProductCombinations";
    constructor(public combinations: any[]) {}
}
export class SetPopupExitStatus {
    static readonly type = "[BenefitsOfferingStateModel] SetPopupExitStatus";
    constructor(public exitPopupStatus: boolean) {}
}
export class SaveCarrierSetupStatus {
    static readonly type = "[BenefitsOfferingStateModel] SaveCarrierSetupStatus";
    constructor(public statusPayload: CarrierSetupStatus, public carrierId: number, public useUnapproved: boolean) {}
}
export class GetCarrierSetupStatuses {
    static readonly type = "[BenefitsOfferingStateModel] GetCarrierSetupStatus";
    constructor(public carrierIds: number[], public filterWageWorks: boolean) {}
}
export class SetMaintenanceRequiredData {
    static readonly type = "[BenefitsOfferingStateModel] SetMaintenanceRequiredData";
    constructor() {}
}
export class SetUnapprovedPanel {
    static readonly type = "[BenefitsOfferingStateModel] SetUnapprovedPanel";
    constructor() {}
}
export class SetUnapprovedPlanChoices {
    static readonly type = "[BenefitsOfferingStateModel] SetUnapprovedPlanChoices";
    constructor() {}
}

export class SetUnapprovedPlanChoicesWithPayload {
    static readonly type = "[BenefitsOfferingStateModel] SetUnapprovedPlanChoicesWithPayload";
    constructor(public planChoices: PlanChoice[]) {}
}
export class MapProductChoiceToUnapprovedPanelProduct {
    static readonly type = "[BenefirOfferingStateModel] MapProductChoiceToUnapprovedPanelProduct";
    constructor(public selectedProducts: ProductSelection[]) {}
}
export class MapPlanChoicesToPlans {
    static readonly type = "[BenefirOfferingStateModel] MapPlanChoicesToPlans";
    constructor(public updatedPlanchoices: PlanChoice[]) {}
}
export class UpdateNewPlanYearChoice {
    static readonly type = "[BenefirOfferingStateModel] updatePlanYearId";
    constructor(public choice: boolean, public planYearId: number, public planYear: PlanYear) {}
}
export class SetNewPlanYearPanel {
    static readonly type = "[BenefitsOfferingStateModel] SetNewPlanYearPanel";
    constructor() {}
}
export class MapProductChoiceToNewPlanYearPanel {
    static readonly type = "[BenefirOfferingStateModel] MapProductChoiceToNewPlanYearPanel";
    constructor(public selectedProducts: ProductSelection[]) {}
}
export class MapPlanChoicesToNewPlanYearPanel {
    static readonly type = "[BenefirOfferingStateModel] MapPlanChoicesToNewPlanYearPanel";
    constructor(public updatedPlanchoices: PlanChoice[]) {}
}
export class SetUserPlanChoice {
    static readonly type = "[BenefirOfferingStateModel] SetUserPlanChoice";
    constructor(public planChoices: PlanChoice[]) {}
}
export class SetManagePlanYearChoice {
    static readonly type = "[BenefitOfferingStateModel] SetManagePlanYearChoice";
    constructor(public choice: string) {}
}
export class MakeStoreEmpty {
    static readonly type = "[BenefitOfferingStateModel] MakeStoreEmpty";
    constructor() {}
}
export class SetProductsTabView {
    static readonly type = "[BenefitOfferingStateModel] SetProductsTabView";
    constructor(public view: any[]) {}
}

export class SetApprovalToastValue {
    static readonly type = "[BenefitOfferingStateModel] SetApprovalToastValue";
    constructor(public approvalToasterAppeared: ApprovalToasterStatus) {}
}
export class SetStepperData {
    static readonly type = "[BenefitOfferingStateModel] SetStepperData";
    constructor(public steps: OfferingSteps) {}
}
export class GetRSLIEligibility {
    static readonly type = "[BenefitOfferingStateModel] GetRSLIEligibility";
}
export class ResetQuasiModalVariables {
    static readonly type = "[BenefitOfferingStateModel] ResetQuasiModalVariables";
    constructor() {}
}
export class SetSubmitApprovalToasterStatus {
    static readonly type = "[BenefitOfferingStateModel] SetSubmitApprovalToasterStatus";
    constructor(public approvalToasterStatus: ApprovalToasterStatus) {}
}
export class SetAccountThirdPartyPlatforms {
    static readonly type = "[BenefitOfferingStateModel] SetAccountThirdPartyPlatforms";
    constructor() {}
}
export class SetVasExceptions {
    static readonly type = "[BenefitOfferingStateModel] SetVasExceptions";
    constructor() {}
}
export class SetThirdPartyPlatformRequirement {
    static readonly type = "[BenefitOfferingStateModel] SetThirdPartyPlatformRequirement";
    constructor() {}
}

export class SetProductPlanChoices {
    static readonly type = "[BenefitOfferingStateModel] SetProductPlanChoices";
    constructor() {}
}

export class UpdateCurrentPlanYearId {
    static readonly type = "[BenefitOfferingStateModel] updateCurrentPlanYearId";
    constructor(public currentPlanYearId: number) {}
}

export class SetNewPlanYearValue {
    static readonly type = "[BenefitsOfferingStateModel] SetNewPlanYearValue";
    constructor(public isNewPlanYear: boolean) {}
}
