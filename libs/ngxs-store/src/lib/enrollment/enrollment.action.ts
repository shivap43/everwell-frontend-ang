/* eslint-disable max-classes-per-file */
import {
    PayFrequency,
    ApiError,
    EnrollmentMethod,
    Application,
    GetCartItems,
    MemberBeneficiary,
    Enrollments,
    MemberDependent,
    MemberFlexDollar,
    EnrollmentInformation,
    PlanOfferingPanel,
    PlanYear,
    ProductOfferingPanel,
} from "@empowered/constants";
import { Observable } from "rxjs";
import { SkippedStepData } from "./enrollment.model";
import {
    CustomApplication,
    RiderApplicationPanel,
    PlanCoverageLevelRules,
    HashKeys,
    Reinstate,
    AccountProducerList,
} from "@empowered/constants";

export class SetMemberAge {
    static readonly type = "[EnrollmentStateModel] SetMemberAge";
    constructor(public age: number) {}
}
export class SetMemberName {
    static readonly type = "[EnrollmentStateModel] SetMemberName";
    constructor(public name: string) {}
}

export class SetMemberDependents {
    static readonly type = "[EnrollmentStateModel] SetMemberDependents";
    constructor(public dependents: MemberDependent[]) {}
}

export class SetMemberBeneficiaries {
    static readonly type = "[EnrollmentStateModel] SetMemberBeneficiaries";
    constructor(public beneficiaries: MemberBeneficiary[]) {}
}

export class SetMPGroup {
    static readonly type = "[EnrollmentStateModel] SetMPGroup";
    constructor(public mpGroup: number) {}
}

export class SetMemberId {
    static readonly type = "[EnrollmentStateModel] SetMemberId";
    constructor(public memberId: number) {}
}

export class SetPayFrequency {
    static readonly type = "[EnrollmentStateModel] SetPayFrequency";
    constructor(public payFrequency: PayFrequency) {}
}

export class SetPlanStatus {
    static readonly type = "[EnrollmentStateModel] SetPlanStatus";
    constructor(public productOfferingId: number, public planOfferingId: number) {}
}

export class SetProductOfferings {
    static readonly type = "[EnrollmentStateModel] SetProductOfferings";
    constructor(public productOfferings: ProductOfferingPanel[]) {}
}

export class SetAllPlanOfferings {
    static readonly type = "[EnrollmentStateModel] SetAllPlanOfferings";
    constructor(public planOfferings: PlanOfferingPanel[]) {}
}

export class SetProductPlanOfferings {
    static readonly type = "[EnrollmentStateModel] SetProductPlanOfferings";
    constructor(public productOfferingId: number, public planOfferings: PlanOfferingPanel[]) {}
}

export class SetProductOfferingsOfId {
    static readonly type = "[EnrollmentStateModel] SetProductOfferingsID";
    constructor(public productOfferings: ProductOfferingPanel) {}
}

export class SetNavBarType {
    static readonly type = "[EnrollmentStateModel] SetNavBarType";
    constructor(public navType: string) {}
}

export class SetPlanOfferingById {
    static readonly type = "[PlanOfferings] SetPlanOfferingById";
    constructor(public prodOffId: number, public planOff: PlanOfferingPanel) {}
}

export class LoadApplicationFlowData {
    static readonly type = "[ApplicationFlow] LoadApplicationFlowData";
    constructor(public memberId: number, public mpGroup: number) {}
}

export class LoadApplicationResponses {
    static readonly type = "[ApplictionResponse] LoadApplicationResponse";
    constructor() {}
}

export class LoadAllPlanOfferings {
    static readonly type = "[PlanOfferings] LoadAllPlanOfferings";
    constructor(public payload: Observable<any>[]) {}
}

export class LoadAllPlans {
    static readonly type = "[AllPlans] LoadAllPlans";
    constructor() {}
}

export class LoadProductById {
    static readonly type = "[PlanOfferings] LoadProductById";
    constructor(public prodOffId: number) {}
}

export class LoadPlanOfferingById {
    static readonly type = "[PlanOfferings] LoadPlanOfferingById";
    constructor(public prodOffId: number, public planOffId: number) {}
}

export class MapDataForApplicationFlow {
    static readonly type = "[DataMapping] DataMapping";
    constructor() {}
}
export class MapApplicationResponse {
    static readonly type = "[MapResponse] DataMapping";
    constructor() {}
}

export class SetEnrollmentMethod {
    static readonly type = "[EnrollmentStateModel] SetEnrollmentMethod";
    constructor(public enrollmentMethod: EnrollmentMethod) {}
}

export class SetEnrollmentState {
    static readonly type = "[EnrollmentStateModel] SetEnrollmentState";
    constructor(public enrollmentState: string) {}
}
export class UpdateApplicationResponse {
    static readonly type = "[EnrollmentStateModel] UpdateApplicationResponse";
    constructor(public memberId: number, public itemId: number, public mpGroup: number) {}
}

export class SetEnrollments {
    static readonly type = "[EnrollmentStateModel] SetEnrollments";
    constructor(public enrollments: Enrollments[]) {}
}

export class SetExitPopupStatus {
    static readonly type = "[EnrollmentStateModel] SetExitPopupStatus";
    constructor(public exitPopupStatus: boolean) {}
}
export class UpdateConstraintValues {
    static readonly type = "[EnrollmentStateModel] UpdateConstraintValues";
    constructor(public type: string, public value: any, public flowId?: number, public cartId?: number) {}
}
export class SetBaseCoverageLevel {
    static readonly type = "[EnrollmentStateModel] SetBaseCoverageLevel ";
    constructor(public baseRules: PlanCoverageLevelRules) {}
}
export class SetRuleForRider {
    static readonly type = "[EnrollmentStateModel] SetRuleForRider ";
    constructor(public riderRule: PlanCoverageLevelRules) {}
}
export class UpdateCartData {
    static readonly type = "[EnrollmentStateModel] UpdateCart";
    constructor(public cartId: number, public planOfferingId: number) {}
}
export class SetMemberData {
    static readonly type = "[EnrollmentStateModel] MemberProfile";
    constructor() {}
}
export class UpdateApplicationPanel {
    static readonly type = "[EnrollmentStateModel] UpdateAppPanel";
    constructor(public appPanel: CustomApplication, public riderPanel: RiderApplicationPanel[]) {}
}
export class DiscardCartItem {
    static readonly type = "[EnrollmentStateModel] DiscardCartItem";
    constructor(public cartId: number, public riderCart: boolean, public isReinstate: boolean) {}
}
export class CarrierRiskClass {
    static readonly type = "[EnrollmentStateModel] CarrierRiskClass";
    constructor() {}
}
export class SetAflacAlways {
    static readonly type = "[EnrollmentStateModel] SetAflacAlways";
    constructor() {}
}
export class SetPaymentCost {
    static readonly type = "[EnrollmentStateModel] SetPaymentCost";
    constructor(public cartItemId: number) {}
}
export class ReinstatementFlow {
    static readonly type = "[EnrollmentStateModel] ReinstatementFlow";
    constructor(public application: Application[], public planIds: number[], public id: number, public cart: GetCartItems[]) {}
}
export class PatchApplication {
    static readonly type = "[EnrollmentStateModel] PatchApplication";
    constructor(public application: Application) {}
}
export class RemoveApplication {
    static readonly type = "[EnrollmentStateModel] DeleteApplication";
    constructor(public appFlowId: number) {}
}
export class AddcartData {
    static readonly type = "[EnrollmentStateModel] AddcartData";
    constructor(public cartData: GetCartItems) {}
}
export class UpdateHashKeys {
    static readonly type = "[EnrollmentStateModel] SetHashKeys";
    constructor(public responseHash: HashKeys[]) {}
}
export class DiscardRiderCartItem {
    static readonly type = "[EnrollmentStateModel] DiscardRiderCartItem";
    constructor(
        public index: number,
        public planId: number,
        public riderCartId: number,
        public parentCartId: number,
        public planOfferingId: number,
    ) {}
}

export class SetCartItems {
    static readonly type = "[EnrollmentStateModel] SetCartItems";
    constructor(public memberId: number, public mpGroup: number) {}
}

export class SetKnockOutData {
    static readonly type = "[EnrollmentStateModel] SetKnockOutData";
    constructor(public knockoutData: any) {}
}
export class DeleteKnockOutData {
    static readonly type = "[EnrollmentStateModel] DeleteKnockOutData";
    constructor(public knockoutData: any) {}
}
export class ResetPlanKnockOutData {
    static readonly type = "[EnrollmentStateModel] ResetPlanKnockOutData";
    constructor(public planId: number) {}
}
export class SetPayment {
    static readonly type = "[EnrollmentStateModel] SetPayment";
    constructor(public carrierId?: number) {}
}

export class SetEBSPayment {
    static readonly type = "[EnrollmentStateModel] SetEBSPayment";
    constructor(public acctType?: string) {}
}
export class SetDirectPaymentCost {
    static readonly type = "[EnrollmentStateModel] SetDirectPaymentCost";
    constructor(public carrierId: number, public isReinstate: boolean) {}
}
export class MakeAppFlowStoreEmpty {
    static readonly type = "[EnrollmentStateModel] MakeAppFlowStoreEmpty";
    constructor() {}
}
export class SetSSNData {
    static readonly type = "[EnrollmentStateModel] SSNData";
    constructor() {}
}
export class SetMemberContact {
    static readonly type = "[EnrollmentStateModel] MemberContact";
    constructor() {}
}
export class SetEmployeeId {
    static readonly type = "[EnrollmentStateModel] EmployeeId";
    constructor() {}
}
export class SetPartnerAccountType {
    static readonly type = "[EnrollmentStateModel] AccountType";
    constructor() {}
}
export class SetCompanyProductsDisplayed {
    static readonly type = "[EnrollmentStateModel] CompanyProductDisplayed";
    constructor(public value?: boolean) {}
}
export class DeclineRiderCartItem {
    static readonly type = "[EnrollmentStateModel] DeclineRiderCartItem";
    constructor(public index: number, public planId: number, public declineFlag: boolean) {}
}

export class SetProductPlanData {
    static readonly type = "[EnrollmentStateModel] SetProductPlanData";
    constructor(public data: any) {}
}

/**
 * Sets info about the employee's dependents.
 */
export class SetDependentMember {
    static readonly type = "[EnrollmentStateModel] SetMemberDependents";
    constructor(public mpGroup?: number, public memberId?: number) {}
}

export class SetNewPlan {
    static readonly type = "[EnrollmentStateModel] SetNewPlan";
    constructor(public productId: number, public newPlanOfferingObject: PlanOfferingPanel, public planIndex: number) {}
}

export class SetNewProduct {
    static readonly type = "[EnrollmentStateModel] SetNewProduct";
    constructor(
        public productId: number,
        public newProductOfferingObject: ProductOfferingPanel,
        public newPlan?: PlanOfferingPanel,
        public cartItems?: GetCartItems[],
    ) {}
}

export class SetAddtoCart {
    static readonly type = "[EnrollmentStateModel] SetAddtoCart";
    constructor(
        public productId: number,
        public newPlanOfferingObject: PlanOfferingPanel,
        public cartItems?: GetCartItems[],
        public isEnrolled?: boolean,
    ) {}
}

export class UpdatePlan {
    static readonly type = "[EnrollmentStateModel] UpdatePlan";
    constructor(public productId: number, public newPlanOfferingObject: PlanOfferingPanel, public cartItems?: GetCartItems[]) {}
}

export class DisablePlan {
    static readonly type = "[EnrollmentStateModel] DisablePlan";
    constructor(public productId: number, public newPlanOfferingObject: PlanOfferingPanel) {}
}
export class ResetProductPlanData {
    static readonly type = "[EnrollmentStateModel] ResetProductPlanData";
    constructor() {}
}
export class UpdateSkippedStepResponses {
    static readonly type = "[EnrollmentStateModel] UpdateSkippedStepResponses";
    constructor(public skippedData: SkippedStepData) {}
}

export class SetIsOpenEnrollment {
    static readonly type = "[EnrollmentStateModel] SetIsOpenEnrollment";
    constructor(public mpGroup: number, public useUnapproved: boolean, public inOpenEnrollment?: boolean) {}
}

export class SetQLE {
    static readonly type = "[EnrollmentStateModel] SetQLE";
    constructor(public memberId: number, public mpGroup: number) {}
}

export class RemoveStackablePlan {
    static readonly type = "[EnrollmentStateModel] RemoveStackablePlan";
    constructor(public productId: number, public cartItemId: number, public cartItems?: GetCartItems[]) {}
}
/**
 * to set reinstateItem values
 */
export class SetReinstateItem {
    static readonly type = "[EnrollmentStateModel] SetReinstateItem";
    constructor(public reinstate: Reinstate) {}
}
/**
 * to empty reinstateItem values on completion/ close of reinstate
 */
export class MakeReinstateStoreEmpty {
    static readonly type = "[EnrollmentStateModel] MakeReinstateStoreEmpty";
    constructor() {}
}
/**
 * to copy cart Data
 */
export class CopyCartData {
    static readonly type = "[EnrollmentStateModel] CopyCartData";
    constructor(public cartData: GetCartItems[]) {}
}
/**
 * to set flow type to either payroll or direct
 * @param isDirect indicates if it's direct or payroll flow
 */
export class SetFlowType {
    static readonly type = "[EnrollmentStateModel] SetFlowType";
    constructor(public isDirect: boolean) {}
}

/**
 * set member flex dollar details
 */
export class SetMemberFlexDollars {
    static readonly type = "[EnrollmentStateModel] SetMemberFlexDollars";
    constructor(public memberFlexDollars: MemberFlexDollar[]) {}
}
/**
 * Method to set enrollment information
 */
export class SetEnrollmentInformation {
    static readonly type = "[EnrollmentStateModel] SetEnrollmentInformation";
    constructor(public enrollmentInfo: EnrollmentInformation) {}
}

export class SetSalaryAndRelatedConfigs {
    static readonly type = "[EnrollmentStateModel] SetSalaryAndRelatedConfigs";
    constructor(public memberId: number, public mpGroup: number) {}
}

/**
 * Method to set Risk Class Id
 * @param riskClassId Indicates rick Class Id
 */
export class SetRiskClassId {
    static readonly type = "[EnrollmentStateModel] SetRiskClassId";
    constructor(public riskClassId: number) {}
}
/**
 * Method to set where to land on shop experience
 * * @param isPlanListPage Indicates whether to land on plan listing page
 */
export class SetIsPlanListPage {
    static readonly type = "[EnrollmentStateModel] SetRiskClassId";
    constructor(public isPlanListPage: boolean) {}
}

/**
 * Method to set account producer list
 * * @param list: Account producer list
 */
export class SetAccountProducerList {
    static readonly type = "[EnrollmentStateModel] SetAccountProducerList";
    constructor(public list: AccountProducerList) {}
}
/**
 * Class to set api error message
 * * @param error: Error object received from api
 */
export class SetErrorForShop {
    static readonly type = "[EnrollmentStateModel] SetErrorForShop";
    constructor(public error: ApiError) {}
}
/**
 * Class to reset api error message
 */
export class ResetApiErrorMessage {
    static readonly type = "[EnrollmentStateModel] ResetApiErrorMessage";
    constructor() {}
}
/**
 * Class to set product and plan data as empty if api error
 * * @param error: Error object received from api
 */
export class SetProductPlanDataEmptyIfError {
    static readonly type = "[EnrollmentStateModel] SetProductPlanDataEmptyIfError";
    constructor(public error: ApiError) {}
}

/**
 * Set company products acknowledged members
 */
export class SetCompanyProductsAcknowledgedMembers {
    static readonly type = "[EnrollmentStateModel] SetCompanyProductsAcknowledgedMembers";
    constructor(public membersList: number[]) {}
}

/**
 * Sets member's full profile.
 */
export class SetFullMemberProfile {
    static readonly type = "[EnrollmentStateModel] SetFullMemberProfile";
    constructor(public mpGroup: number, public memberId: number) {}
}

/**
 * Sets open enrollment plan years.
 */
export class SetOpenEnrollmentPlanYears {
    static readonly type = "[EnrollmentStateModel] SetOpenEnrollmentPlanYears";
    constructor(public planYears: PlanYear[]) {}
}
