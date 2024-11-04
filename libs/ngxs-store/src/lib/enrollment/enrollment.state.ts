import {
    MemberService,
    AccountService,
    CartStatus,
    EnrollmentService,
    BenefitsOfferingService,
    AflacService,
    AccountProfileService,
    MemberIdentifier,
    ShoppingService,
    ShoppingCartDisplayService,
    ApplicationService,
    CoreService,
} from "@empowered/api";
import { State, Selector, Action, StateContext, Store } from "@ngxs/store";
import { AccountTypes, RiderSectionData, RiskClassId } from "./enrollment.model";
import {
    SetProductOfferings,
    SetAllPlanOfferings,
    SetProductPlanOfferings,
    SetMPGroup,
    SetMemberId,
    SetPayFrequency,
    SetNavBarType,
    LoadApplicationResponses,
    LoadApplicationFlowData,
    SetProductOfferingsOfId,
    SetPlanOfferingById,
    LoadAllPlans,
    MapDataForApplicationFlow,
    MapApplicationResponse,
    SetEnrollmentMethod,
    SetEnrollmentState,
    UpdateApplicationResponse,
    SetEnrollments,
    SetExitPopupStatus,
    SetPlanStatus,
    UpdateConstraintValues,
    SetBaseCoverageLevel,
    SetRuleForRider,
    UpdateCartData,
    SetMemberName,
    SetMemberDependents,
    SetMemberBeneficiaries,
    SetMemberData,
    UpdateApplicationPanel,
    DiscardCartItem,
    CarrierRiskClass,
    SetAflacAlways,
    SetPaymentCost,
    ReinstatementFlow,
    PatchApplication,
    RemoveApplication,
    AddcartData,
    UpdateHashKeys,
    DiscardRiderCartItem,
    SetCartItems,
    SetKnockOutData,
    DeleteKnockOutData,
    SetPayment,
    SetEBSPayment,
    SetDirectPaymentCost,
    ResetPlanKnockOutData,
    MakeAppFlowStoreEmpty,
    SetSSNData,
    SetMemberContact,
    SetEmployeeId,
    SetPartnerAccountType,
    SetCompanyProductsDisplayed,
    DeclineRiderCartItem,
    SetProductPlanData,
    SetDependentMember,
    SetNewPlan,
    SetNewProduct,
    SetAddtoCart,
    UpdatePlan,
    DisablePlan,
    ResetProductPlanData,
    UpdateSkippedStepResponses,
    SetIsOpenEnrollment,
    RemoveStackablePlan,
    SetQLE,
    SetReinstateItem,
    MakeReinstateStoreEmpty,
    CopyCartData,
    SetFlowType,
    SetMemberFlexDollars,
    SetEnrollmentInformation,
    SetSalaryAndRelatedConfigs,
    SetRiskClassId,
    SetIsPlanListPage,
    SetAccountProducerList,
    SetErrorForShop,
    ResetApiErrorMessage,
    SetProductPlanDataEmptyIfError,
    SetCompanyProductsAcknowledgedMembers,
    SetMemberAge,
    SetFullMemberProfile,
    SetOpenEnrollmentPlanYears,
} from "./enrollment.action";
import { patch } from "@ngxs/store/operators";
import { tap, defaultIfEmpty, switchMap, first, finalize, catchError, filter, withLatestFrom, map } from "rxjs/operators";
import { Observable, forkJoin, of, combineLatest, EMPTY } from "rxjs";
import { Router } from "@angular/router";
import { QuoteShopHelperService } from "../services/quote-shop-helper/quote-shop-helper.service";
import { ShopCartService } from "../services/shop-cart/shop-cart.service";
import { DatePipe } from "@angular/common";

import { FetchErrorMessageLanguage, LanguageService } from "@empowered/language";
import {
    DateFormats,
    CarrierId,
    DateInfo,
    ProductId,
    ClientErrorResponseCode,
    Channel,
    ResponsePanel,
    Responses,
    EnrollmentStateModel,
    BasePlanApplicationPanel,
    RiderApplicationPanel,
    CustomSection,
    CustomStep,
    ResponseItem,
    StepConstraints,
    PlanCoverageLevelRules,
    MemberData,
    CustomRiskClass,
    DualRiskClass,
    AflacAlways,
    PaymentCost,
    HashKeys,
    Payments,
    DirectPaymentCost,
    Reinstate,
    SalaryDetails,
    AccountProducerList,
    ApiError,
    AccountImportTypes,
    PayFrequency,
    RiskClass,
    Validity,
    AppSettings,
    DualPlanYearSettings,
    EnrollmentMethod,
    GroupAttribute,
    Characteristics,
    RatingCode,
    RiderCart,
    Step,
    TaxStatus,
    PlanOffering,
    Section,
    Application,
    GetCartItems,
    ProducerCredential,
    MemberBeneficiary,
    EnrollmentBeneficiary,
    Enrollments,
    ApplicationResponse,
    MemberProfile,
    Relations,
    GetPlan,
    MemberDependent,
    MemberFlexDollar,
    EnrollmentInformation,
    PlanOfferingPanel,
    MemberContact,
    StatusType,
    QLEProductCoverageStart,
    MemberQualifyingEvent,
    PlanYear,
    ProductOfferingPanel,
    PlanYearModel,
    EBS_Payment,
    StepType,
    StepTitle,
} from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { UserService } from "@empowered/user";
import { Injectable } from "@angular/core";
import { ResetState } from "@empowered/user/state/actions";
import { AccountInfoState } from "../dashboard/dashboard.state";
import { DualPlanYearState } from "../dual-plan-year";
import { EnrollmentMethodState } from "../enrollment-method/enrollment-method.state";
import { SharedState } from "../shared/shared.state";
import { StaticUtilService } from "../state-services/static-util.service";
import { UtilService } from "../state-services/util.service";
import { AppFlowService } from "../state-services/app-flow.service";
import { DualPlanYearService } from "../state-services/dual-plan-year.service";
import { DateService } from "@empowered/date";

const restrictedDates = ["29", "30", "31"];
const DAY_OF_MONTH = "D";
const MONTH = "month";
const MONTHS = "months";
const NEXT_FIFTEENTH_OF_MONTH_DATE = 15;
const DAY_AFTER = "DAY_AFTER";
const NEXT_FIRST_OF_MONTH = "NEXT_FIRST_OF_MONTH";
const NEXT_FIRST_OR_FIFTEENTH_OF_MONTH = "NEXT_FIRST_OR_FIFTEENTH_OF_MONTH";
const ID = "id";
const DEFAULT_COVERAGE_DATE = "defaultCoverageDate";
const COVERAGE_DATE = "coverageDate";
const INITIAL_COVERAGE_DATE = "initialCoverageDate";
const COVERAGE_START_DATE = "coverage_start_date";
const todayDate = new Date();
const PLAN_YEAR_EXIST = "planYearExist";
const INDUSTRY_CODE = "IndustryCode";
const EVENT_IN_PROGRESS = "IN_PROGRESS";
const FIRST_OF_MONTH = 1;
const ONE_MONTH = 1;
const DAY = "day";
const AFLAC_GROUP_PLAN_YEAR = "isAgPlanYear";
const MULTIPLE_PLAN_YEARS = "multiplePlanYears";
const MULTIPLE_COVERAGE_DATE_NEW = "multipleCoverageDateNew";
const defaultState: EnrollmentStateModel = {
    memberAge: null,
    memberName: "",
    memberDependents: [],
    memberBeneficiaries: [],
    mpGroup: null,
    memberId: null,
    payFrequency: null,
    productOfferings: [],
    allPlanOfferings: [],
    navType: "",
    applications: [],
    cartItems: [],
    applicationResponse: [],
    allPlans: [],
    applicationPanel: [],
    appResponseItems: [],
    enrollmentMethod: EnrollmentMethod.SELF_SERVICE,
    enrollmentState: "GA",
    enrollments: [],
    exitPopupStatus: false,
    constraints: [],
    baseRules: [],
    riderRulesRepo: [],
    memberData: null,
    carrierRiskClasses: [],
    aflacAlways: [],
    totalPaymentCost: null,
    reinstatementPanel: [],
    responseHashKeys: [],
    knockOutData: [],
    payments: [],
    directPaymentCost: null,
    ssnValue: null,
    email: null,
    preferredContactTime: null,
    memberContactData: null,
    employeeId: null,
    accountType: [],
    companyProductsDisplayed: false,
    productPlanData: [],
    dependentRelation: null,
    isOpenEnrollment: false,
    isQLEPeriod: false,
    currentQLE: null,
    reinstateItem: null,
    isDirect: null,
    memberFlexDollars: [],
    enrollmentInfo: null,
    qleResponse: [],
    salaryDetails: null,
    isPlanListPage: false,
    producerList: null,
    apiError: null,
    cartItemId: null,
    companyProductsAcknowledgedMembers: [],
    openEnrollmentPlanYears: [],
    ebsPayment: null,
};

@State<EnrollmentStateModel>({
    name: "enrollment",
    defaults: defaultState,
})
@Injectable()
export class EnrollmentState {
    tomorrowDate = this.dateService.addDays(new Date(), 1);
    aflacPlanYear: number;
    planYearEffectiveDate: string;
    postTaxAflacPlanYear: number;
    postTaxPlanYearEffectiveDate: string;
    nonAflacPlanYearEffectiveDate: string;
    aflacGroupPlanYear: number;
    groupPlanYearEffectiveDate: string;
    riskClassId: number;
    memberData: MemberData;
    today = new Date();
    coverageFunctionStartDate: string | Date;
    allPlanYears: PlanYear[];

    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly appService: ApplicationService,
        private readonly coreService: CoreService,
        private readonly memberService: MemberService,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly enrollmentService: EnrollmentService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly shopCartService: ShopCartService,
        private readonly benefitOffService: BenefitsOfferingService,
        private readonly datePipe: DatePipe,
        private readonly appFlowService: AppFlowService,
        private readonly dualPlanYearService: DualPlanYearService,
        private readonly languageService: LanguageService,
        private readonly aflacService: AflacService,
        private readonly staticUtilService: StaticUtilService,
        private readonly userService: UserService,
        private readonly accountProfileService: AccountProfileService,
        private readonly dateService: DateService,
    ) {}

    @Selector()
    static GetMemberAge(state: EnrollmentStateModel): number {
        return state.memberAge;
    }
    @Selector()
    static GetKnockOutData(state: EnrollmentStateModel): any[] {
        return state.knockOutData;
    }
    @Selector()
    static GetMemberName(state: EnrollmentStateModel): string {
        return state.memberName;
    }

    @Selector()
    static GetMemberDependents(state: EnrollmentStateModel): MemberDependent[] {
        return state.memberDependents;
    }
    @Selector()
    static GetMemberDependentsRelation(state: EnrollmentStateModel): Relations[] {
        return state.dependentRelation;
    }

    @Selector()
    static GetMemberBeneficiaries(state: EnrollmentStateModel): MemberBeneficiary[] {
        return state.memberBeneficiaries;
    }

    @Selector()
    static GetMPGroup(state: EnrollmentStateModel): number {
        return state.mpGroup;
    }
    @Selector()
    static GetBaseCoverageLevelRules(state: EnrollmentStateModel): PlanCoverageLevelRules[] {
        return state.baseRules;
    }
    @Selector()
    static GetRiderRules(state: EnrollmentStateModel): PlanCoverageLevelRules[] {
        return state.riderRulesRepo;
    }
    @Selector()
    static GetMemberId(state: EnrollmentStateModel): number {
        return state.memberId;
    }

    @Selector()
    static GetPayFrequency(state: EnrollmentStateModel): PayFrequency {
        return state.payFrequency;
    }

    @Selector()
    static GetProductOfferingById(state: EnrollmentStateModel, prodOffId: number): ProductOfferingPanel {
        return state.productOfferings.filter((x) => x.id === prodOffId)[0];
    }

    @Selector()
    static GetPlanOfferingById(state: EnrollmentStateModel, prodOffId: number, planOffId: number): PlanOfferingPanel {
        return state.productOfferings.filter((x) => x.id === prodOffId)[0].planOfferings.filter((y) => y.id === planOffId)[0];
    }

    @Selector()
    static GetProductOfferings(state: EnrollmentStateModel): ProductOfferingPanel[] {
        return [...state.productOfferings];
    }

    @Selector()
    static GetAllPlanOfferings(state: EnrollmentStateModel): PlanOfferingPanel[] {
        return [...state.allPlanOfferings];
    }

    @Selector()
    static GetProductPlanOfferings(state: EnrollmentStateModel): PlanOfferingPanel[] {
        return [...state.allPlanOfferings];
    }

    @Selector()
    static GetNavBarType(state: EnrollmentStateModel): string {
        return state.navType;
    }

    @Selector()
    static GetApplicationPanel(state: EnrollmentStateModel): BasePlanApplicationPanel[] {
        return state.applicationPanel;
    }
    @Selector()
    static GetApplicationResponses(state: EnrollmentStateModel): any[] {
        return state.applicationResponse;
    }
    @Selector()
    static GetApplications(state: EnrollmentStateModel): Application[] {
        return state.applications;
    }
    @Selector()
    static GetCartItem(state: EnrollmentStateModel): GetCartItems[] {
        return state.cartItems;
    }
    @Selector()
    static GetResponseItems(state: EnrollmentStateModel): ResponseItem[] {
        return state.appResponseItems;
    }

    @Selector()
    static GetEnrollmentMethod(state: EnrollmentStateModel): EnrollmentMethod {
        return state.enrollmentMethod;
    }

    @Selector()
    static GetEnrollmentState(state: EnrollmentStateModel): string {
        return state.enrollmentState;
    }

    @Selector()
    static GetEnrollments(state: EnrollmentStateModel): Enrollments[] {
        return state.enrollments;
    }

    @Selector()
    static GetExitPopupStatus(state: EnrollmentStateModel): boolean {
        return state.exitPopupStatus;
    }
    @Selector()
    static GetConstraint(state: EnrollmentStateModel): StepConstraints[] {
        return state.constraints;
    }
    @Selector()
    static GetMemberData(state: EnrollmentStateModel): MemberData {
        return state.memberData;
    }
    @Selector()
    static GetRiskClasses(state: EnrollmentStateModel): CustomRiskClass[] {
        return state.carrierRiskClasses;
    }
    @Selector()
    static GetAflacAlways(state: EnrollmentStateModel): AflacAlways[] {
        return state.aflacAlways;
    }
    @Selector()
    static GetPaymentCost(state: EnrollmentStateModel): PaymentCost {
        return state.totalPaymentCost;
    }
    @Selector()
    static GetReinstatementPanel(state: EnrollmentStateModel): BasePlanApplicationPanel[] {
        return state.reinstatementPanel;
    }
    @Selector()
    static GetHashKeys(state: EnrollmentStateModel): HashKeys[] {
        return state.responseHashKeys;
    }
    @Selector()
    static GetDirectPaymentCost(state: EnrollmentStateModel): DirectPaymentCost {
        return state.directPaymentCost;
    }
    @Selector()
    static GetDirectPayment(state: EnrollmentStateModel): Payments[] {
        return state.payments;
    }
    @Selector()
    static GetEBSPayment(state: EnrollmentStateModel): EBS_Payment {
        return state.ebsPayment;
    }
    @Selector()
    static GetSSNValue(state: EnrollmentStateModel): string {
        return state.ssnValue;
    }
    @Selector()
    static GetEmployeeId(state: EnrollmentStateModel): string {
        return state.employeeId;
    }
    @Selector()
    static GetMemberEmail(state: EnrollmentStateModel): any[] {
        return state.email;
    }
    @Selector()
    static GetMemberContact(state: EnrollmentStateModel): MemberContact {
        return state.memberContactData;
    }
    @Selector()
    static GetAllPlans(data: EnrollmentStateModel): GetPlan[] {
        return data.allPlans;
    }
    @Selector()
    static GetCompanyProductsDisplayed(state: EnrollmentStateModel): boolean {
        return state.companyProductsDisplayed;
    }
    @Selector()
    static GetProductPlanData(state: EnrollmentStateModel): ProductOfferingPanel[] {
        return state.productPlanData;
    }
    @Selector()
    static GetIsOpenEnrollment(state: EnrollmentStateModel): boolean {
        return state.isOpenEnrollment;
    }
    @Selector()
    static GetOpenEnrollmentPlanYears(state: EnrollmentStateModel): PlanYear[] {
        return state.openEnrollmentPlanYears;
    }
    @Selector()
    static GetIsQLEPeriod(state: EnrollmentStateModel): boolean {
        return state.isQLEPeriod;
    }
    /**
     * Method to get qualifying status Response(api response)
     * @param state  variable of type EnrollmentStateModel
     * @returns qualifying data
     */
    @Selector()
    static GetQLEResponse(state: EnrollmentStateModel): MemberQualifyingEvent[] {
        return state.qleResponse;
    }
    @Selector()
    static GetCurrentQLE(state: EnrollmentStateModel): MemberQualifyingEvent {
        return state.currentQLE;
    }
    @Selector()
    static GetReinstate(state: EnrollmentStateModel): Reinstate {
        return state.reinstateItem;
    }
    /**
     * Method to get whether flow is direct or payroll from store
     * @param state variable of type EnrollmentStateModel
     * @returns if direct customer or not
     */
    @Selector()
    static IsDirect(state: EnrollmentStateModel): boolean {
        return state.isDirect;
    }
    /**
     * Method to get member flex dollars from store
     * @param state variable of type EnrollmentStateModel
     */
    @Selector()
    static GetMemberFlexDollars(state: EnrollmentStateModel): MemberFlexDollar[] {
        return state.memberFlexDollars;
    }
    /**
     * Method to get the member salary details and min salary threshold
     * @param state variable of type EnrollmentStateModel
     * @returns salary related data of the member
     */
    @Selector()
    static GetMemberSalaryDetails(state: EnrollmentStateModel): SalaryDetails {
        return state.salaryDetails;
    }
    /**
     * Selector to get enrollment info from store
     * @param state variable of type EnrollmentStateModel
     */
    @Selector()
    static GetEnrollmentInfo(state: EnrollmentStateModel): EnrollmentInformation {
        return state.enrollmentInfo;
    }
    /**
     * Selector to get Risk Class Id from store
     * @param state variable of type RiskClassId
     * @return Risk Class Id
     */
    @Selector()
    static GetRiskClassId(state: RiskClassId): number {
        return state.riskClassId;
    }
    /**
     * Selector to whether to land on plan list page or not from store
     * @param state variable of type Enrollment State
     * @return boolean whether we have to land on plan list page or not
     */
    @Selector()
    static GetIsPlanListPage(state: EnrollmentStateModel): boolean {
        return state.isPlanListPage;
    }
    /**
     * Selector to get account producer list from store
     * @param state variable of type EnrollmentStateModel
     */
    @Selector()
    static GetAccountProducerList(state: EnrollmentStateModel): AccountProducerList {
        return state.producerList;
    }
    /**
     * Selector to api error details
     * @param {EnrollmentStateModel} state variable of type EnrollmentStateModel
     */
    @Selector()
    static GetApiError(state: EnrollmentStateModel): ApiError {
        return state.apiError;
    }

    /**
     * Selectors enrollment state
     * @param state variable of type EnrollmentStateModel
     * @returns company products acknowledged members list
     */
    @Selector()
    static GetCompanyProductsAcknowledgedMembers(state: EnrollmentStateModel): number[] {
        return state.companyProductsAcknowledgedMembers;
    }

    @Action(ResetState)
    resetState(context: StateContext<EnrollmentStateModel>): void {
        context.setState(defaultState);
    }

    @Action(SetMemberAge)
    setMemberAge(ctx: StateContext<EnrollmentStateModel>, { age }: SetMemberAge): void {
        ctx.setState(
            patch({
                memberAge: age,
            }),
        );
    }

    @Action(SetMemberName)
    setMemberName(ctx: StateContext<EnrollmentStateModel>, { name }: SetMemberName): void {
        ctx.setState(
            patch({
                memberName: name,
            }),
        );
    }

    @Action(SetMemberDependents)
    setMemberDependents(ctx: StateContext<EnrollmentStateModel>, { dependents }: SetMemberDependents): void {
        ctx.setState(
            patch({
                memberDependents: dependents,
            }),
        );
    }

    @Action(SetMemberBeneficiaries)
    setMemberBeneficiaries(ctx: StateContext<EnrollmentStateModel>, { beneficiaries }: SetMemberBeneficiaries): void {
        ctx.setState(
            patch({
                memberBeneficiaries: beneficiaries,
            }),
        );
    }

    @Action(SetMPGroup)
    setMPGroup(ctx: StateContext<EnrollmentStateModel>, { mpGroup }: SetMPGroup): void {
        ctx.setState(
            patch({
                mpGroup: mpGroup,
            }),
        );
    }

    @Action(SetMemberId)
    setMemberId(ctx: StateContext<EnrollmentStateModel>, { memberId }: SetMemberId): void {
        ctx.setState(
            patch({
                memberId: memberId,
            }),
        );
    }

    @Action(SetPayFrequency)
    setPayFrequency(ctx: StateContext<EnrollmentStateModel>, { payFrequency }: SetPayFrequency): void {
        ctx.setState(
            patch({
                payFrequency: payFrequency,
            }),
        );
    }

    @Action(SetProductOfferings)
    SetProductOfferings(ctx: StateContext<EnrollmentStateModel>, { productOfferings }: SetProductOfferings): void {
        ctx.setState(
            patch({
                productOfferings: productOfferings,
            }),
        );
    }

    @Action(SetAllPlanOfferings)
    SetAllPlanOfferings(ctx: StateContext<EnrollmentStateModel>, { planOfferings }: SetAllPlanOfferings): void {
        ctx.setState(
            patch({
                allPlanOfferings: planOfferings,
            }),
        );
    }

    @Action(SetProductPlanOfferings)
    SetProductPlanOfferings(ctx: StateContext<EnrollmentStateModel>, { productOfferingId, planOfferings }: SetProductPlanOfferings): void {
        const state = ctx.getState();
        const idx = state.productOfferings.findIndex((productOffering) => productOffering.id === productOfferingId);
        if (idx > -1) {
            const productOfferings: ProductOfferingPanel[] = [];
            state.productOfferings.forEach((x) => productOfferings.push(Object.assign({}, x)));
            productOfferings[idx].planOfferings = planOfferings;
            ctx.patchState({
                productOfferings: productOfferings,
            });
        }
    }

    @Action(SetPlanStatus)
    SetPlanStatus(ctx: StateContext<EnrollmentStateModel>, { productOfferingId, planOfferingId }: SetPlanStatus): void {
        const state = ctx.getState();
        // const idx = state.productOfferings.findIndex(productOffering => productOffering.id === productOfferingId);
        // if (idx > -1) {
        const productOfferings: ProductOfferingPanel[] = [];
        state.productOfferings.forEach((x) => {
            if (x.id === productOfferingId) {
                const temp = { ...x };
                temp.inCart = false;
                const planOfferings = [];
                temp.planOfferings.forEach((plan) => {
                    if (plan.id === planOfferingId) {
                        const tempPlan = { ...plan };
                        tempPlan.inCart = false;
                        tempPlan.cartItem = null;
                        planOfferings.push(tempPlan);
                    } else {
                        planOfferings.push(plan);
                        if (plan.cartItem) {
                            temp.inCart = true;
                        }
                    }
                });
                temp.planOfferings = planOfferings;
                productOfferings.push(temp);
            } else {
                productOfferings.push(x);
            }
        });
        ctx.patchState({
            productOfferings: productOfferings,
        });
    }

    @Action(SetNavBarType)
    SetNavBarType(ctx: StateContext<EnrollmentStateModel>, { navType }: SetNavBarType): void {
        ctx.setState(
            patch({
                navType: navType,
            }),
        );
    }

    /**
     * This method fetch application data from api and updates applications and cartItems.
     * @param param1 patchState->callback function used to update the store and dispatch->callback function use to dispatch aflac always
     * @param param2 memberId->id of member and mpGroup->id of group
     * @returns application flow data
     */
    @Action(LoadApplicationFlowData)
    LoadApplicationFlowData(
        { patchState, dispatch }: StateContext<EnrollmentStateModel>,
        { memberId, mpGroup }: LoadApplicationFlowData,
    ): Observable<any> {
        const planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        const isTpi = this.appFlowService.checkTpi();
        return forkJoin([
            this.appService.getApplications(memberId, mpGroup, true),
            this.shoppingService.getCartItems(memberId, mpGroup, "planOfferingId", isTpi ? [] : planYearId),
        ]).pipe(
            tap((response) => {
                const cartItems = [];
                if (response[1].length > 0) {
                    response[1].forEach((cart) => {
                        cartItems.push(cart);
                        if (cart.riders.length > 0) {
                            cart.riders.forEach((riderCart) => {
                                cartItems.push(riderCart);
                            });
                        }
                    });
                }
                const applications: Application[] = this.utilService.copy(response[0]);
                const inValidApplicationIds: number[] = applications
                    .filter((application) => application.sections && application.sections.length === 0)
                    .map((app) => app.id);
                const applicant = [];
                applicant.push("Applicant's Statements and Agreements");
                applicant.push("Applicant Statements and Agreements");
                applications.forEach((app, index) => {
                    applications[index].riderApplicationIds = app.riderApplicationIds.filter(
                        (applicationId) => inValidApplicationIds.indexOf(applicationId) < 0,
                    );
                    let isCompletedStep = true;
                    const cartData = cartItems
                        .filter((cartItem) => cartItem.applicationId === app.id || app.planId === cartItem.planId)
                        .pop();
                    if (cartData && (!(cartData.status && cartData.status !== CartStatus.TODO) || cartData.lastAnsweredId === undefined)) {
                        isCompletedStep = false;
                    }
                    let appSections = [];
                    if (!applications[index].riderApplicationIds.length) {
                        appSections = app.sections.filter((section) => section.title !== StepTitle.RIDERS);
                    } else {
                        appSections = app.sections;
                    }
                    appSections
                        .filter(
                            (section) =>
                                section.steps &&
                                section.steps.length &&
                                section.steps[0].type &&
                                section.title !== StepType.AFLACALWAYS &&
                                section.title !== StepTitle.REQUIREDFORMS &&
                                section.title !== StepTitle.REQUIREDFORMS1 &&
                                section.title !== StepTitle.REQUIREDFORMS2 &&
                                section.title !== StepTitle.PAYMENTOPTION &&
                                section.title !== StepTitle.PAYLOGIX_PAYMENT &&
                                section.title !== StepTitle.PAYMENTLCOPTION &&
                                section.steps[0].type !== StepType.VERIFICATION_CODE &&
                                !applicant.includes(section.title),
                        )
                        .forEach((section, i) => {
                            if (section.title === StepTitle.BENEFICIARY) {
                                section.title = StepTitle.BENEFICIARIES;
                            }
                            section.sectionId = i;
                        });
                    appSections.forEach((section) => {
                        section.steps.forEach((step) => {
                            step.completed = isCompletedStep;
                            if (cartData && cartData.lastAnsweredId && cartData.lastAnsweredId === step.id) {
                                isCompletedStep = false;
                            }
                        });
                    });
                });
                patchState({
                    applications: applications,
                    cartItems: cartItems,
                });
                dispatch(new SetAflacAlways());
                dispatch(new SetEBSPayment());
            }),
        );
    }
    @Action(LoadApplicationResponses)
    LoadApplicationResponses({ patchState, getState }: StateContext<EnrollmentStateModel>): Observable<any> {
        const store = getState();
        const applicationResponseObservables = [];
        const cartIds: number[] = [];
        // TODO Hardcoding of MP-Group & MemberId has to be removed.
        store.cartItems.forEach((item) => {
            cartIds.push(item.id ? item.id : item.cartItemId);
            applicationResponseObservables.push(
                this.shoppingCartService.getApplicationResponses(store.memberId, item.id ? item.id : item.cartItemId, store.mpGroup),
            );
        });
        return forkJoin(applicationResponseObservables).pipe(
            catchError(() => of([])),
            tap((response) => {
                const appResponses: Responses[] = response.map((data, i) => ({ cartId: cartIds[i], response: data }));
                patchState({
                    applicationResponse: appResponses,
                });
            }),
        );
    }
    @Action(LoadAllPlans)
    LoadAllPlans({ dispatch, patchState, getState }: StateContext<EnrollmentStateModel>): Observable<any> {
        const planObservables = [];
        const store = getState();
        store.applications.forEach((app) => {
            planObservables.push(this.coreService.getPlan(app.planId));
        });
        return forkJoin(planObservables).pipe(
            tap((response) => {
                patchState({
                    allPlans: response,
                });
                dispatch(new SetPayment());
                dispatch(new MapDataForApplicationFlow());
            }),
        );
    }

    @Action(SetProductOfferingsOfId)
    SetProductPlanOfferingsOfID(ctx: StateContext<EnrollmentStateModel>, { productOfferings }: SetProductOfferingsOfId): void {
        const state = ctx.getState();
        const idx = state.productOfferings.findIndex((productOffering) => productOffering.id === productOfferings.id);
        if (idx > -1) {
            const products: ProductOfferingPanel[] = [];
            state.productOfferings.forEach((x) => products.push(Object.assign({}, x)));
            products[idx] = productOfferings;
            ctx.patchState({
                productOfferings: products,
            });
        }
    }

    @Action(SetPlanOfferingById)
    SetPlanOfferingById(ctx: StateContext<EnrollmentStateModel>, { prodOffId, planOff }: SetPlanOfferingById): void {
        const state = ctx.getState();
        state.productOfferings.filter((x) => x.id === prodOffId)[0].planOfferings.filter((y) => y.id === planOff.id)[0] = planOff;
    }
    /**
     * builds application panel array from applications and plan data
     * @param applications list of applications
     * @param cartItems list of cart items
     * @param allPlans list of plan data
     * @param isReinstatement indicates if reinstatement or not
     * @returns application panel array
     */
    applicationPanelData(
        applications: Application[],
        cartItems: GetCartItems[],
        allPlans: GetPlan[],
        isReinstatement: boolean = false,
    ): BasePlanApplicationPanel[] {
        const applicationsPanel: BasePlanApplicationPanel[] = [];
        applications.forEach((app: Application) => {
            const ridersPanel: RiderApplicationPanel[] = [];
            const riderApplicationIds: number[] = this.utilService.copy(app.riderApplicationIds);
            const cartData: GetCartItems = cartItems
                .filter((item) => (app.cartItemId ? item.id === app.cartItemId : item.applicationId === app.id))
                .pop();
            const planData: GetPlan = allPlans.filter((plan) => plan.id === app.planId).pop();
            if (cartData || isReinstatement) {
                app.riderApplicationIds.forEach((id) => {
                    const data: Application = applications.filter((application) => application.id === id).pop();
                    if (data && data.sections && data.sections.length > 0) {
                        ridersPanel.push(this.getRiderApplicationPanel(data, cartData, allPlans));
                    } else {
                        riderApplicationIds.splice(riderApplicationIds.indexOf(id));
                    }
                });
                const sections: CustomSection[] = this.getBasePlanSectionData(app, cartData);
                sections.forEach((cusSection, i) => {
                    cusSection.sectionId = i;
                });
                let isAdditionalUnit = false;
                if (
                    planData.characteristics &&
                    planData.characteristics.length &&
                    planData.characteristics.indexOf(Characteristics.SUPPLEMENTARY) >= 0
                ) {
                    isAdditionalUnit = true;
                }
                applicationsPanel.push(
                    this.getBaseApplicationPanel(app, sections, cartData, planData, isAdditionalUnit, ridersPanel, riderApplicationIds),
                );
            }
        });
        return applicationsPanel.sort((a, b) => a.cartData.id - b.cartData.id);
    }
    /**
     * gets rider application panel from rider application
     * @param riderApplication rider application
     * @param cartData cart data
     * @param allPlans list of plans data
     * @returns rider application panel
     */
    getRiderApplicationPanel(riderApplication: Application, cartData: GetCartItems, allPlans: GetPlan[]): RiderApplicationPanel {
        const riderPlanData: GetPlan = allPlans.filter((plan) => plan.id === riderApplication.planId).pop();
        const riderSectionData: RiderSectionData = this.getRiderSectionData(riderApplication);
        return {
            appData: {
                id: riderApplication.id,
                planId: riderApplication.planId,
                riderApplicationIds: riderApplication.riderApplicationIds,
                sections: riderSectionData.riderSections,
            },
            cartData: cartData,
            planId: riderApplication.planId,
            baseRiderId: riderApplication.baseRiderId ? riderApplication.baseRiderId : null,
            planName: riderPlanData.name,
            productId: riderPlanData.product.id,
            productName: riderPlanData.product.name,
            carrierId: riderPlanData.carrierId,
            enrollmentRequirements: riderApplication.enrollmentRequirements ? riderApplication.enrollmentRequirements : null,
            riderAttributeName: riderSectionData.riderAttributeName,
            riderPolicySeries: riderPlanData.policySeries,
        };
    }
    /**
     * gets rider section data based on rider application
     * @param riderApplication rider application
     * @returns rider section data
     */
    getRiderSectionData(riderApplication: Application): RiderSectionData {
        const riderSections: CustomSection[] = [];
        let riderAttributeName: string;
        riderApplication.sections
            .filter((section) => section.steps.length)
            .forEach((section) => {
                let currentStepId: number;
                let stepArray: Step[] = [];
                const steps: CustomStep[] = [];
                section.steps.forEach((step) => {
                    if (!riderAttributeName && step.type === StepType.PLANOPTIONS) {
                        riderAttributeName = step.title;
                    }
                    if (!currentStepId) {
                        currentStepId = step.id;
                    }
                    if (currentStepId !== step.id) {
                        currentStepId = step.id;
                        steps.push({
                            step: stepArray,
                            showStep: true,
                        });
                        stepArray = [];
                    }
                    stepArray.push(step);
                });
                steps.push({
                    step: stepArray,
                    showStep: true,
                });
                riderSections.push({
                    sectionId: section.sectionId,
                    steps: steps,
                    title: section.title,
                    showSection: true,
                });
            });
        return { riderSections: riderSections, riderAttributeName: riderAttributeName };
    }
    /**
     * gets base plan section data
     * @param app application
     * @param cartData cart data
     * @returns base plan section data
     */
    getBasePlanSectionData(app: Application, cartData: GetCartItems): CustomSection[] {
        let appSections: Section[] = [];
        let isCompletedStep = true;
        if (!app.riderApplicationIds.length) {
            appSections = app.sections.filter((section) => section.title !== StepTitle.RIDERS);
        } else {
            appSections = app.sections;
        }
        if (cartData.status === CartStatus.TODO || cartData.lastAnsweredId === undefined) {
            isCompletedStep = false;
        }
        return this.getBasePlanCustomSections(appSections, cartData, isCompletedStep);
    }
    /**
     * gets base plan section data after including custom data
     * @param appSections application sections
     * @param cartData cart data
     * @param isCompletedStep indicates if step is completed or not
     * @returns base plan section data
     */
    getBasePlanCustomSections(appSections: Section[], cartData: GetCartItems, isCompletedStep: boolean): CustomSection[] {
        const sections: CustomSection[] = [];
        appSections
            .filter((section) => section.steps && section.steps.length && section.steps[0].type && section.sectionId >= 0)
            .forEach((section) => {
                let currentStepId: number;
                let stepArray: Step[] = [];
                const steps: CustomStep[] = [];
                section.steps.forEach((step) => {
                    if (!currentStepId) {
                        currentStepId = step.id;
                    }
                    if (currentStepId !== step.id) {
                        currentStepId = step.id;
                        steps.push(this.getCustomStep(stepArray, isCompletedStep));
                        isCompletedStep = this.getStepCompletedStepStatus(cartData, stepArray, isCompletedStep);
                        stepArray = [];
                    }
                    stepArray.push(step);
                });
                steps.push(this.getCustomStep(stepArray, isCompletedStep));
                isCompletedStep = this.getStepCompletedStepStatus(cartData, stepArray, isCompletedStep);
                if (steps.length) {
                    sections.push({
                        sectionId: section.sectionId,
                        steps: steps,
                        title: section.title,
                        showSection: true,
                    });
                }
            });
        return sections;
    }
    /**
     * gets if a step is completed or not
     * @param cartData cart data
     * @param stepArray list of steps
     * @param isCompletedStep indicates step completed status
     * @returns step completed status
     */
    getStepCompletedStepStatus(cartData: GetCartItems, stepArray: Step[], isCompletedStep: boolean): boolean {
        if (cartData.lastAnsweredId && cartData.lastAnsweredId === stepArray[0].id) {
            isCompletedStep = false;
        }
        return isCompletedStep;
    }
    /**
     * gets custom step data for panel
     * @param stepArray list of steps
     * @param isCompletedStep indicates if step is completed or not
     * @returns custom step
     */
    getCustomStep(stepArray: Step[], isCompletedStep: boolean): CustomStep {
        return {
            step: stepArray,
            showStep: true,
            completed: isCompletedStep,
        };
    }
    /**
     * gets Base application panel
     * @param app application
     * @param sections list of sections
     * @param cartData cart data
     * @param planData plan data
     * @param isAdditionalUnit indicates if additional unit or not
     * @param ridersPanel list of rider application panel
     * @param riderApplicationIds list of rider application ids
     * @returns base application panel
     */
    getBaseApplicationPanel(
        app: Application,
        sections: CustomSection[],
        cartData: GetCartItems,
        planData: GetPlan,
        isAdditionalUnit: boolean,
        ridersPanel: RiderApplicationPanel[],
        riderApplicationIds: number[],
    ): BasePlanApplicationPanel {
        return {
            appData: {
                id: app.id,
                planId: app.planId,
                riderApplicationIds: riderApplicationIds,
                sections: sections,
            },
            cartData: cartData,
            planId: planData.id,
            baseRiderId: app.baseRiderId ? app.baseRiderId : null,
            planName: planData.name,
            productId: planData.product.id,
            productName: planData.product.name,
            riders: ridersPanel.length ? ridersPanel : null,
            carrierId: planData.carrierId,
            characteristics: planData.characteristics,
            enrollmentRequirements: app.enrollmentRequirements ? app.enrollmentRequirements : null,
            isAdditionalUnit: isAdditionalUnit,
        };
    }

    @Action(MapDataForApplicationFlow)
    MapDataForApplicationFlow({ getState, patchState }: StateContext<EnrollmentStateModel>): void {
        const store = getState();
        const applicationsPanel: BasePlanApplicationPanel[] = this.applicationPanelData(
            store.applications,
            store.cartItems,
            store.allPlans,
        );
        patchState({
            applicationPanel: applicationsPanel,
        });
    }
    @Action(MapApplicationResponse)
    MapApplicationResponse({ getState, patchState }: StateContext<EnrollmentStateModel>): void {
        const store = getState();
        const appResponse: Responses[] = store.applicationResponse;
        const applications: Application[] = store.applications;
        const cartItems: GetCartItems[] = store.cartItems;
        const responsePanel: ResponseItem[] = [];
        appResponse.forEach((resp) => {
            if (resp && resp.response && resp.response.length) {
                resp.response.forEach((data) => {
                    const questionId: number = data.planQuestionId;
                    const stepId: number = data.stepId;
                    const dataSet: ResponsePanel[] = [];
                    applications.forEach((app) => {
                        const planId: number = app.planId;
                        let cartId: number = app.cartItemId;
                        if (!cartId) {
                            cartId = cartItems
                                .filter((item) => item.applicationId === app.id)
                                .map((item) => item.id)
                                .pop();
                        }
                        app.sections.forEach((section) => {
                            section.steps.forEach((step) => {
                                if (step.id === stepId && cartId === resp.cartId) {
                                    const index = responsePanel.findIndex((item) => item.planId === planId && item.cartId === cartId);
                                    if (index === -1) {
                                        if (data.type === StepType.QUESTION && data.planQuestionId === step.question[ID]) {
                                            dataSet.push({
                                                planQuestionId: step.question[ID],
                                                type: data.type,
                                                stepId: data.stepId,
                                                value: data.value,
                                                key: data.key,
                                            });
                                        }
                                        responsePanel.push({
                                            planId: planId,
                                            cartId: cartId,
                                            application: app,
                                            response: data.type === StepType.QUESTION ? dataSet : [data],
                                        });
                                    } else {
                                        const type = data.type;
                                        if (type !== StepType.QUESTION) {
                                            let flag = false;
                                            responsePanel.forEach((item) => {
                                                if (item.cartId === cartId) {
                                                    item.response.forEach((response) => {
                                                        if (response.stepId === stepId) {
                                                            flag = true;
                                                        }
                                                    });
                                                }
                                            });
                                            if (!flag) {
                                                responsePanel[index]["response"].push(data);
                                            }
                                        } else {
                                            let flag = false;
                                            responsePanel.forEach((item) => {
                                                if (item.cartId === cartId) {
                                                    item.response.forEach((response) => {
                                                        if (
                                                            response.planQuestionId &&
                                                            response.stepId === stepId &&
                                                            response.planQuestionId === questionId &&
                                                            item.cartId === cartId
                                                        ) {
                                                            flag = true;
                                                        }
                                                    });
                                                }
                                            });
                                            if (!flag && data.planQuestionId === step.question[ID]) {
                                                const value = {
                                                    planQuestionId: step.question[ID],
                                                    type: data.type,
                                                    stepId: data.stepId,
                                                    value: data.value,
                                                    key: data.key,
                                                };
                                                responsePanel[index]["response"].push(value);
                                            }
                                        }
                                    }
                                }
                            });
                        });
                    });
                });
            }
        });
        patchState({
            appResponseItems: responsePanel,
        });
    }

    @Action(SetEnrollmentMethod)
    SetEnrollmentMethod(ctx: StateContext<EnrollmentStateModel>, { enrollmentMethod }: SetEnrollmentMethod): void {
        ctx.setState(
            patch({
                enrollmentMethod: enrollmentMethod,
            }),
        );
    }

    @Action(SetEnrollmentState)
    SetEnrollmentState(ctx: StateContext<EnrollmentStateModel>, { enrollmentState }: SetEnrollmentState): void {
        ctx.setState(
            patch({
                enrollmentState: enrollmentState,
            }),
        );
    }
    @Action(UpdateApplicationResponse)
    UpdateApplicationResponse(
        { getState, patchState, dispatch }: StateContext<EnrollmentStateModel>,
        { memberId, itemId, mpGroup }: UpdateApplicationResponse,
    ): Observable<ApplicationResponse> {
        return this.shoppingCartService.getApplicationResponses(memberId, itemId, mpGroup).pipe(
            tap((response) => {
                const store = getState();
                const index = store.cartItems.findIndex((item) => item.id === itemId || item?.cartItemId === itemId);
                const resp = this.utilService.copy(store.applicationResponse);
                resp[index] = { cartId: itemId, response: response };
                patchState({
                    applicationResponse: resp,
                });
                dispatch(new MapApplicationResponse());
            }),
        );
    }

    @Action(SetEnrollments)
    SetEnrollments(ctx: StateContext<EnrollmentStateModel>, { enrollments }: SetEnrollments): void {
        ctx.setState(
            patch({
                enrollments: enrollments,
            }),
        );
    }

    @Action(SetExitPopupStatus)
    SetExitPopupStatus(ctx: StateContext<EnrollmentStateModel>, { exitPopupStatus }: SetExitPopupStatus): void {
        ctx.setState(
            patch({
                exitPopupStatus: exitPopupStatus,
            }),
        );
    }
    /**
     * updates constraint values to store based on application flow id and cart item id
     * @param type type of constraint
     * @param value value of constraint
     * @param flowId application flow id
     * @param cartId cart item id
     */
    @Action(UpdateConstraintValues)
    UpdateConstraintValues(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { type, value, flowId, cartId }: UpdateConstraintValues,
    ): void {
        const state = getState();
        const constraintValue = this.utilService.copy(state.constraints);
        const payload = { flowId: flowId, [`${type}`]: value, cartId: cartId };
        if (constraintValue.length === 0) {
            constraintValue[0] = payload;
        } else {
            const index = constraintValue.findIndex(
                (flow) => (!flowId || flow.flowId === flowId) && (!cartId || flow.cartItemId === cartId),
            );
            if (index >= 0) {
                constraintValue[index][`${type}`] = value;
            } else {
                constraintValue[constraintValue.length] = payload;
            }
        }
        patchState({
            constraints: constraintValue,
        });
    }
    @Action(SetBaseCoverageLevel)
    SetBaseCoverageLevel(ctx: StateContext<EnrollmentStateModel>, { baseRules }: SetBaseCoverageLevel): void {
        const store = [...ctx.getState().baseRules];
        store.push(baseRules);
        ctx.setState(
            patch({
                baseRules: store,
            }),
        );
    }

    @Action(SetRuleForRider)
    SetRuleForRider(ctx: StateContext<EnrollmentStateModel>, { riderRule }: SetRuleForRider): void {
        const store = [...ctx.getState().riderRulesRepo];
        store.push(riderRule);
        ctx.setState(
            patch({
                riderRulesRepo: store,
            }),
        );
    }
    @Action(UpdateCartData)
    UpdateCartData(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { cartId, planOfferingId }: UpdateCartData,
    ): Observable<any> {
        const state = getState();
        const cartData = this.utilService.copy(state.cartItems);
        const index = cartData.findIndex((cart) => cart.id === cartId);
        return combineLatest([
            this.shoppingService.getCartItem(state.memberId, cartId, state.mpGroup),
            this.shoppingService.getPlanOffering(planOfferingId.toString(), state.mpGroup),
        ]).pipe(
            first(),
            tap((response) => {
                if (response[0] && index >= 0) {
                    const cartItem: GetCartItems = response[0];
                    cartItem.planOffering = response[1];
                    cartData[index] = cartItem;
                    const application = this.utilService.copy(state.applicationPanel);
                    const appIndex = application.findIndex((app) => app.cartData.id === cartId);
                    if (appIndex >= 0) {
                        application[appIndex].cartData = cartItem;
                        if (application[appIndex].riders) {
                            application[appIndex].riders.forEach((rider) => {
                                rider.cartData = cartItem;
                            });
                        }
                    }
                    patchState({
                        cartItems: cartData,
                        applicationPanel: application,
                    });
                }
            }),
        );
    }
    /**
     * set member data and patch it to store
     * @param param0 getState defines get state of StateContext<EnrollmentStateModel>
     * patchState defines patch state of StateContext<EnrollmentStateModel>
     * dispatch dispatches new action
     * @returns Observable of member data
     */
    @Action(SetMemberData)
    SetMemberData({ getState, patchState, dispatch }: StateContext<EnrollmentStateModel>): Observable<any> {
        const store = getState();
        const memberSalaryApi = this.memberService.getSalaries(store.memberId, false, store.mpGroup.toString());
        const memberInfoApi = this.memberService.getMember(store.memberId, true, store.mpGroup.toString());
        const memberContactApi = this.memberService.getMemberContacts(store.memberId, store.mpGroup.toString());
        const accountApi =
            this.store.selectSnapshot(AccountInfoState.getMpGroupId) === store.mpGroup.toString()
                ? of(this.store.selectSnapshot(AccountInfoState.getAccountInfo))
                : this.accountService.getAccount(store.mpGroup.toString());
        return forkJoin([memberSalaryApi, memberInfoApi, memberContactApi, accountApi]).pipe(
            tap((response) => {
                const memberData: MemberData = {
                    salaryInfo: response[0],
                    info: response[1].body,
                    contactInfo: response[2],
                    account: response[3],
                };
                this.memberData = memberData;
                const freqId = memberData.info.workInformation.payrollFrequencyId;
                this.accountService.getPayFrequencies(store.mpGroup.toString()).subscribe((res) => {
                    const index = res.findIndex((freq) => freq.id === freqId);
                    if (index >= 0) {
                        dispatch(new SetPayFrequency(res[index]));
                    }
                });
            }),
            switchMap(([, , , acc]) => {
                if (acc.ratingCode === RatingCode.STANDARD) {
                    return forkJoin([
                        this.accountProfileService.getAccountCarrierRiskClasses(CarrierId.AFLAC, store.mpGroup),
                        this.accountService.getGroupAttributesByName([INDUSTRY_CODE], store.mpGroup),
                    ]).pipe(
                        tap(([riskClasses, groupAttributes]) => {
                            if (riskClasses && groupAttributes && groupAttributes.length) {
                                this.setRiskClassId(riskClasses, groupAttributes[0].value);
                                this.memberData.riskClassId = this.riskClassId;
                            }
                            patchState({
                                memberData: this.memberData,
                            });
                        }),
                    );
                }
                if (acc.ratingCode === RatingCode.PEO) {
                    return forkJoin([
                        this.memberService.getMemberCarrierRiskClasses(store.memberId, CarrierId.AFLAC, store.mpGroup.toString()),
                        this.memberService.getMemberCarrierRiskClasses(store.memberId, null, store.mpGroup.toString()),
                    ]).pipe(
                        tap(([aflacRiskClasses, allRiskClasses]) => {
                            if (aflacRiskClasses && allRiskClasses && allRiskClasses.length) {
                                this.setRiskClassId(aflacRiskClasses, allRiskClasses[0].name);
                                this.memberData.riskClassId = this.riskClassId;
                            }
                            patchState({
                                memberData: this.memberData,
                            });
                        }),
                    );
                }
                if (acc.ratingCode === RatingCode.DUAL) {
                    return forkJoin([
                        this.aflacService.getDualPeoSelection(store.mpGroup.toString(), CarrierId.AFLAC),
                        this.aflacService.getDualPeoSelection(store.mpGroup.toString()),
                        this.coreService.getCarrierRiskClasses(CarrierId.AFLAC.toString()),
                    ]).pipe(
                        tap(([carrierResponseList, carrierResponseSelected, genericCarrierResponse]) => {
                            const accidentJobs = genericCarrierResponse.filter((riskClass) =>
                                carrierResponseList[ProductId.ACCIDENT].some((classId) => classId === riskClass.id),
                            );
                            const stdJobs = genericCarrierResponse.filter((riskClass) =>
                                carrierResponseList[ProductId.SHORT_TERM_DISABILITY].some((classId) => classId === riskClass.id),
                            );
                            this.memberData.dualRiskClasses = [];
                            if (accidentJobs.length) {
                                const accidentJobClass: DualRiskClass = accidentJobs.find(
                                    (x) => x.id === +carrierResponseSelected[ProductId.ACCIDENT],
                                );
                                if (accidentJobClass) {
                                    accidentJobClass.productId = ProductId.ACCIDENT;
                                    this.memberData.dualRiskClasses.push(accidentJobClass);
                                }
                            }
                            if (stdJobs.length) {
                                const stdJobClass: DualRiskClass = stdJobs.find(
                                    (x) => x.id === +carrierResponseSelected[ProductId.SHORT_TERM_DISABILITY],
                                );
                                if (stdJobClass) {
                                    stdJobClass.productId = ProductId.SHORT_TERM_DISABILITY;
                                    this.memberData.dualRiskClasses.push(stdJobClass);
                                }
                            }
                            patchState({
                                memberData: this.memberData,
                            });
                        }),
                    );
                }
                return of(EMPTY);
            }),
            catchError((error) => {
                if (error.error) {
                    dispatch(new SetErrorForShop(error.error));
                }
                this.shopCartService.displaySpinner({
                    isLoading: false,
                });
                return of([]);
            }),
        );
    }
    /**
     * Function to set Risk Class Id
     * @param riskClass {RiskClass[]}
     * @param riskClassName {string}
     */
    setRiskClassId(riskClass: RiskClass[], riskClassName: string): void {
        const defaultJobClass = riskClass.find((jobClass) => jobClass.name === riskClassName);
        if (defaultJobClass) {
            this.riskClassId = defaultJobClass.id;
        }
    }

    /**
     * Stores dependents' full profiles.
     *
     * @param param0 state context
     * @param actionPayload member and group ids
     * @returns observable of dependent info
     */
    @Action(SetDependentMember)
    SetDependentMember({ getState, patchState }: StateContext<EnrollmentStateModel>): Observable<[Relations[], MemberDependent[]]> {
        const store = getState();
        return forkJoin([
            this.accountService.getDependentRelations(store.mpGroup),
            this.memberService.getMemberDependents(store.memberId, true, store.mpGroup),
        ]).pipe(
            tap(([dependentRelation, memberDependents]) =>
                patchState({
                    dependentRelation,
                    memberDependents,
                }),
            ),
        );
    }
    @Action(UpdateApplicationPanel)
    UpdateApplicationPanel(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { appPanel, riderPanel }: UpdateApplicationPanel,
    ): void {
        const store = getState();
        const application = this.utilService.copy(store.applicationPanel);
        const index = application.findIndex((app) => app.planId === appPanel.planId);
        if (index >= 0) {
            application[index].appData = appPanel;
            if (application[index].riders && riderPanel) {
                application[index].riders = riderPanel;
            }
        }
        patchState({
            applicationPanel: application,
        });
    }
    /**
     * discards cart item and updates store
     * @param param0 getState defines get state of StateContext<EnrollmentStateModel>
     * patchState defines patch state of StateContext<EnrollmentStateModel>
     * dispatch dispatches new action
     * @param param1 cartId cart item id
     * riderCart indicates if rider or not
     * isReinstate indicates if reinstatement or not
     * @returns observable of void http response
     */
    @Action(DiscardCartItem)
    DiscardCartItem(
        { getState, patchState, dispatch }: StateContext<EnrollmentStateModel>,
        { cartId, riderCart, isReinstate }: DiscardCartItem,
    ): Observable<HttpResponse<void>> {
        const store = getState();
        return this.shoppingService.deleteCartItem(store.memberId, cartId, store.mpGroup).pipe(
            tap(() => {
                const cartData: GetCartItems[] = this.utilService.copy(store.cartItems);
                const index: number = cartData.findIndex((cart) => cart.id === cartId);
                if (index >= 0) {
                    const appResponse: Responses[] = this.utilService.copy(store.applicationResponse);
                    const applications: Application[] = this.utilService.copy(store.applications);
                    const appFlowId: number = cartData[index].applicationId;
                    const ridersData: RiderCart[] = cartData[index].riders;
                    cartData.splice(index, 1);
                    const appIndex: number = applications.findIndex((app) => app.id === appFlowId && app.cartItemId === cartId);
                    if (appIndex >= 0) {
                        applications.splice(appIndex, 1);
                        appResponse.splice(index, 1);
                    }
                    if (ridersData) {
                        ridersData.forEach((rider) => {
                            const riderIndex: number = cartData.findIndex((cart) => cart.cartItemId === rider.cartItemId);
                            if (riderIndex >= 0) {
                                cartData.splice(riderIndex, 1);
                            }
                            const riderAppIndex: number = applications.findIndex((app) => app.cartItemId === rider.cartItemId);
                            if (riderAppIndex >= 0) {
                                applications.splice(riderAppIndex, 1);
                                appResponse.splice(riderIndex, 1);
                            }
                        });
                    }
                    patchState({
                        cartItems: cartData,
                        applicationResponse: appResponse,
                        applications: applications,
                    });
                }
                const applicationPannel = store.applicationPanel;
                if (applicationPannel.length <= 1 && !riderCart && !isReinstate) {
                    if (this.appFlowService.checkTpi()) {
                        this.router.navigate(["tpi/shop"]);
                    } else if (this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_MEMBER) {
                        this.router.navigate(["/member/wizard/enrollment/shop"]);
                    } else if (store.isDirect) {
                        this.router.navigate([
                            // eslint-disable-next-line max-len
                            `/producer/direct/customers/${store.mpGroup}/${store.memberId}/enrollment/quote-shop/${store.mpGroup}/specific/${store.memberId}`,
                        ]);
                    } else {
                        this.router.navigate([
                            // eslint-disable-next-line max-len
                            `/producer/payroll/${store.mpGroup}/member/${store.memberId}/enrollment/quote-shop/${store.mpGroup}/specific/${store.memberId}`,
                        ]);
                    }
                } else if (index >= 0) {
                    dispatch(new SetAflacAlways());
                    dispatch(new SetPayment());
                    dispatch(new MapDataForApplicationFlow());
                }
            }),
        );
    }
    @Action(CarrierRiskClass)
    CarrierRiskClass({ getState, patchState }: StateContext<EnrollmentStateModel>): Observable<any> {
        const store = getState();
        const allPlans = store.allPlans;
        const riskObservables = [];
        const application = store.applications;
        application.forEach((app) => {
            const planObject = allPlans.filter((plan) => plan.id === app.planId).pop();
            riskObservables.push(this.coreService.getRiskClasses(planObject.carrierId));
        });
        const payload: CustomRiskClass[] = [];
        return forkJoin(riskObservables).pipe(
            tap((resp) => {
                application.forEach((app, index) => {
                    const planObject = allPlans.filter((plan) => plan.id === app.planId).pop();
                    payload.push({ carrierId: planObject.carrierId, data: resp[index] });
                });
                patchState({
                    carrierRiskClasses: payload,
                });
            }),
        );
    }
    @Action(SetAflacAlways)
    SetAflacAlways({ getState, patchState }: StateContext<EnrollmentStateModel>): void {
        const store = getState();
        const applications = store.applications;
        const cartData = store.cartItems;
        const aflacAlways: AflacAlways[] = [];
        const accountType = store.accountType;
        const achType = accountType.length ? accountType[0].attribute === AccountTypes.ACH_ACCOUNT : false;
        applications.forEach((app) => {
            const section = app.sections.filter((sec) => sec.title === StepType.AFLACALWAYS).pop();
            if (section && !achType) {
                const index = cartData.findIndex(
                    (cart) =>
                        cart.applicationId === app.id && (cart.applicationType === StepType.REINSTATEMENT || cart.id === app.cartItemId),
                );
                if (index >= 0) {
                    aflacAlways.push({
                        itemId: cartData[index].id,
                        steps: section.steps,
                        planId: app.planId,
                        flowId: app.id,
                        applicationType: cartData[index].applicationType,
                    });
                }
            }
        });
        patchState({
            aflacAlways: aflacAlways,
        });
    }

    /**
     * This method is used to set payment cost for the enrollment
     * @param param0 - stateContext reference of EnrollmentStateModel
     * @param param1 - cartItemId cart item id
     */
    @Action(SetPaymentCost)
    SetPaymentCost({ getState, patchState }: StateContext<EnrollmentStateModel>, { cartItemId }: SetPaymentCost): void {
        const store = getState();
        let applications = store.applications;
        const cartData = store.cartItems;
        let totalCost = 0;
        applications = cartItemId ? applications.filter((app) => !app.cartItemId) : applications.filter((app) => app.cartItemId);
        applications.forEach((app) => {
            const section = app.sections.filter((sec) => sec.title === StepType.AFLACALWAYS).pop();
            if (section) {
                const index = cartData.findIndex((cart) => cart.applicationId === app.id);
                if (index >= 0) {
                    totalCost += cartData[index].memberCost;
                    if (cartData[index].riders.length) {
                        cartData[index].riders.forEach((riderData) => {
                            totalCost += riderData.memberCost;
                        });
                    }
                }
            }
        });
        const totalPaymentCost: PaymentCost = { monthly: null, quarterly: null };
        const payrollsPerYear = store.payFrequency?.payrollsPerYear;
        totalPaymentCost.monthly = (totalCost * (payrollsPerYear / 12))?.toFixed(2);
        totalPaymentCost.quarterly = (totalCost * (payrollsPerYear / 4))?.toFixed(2);
        patchState({
            totalPaymentCost: totalPaymentCost,
        });
    }
    /**
     * sets reinstatement panel in store
     * @param param0 getState defines get state of StateContext<EnrollmentStateModel>
     * patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param param1 application application
     * planIds defines list of plan ids
     * id defines reinstate id
     * cart defines cart data
     * @returns Observable of GetPlan[]
     */
    @Action(ReinstatementFlow)
    ReinstatementFlow(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { application, planIds, id, cart }: ReinstatementFlow,
    ): Observable<GetPlan[]> {
        const store: EnrollmentStateModel = getState();
        const planObservables: Observable<GetPlan>[] = [];
        planIds.forEach((ids) => {
            planObservables.push(this.coreService.getPlan(ids));
        });
        return forkJoin(planObservables).pipe(
            tap((response) => {
                const returnData: BasePlanApplicationPanel[] = this.applicationPanelData(application, cart, response, true);
                const panel: BasePlanApplicationPanel[] = this.utilService.copy(store.reinstatementPanel);
                const app: BasePlanApplicationPanel = returnData.pop();
                const index: number = panel.findIndex((panels) => panels.appData.id === app.appData.id);
                if (index > -1) {
                    panel[index] = app;
                } else {
                    panel.push(app);
                }
                let allPlans = store.allPlans;
                allPlans = [
                    ...allPlans,
                    ...response.filter((responsePlan) => !allPlans.some((storePlan) => storePlan.id === responsePlan.id)),
                ];
                patchState({
                    allPlans: allPlans,
                    reinstatementPanel: panel,
                });
            }),
        );
    }
    /**
     * to patch Reinstate application
     * @param param0 getState defines get state of StateContext<EnrollmentStateModel>
     * patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param param1 application defines application of plan
     */
    @Action(PatchApplication)
    PatchApplication({ getState, patchState }: StateContext<EnrollmentStateModel>, { application }: PatchApplication): void {
        const store: EnrollmentStateModel = getState();
        const applications: Application[] = this.utilService.copy(store.applications).filter((app) => app.cartItemId);
        applications.push(application);
        patchState({
            applications: applications,
        });
    }
    @Action(RemoveApplication)
    RemoveApplication({ getState, patchState }: StateContext<EnrollmentStateModel>, { appFlowId }: RemoveApplication): void {
        const store = getState();
        const applications = this.utilService.copy(store.applications);
        const index = applications.findIndex((app) => app.id === appFlowId);
        if (index >= 0) {
            applications.splice(index, 1);
        }
        patchState({
            applications: applications,
        });
    }
    @Action(AddcartData)
    AddcartData({ getState, patchState }: StateContext<EnrollmentStateModel>, { cartData }: AddcartData): void {
        const store = getState();
        const cartItems = this.utilService.copy(store.cartItems);
        const index = cartItems.findIndex((item) => item.id === cartData.id);
        if (index > -1) {
            cartItems[index] = cartData;
        } else {
            cartItems.push(cartData);
        }
        patchState({
            cartItems: cartItems,
        });
    }
    /**
     * updates hash key values in store based on user responses
     * @param param0 getState defines get state of StateContext<EnrollmentStateModel>
     * patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param param1 responseHash list of user responses with hash keys
     */
    @Action(UpdateHashKeys)
    UpdateHashKeys({ getState, patchState }: StateContext<EnrollmentStateModel>, { responseHash }: UpdateHashKeys): void {
        const store: EnrollmentStateModel = getState();
        const response: HashKeys[] = this.utilService.copy(store.responseHashKeys);
        responseHash.forEach((resp) => {
            const index = response.findIndex((res) => res.key === resp.key);
            if (index === -1) {
                response.push({
                    key: resp.key,
                    value: resp.value,
                    planFlowId: resp.planFlowId,
                    cartItemId: resp.cartItemId,
                });
            } else {
                response[index] = resp;
            }
        });
        patchState({
            responseHashKeys: response,
        });
    }
    @Action(DiscardRiderCartItem)
    DiscardRiderCartItem(
        { getState, patchState, dispatch }: StateContext<EnrollmentStateModel>,
        { index, planId, riderCartId, parentCartId, planOfferingId }: DiscardRiderCartItem,
    ): void {
        const store = getState();
        const applications = this.utilService.copy(store.applicationPanel);
        const appIndex = applications.findIndex((app) => app.appData.planId === planId);
        if (appIndex > -1) {
            let ridersData = this.utilService.copy(applications[appIndex].riders);
            if (ridersData.length === 1) {
                ridersData = [];
            } else {
                ridersData.splice(index, 1);
            }
            applications[appIndex].riders = ridersData;
        }
        patchState({
            applicationPanel: applications,
        });
        dispatch(new DiscardCartItem(riderCartId, true, false)).pipe(
            tap((resp) => {
                dispatch(new UpdateCartData(parentCartId, planOfferingId));
            }),
        );
    }
    /**
     * Action to set cart items
     * @param param0 getState defines get state of StateContext<EnrollmentStateModel>
     * patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param param1 memberId : Id of the member
     * mpGroup : group id
     */
    @Action(SetCartItems)
    SetCartItems(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { memberId, mpGroup }: SetCartItems,
    ): Observable<GetCartItems[]> {
        const state = getState();
        const planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        return this.shoppingService.getCartItems(memberId, mpGroup, "planOfferingId", planYearId).pipe(
            tap((response) => {
                const cartItems = [];
                if (response.length > 0) {
                    const application = this.utilService.copy(state.applicationPanel);
                    response.forEach((cartItem) => {
                        const appIndex = application.findIndex((app) => app.cartData.id === cartItem.id);
                        if (appIndex >= 0) {
                            application[appIndex].cartData = cartItem;
                            if (application[appIndex].riders) {
                                application[appIndex].riders.forEach((rider) => {
                                    rider.cartData = cartItem;
                                });
                            }
                        }
                        cartItems.push(cartItem);
                        if (cartItem.riders && cartItem.riders.length > 0) {
                            cartItem.riders.forEach((riderCart) => {
                                cartItems.push(riderCart);
                            });
                        }
                    });

                    patchState({
                        cartItems: cartItems,
                        applicationPanel: application,
                    });
                }
            }),
        );
    }

    @Action(DeleteKnockOutData)
    DeleteKnockOutData(ctx: StateContext<EnrollmentStateModel>, { knockoutData }: DeleteKnockOutData): void {
        const state = ctx.getState();
        const knockoutList = [...state.knockOutData];
        if (state.knockOutData.length) {
            state.knockOutData.forEach((element) => {
                if (element.planId === knockoutData.planId) {
                    const index = state.knockOutData.indexOf(element);
                    if (index > -1) {
                        knockoutList.splice(index, 1);
                    }
                }
            });
        }
        ctx.setState(
            patch({
                knockOutData: knockoutList,
            }),
        );
    }
    @Action(SetKnockOutData)
    SetKnockOutData(ctx: StateContext<EnrollmentStateModel>, { knockoutData }: SetKnockOutData): void {
        const state = ctx.getState();
        let match = false;
        let knockoutList: any;
        if (state.knockOutData.length) {
            knockoutList = state.knockOutData.map((data) => {
                if (data.planId === knockoutData.planId && data.coverageLevel === knockoutData.coverageLevel) {
                    data = knockoutData;
                    match = true;
                }
                return data;
            });
            if (!match) {
                knockoutList.push(knockoutData);
            }
            ctx.setState(
                patch({
                    knockOutData: knockoutList,
                }),
            );
        } else {
            ctx.setState(
                patch({
                    knockOutData: [knockoutData],
                }),
            );
        }
    }

    @Action(ResetPlanKnockOutData)
    ResetPlanKnockOutData(ctx: StateContext<EnrollmentStateModel>, { planId }: ResetPlanKnockOutData): void {
        const state = ctx.getState();
        let knockoutList = this.utilService.copy(state.knockOutData);
        if (state.knockOutData.length) {
            knockoutList = knockoutList.map((data) => {
                if (data.planId === planId) {
                    data.disable = false;
                }
                return data;
            });
            ctx.setState(
                patch({
                    knockOutData: knockoutList,
                }),
            );
        }
    }
    @Action(SetPayment)
    SetPayment({ getState, patchState }: StateContext<EnrollmentStateModel>, { carrierId }: SetPayment): void {
        const store = getState();
        const applications = store.applications.slice().sort((firstItem, secondItem) => firstItem.cartItemId - secondItem.cartItemId);
        const cartData = store.cartItems;
        const payments: Payments[] = [];
        const allPlans = store.allPlans;
        const accountType = store.accountType;
        const listBillType = accountType.length ? accountType[0].attribute === AccountTypes.LIST_BILL_ACCOUNT : false;
        applications.forEach((app) => {
            const section = app.sections
                .filter((sec) => sec.title === StepTitle.PAYMENTOPTION || sec.title === StepTitle.PAYMENTLCOPTION)
                .pop();
            if (section && !listBillType) {
                const index = cartData.findIndex(
                    (cart) =>
                        cart.applicationId === app.id && (cart.applicationType === StepType.REINSTATEMENT || cart.id === app.cartItemId),
                );
                const carrierIdIndex = allPlans.findIndex((plan) => plan.id === app.planId);
                if (index >= 0) {
                    payments.push({
                        itemId: cartData[index].id,
                        steps: section.steps,
                        planId: app.planId,
                        flowId: app.id,
                        carrierId: carrierIdIndex === -1 ? carrierId : allPlans[carrierIdIndex].carrierId,
                        applicationType: cartData[index].applicationType,
                    });
                }
            }
        });
        patchState({
            payments: payments,
        });
    }

    @Action(SetEBSPayment)
    SetEBSPayment({ getState, patchState }: StateContext<EnrollmentStateModel>, { acctType }: SetEBSPayment): void {
        const store = getState();
        const applications = store.applications.slice().sort((firstItem, secondItem) => firstItem.cartItemId - secondItem.cartItemId);
        const accountType = store.accountType;
        let ebsPayment: EBS_Payment;
        const ebsAcctType = accountType.length ? Boolean(accountType[0].value) : false;
        applications.forEach((app) => {
            const section = app.sections.find((sec) => sec.title === StepTitle.PAYLOGIX_PAYMENT);
            if (section && ebsAcctType) {
                ebsPayment = {
                    isEBSAccount: accountType[0].value === "true",
                    steps: section.steps,
                };
            }
        });
        if (!ebsPayment) {
            ebsPayment = {
                isEBSAccount: false,
            };
        }
        patchState({
            ebsPayment: ebsPayment,
        });
    }
    /**
     * This method is used to set payment cost for the enrollment
     * @param param1 - stateContext reference of EnrollmentStateModel
     * @param param2 - carrier Id of the plan, is Reinstatement flow
     */
    @Action(SetDirectPaymentCost)
    SetDirectPaymentCost(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { carrierId, isReinstate }: SetDirectPaymentCost,
    ): void {
        const store = getState();
        let applications: Application[] = [];
        if (isReinstate) {
            applications = store.applications;
        } else {
            applications = store.applications.filter((app) =>
                store.applicationPanel.some(
                    (appPanel) =>
                        appPanel.appData.id === app.id &&
                        appPanel.carrierId === carrierId &&
                        appPanel.cartData.applicationType !== StepType.REINSTATEMENT,
                ),
            );
        }
        const cartData = store.cartItems;
        let totalCost = 0;
        applications.forEach((app) => {
            const section = app.sections
                .filter((sec) => sec.title === StepTitle.PAYMENTOPTION || sec.title === StepTitle.PAYMENTLCOPTION)
                .pop();
            if (section) {
                const index = cartData.findIndex(
                    (cart) =>
                        cart.applicationId === app.id &&
                        ((cart.applicationType === StepType.REINSTATEMENT && isReinstate) || cart.id === app.cartItemId),
                );
                if (index >= 0) {
                    totalCost += cartData[index].memberCost;
                    if (cartData[index].riders.length) {
                        cartData[index].riders.forEach((riderData) => {
                            totalCost += riderData.memberCost;
                        });
                    }
                }
            }
        });
        const directPaymentCost: DirectPaymentCost = {
            monthly: null,
            quarterly: null,
            semiAnnually: null,
            annually: null,
        };
        const payrollsPerYear = store.payFrequency.payrollsPerYear;
        directPaymentCost.monthly = (totalCost * (payrollsPerYear / 12)).toFixed(2);
        directPaymentCost.quarterly = (totalCost * (payrollsPerYear / 4)).toFixed(2);
        directPaymentCost.semiAnnually = (totalCost * (payrollsPerYear / 2)).toFixed(2);
        directPaymentCost.annually = (totalCost * payrollsPerYear).toFixed(2);

        patchState({
            directPaymentCost: directPaymentCost,
        });
    }
    @Action(MakeAppFlowStoreEmpty)
    MakeAppFlowStoreEmpty({ patchState }: StateContext<EnrollmentStateModel>): void {
        patchState({
            payFrequency: null,
            applications: [],
            cartItems: [],
            applicationResponse: [],
            allPlans: [],
            applicationPanel: [],
            appResponseItems: [],
            constraints: [],
            carrierRiskClasses: [],
            aflacAlways: [],
            reinstatementPanel: [],
            responseHashKeys: [],
            ssnValue: null,
            email: null,
            preferredContactTime: null,
            memberContactData: null,
            employeeId: null,
            payments: [],
            directPaymentCost: null,
            accountType: [],
        });
    }

    @Action(SetMemberContact)
    SetMemberContact({ getState, patchState, dispatch }: StateContext<EnrollmentStateModel>): Observable<any> {
        const store = getState();
        return this.memberService.getMemberContact(store.memberId, "HOME", store.mpGroup.toString()).pipe(
            tap(
                (response) => {
                    patchState({
                        memberContactData: response.body,
                        email: response.body.emailAddresses,
                        preferredContactTime: response.contactTimeOfDay,
                    });
                },
                (error) => {
                    if (error.error) {
                        dispatch(new SetErrorForShop(error.error));
                    }
                    this.shopCartService.displaySpinner({
                        isLoading: false,
                    });
                },
            ),
        );
    }

    /**
     * This method is used to set SNN data for the enrollment
     * @param { getState, patchState } - stateContext reference of EnrollmentStateModel {StateContext<EnrollmentStateModel>}
     * @returns Observable<MemberIdentifier[]>
     */
    @Action(SetSSNData)
    SetSSNData({ getState, patchState }: StateContext<EnrollmentStateModel>): Observable<MemberIdentifier[]> {
        const store = getState();
        return this.memberService.getMemberIdentifier(store.memberId, 1, false, store.mpGroup).pipe(
            tap((response) => {
                if (response[0]) {
                    patchState({
                        ssnValue: response[0].value,
                    });
                }
            }),
        );
    }

    /**
     * This method is used to set employee id for the enrollment
     * @param { getState, patchState } - stateContext reference of EnrollmentStateModel {StateContext<EnrollmentStateModel>}
     * @returns Observable<MemberIdentifier[]>
     */
    @Action(SetEmployeeId)
    SetEmployeeId({ getState, patchState }: StateContext<EnrollmentStateModel>): Observable<MemberIdentifier[]> {
        const store = getState();
        return this.memberService.getMemberIdentifier(store.memberId, 2, false, store.mpGroup).pipe(
            filter(([memberIdentifier]) => !!memberIdentifier),
            tap(([memberIdentifier]) => {
                patchState({
                    employeeId: memberIdentifier.value,
                });
            }),
        );
    }
    @Action(SetPartnerAccountType)
    SetPartnerAccountType({ getState, patchState }: StateContext<EnrollmentStateModel>): Observable<GroupAttribute[]> {
        const store = getState();
        return this.accountService
            .getGroupAttributesByName([AccountTypes.LIST_BILL_ACCOUNT, AccountTypes.ACH_ACCOUNT, AccountTypes.EBS_ACCOUNT], store.mpGroup)
            .pipe(
                tap((resp) => {
                    patchState({
                        accountType: resp,
                    });
                }),
            );
    }
    @Action(SetCompanyProductsDisplayed)
    SetCompanyProductsDisplayed(ctx: StateContext<EnrollmentStateModel>, { value }: SetCompanyProductsDisplayed): void {
        ctx.patchState({
            companyProductsDisplayed: value,
        });
    }
    @Action(DeclineRiderCartItem)
    DeclineRiderCartItem(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { index, planId, declineFlag }: DeclineRiderCartItem,
    ): void {
        const store = getState();
        const applications = this.utilService.copy(store.applicationPanel);

        const appIndex = applications.findIndex((app) => app.appData.planId === planId);
        if (appIndex > -1) {
            const ridersData = this.utilService.copy(applications[appIndex].riders);
            if (ridersData[index]) {
                ridersData[index].decline = declineFlag;
            }
            applications[appIndex].riders = ridersData;
        }
        patchState({
            applicationPanel: applications,
        });
    }
    /**
     * Function used to set the various product plan data.
     * @param param0 patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param memberData represents member data
     * @return observable to set product plan data
     */
    @Action(SetProductPlanData)
    SetProductPlanData({ patchState, dispatch }: StateContext<EnrollmentStateModel>, memberData: any): Observable<void | any[]> {
        const EMPLOYER_CONTRIBUTION = this.languageService.fetchPrimaryLanguageValue("primary.portal.shoppingCart.employerContribution");
        // Code to reset the coverage date(single & multiple) to user selected date when shop settings change
        if (memberData.data.singleCoverageDate) {
            this.quoteShopHelperService.customSingleCvgDate = memberData.data.singleCoverageDate;
            this.quoteShopHelperService.customMultipleCvgDate = undefined;
        } else if (memberData.data.multipleCoverageDate) {
            this.quoteShopHelperService.customMultipleCvgDate = memberData.data.multipleCoverageDate;
            this.quoteShopHelperService.customSingleCvgDate = undefined;
        } else if (this.quoteShopHelperService.customSingleCvgDate) {
            memberData.data.singleCoverageDate = this.quoteShopHelperService.customSingleCvgDate;
        } else if (this.quoteShopHelperService.customMultipleCvgDate) {
            memberData.data.multipleCoverageDate = this.quoteShopHelperService.customMultipleCvgDate;
        }

        this.shopCartService.displaySpinner({ isLoading: true });
        const planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        const isTpi = this.appFlowService.checkTpi();
        const referenceDate = this.dualPlanYearService.getReferenceDate();
        const moreSettingsObject = memberData.data.moreSettingsObject || {};
        return combineLatest([
            this.shoppingService.getCartItems(memberData.data.memberId, memberData.data.mpGroup, "", isTpi ? [] : planYearId),
            this.shoppingService.getPlanOfferings(
                undefined,
                memberData.data.selectedMethod,
                memberData.data.selectedState,
                moreSettingsObject,
                memberData.data.memberId,
                memberData.data.mpGroup,
                "plan.productId",
                referenceDate,
            ),
            this.userService.credential$,
        ]).pipe(
            switchMap(([cartItemsArray, planOfferings, credential]: [GetCartItems[], PlanOffering[], ProducerCredential]) => {
                const updateCartItems = [];
                cartItemsArray.forEach((cartItem) => {
                    if (
                        cartItem.coverageEffectiveDate < this.dateTransform(new Date()) &&
                        planOfferings.some((planOffering) => planOffering.id === cartItem.planOfferingId)
                    ) {
                        const updateCartApi = {
                            ...cartItem,
                            coverageEffectiveDate: this.dateTransform(this.tomorrowDate),
                            assistingAdminId: cartItem.assistingAdminId
                                ? cartItem.assistingAdminId
                                : credential.producerId || credential.adminId,
                        };
                        updateCartItems.push(
                            this.shoppingService.updateCartItem(
                                memberData.data.memberId,
                                memberData.data.mpGroup,
                                cartItem.id,
                                updateCartApi,
                            ),
                        );
                    }
                });
                return forkJoin(updateCartItems).pipe(
                    defaultIfEmpty(null),
                    switchMap((updatedItems) =>
                        this.staticUtilService.cacheConfigEnabled("general.feature.enable.benefitDollars").pipe(
                            switchMap((benefitDollarEnabled) =>
                                forkJoin(
                                    this.shoppingService.getProductOfferingsSorted(memberData.data.mpGroup),
                                    this.shoppingService.getShoppingCart(
                                        memberData.data.memberId,
                                        memberData.data.mpGroup,
                                        isTpi ? [] : planYearId,
                                    ),
                                    this.shoppingService.getCartItems(
                                        memberData.data.memberId,
                                        memberData.data.mpGroup,
                                        "planOfferingId",
                                        isTpi ? [] : planYearId,
                                    ),
                                    this.enrollmentService.getEnrollments(memberData.data.memberId, memberData.data.mpGroup),
                                    this.memberService.getMemberQualifyingEvents(memberData.data.memberId, memberData.data.mpGroup),
                                    this.benefitOffService.getPlanYears(memberData.data.mpGroup, false, true),
                                    benefitDollarEnabled
                                        ? this.accountService.getFlexDollarsOfMember(memberData.data.memberId, memberData.data.mpGroup)
                                        : of([]),
                                    this.accountService.getGroupAttributesByName([COVERAGE_START_DATE], memberData.data.mpGroup),
                                    this.benefitOffService.getPlanYears(memberData.data.mpGroup, false),
                                    this.benefitOffService.getPlanYears(memberData.data.mpGroup, true),
                                ),
                            ),
                            switchMap(
                                ([
                                    productOfferings,
                                    shoppingCart,
                                    cartItems,
                                    enrollments,
                                    qualifyingEvents,
                                    planYears,
                                    memberFlexDollars,
                                    groupAttributes,
                                    approvedPlanYears,
                                    unapprovedPlanYears,
                                ]) => {
                                    if (cartItems.length) {
                                        cartItems = cartItems.map((item) => {
                                            if (item.planOffering) {
                                                item.planOfferingId = item.planOffering.id;
                                            }
                                            return item;
                                        });
                                    }
                                    const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
                                    if (
                                        dualPlanYearData.isDualPlanYear &&
                                        dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP &&
                                        enrollments.length
                                    ) {
                                        const coverageStartDate = dualPlanYearData.oeCoverageStartDate;
                                        if (coverageStartDate) {
                                            enrollments = enrollments.filter(
                                                (enrollment) =>
                                                    !enrollment.validity.expiresAfter ||
                                                    this.dateService.checkIsAfter(
                                                        this.dateService.toDate(enrollment.validity.expiresAfter),
                                                        coverageStartDate,
                                                    ),
                                            );
                                        }
                                    }
                                    const apiArray = enrollments.map((enrollment) =>
                                        this.enrollmentService.getEnrollmentRiders(
                                            memberData.data.memberId,
                                            enrollment.id,
                                            memberData.data.mpGroup,
                                        ),
                                    );
                                    const enrollmentBeneficiaryCalls$: Observable<EnrollmentBeneficiary[]>[] = enrollments.map(
                                        (enrollment) =>
                                            this.enrollmentService.getEnrollmentBeneficiaries(
                                                memberData.data.memberId,
                                                enrollment.id,
                                                memberData.data.mpGroup,
                                            ),
                                    );

                                    memberFlexDollars.forEach((flex) => (flex.name = EMPLOYER_CONTRIBUTION));
                                    patchState({
                                        memberFlexDollars: memberFlexDollars,
                                    });
                                    this.allPlanYears = [...approvedPlanYears, ...unapprovedPlanYears];
                                    this.quoteShopHelperService.updateMaxDayDiffValue(
                                        this.dualPlanYearService.calculateMaxDayDifference(this.allPlanYears),
                                    );
                                    return forkJoin(enrollmentBeneficiaryCalls$).pipe(
                                        defaultIfEmpty(null),
                                        tap((enrolledBeneficiaries) => {
                                            enrollments.forEach((enrollment, index) => {
                                                enrollment.beneficiaries = enrolledBeneficiaries[index];
                                            });
                                        }),
                                        switchMap(() => forkJoin(apiArray)),
                                        defaultIfEmpty(null),
                                        withLatestFrom(this.store.select(EnrollmentMethodState)),
                                        switchMap(([enrolledRiders, enrollment]) => {
                                            enrollments.forEach((enrollmentItem, index) => {
                                                enrollmentItem.riders = enrolledRiders[index];
                                            });

                                            const shortTermDisability = productOfferings.find(
                                                (productEntry) => productEntry.product.id === ProductId.SHORT_TERM_DISABILITY,
                                            );
                                            if (shortTermDisability) {
                                                shortTermDisability.disableSTDProductForVCC =
                                                    enrollment?.currentEnrollment?.enrollmentMethod === EnrollmentMethod.CALL_CENTER &&
                                                    enrollment.is8x8CallCenterDisabilityRestricted;
                                            }
                                            let productPlanList = this.quoteShopHelperService.getProductPlanModelData(
                                                productOfferings,
                                                planOfferings,
                                                shoppingCart,
                                                cartItems,
                                                enrollments,
                                                memberData.data.singleCoverageDate,
                                                memberData.data.multipleCoverageDate,
                                                qualifyingEvents,
                                                planYears,
                                                groupAttributes,
                                                memberData.data.stateOrMethodChange,
                                                memberData.data.mpGroup,
                                                memberData.data.memberId,
                                            );
                                            const qLEvent: MemberQualifyingEvent = qualifyingEvents.find(
                                                (qle) =>
                                                    qle.status !== StatusType.DECLINED &&
                                                    qle.status !== StatusType.DENIED &&
                                                    this.isEnrollementOpen(qle.enrollmentValidity),
                                            );
                                            const isPlanInCart = productPlanList.some((productPlan) =>
                                                Boolean(productPlan.planOfferings.find((planOffering) => planOffering.inCart)),
                                            );
                                            patchState({
                                                isQLEPeriod: qLEvent !== undefined,
                                                currentQLE: qLEvent,
                                                cartItems: cartItems,
                                                enrollments: enrollments,
                                            });
                                            let returnObservable: Observable<PlanYear[]>;
                                            if (!memberData.data.singleCoverageDate && !memberData.data.multipleCoverageDate) {
                                                if (
                                                    qualifyingEvents.length > 0 &&
                                                    this.checkOEOfQualifyEvents(qualifyingEvents) &&
                                                    qualifyingEvents.some((event) => event.status === EVENT_IN_PROGRESS)
                                                ) {
                                                    if (isPlanInCart) {
                                                        this.checkCartItemCoverageDate(
                                                            productPlanList,
                                                            qualifyingEvents,
                                                            planYears,
                                                            groupAttributes,
                                                            planOfferings,
                                                        );
                                                        this.getQualifyEventDate(
                                                            productPlanList,
                                                            qualifyingEvents,
                                                            planYears,
                                                            groupAttributes,
                                                            planOfferings,
                                                        );
                                                        this.productPlanListWithNoQle(productPlanList, planYears, groupAttributes);
                                                    } else {
                                                        this.getQualifyEventDate(
                                                            productPlanList,
                                                            qualifyingEvents,
                                                            planYears,
                                                            groupAttributes,
                                                            planOfferings,
                                                        );
                                                        this.productPlanListWithNoQle(productPlanList, planYears, groupAttributes);
                                                    }
                                                } else {
                                                    productPlanList.forEach((productPlan) => {
                                                        const planYearExist = productPlan.planOfferings.find((plan) => !!plan.planYearId);
                                                        if (isPlanInCart) {
                                                            productPlan.planYearId = planYearExist
                                                                ? planYearExist.planYearId
                                                                : productPlan.planOfferings[0].planYearId;
                                                        }
                                                    });
                                                    const productPlansInPlanYear = productPlanList.filter(
                                                        (productPlan) => productPlan.planYearId,
                                                    );
                                                    if (productPlansInPlanYear.length) {
                                                        // get unique PY IDs from product offering panels to get PYs from API
                                                        returnObservable = forkJoin(
                                                            [
                                                                ...new Set(
                                                                    productPlansInPlanYear.map((productPlan) => productPlan.planYearId),
                                                                ),
                                                            ].map((planYear) =>
                                                                this.benefitOffService.getPlanYear(planYear, memberData.data.mpGroup),
                                                            ),
                                                        ).pipe(
                                                            tap(
                                                                (response) => {
                                                                    this.getProductPlanYearsDate(
                                                                        productPlanList,
                                                                        response,
                                                                        planOfferings,
                                                                        groupAttributes,
                                                                        this.allPlanYears,
                                                                    );
                                                                },
                                                                (error) => {
                                                                    dispatch(new SetProductPlanDataEmptyIfError(error.error));
                                                                    return of([]);
                                                                },
                                                            ),
                                                        );
                                                    } else {
                                                        productPlanList.forEach((productPlan) => {
                                                            this.getCoverageDate(productPlan, planOfferings, groupAttributes);
                                                        });
                                                    }
                                                }
                                            } else {
                                                const productPlansInPlanYear = productPlanList.filter(
                                                    (productPlan) => productPlan.planYearId,
                                                );
                                                if (productPlansInPlanYear.length) {
                                                    returnObservable = forkJoin(
                                                        [
                                                            ...new Set(productPlansInPlanYear.map((productPlan) => productPlan.planYearId)),
                                                        ].map((planYear) =>
                                                            this.benefitOffService.getPlanYear(planYear, memberData.data.mpGroup),
                                                        ),
                                                    ).pipe(
                                                        tap((response) => {
                                                            productPlanList = productPlanList.map((product) => {
                                                                if (
                                                                    !product.planYearId ||
                                                                    (product.planOfferings.some(
                                                                        (plan) => plan.taxStatus === TaxStatus.VARIABLE,
                                                                    ) &&
                                                                        response.some(
                                                                            (planYear) =>
                                                                                planYear.id === product.planYearId &&
                                                                                this.dateService.isBefore(new Date()) &&
                                                                                this.dateService.checkIsTodayOrBefore(
                                                                                    planYear.coveragePeriod.effectiveStarting,
                                                                                ),
                                                                        ))
                                                                ) {
                                                                    product.planYearId = null;
                                                                }
                                                                return product;
                                                            });
                                                        }),
                                                    );
                                                }
                                            }
                                            return (returnObservable || of(null)).pipe(
                                                // use map to change observable type to void
                                                finalize(() => {
                                                    patchState({
                                                        productPlanData: productPlanList,
                                                    });
                                                    this.shopCartService.displaySpinner({
                                                        isLoading: false,
                                                    });
                                                }),
                                            );
                                        }),
                                    );
                                },
                            ),
                            catchError((error) => {
                                dispatch(new SetProductPlanDataEmptyIfError(error.error));
                                return of([]);
                            }),
                        ),
                    ),
                );
            }),
            catchError((error) => {
                dispatch(new SetProductPlanDataEmptyIfError(error.error));
                return of([]);
            }),
        );
    }

    @Action(SetProductPlanDataEmptyIfError)
    SetProductPlanDataEmptyIfError({ patchState, dispatch }: StateContext<EnrollmentStateModel>, { error }: SetErrorForShop): void {
        if (error) {
            dispatch(new SetErrorForShop(error));
            patchState({
                productPlanData: [],
            });
        }
        this.shopCartService.displaySpinner({
            isLoading: false,
        });
    }
    /**
     * Set the error message in store based on language key received in error
     */
    @Action(SetErrorForShop)
    SetErrorMessageForShop({ patchState, dispatch }: StateContext<EnrollmentStateModel>, { error }: SetErrorForShop): void {
        let errorObj: ApiError = {};
        if (error && error.language && error.language.languageTag) {
            errorObj = {
                status: error.status,
                errorKey: error.language.languageTag,
            };
            dispatch(new FetchErrorMessageLanguage(error.language.languageTag, error.language.displayText));
        } else {
            const genericError = "secondary.api.400.invalid";
            errorObj = {
                status: ClientErrorResponseCode.RESP_400.toString(),
                errorKey: genericError,
            };
            dispatch(new FetchErrorMessageLanguage(genericError));
        }
        patchState({
            apiError: errorObj,
        });
        this.shopCartService.displaySpinner({
            isLoading: false,
        });
    }
    /**
     * Reset the API error object in state
     * @param context language state context
     */
    @Action(ResetApiErrorMessage)
    ResetApiErrorMessage(context: StateContext<EnrollmentStateModel>): void {
        context.patchState({
            apiError: null,
        });
    }
    /**
     * Function used to format the date to yyyy-MM-dd
     * @param dateValue: Input date
     * @returns date in yyyy-MM-dd
     */
    dateTransform(dateValue: Date): string {
        return this.datePipe.transform(dateValue, AppSettings.DATE_FORMAT_YYYY_MM_DD);
    }
    /**
     * Function used to set the initial date based on coverage start date rules
     * @param productPlanList :products offered
     * @param planOfferings: The plans that are offered
     */
    coverageStartDateRule(productPlanList: ProductOfferingPanel[], planOfferings: PlanOffering[]): void {
        productPlanList.forEach((productPlan) => {
            this.getCoverageDate(productPlan, planOfferings);
        });
    }
    /**
     * Method to get coverage date for each products
     * @param productPlan - To assign calculated coverage date for each product
     * @param planOfferings - To get coverageStartFunction to calculate coverage date
     * @param groupAttributes: Group attributes to get the earliest coverage date
     */
    getCoverageDate(productPlan: ProductOfferingPanel, planOfferings: PlanOffering[], groupAttributes?: GroupAttribute[]): void {
        const inCartPlan = productPlan.planOfferings.find((planOffering) => planOffering.inCart);
        if (inCartPlan) {
            productPlan.defaultCoverageDate = inCartPlan.cartItem.coverageValidity.effectiveStarting;
            productPlan.initialCoverageDate = inCartPlan.cartItem.coverageValidity.effectiveStarting;
            productPlan.coverageDate = inCartPlan.cartItem.coverageValidity.effectiveStarting;
            productPlan.multipleCoverageDateNew = inCartPlan.cartItem.coverageValidity.effectiveStarting;
        } else if (
            !productPlan.planYearId &&
            groupAttributes &&
            groupAttributes.length &&
            this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY) > this.dateTransform(todayDate)
        ) {
            this.planYearEffectiveDate = this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY);
            productPlan[DEFAULT_COVERAGE_DATE] = this.planYearEffectiveDate;
            productPlan[COVERAGE_DATE] = this.planYearEffectiveDate;
            productPlan[INITIAL_COVERAGE_DATE] = this.planYearEffectiveDate;
            productPlan[MULTIPLE_COVERAGE_DATE_NEW] = this.planYearEffectiveDate;
        } else {
            const coverageStart: PlanOffering[] = planOfferings.filter(
                (plan) => plan.plan.product.id === productPlan.product.id && plan.coverageStartFunction !== undefined,
            );
            let earliestCoverageStartRule: string = NEXT_FIRST_OF_MONTH;
            if (this.router.url.includes(Channel.DIRECT.toLocaleLowerCase())) {
                earliestCoverageStartRule = DAY_AFTER;
            } else {
                coverageStart.forEach((coverage) => {
                    if (coverage.coverageStartFunction === DAY_AFTER) {
                        earliestCoverageStartRule = coverage.coverageStartFunction.toString();
                        return;
                    }
                    if (
                        coverage.coverageStartFunction === NEXT_FIRST_OR_FIFTEENTH_OF_MONTH ||
                        (coverage.coverageStartFunction === NEXT_FIRST_OF_MONTH &&
                            earliestCoverageStartRule !== NEXT_FIRST_OR_FIFTEENTH_OF_MONTH)
                    ) {
                        earliestCoverageStartRule = coverage.coverageStartFunction.toString();
                    }
                });
            }
            const date: Date | string = coverageStart?.length
                ? this.calculateCoverageDateFunction(earliestCoverageStartRule)
                : this.calculateCoverageDateFunction(DAY_AFTER);
            productPlan.defaultCoverageDate = this.datePipe.transform(date, DateFormats.YEAR_MONTH_DAY);
            productPlan.coverageDate = this.datePipe.transform(date, DateFormats.YEAR_MONTH_DAY);
            productPlan.initialCoverageDate = this.datePipe.transform(date, DateFormats.YEAR_MONTH_DAY);
            productPlan.multipleCoverageDateNew = this.datePipe.transform(date, DateFormats.YEAR_MONTH_DAY);
        }
    }
    /**
     * Method to calculate coverage date based on coverageStartFunction selected in BO
     * @param coverageStartFunction - compare coverageStartFunction selected in BO to calculate coverage date
     * @return date - returns coverage date based on coverageStartFunction
     */
    calculateCoverageDateFunction(coverageStartFunction: string): Date | string {
        let date: Date | string;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (coverageStartFunction === DAY_AFTER) {
            const dayAfterDate = this.dateService.addDays(new Date(), 1);
            const notAllowedDate = this.dateService.toDate(dayAfterDate).getDate();
            if (DateInfo.LAST_DATES_OF_MONTH.includes(notAllowedDate)) {
                date = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            } else {
                date = dayAfterDate;
            }
        } else if (coverageStartFunction === NEXT_FIRST_OF_MONTH) {
            date = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        } else if (coverageStartFunction === NEXT_FIRST_OR_FIFTEENTH_OF_MONTH) {
            date =
                new Date(today) < new Date(today.getFullYear(), today.getMonth(), NEXT_FIFTEENTH_OF_MONTH_DATE)
                    ? new Date(today.getFullYear(), today.getMonth(), NEXT_FIFTEENTH_OF_MONTH_DATE)
                    : new Date(today.getFullYear(), today.getMonth() + 1, 1);
        }
        return date;
    }
    /**
     * Checking the qualifying events coverage dates
     * @param qualifyingEvents: Member qualifying life events
     * @return: boolean value
     *
     */
    checkQualifyEvents(qualifyingEvents: MemberQualifyingEvent[]): boolean {
        return Boolean(qualifyingEvents.some((event) => event.coverageStartDates.length > 0));
    }
    /**
     * Checking the qualifying events enrollment expiry date is in future
     * @param qualifyingEvents: Member qualifying life events
     * @return: boolean value
     *
     */
    checkOEOfQualifyEvents(qualifyingEvents: MemberQualifyingEvent[]): boolean {
        return qualifyingEvents.some(
            (event) =>
                event.enrollmentValidity?.expiresAfter >= this.dateTransform(todayDate) &&
                event.enrollmentValidity?.effectiveStarting <= this.dateTransform(todayDate),
        );
    }
    /**
     * Method to get qualifying events coverage date
     * Get the QLE coverage date and set for the product and if the QLE coverage date < tomorrow, then set the coverage date to tomorrow
     * Set coverage start date based on the shop selected during dual plan year scenario.
     * @param qualifyEvents : Qualifying Life Events
     * @param productPlanList : products offered
     * @param planYears: plan years added to the BO
     * @param groupAttributes: Group attributes to get the earliest coverage date
     * @param planOfferings list of plan offerings
     */
    getQualifyingEventsCoverageDate(
        qualifyEvents: QLEProductCoverageStart[],
        productPlanList: ProductOfferingPanel[],
        planYears?: PlanYear[],
        groupAttributes?: GroupAttribute[],
        planOfferings?: PlanOffering[],
    ): void {
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        let dualPlanYearOeCoverageDate = null;
        let isDualPlanYear = false;
        let isOeShop = false;
        let isQleAfterOeEnrollment = false;
        let isQleDuringOeEnrollment = false;
        let dualPlanYearQleEndDate = null;
        let isQleShop = false;
        const today = this.dateTransform(todayDate);
        const groupAttributesDateValue =
            groupAttributes && groupAttributes.length
                ? this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY)
                : null;
        if (dualPlanYearData) {
            isDualPlanYear = dualPlanYearData.isDualPlanYear;
            isOeShop = dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
            isQleShop = dualPlanYearData.selectedShop === DualPlanYearSettings.QLE_SHOP;
            isQleAfterOeEnrollment = dualPlanYearData.isQleAfterOeEnrollment;
            isQleDuringOeEnrollment = dualPlanYearData.isQleDuringOeEnrollment;
            dualPlanYearOeCoverageDate = isOeShop ? dualPlanYearData.oeCoverageStartDate : null;
            dualPlanYearQleEndDate = isQleShop ? dualPlanYearData.qlePlanYear?.coveragePeriod?.expiresAfter : null;
        }
        qualifyEvents.forEach((event) => {
            if (
                groupAttributes?.length &&
                this.dateService.getIsAfterOrIsEqual(this.dateService.toDate(groupAttributes[0].value), new Date()) &&
                this.checkGroupAttribute(groupAttributes, dualPlanYearQleEndDate, event, planOfferings) &&
                (!isQleDuringOeEnrollment || !isOeShop)
            ) {
                let groupAttributesCoverageDate = groupAttributes[0].value
                    ? groupAttributesDateValue
                    : this.datePipe.transform(this.coverageFunctionStartDate, DateFormats.YEAR_MONTH_DAY);
                groupAttributesCoverageDate = this.getValidCoverageDate(groupAttributesCoverageDate);
                this.coverageDateAssign(productPlanList, event, groupAttributesCoverageDate);
            } else if (
                event.date >= today &&
                (dualPlanYearOeCoverageDate === null ||
                    (isQleAfterOeEnrollment && event.date > dualPlanYearOeCoverageDate) ||
                    !isQleAfterOeEnrollment) &&
                (!isQleDuringOeEnrollment || !isOeShop)
            ) {
                const validCoverageDate = this.getValidCoverageDate(event.date.toString());
                this.coverageDateAssign(productPlanList, event, validCoverageDate);
                productPlanList[productPlanList.findIndex((product) => product.product.id === event.productId)].qleExist = true;
            } else if (isDualPlanYear && isOeShop) {
                const index = productPlanList.findIndex((product) => product.product.id === event.productId);
                if (index >= 0 && productPlanList[index].planYearId) {
                    const covStartDate = dualPlanYearData.planYearsData.find((py) => py.id === productPlanList[index].planYearId)
                        .coveragePeriod.effectiveStarting;
                    let currentCovStartDate: string = covStartDate > today ? covStartDate : today;
                    currentCovStartDate = this.getValidCoverageDate(currentCovStartDate);
                    productPlanList[index].defaultCoverageDate = currentCovStartDate;
                    productPlanList[index].initialCoverageDate = currentCovStartDate;
                    productPlanList[index].coverageDate = currentCovStartDate;
                    productPlanList[index].qleExist = true;
                    productPlanList[index].multipleCoverageDateNew = currentCovStartDate;
                }
            } else {
                this.assignPlanYearEffectiveDate(productPlanList, planYears, event);
            }
        });
        if (isDualPlanYear && isOeShop) {
            let covStartDate = dualPlanYearData.oeCoverageStartDate;
            let currentCovStartDate: string =
                covStartDate > this.dateTransform(this.tomorrowDate) ? covStartDate : this.dateTransform(this.tomorrowDate);
            currentCovStartDate = this.getValidCoverageDate(currentCovStartDate);
            productPlanList.forEach((product, index) => {
                if (!productPlanList[index].defaultCoverageDate) {
                    productPlanList[index].defaultCoverageDate = currentCovStartDate;
                    productPlanList[index].initialCoverageDate = currentCovStartDate;
                    productPlanList[index].coverageDate = currentCovStartDate;
                    productPlanList[index].qleExist = true;
                    productPlanList[index].multipleCoverageDateNew = currentCovStartDate;
                }
            });
            const openPlanYears: PlanYearModel[] = this.getOpenEnrollmentPlanYears(this.allPlanYears, productPlanList);
            // checking if multiple plan years are in open enrollment window
            if (openPlanYears.length > 1) {
                covStartDate = this.dualPlanYearService.getEarliestCoverageDate(openPlanYears);
                currentCovStartDate =
                    covStartDate > this.dateTransform(this.tomorrowDate) ? covStartDate : this.dateTransform(this.tomorrowDate);
                currentCovStartDate = this.getValidCoverageDate(currentCovStartDate);
                productPlanList
                    .filter((productPlan) => !productPlan.planYearId)
                    .forEach((product) => {
                        product.defaultCoverageDate = currentCovStartDate;
                        product.initialCoverageDate = currentCovStartDate;
                        product.coverageDate = currentCovStartDate;
                        product.qleExist = true;
                        product.multipleCoverageDateNew = currentCovStartDate;
                    });
            }
        }
    }

    /**
     * Gets valid coverage date
     * @param coverageDate is the default coverage date set based on new hire rule
     * @returns valid coverage date
     */
    getValidCoverageDate(coverageDate: string): string {
        const defaultCoverageDate = this.dateService.toDate(coverageDate);
        const coverageDay = defaultCoverageDate.getDate().toString();
        if (restrictedDates.includes(coverageDay)) {
            return this.dateService.getFormattedFirstOfMonths(defaultCoverageDate, 1, DateFormats.YEAR_MONTH_DAY);
        }
        return coverageDate;
    }

    /**
     * Set coverage start date based on the plan year.
     * @param event : Qualifying Life Events
     * @param productPlanList : products offered
     * @param planYears: plan years added to the BO
     */
    assignPlanYearEffectiveDate(productPlanList: ProductOfferingPanel[], planYears: PlanYear[], event: QLEProductCoverageStart): void {
        const today: string = this.dateTransform(new Date());
        productPlanList.forEach((productPlan) => {
            if (productPlan.product.id === event.productId) {
                let currentCovStartDate: string = today;
                if (planYears.some((planYear) => planYear.id === productPlan.planYearId)) {
                    const covStartDate: string = planYears.find((planYear) => planYear.id === productPlan.planYearId).coveragePeriod
                        .effectiveStarting;
                    currentCovStartDate = covStartDate > today ? covStartDate : today;
                }
                productPlan.defaultCoverageDate = currentCovStartDate;
                productPlan.initialCoverageDate = currentCovStartDate;
                productPlan.coverageDate = currentCovStartDate;
                productPlan.qleExist = true;
                productPlan.multipleCoverageDateNew = currentCovStartDate;
            }
        });
    }
    /**
     * Functions used to check the group attributes date is greater than event date and less than the QLE plan year coverage end date
     * @param groupAttributes: Group attributes to get the earliest coverage date
     * @param dualPlanYearQleEndDate: QLE plan year coverage end date
     * @param event: Qualifying Event
     * @param planOfferings list of plan offerings
     * @returns if group attribute is present or not
     */
    checkGroupAttribute(
        groupAttributes: GroupAttribute[],
        dualPlanYearQleEndDate: string,
        event: QLEProductCoverageStart,
        planOfferings: PlanOffering[],
    ): boolean {
        const groupAttributesDateValue =
            groupAttributes && groupAttributes.length
                ? this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY)
                : null;
        const coverageStart: PlanOffering = planOfferings.find(
            (plan) => plan.plan.product.id === event.productId && plan.coverageStartFunction !== undefined && plan.planYearId === undefined,
        );
        if (coverageStart) {
            this.coverageFunctionStartDate = this.calculateCoverageDateFunction(coverageStart.coverageStartFunction);
        }
        return (
            ((groupAttributes && groupAttributes.length && event.date < groupAttributesDateValue) ||
                (coverageStart &&
                    event.date < this.datePipe.transform(this.coverageFunctionStartDate, DateFormats.YEAR_MONTH_DAY) &&
                    event.date < groupAttributesDateValue)) &&
            (dualPlanYearQleEndDate === null || groupAttributesDateValue < dualPlanYearQleEndDate)
        );
    }
    /**
     * Function used to set the earliest coverage start date or qualifying event date for the products
     * @param productPlanList : Products that have been offered
     * @param event : Qualifying event
     * @param coverageDate : Coverage Effective Date
     */
    coverageDateAssign(productPlanList: ProductOfferingPanel[], event: QLEProductCoverageStart, coverageDate: string): void {
        const productPlan = productPlanList.find((product) => product.product.id === event.productId);
        if (productPlan) {
            productPlan.qleExist = true;
            productPlan.defaultCoverageDate = coverageDate;
            productPlan.initialCoverageDate = coverageDate;
            productPlan.coverageDate = coverageDate;
            productPlan.multipleCoverageDateNew = coverageDate;
        }
    }
    /**
     * Set the coverage date for the products which have no qualifying life event
     * @param productPlan : product offered
     * @param planYears : plan Years
     * @param groupAttributes: Group attributes to get the earliest coverage date
     */
    productsWithNoQle(productPlan: ProductOfferingPanel, planYears: PlanYear[], groupAttributes: GroupAttribute[]): void {
        const groupAttributesDateValue =
            groupAttributes && groupAttributes.length
                ? this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY)
                : null;
        const prodPlanYearIdExist: number = productPlan.planOfferings[0].planYearId;
        if (groupAttributes && groupAttributes.length && groupAttributesDateValue > this.dateTransform(todayDate)) {
            const groupAttributesDate = groupAttributesDateValue;
            productPlan.defaultCoverageDate = groupAttributesDate;
            productPlan.initialCoverageDate = groupAttributesDate;
            productPlan.coverageDate = groupAttributesDate;
            productPlan.multipleCoverageDateNew = groupAttributesDate;
        } else if (productPlan.planOfferings[0].planYearId && planYears.some((planYear) => planYear.id === prodPlanYearIdExist)) {
            const prodPlanYearId: number = productPlan.planOfferings[0].planYearId;
            const covStartDate: string = planYears.find((planYear) => planYear.id === prodPlanYearId).coveragePeriod.effectiveStarting;
            let currentCovStartDate: string;
            if (covStartDate > this.dateTransform(this.tomorrowDate)) {
                currentCovStartDate = covStartDate;
            } else if (productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                currentCovStartDate = this.dateTransform(
                    new Date(this.today.getFullYear(), this.today.getMonth() + ONE_MONTH, FIRST_OF_MONTH),
                );
            } else {
                currentCovStartDate = this.dateTransform(this.tomorrowDate);
            }

            productPlan.defaultCoverageDate = currentCovStartDate;
            productPlan.initialCoverageDate = currentCovStartDate;
            productPlan.coverageDate = currentCovStartDate;
            productPlan.multipleCoverageDateNew = currentCovStartDate;
        } else {
            productPlan.defaultCoverageDate = this.dateTransform(this.tomorrowDate);
            productPlan.initialCoverageDate = this.dateTransform(this.tomorrowDate);
            productPlan.coverageDate = this.dateTransform(this.tomorrowDate);
            productPlan.multipleCoverageDateNew = this.dateTransform(this.tomorrowDate);
        }
    }
    /**
     * Set the coverage date for the products which have no qualifying life event in the product plan list
     * @param productPlanList : products offered
     * @param planYears : plan Years
     * @param groupAttributes: Group attributes to get the earliest coverage date
     */
    productPlanListWithNoQle(productPlanList: ProductOfferingPanel[], planYears: PlanYear[], groupAttributes: GroupAttribute[]): void {
        productPlanList.forEach((productPlan) => {
            if (!productPlan.qleExist) {
                this.productsWithNoQle(productPlan, planYears, groupAttributes);
            }
        });
    }
    /**
     * Check the cart item and set the cart item coverage date else set the QLE coverage date
     * @param productPlanList : products offered
     * @param qualifyingEvents : Member qualifying events
     * @param planYears: plan years setup as part of benefit offering
     * @param groupAttributes: Group attributes to get the earliest coverage date
     * @param planOfferings list of plan offerings
     */
    checkCartItemCoverageDate(
        productPlanList: ProductOfferingPanel[],
        qualifyingEvents: MemberQualifyingEvent[],
        planYears: PlanYear[],
        groupAttributes: GroupAttribute[],
        planOfferings: PlanOffering[],
    ): void {
        productPlanList.forEach((productPlan) => {
            const inCartPlan = productPlan.planOfferings.find((planOffering) => planOffering.inCart);
            if (inCartPlan) {
                productPlan.defaultCoverageDate = inCartPlan.cartItem.coverageEffectiveDate;
                productPlan.initialCoverageDate = inCartPlan.cartItem.coverageEffectiveDate;
                productPlan.coverageDate = inCartPlan.cartItem.coverageEffectiveDate;
                productPlan.multipleCoverageDateNew = inCartPlan.cartItem.coverageEffectiveDate;
            } else {
                let qualifyEvents = [];
                qualifyingEvents.forEach((event) => {
                    if (event.status === EVENT_IN_PROGRESS) {
                        qualifyEvents = event.coverageStartDates.filter((products) =>
                            productPlanList
                                .filter((product) => !product.inCart)
                                .some((product) => products.productId === product.product.id),
                        );
                        this.getQualifyingEventsCoverageDate(qualifyEvents, productPlanList, planYears, groupAttributes, planOfferings);
                    }
                });
            }
        });
    }
    /**
     * Get the qualifying event date and set to the products coverage date
     * @param productPlanList : Products offered
     * @param qualifyingEvents : Qualifying Events registered
     * @param planYears : plan years setup as part of benefit offering
     * @param groupAttributes: Group attributes to get the earliest coverage date
     * @param planOfferings list of plan offerings
     */
    getQualifyEventDate(
        productPlanList: ProductOfferingPanel[],
        qualifyingEvents: MemberQualifyingEvent[],
        planYears: PlanYear[],
        groupAttributes: GroupAttribute[],
        planOfferings: PlanOffering[],
    ): void {
        let qualifyEvents: QLEProductCoverageStart[] = [];
        qualifyingEvents.forEach((event) => {
            if (event.status === EVENT_IN_PROGRESS) {
                qualifyEvents = event.coverageStartDates.filter((products) =>
                    productPlanList.some((product) => products.productId === product.product.id),
                );
                this.getQualifyingEventsCoverageDate(qualifyEvents, productPlanList, planYears, groupAttributes, planOfferings);
            }
        });
    }

    /**
     * Get the product plan years date and set the coverage date in the shop page accordingly
     * @param productPlanList Products offered
     * @param planYears list of Plan Years
     * @param planOfferings Plans offered
     * @param groupAttributes Group attributes to get the earliest coverage date
     * @param openOePlanYears all open enrollment plan years
     */
    getProductPlanYearsDate(
        productPlanList: ProductOfferingPanel[],
        planYears: PlanYearModel[],
        planOfferings: PlanOffering[],
        groupAttributes: GroupAttribute[],
        openOePlanYears: PlanYearModel[],
    ): void {
        const accountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const continuousPlans: ProductOfferingPanel[] = productPlanList.filter((product) => {
            if (
                !product.planYearId ||
                (product.planOfferings.some((plan) => plan.taxStatus === TaxStatus.VARIABLE) &&
                    planYears.some(
                        (planYear) =>
                            planYear.id === product.planYearId &&
                            this.dateService.isBefore(this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter.toString())) &&
                            this.dateService.isBeforeOrIsEqual(
                                this.dateService.toDate(planYear.coveragePeriod.effectiveStarting.toString()),
                            ),
                    ))
            ) {
                product.planYearId = null;
                return product;
            }
            return undefined;
        });

        if (accountDetails && accountDetails.importType === AccountImportTypes.SHARED_CASE && continuousPlans.length) {
            this.coverageStartDateRule(continuousPlans, planOfferings);
        }
        const openEnrollment: PlanYearModel[] = this.getOpenEnrollmentPlanYears(openOePlanYears, productPlanList);
        productPlanList.forEach((productPlan) => {
            if (productPlan.isAflac && !productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                if (this.isGroupAttributeInFuture(groupAttributes, productPlan)) {
                    this.planYearEffectiveDate = this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY);
                    productPlan[DEFAULT_COVERAGE_DATE] = this.planYearEffectiveDate;
                    productPlan[COVERAGE_DATE] = this.planYearEffectiveDate;
                    productPlan[INITIAL_COVERAGE_DATE] = this.planYearEffectiveDate;
                    productPlan[MULTIPLE_COVERAGE_DATE_NEW] = this.planYearEffectiveDate;
                } else if (!productPlan.planYearId && openEnrollment.length) {
                    this.planYearEffectiveDate = this.datePipe.transform(
                        this.dualPlanYearService.getReferenceDate(openEnrollment),
                        DateFormats.YEAR_MONTH_DAY,
                    );
                    productPlan[DEFAULT_COVERAGE_DATE] = this.planYearEffectiveDate;
                    productPlan[COVERAGE_DATE] = this.planYearEffectiveDate;
                    productPlan[INITIAL_COVERAGE_DATE] = this.planYearEffectiveDate;
                    productPlan[MULTIPLE_COVERAGE_DATE_NEW] = this.planYearEffectiveDate;
                } else if (productPlan.planYearId) {
                    this.setDefaultDates(planYears, planOfferings, productPlan, groupAttributes);
                } else {
                    this.getCoverageDate(productPlan, planOfferings);
                }
            } else if (productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                const planYearResponse = planYears.find((planYear) => planYear.id === productPlan.planYearId);
                if (planYearResponse) {
                    this.groupPlanYearEffectiveDate =
                        planYearResponse.coveragePeriod.effectiveStarting.toString() > this.dateTransform(todayDate)
                            ? planYearResponse.coveragePeriod.effectiveStarting.toString()
                            : this.dateTransform(this.tomorrowDate);
                    this.setCoverageDateForSharedCase(accountDetails.importType, productPlan);
                }
            } else if (!productPlan.isAflac && !productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                const planYearData: PlanOffering = productPlan.planOfferings.find((plan) => !!plan.planYearId);
                const planYearId: number = planYearData && planYearData.planYearId;

                const planYearResponse: PlanYearModel = planYears.find(
                    (planYear) => planYear.id === (productPlan.planYearId || planYearId),
                );
                if (planYearResponse && planYearResponse.coveragePeriod) {
                    this.setNonAflacPlanYearDate(planYearResponse.coveragePeriod);
                }

                productPlan[DEFAULT_COVERAGE_DATE] = this.nonAflacPlanYearEffectiveDate;

                productPlan[COVERAGE_DATE] = this.nonAflacPlanYearEffectiveDate;

                productPlan[INITIAL_COVERAGE_DATE] = this.nonAflacPlanYearEffectiveDate;
                productPlan[MULTIPLE_COVERAGE_DATE_NEW] = this.nonAflacPlanYearEffectiveDate;
            } else {
                this.getCoverageDate(productPlan, planOfferings);
            }
        });
    }
    /**
     * check if group attribute is in future date
     * @param groupAttributes group attribute value
     * @param productPlan selected product details
     * @returns true/false for post tax plan and group attribute in future
     */
    isGroupAttributeInFuture(groupAttributes: GroupAttribute[], productPlan: ProductOfferingPanel): boolean {
        return (
            !productPlan.planYearId &&
            groupAttributes &&
            groupAttributes.length &&
            this.dateService.checkIsAfter(this.dateService.toDate(groupAttributes[0].value))
        );
    }
    /**
     * get list of plan years having open enrollment period
     * @param planYears all plan years
     * @param productPlanList list of products with plan offerings
     * @returns list of open enrollment plan years
     */
    getOpenEnrollmentPlanYears(planYears: PlanYearModel[], productPlanList: ProductOfferingPanel[]): PlanYearModel[] {
        let openEnrollment: PlanYearModel[] = [];
        const currentDate = new Date();
        if (planYears.length) {
            openEnrollment = planYears.filter(
                (planYear) =>
                    this.dateService.isBeforeOrIsEqual(
                        this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting.toString()),
                        currentDate,
                    ) &&
                    this.dateService.getIsAfterOrIsEqual(
                        this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter.toString()),
                        currentDate,
                    ) &&
                    productPlanList.some((prod) => prod.isAflac && prod.planYearId === planYear.id),
            );
        }
        return openEnrollment;
    }

    /**
     * method to set coverage date values for Shared case
     * @param importType import type of account
     * @param productPlan selected product plan
     */
    setCoverageDateForSharedCase(importType: string, productPlan: ProductOfferingPanel): void {
        if ((importType === AccountImportTypes.SHARED_CASE && productPlan.planYearId) || importType !== AccountImportTypes.SHARED_CASE) {
            productPlan[DEFAULT_COVERAGE_DATE] = this.groupPlanYearEffectiveDate;
            productPlan[COVERAGE_DATE] = this.groupPlanYearEffectiveDate;
            productPlan[INITIAL_COVERAGE_DATE] = this.groupPlanYearEffectiveDate;
            productPlan[MULTIPLE_COVERAGE_DATE_NEW] = this.groupPlanYearEffectiveDate;
            productPlan[AFLAC_GROUP_PLAN_YEAR] = true;
        }
    }

    /**
     * Sets default dates for plans with planYearId
     * @param planYears list of Plan Years
     * @param planOfferings Plans offered
     * @param productPlan selected product plan
     * @param groupAttributes Group attributes to get the earliest coverage date
     */
    setDefaultDates(
        planYears: PlanYearModel[],
        planOfferings: PlanOffering[],
        productPlan: ProductOfferingPanel,
        groupAttributes: GroupAttribute[],
    ): void {
        const planYearRes = planYears.find((planYear) => planYear.id === productPlan.planYearId);
        if (
            planYearRes &&
            (planYearRes.enrollmentPeriod.expiresAfter.toString() >= this.dateTransform(todayDate) ||
                (groupAttributes &&
                    groupAttributes.length &&
                    this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY) > this.dateTransform(todayDate)) ||
                (!groupAttributes.length &&
                    this.dateService.getIsAfterOrIsEqual(
                        this.dateService.toDate(planYearRes.coveragePeriod.effectiveStarting.toString()),
                        todayDate,
                    )))
        ) {
            this.planYearEffectiveDate = planYearRes.coveragePeriod.effectiveStarting.toString();
            productPlan[DEFAULT_COVERAGE_DATE] = this.planYearEffectiveDate;
            productPlan[COVERAGE_DATE] = this.planYearEffectiveDate;
            productPlan[INITIAL_COVERAGE_DATE] = this.planYearEffectiveDate;
            productPlan[MULTIPLE_COVERAGE_DATE_NEW] = this.planYearEffectiveDate;
        } else {
            this.getCoverageDate(productPlan, planOfferings);
        }
    }

    /**
     * set non aflac plan year effective date value
     * @param planYearCoverage plan year coverage period value
     */
    setNonAflacPlanYearDate(planYearCoverage: Validity): void {
        this.nonAflacPlanYearEffectiveDate =
            planYearCoverage.effectiveStarting.toString() > this.dateTransform(todayDate)
                ? planYearCoverage.effectiveStarting.toString()
                : this.dateTransform(this.tomorrowDate);
    }
    /**
     * Function used to set the coverage effective date for different plan years
     * @param productPlanList : Products offered
     * @param planYears : Plan Years
     * @param planOfferings: Plans offered
     */
    multiplePlanYearsCoverageDate(productPlanList: ProductOfferingPanel[], planYears: PlanYear[], planOfferings: PlanOffering[]): void {
        productPlanList.forEach((productPlan) => {
            if (productPlan.planYearId) {
                let planYearEffDate: string;
                const planYearOffered = planYears.find((planYear) => planYear.id === productPlan.planYearId);
                if (planYearOffered) {
                    planYearEffDate = planYearOffered.coveragePeriod.effectiveStarting;
                }
                if (planYearEffDate && planYearEffDate > this.dateTransform(this.today)) {
                    productPlan[DEFAULT_COVERAGE_DATE] = productPlan[COVERAGE_DATE] = productPlan[INITIAL_COVERAGE_DATE] = planYearEffDate;
                    productPlan[MULTIPLE_PLAN_YEARS] = true;
                } else {
                    productPlan[DEFAULT_COVERAGE_DATE] =
                        productPlan[COVERAGE_DATE] =
                        productPlan[INITIAL_COVERAGE_DATE] =
                            this.dateTransform(this.tomorrowDate);
                }
            } else {
                this.coverageStartDateRule(productPlanList, planOfferings);
            }
        });
    }
    /**
     * Function used to check whether the plan year effective date is in past
     * @param productPlanList : Products offered
     * @param planOfferings : Plans offered
     * @param planYearEffectiveDate : Plan Year effective date
     * @param groupAttributes: Group attributes to get the earliest coverage start date
     * @param planYears: Plan Years
     */
    checkPlanYearEffectiveDate(
        productPlanList: ProductOfferingPanel[],
        planOfferings: PlanOffering[],
        planYearEffectiveDate: string,
        groupAttributes: GroupAttribute[],
        planYears: PlanYearModel[],
    ): void {
        if (this.planYearEffectiveDate > this.dateTransform(todayDate)) {
            this.planYearDefaultCoverageDate(productPlanList, planYearEffectiveDate, groupAttributes, planYears);
        } else {
            this.coverageStartDateRule(productPlanList, planOfferings);
        }
    }
    /**
     * Function used to set the plan year effective starting date and also check for the pre-tax plan years
     * Also set the plan years effective date for non-aflac products
     * @param productPlanList : Products offered
     * @param planYearDefaultDate : Selected plan year effective date
     * @param groupAttributes: Group attributes to get the earliest coverage start date
     * @param planYears: Plan Years
     */
    planYearDefaultCoverageDate(
        productPlanList: ProductOfferingPanel[],
        planYearDefaultDate: string,
        groupAttributes: GroupAttribute[],
        planYears: PlanYearModel[],
    ): void {
        const groupAttributesDateValue =
            groupAttributes && groupAttributes.length
                ? this.datePipe.transform(groupAttributes[0].value, DateFormats.YEAR_MONTH_DAY)
                : null;
        productPlanList.forEach((productPlan) => {
            if (productPlan.isAflac && !productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                productPlan[DEFAULT_COVERAGE_DATE] = planYearDefaultDate;
                productPlan[COVERAGE_DATE] = planYearDefaultDate;
                productPlan[INITIAL_COVERAGE_DATE] = planYearDefaultDate;
            } else if (!productPlan.isAflac || productPlan.product.carrierIds.includes(CarrierId.AFLAC_GROUP)) {
                const planYear: PlanYearModel = planYears.find((productPlanYear) => productPlanYear.id === productPlan.planYearId);
                if (planYear) {
                    this.nonAflacPlanYearEffectiveDate =
                        planYear.coveragePeriod.effectiveStarting.toString() > this.dateTransform(todayDate)
                            ? planYear.coveragePeriod.effectiveStarting.toString()
                            : this.dateTransform(this.tomorrowDate);
                    productPlan[DEFAULT_COVERAGE_DATE] = this.nonAflacPlanYearEffectiveDate;
                    productPlan[COVERAGE_DATE] = this.nonAflacPlanYearEffectiveDate;
                    productPlan[INITIAL_COVERAGE_DATE] = this.nonAflacPlanYearEffectiveDate;
                }
            }

            if (groupAttributes && groupAttributes.length && planYearDefaultDate === groupAttributesDateValue) {
                productPlan[PLAN_YEAR_EXIST] = true;
            }
        });
    }

    /**
     * Action to set new plan
     * @param getState defines get state of StateContext<EnrollmentStateModel>
     * @param patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param productId has the product id
     * @param newPlanOfferingObject has the planOffering object to be added to cart
     * @param planIndex has the plan index
     */
    @Action(SetNewPlan)
    SetNewPlan(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { productId, newPlanOfferingObject, planIndex }: SetNewPlan,
    ): void {
        const store = getState();
        const newproductPlanData = this.utilService.copy(store.productPlanData);
        const planOfferings = this.utilService.copy(store.allPlanOfferings);
        const cartItems = this.utilService.copy(store.cartItems);
        const enrollments = this.utilService.copy(store.enrollments);
        const productIndex = newproductPlanData.findIndex((product) => product.id === productId);
        const selectedProductData = newproductPlanData.find((product) => product.id === productId);
        let planIndexCheck = -1;
        const stackablePlanOfferings = selectedProductData.planOfferings.filter((offering) => offering.id === newPlanOfferingObject.id);
        if (selectedProductData && selectedProductData.planOfferings) {
            if (stackablePlanOfferings && stackablePlanOfferings.length > 1) {
                planIndexCheck = this.checkStackablePlanId(selectedProductData.planOfferings, newPlanOfferingObject);
            } else {
                planIndexCheck = selectedProductData.planOfferings.findIndex((offering) => offering.id === newPlanOfferingObject.id);
            }
        }
        if (productIndex > -1 && newproductPlanData[productIndex] && (planIndexCheck < 0 || planIndexCheck === planIndex)) {
            newproductPlanData[productIndex].planOfferings[planIndex] = newPlanOfferingObject;
        }
        this.quoteShopHelperService.checkPlanDependency(newproductPlanData, store.cartItems, planOfferings, enrollments, false);
        if (newproductPlanData[productIndex] && newproductPlanData[productIndex].planOfferings[planIndex].ridersData) {
            this.quoteShopHelperService.checkRiderEnrollmentRequirementStatus(
                newproductPlanData[productIndex].planOfferings[planIndex],
                cartItems,
                enrollments,
                planOfferings,
                false,
            );
        }
        patchState({
            productPlanData: newproductPlanData,
            cartItems: store.cartItems,
        });
    }
    /**
     * Method to get the planIndex from planOfferings to avoid plan duplication
     * @param planOfferings all plan offerings
     * @param planObject selected plan object
     * @returns planIndex
     */
    checkStackablePlanId(planOfferings: PlanOfferingPanel[], planObject: PlanOfferingPanel): number {
        let planIndexCheck = -1;
        if (planObject.cartItem) {
            planIndexCheck = planOfferings.findIndex(
                (offering) => offering.id === planObject.id && offering.cartItem && offering.cartItem.id === planObject.cartItem.id,
            );
        } else if (planObject.enrollment) {
            planIndexCheck = planOfferings.findIndex(
                (offering) => offering.id === planObject.id && offering.enrollment && offering.enrollment.id === planObject.enrollment.id,
            );
        } else {
            planIndexCheck = planOfferings.findIndex(
                (offering) => offering.id === planObject.id && !offering.cartItem && !offering.enrollment,
            );
        }
        return planIndexCheck;
    }

    /**
     * Action to set new product
     * @param getState defines get state of StateContext<EnrollmentStateModel>
     * @param patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param productId has the product id
     * @param newPlanOfferingObject has the planOffering object to be added to cart
     * @param newPlan has the new plan
     * @param cartItems has the items in cart
     */
    @Action(SetNewProduct)
    SetNewProduct(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { productId, newProductOfferingObject, newPlan, cartItems }: SetNewProduct,
    ): void {
        const store = getState();
        const newProductPlanData = this.utilService.copy(store.productPlanData);
        const planOfferings = this.utilService.copy(store.allPlanOfferings);
        const productIndex = newProductPlanData.findIndex((product) => product.id === productId);
        const enrollments = this.utilService.copy(store.enrollments);
        if (productIndex > -1) {
            newProductPlanData[productIndex] = newProductOfferingObject;
            if (newPlan) {
                this.quoteShopHelperService.checkPlanDependency(newProductPlanData, cartItems, planOfferings, enrollments, true);
                this.checkProductPlanDependency(newProductPlanData, cartItems, enrollments, true, planOfferings);
            }
        }
        patchState({
            productPlanData: newProductPlanData,
            cartItems: cartItems,
        });
    }

    /**
     * Checks for Plan dependency across Products
     *
     * @param newProductPlanData
     * @param cartItems
     * @param enrollments
     * @param checkRiderDependency
     * @param planOfferings
     */
    checkProductPlanDependency(
        newProductPlanData: ProductOfferingPanel[],
        cartItems: GetCartItems[],
        enrollments: Enrollments[],
        checkRiderDependency: boolean,
        planOfferings: PlanOfferingPanel[],
    ): void {
        newProductPlanData.forEach((productPlan) => {
            productPlan.planOfferings.forEach((plan) => {
                if (plan.ridersData) {
                    this.quoteShopHelperService.checkRiderEnrollmentRequirementStatus(
                        plan,
                        cartItems,
                        enrollments,
                        planOfferings,
                        checkRiderDependency,
                        newProductPlanData,
                    );
                }
            });
        });
    }
    /**
     * Action to add item to cart
     * @param param1  getState, patchState of EnrollmentStateModel state context
     * @param param2  productId : the product id,
     * newPlanOfferingObject : the planOffering object to be added to cart,
     * cartItems : a list of existing items in the cart
     * isEnrolled: is the plan in consideration is already enrolled
     */
    @Action(SetAddtoCart)
    SetAddtoCart(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { productId, newPlanOfferingObject, cartItems, isEnrolled }: SetAddtoCart,
    ): void {
        const store = getState();
        const newproductPlanData = this.utilService.copy(store.productPlanData);
        const productIndex = newproductPlanData.findIndex((product) => product.id === productId);
        const planOfferings = this.utilService.copy(store.allPlanOfferings);
        const enrollments = this.utilService.copy(store.enrollments);
        if (productIndex > -1) {
            newproductPlanData[productIndex].inCart = true;
            const planIndex = newproductPlanData[productIndex].planOfferings.findIndex(
                (plan) => plan.id === newPlanOfferingObject.id && !plan.inCart && (!plan.enrollment || plan.editCoverage),
            );
            if (newproductPlanData[productIndex].declined) {
                newproductPlanData[productIndex].declined = false;
            }
            if (planIndex > -1) {
                newproductPlanData[productIndex].planOfferings[planIndex] = newPlanOfferingObject;
                if (newPlanOfferingObject.stackable && !isEnrolled) {
                    // const allPlanOffering = this.utilService.copy(store.allPlanOfferings);
                    const newStackedPlan = this.utilService.copy(
                        store.allPlanOfferings.find((plan) => plan.id === newPlanOfferingObject.id),
                    );
                    if (newStackedPlan.enrollment || newStackedPlan.cartItem) {
                        newStackedPlan.inCart = false;
                        newStackedPlan.cartItem = undefined;
                        newStackedPlan.enrollment = undefined;
                    }
                    newproductPlanData[productIndex].planOfferings.splice(planIndex + 1, 0, newStackedPlan);
                }
                this.quoteShopHelperService.checkPlanDependency(newproductPlanData, cartItems, planOfferings, enrollments, true);
                if (newproductPlanData[productIndex].planOfferings[planIndex].ridersData) {
                    this.checkProductPlanDependency(newproductPlanData, cartItems, enrollments, true, planOfferings);
                }
            }
        }

        patchState({
            productPlanData: newproductPlanData,
            cartItems: cartItems,
        });
    }

    /**
     * Action to update a plan
     * @param getState defines get state of StateContext<EnrollmentStateModel>
     * @param patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param productId has the product id
     * @param newPlanOfferingObject hass the planOffering object to be added to cart
     * @param cartItems has the items in cart
     */
    @Action(UpdatePlan)
    UpdatePlan(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { productId, newPlanOfferingObject, cartItems }: UpdatePlan,
    ): void {
        const store = getState();
        const newProductPlanData = this.utilService.copy(store.productPlanData);
        const productIndex = newProductPlanData.findIndex((product) => product.id === productId);
        const planOfferings = this.utilService.copy(store.allPlanOfferings);
        const enrollments = this.utilService.copy(store.enrollments);

        if (productIndex !== -1) {
            const planIndex = newProductPlanData[productIndex].planOfferings.findIndex(
                (planOffering) => planOffering.cartItem && planOffering.cartItem.id === newPlanOfferingObject.cartItem.id,
            );
            if (planIndex !== -1) {
                newProductPlanData[productIndex].planOfferings[planIndex] = newPlanOfferingObject;
                this.quoteShopHelperService.checkPlanDependency(newProductPlanData, cartItems, planOfferings, enrollments, true);
                if (newProductPlanData[productIndex].planOfferings[planIndex].ridersData) {
                    this.checkProductPlanDependency(newProductPlanData, cartItems, enrollments, true, planOfferings);
                }
            }
        }

        patchState({
            productPlanData: newProductPlanData,
            cartItems: cartItems,
        });
    }

    @Action(DisablePlan)
    DisablePlan({ getState, patchState }: StateContext<EnrollmentStateModel>, { productId, newPlanOfferingObject }: DisablePlan): void {
        const store = getState();
        const newProductPlanData: ProductOfferingPanel[] = this.utilService.copy(store.productPlanData);
        const productIndex = newProductPlanData.findIndex((product) => product.id === productId);
        if (productIndex !== -1) {
            const planIndex = newProductPlanData[productIndex].planOfferings.findIndex((planOfferings) =>
                planOfferings.inCart
                    ? planOfferings.cartItem.id === newPlanOfferingObject.cartItem.id
                    : planOfferings.id === newPlanOfferingObject.id,
            );
            if (planIndex !== -1) {
                newPlanOfferingObject.inCart = false;
                newPlanOfferingObject.cartItem = null;
                newProductPlanData[productIndex].planOfferings[planIndex] = newPlanOfferingObject;
                newProductPlanData[productIndex].inCart = newProductPlanData[productIndex].planOfferings.some(
                    (planOffering) => planOffering.inCart,
                );
            }
        }
        patchState({
            productPlanData: newProductPlanData,
        });
    }
    @Action(ResetProductPlanData)
    ResetProductPlanData({ getState, patchState }: StateContext<EnrollmentStateModel>): void {
        const store = getState();
        let newProductPlanData = this.utilService.copy(store.productPlanData);
        newProductPlanData = [];
        patchState({
            productPlanData: newProductPlanData,
        });
    }
    @Action(UpdateSkippedStepResponses)
    UpdateSkippedStepResponses(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { skippedData }: UpdateSkippedStepResponses,
    ): void {
        const store = getState();
        const appResponseItems = this.utilService.copy(store.appResponseItems);
        appResponseItems.forEach((appResp) => {
            if (skippedData.planId === appResp.planId && appResp.response) {
                appResp.response = appResp.response.filter((stepResponse) => skippedData.responses.stepId !== stepResponse.stepId);
            }
        });
        patchState({
            appResponseItems: appResponseItems,
        });
    }
    /**
     * Action to set isOpenEnrollment true or false
     * @param param1 ctx : state context of EnrollmentStateModel
     * @param param2 mpGroup : mpGroup to get plan years,
     * useUnapproved : to get approved/unapproved plan years,
     * inOpenEnrollment : to get plan years related to open enrollment
     */
    @Action(SetIsOpenEnrollment)
    SetIsOpenEnrollment(ctx: StateContext<EnrollmentStateModel>, { mpGroup, useUnapproved, inOpenEnrollment }: SetIsOpenEnrollment): void {
        this.benefitOffService.getPlanYears(mpGroup, useUnapproved, inOpenEnrollment).subscribe((response) => {
            const isOpenEnrollment: boolean =
                response && !response.length ? false : response.some((py) => this.isEnrollementOpen(py.enrollmentPeriod));
            ctx.patchState({
                isOpenEnrollment: isOpenEnrollment !== undefined ? isOpenEnrollment : false,
            });
        });
    }

    /**
     * method to get the member salary, min salary threshold and products not available for lesser salary members
     * @param ctx context of Enrollment state model
     * @param1  memberId id and mpGroup of the member
     */
    @Action(SetSalaryAndRelatedConfigs)
    SetSalaryAndRelatedConfigs(ctx: StateContext<EnrollmentStateModel>, { memberId, mpGroup }: SetSalaryAndRelatedConfigs): void {
        let memberSalaryDetails: SalaryDetails;
        combineLatest([
            this.staticUtilService.cacheConfigValue("user.employee.job_information.min_salary.products"),
            this.staticUtilService.cacheConfigValue("user.employee.job_information.min_salary.product_specific"),
            this.memberService.getSalaries(memberId, false, mpGroup.toString()),
        ]).subscribe(
            ([minSalaryRequiredProducts, productSpecificMinSalary, salary]) => {
                const currentSalary = salary.find(
                    (activeSalary) =>
                        !activeSalary.validity.expiresAfter || this.dateService.checkIsTodayOrAfter(activeSalary.validity.expiresAfter),
                );
                memberSalaryDetails = {
                    minSalaryProducts: minSalaryRequiredProducts.split(","),
                    minSalaryThreshold: +productSpecificMinSalary,
                    memberSalary: currentSalary ? currentSalary.annualSalary : null,
                };

                ctx.patchState({
                    salaryDetails: memberSalaryDetails,
                });
            },
            (error) => {
                if (error.error) {
                    ctx.dispatch(new SetErrorForShop(error.error));
                    ctx.patchState({
                        salaryDetails: null,
                    });
                }
            },
        );
    }
    /**
     * Method to set values of isQLEPeriod(to check if its qualifying period), currentQLE(active QLE)
     * and qleResponse(API response)
     * @param ctx context of Enrollment state model
     * @param param1 id of the member
     * @param param2 member group number
     */
    @Action(SetQLE)
    SetQLE(ctx: StateContext<EnrollmentStateModel>, { memberId, mpGroup }: SetQLE): void {
        this.memberService.getMemberQualifyingEvents(memberId, mpGroup).subscribe((response) => {
            let qLEvent: MemberQualifyingEvent;
            let qleArray: MemberQualifyingEvent[] = [];
            if (response && response.length) {
                qleArray = response;
                qLEvent = response.find(
                    (x) =>
                        x.status !== StatusType.DECLINED && x.status !== StatusType.DENIED && this.isEnrollementOpen(x.enrollmentValidity),
                );
            }
            ctx.patchState({
                isQLEPeriod: qLEvent !== undefined,
                currentQLE: qLEvent,
                qleResponse: qleArray,
            });
        });
    }
    /**
     * To check whether enrollment is active
     * @param enrollmentPeriod refers enrollment period
     * @return boolean
     */
    isEnrollementOpen(enrollmentPeriod: Validity): boolean {
        if (enrollmentPeriod) {
            const startDate = this.dateService.toDate(enrollmentPeriod.effectiveStarting);
            const endDate = this.dateService.toDate(enrollmentPeriod.expiresAfter);
            const currentDate = new Date();
            return startDate <= currentDate && endDate >= currentDate;
        }
        return false;
    }

    /**
     * Action to remove stackable plan
     * @param getState defines get state of StateContext<EnrollmentStateModel>
     * @param patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param productId has the product id
     * @param cartItemId has the id of item in cart
     * @param cartItems has the items in cart
     */
    @Action(RemoveStackablePlan)
    RemoveStackablePlan(
        { getState, patchState }: StateContext<EnrollmentStateModel>,
        { productId, cartItemId, cartItems }: RemoveStackablePlan,
    ): void {
        const store = getState();
        const newProductPlanData: ProductOfferingPanel[] = this.utilService.copy(store.productPlanData);
        const productIndex = newProductPlanData.findIndex((product) => product.id === productId);
        const planOfferings = this.utilService.copy(store.allPlanOfferings);
        const enrollments = this.utilService.copy(store.enrollments);

        if (productIndex !== -1) {
            const planIndex = newProductPlanData[productIndex].planOfferings.findIndex(
                (planOffering) => planOffering.cartItem && planOffering.cartItem.id === cartItemId,
            );
            if (planIndex !== -1) {
                newProductPlanData[productIndex].planOfferings.splice(planIndex, 1);
                newProductPlanData[productIndex].inCart = newProductPlanData[productIndex].planOfferings.some((plan) => plan.inCart);
                this.quoteShopHelperService.checkPlanDependency(newProductPlanData, cartItems, planOfferings, enrollments, true);
                if (newProductPlanData[productIndex].planOfferings[planIndex]?.ridersData) {
                    newProductPlanData.forEach((productPlan) => {
                        productPlan.planOfferings.forEach((plan) => {
                            if (plan.ridersData) {
                                this.quoteShopHelperService.checkRiderEnrollmentRequirementStatus(
                                    plan,
                                    cartItems,
                                    enrollments,
                                    planOfferings,
                                    true,
                                    newProductPlanData,
                                );
                            }
                        });
                    });
                }
            }
        }

        patchState({
            productPlanData: newProductPlanData,
        });
    }
    /**
     * to set reinstateItem values
     */
    @Action(SetReinstateItem)
    SetReinstateItem({ getState, patchState }: StateContext<EnrollmentStateModel>, { reinstate }: SetReinstateItem): void {
        const store: EnrollmentStateModel = getState();
        if (store.reinstateItem) {
            const reinstateData: Reinstate = this.utilService.copy(store.reinstateItem);
            if (reinstateData.enrollments && reinstateData.enrollments.length) {
                reinstate.enrollments = reinstateData.enrollments;
                reinstate.policyNumber = reinstateData.policyNumber;
                reinstate.cartItemId = reinstateData.cartItemId;
            }
        }
        patchState({
            reinstateItem: reinstate,
        });
    }
    /**
     * to empty reinstateItem values
     */
    @Action(MakeReinstateStoreEmpty)
    MakeReinstateStoreEmpty({ patchState }: StateContext<EnrollmentStateModel>): void {
        patchState({
            reinstateItem: null,
        });
    }
    /**
     * to copy cartItems
     * @param param0 patchState defines patch state of StateContext<EnrollmentStateModel>
     * @param param1 cartData defines cart data to update to store
     */
    @Action(CopyCartData)
    CopyCartData({ patchState }: StateContext<EnrollmentStateModel>, { cartData }: CopyCartData): void {
        const cartItems: GetCartItems[] = [];
        if (cartData.length > 0) {
            cartData.forEach((cartItem) => {
                cartItems.push(cartItem);
                if (cartItem.riders.length > 0) {
                    cartItem.riders.forEach((riderCart) => {
                        cartItems.push(riderCart as GetCartItems);
                    });
                }
            });
            patchState({
                cartItems: cartItems,
            });
        }
    }
    /**
     * to set flow type to either payroll or direct
     * @param ctx context of Enrollment state model
     * @param isDirect indicates if it's direct or payroll flow
     */
    @Action(SetFlowType)
    isDirect(ctx: StateContext<EnrollmentStateModel>, { isDirect }: SetFlowType): void {
        ctx.setState(
            patch({
                isDirect: isDirect,
            }),
        );
    }

    /**
     * set data for member flex dollars
     * @param ctx: state context of enrollment state model
     * @param { memberFlexDollars } : member flex dollars data to set in store
     */
    @Action(SetMemberFlexDollars)
    SetMemberFlexDollars(ctx: StateContext<EnrollmentStateModel>, { memberFlexDollars }: SetMemberFlexDollars): void {
        ctx.setState(
            patch({
                memberFlexDollars: memberFlexDollars,
            }),
        );
    }
    /**
     * Set enrollment information for specific member
     * @param ctx: State context of enrollment state model
     * @param { enrollmentInfo } : Enrollment information to be stored in state
     */
    @Action(SetEnrollmentInformation)
    SetEnrollmentInformation(ctx: StateContext<EnrollmentStateModel>, { enrollmentInfo }: SetEnrollmentInformation): void {
        ctx.setState(
            patch({
                enrollmentInfo: enrollmentInfo,
            }),
        );
    }

    /**
     * Set risk Class Id for pricing of plans
     * @param ctx: State context of RiskClassId model
     * @param { riskClassId } : Risk Class Id to be stored in state
     */
    @Action(SetRiskClassId)
    SetRiskClassId(ctx: StateContext<RiskClassId>, { riskClassId }: SetRiskClassId): void {
        ctx.setState(
            patch({
                riskClassId: riskClassId,
            }),
        );
    }
    /**
     * Set enrollment information for specific member
     * @param param0: State context of enrollment state model
     * @param { isPlanListPage } : isPlanListPage flag to be stored in state
     */
    @Action(SetIsPlanListPage)
    SetIsPlanListPage(ctx: StateContext<EnrollmentStateModel>, { isPlanListPage }: SetIsPlanListPage): void {
        if (isPlanListPage !== undefined) {
            ctx.setState(
                patch({
                    isPlanListPage: isPlanListPage,
                }),
            );
        }
    }

    /**
     * Patch account producer list value in store
     * @param { patchState }: Enrollment state context patchState
     * @param { list }: account producer list data
     */
    @Action(SetAccountProducerList)
    SetAccountProducerList({ patchState }: StateContext<EnrollmentStateModel>, { list }: SetAccountProducerList): void {
        patchState({
            producerList: list,
        });
    }

    /**
     * Patch company products acknowledged members list in store
     * @param { patchState }: Enrollment state context patchState
     * @param { membersList }: company products acknowledged members list
     */
    @Action(SetCompanyProductsAcknowledgedMembers)
    SetCompanyProductsAcknowledgedMembers(
        { patchState }: StateContext<EnrollmentStateModel>,
        { membersList }: SetCompanyProductsAcknowledgedMembers,
    ): void {
        patchState({
            companyProductsAcknowledgedMembers: membersList,
        });
    }

    /**
     * Gets and stores current member's profile.
     *
     * @param param0 state context
     * @param param1 member and group ids
     * @returns observable of full member profile
     */
    @Action(SetFullMemberProfile)
    setFullMemberProfile(
        { patchState }: StateContext<EnrollmentStateModel>,
        { mpGroup, memberId }: SetFullMemberProfile,
    ): Observable<MemberProfile> {
        return this.memberService.getMember(memberId, true, mpGroup.toString()).pipe(
            map((response) => response.body),
            tap((info) =>
                patchState({
                    memberData: {
                        info,
                    },
                }),
            ),
        );
    }

    /**
     * Patch open enrollment plan years list in store
     * @param { patchState }: Enrollment state context patchState
     * @param { planYears }: open enrollment plan years
     */
    @Action(SetOpenEnrollmentPlanYears)
    SetOpenEnrollmentPlanYears({ patchState }: StateContext<EnrollmentStateModel>, { planYears }: SetOpenEnrollmentPlanYears): void {
        patchState({
            openEnrollmentPlanYears: planYears,
        });
    }
}
