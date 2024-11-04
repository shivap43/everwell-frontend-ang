import { BenefitsOfferingStateModel, ApprovalToasterStatus } from "./benefits-offering.model";
import { Action, State, StateContext, Selector, Store } from "@ngxs/store";
import { patch } from "@ngxs/store/operators";
import {
    BenefitsOfferingService,
    CoreService,
    Carrier,
    DeletePlanChoice,
    CarrierFormWithCarrierInfo,
    RegionNames,
    CarrierFormSetupStatus,
    PlansEligibility,
    ProductSelection,
    CarrierSetupStatus,
    CarrierFormStatus,
    BenefitsOfferingMode,
    Eligibility,
    CensusService,
    RSLIEligibility,
    AccountService,
    CarrierSetupStatusExtended,
    ThirdPartyPlatformRequirement,
    AccountDetails,
    BenefitOfferingSettingsInfo,
} from "@empowered/api";
import {
    SetAllProducts,
    SetAllCarriers,
    SetAllEligiblePlans,
    GetProductsPanel,
    SetPlanChoices,
    SetUnapprovedPlanChoices,
    UpdateProductsPanel,
    MapProductChoiceToPanelProduct,
    MapPlanChoicesToPanelProducts,
    SetBenefitsStateMPGroup,
    DiscardPlanChoice,
    SetPlanEligibility,
    SetLandingFlag,
    UpdateBenefitsOfferingState,
    SetCarrierForms,
    SaveCarrierFormResponses,
    SetRegions,
    SetProductCombinations,
    SetPopupExitStatus,
    SaveCarrierSetupStatus,
    SetDefaultPlanChoices,
    SetMaintenanceRequiredData,
    SetUnapprovedPanel,
    MapProductChoiceToUnapprovedPanelProduct,
    MapPlanChoicesToPlans,
    UpdateNewPlanYearChoice,
    MapProductChoiceToNewPlanYearPanel,
    SetNewPlanYearPanel,
    MapPlanChoicesToNewPlanYearPanel,
    SetUserPlanChoice,
    GetCarrierSetupStatuses,
    SetManagePlanYearChoice,
    MakeStoreEmpty,
    SetProductsTabView,
    SetApprovalToastValue,
    SetStepperData,
    SetEligibleEmployees,
    SetNewPlanYearSelection,
    GetRSLIEligibility,
    ResetQuasiModalVariables,
    SetSubmitApprovalToasterStatus,
    SetUnapprovedPlanChoicesWithPayload,
    SetAccountThirdPartyPlatforms,
    SetVasExceptions,
    SetThirdPartyPlatformRequirement,
    SetProductPlanChoices,
    UpdateCurrentPlanYearId,
    SetNewPlanYearValue,
} from "./benefits-offering.action";
import { catchError, tap, map, filter } from "rxjs/operators";
import { EMPTY, Observable, forkJoin, of, throwError } from "rxjs";
import { DatePipe } from "@angular/common";
import { HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { UtilService } from "../state-services/util.service";
import { LanguageService } from "@empowered/language";
import {
    CarrierId,
    PanelModel,
    AppSettings,
    Exceptions,
    PlanChoice,
    PolicyOwnershipType,
    CountryState,
    Product,
    PlanYear,
    Plan,
} from "@empowered/constants";
import { Injectable } from "@angular/core";
import { InitialBenefitsOfferingSteps } from "./constants/initial-offering-steps-data";
import { SideNavService } from "../services/side-nav/side-nav.service";
import { OfferingSteps } from "./constants/initial-offering-steps.model";
import { ResetState } from "@empowered/user/state/actions";
import { AccountInfoState } from "../dashboard/dashboard.state";
import { ExceptionBusinessService } from "../state-services/exception-business.service";

const defaultState: BenefitsOfferingStateModel = {
    allProducts: [],
    allCarriers: [],
    eligiblePlans: [],
    panelProducts: [],
    planChoices: [],
    planEligibilty: [],
    planCarriers: [],
    mpGroup: null,
    benefitOferingStates: [],
    productChoices: [],
    defaultStep: 0,
    approvedCarrierForms: null,
    unApprovedCarrierForms: null,
    region: [],
    combinations: [],
    unApprovedPlanChoices: [],
    unApprovedProductChoices: [],
    unapprovedPanelProducts: [],
    userNewPlanYearChoice: null,
    newPlanYearId: null,
    newplanYearPanel: [],
    newPlanYearProductChoice: [],
    userPlanChoices: [],
    carrierSetupStatuses: [],
    managePlanYearChoice: null,
    productsTabView: [],
    newPlanYearDetail: null,
    defaultStates: [],
    hasApprovalAppeared: [],
    offeringSteps: InitialBenefitsOfferingSteps.withPricing,
    eligibleEmployees: null,
    isNewPlanYear: null,
    newPlanYearSelection: null,
    approvedProductChoices: [],
    rsliEligibility: null,
    submitApprovalToasterStatus: [],
    isAccountTPP: null,
    thirdPartyRequirement: null,
    attributeId: null,
    currentPlanYearId: null,
};
const OPTIONS = "options";
const HQ = "HQ";
const APPROVED_WAGES_INDEX_ADJUSTING_FACTOR = 2;

@State<BenefitsOfferingStateModel>({
    name: "productOffering",
    defaults: defaultState,
})
@Injectable()
export class BenefitsOfferingState {
    constructor(
        private readonly benefitOfferingService: BenefitsOfferingService,
        private readonly coreService: CoreService,
        private readonly datepipe: DatePipe,
        private readonly utilService: UtilService,
        private readonly languageService: LanguageService,
        private readonly sideNavservice: SideNavService,
        private readonly censusService: CensusService,
        private readonly accountService: AccountService,
        private readonly exceptionService: ExceptionBusinessService,
        private readonly store: Store,
    ) {}
    @Selector()
    static getpanelProducts(state: BenefitsOfferingStateModel): PanelModel[] {
        return [...state.panelProducts];
    }
    @Selector()
    static geteligibleEmployees(state: BenefitsOfferingStateModel): number {
        return state.eligibleEmployees;
    }
    @Selector()
    static getNewPlanYearValue(state: BenefitsOfferingStateModel): boolean {
        return state.isNewPlanYear;
    }
    @Selector()
    static getAllProducts(state: BenefitsOfferingStateModel): Product[] {
        return [...state.allProducts];
    }
    @Selector()
    static getBenefitOfferingStates(state: BenefitsOfferingStateModel): CountryState[] {
        return [...state.benefitOferingStates];
    }
    @Selector()
    static getdefaultStates(state: BenefitsOfferingStateModel): CountryState[] {
        return [...state.defaultStates];
    }
    @Selector()
    static getAllCarriers(state: BenefitsOfferingStateModel): Carrier[] {
        return [...state.allCarriers];
    }

    @Selector()
    static getPlanCarriers(state: BenefitsOfferingStateModel): number[] {
        return [...state.planCarriers];
    }
    @Selector()
    static getNewPlanYearSelection(state: BenefitsOfferingStateModel): string {
        return state.newPlanYearSelection;
    }
    @Selector()
    static getMPGroup(state: BenefitsOfferingStateModel): number {
        return state.mpGroup;
    }
    @Selector()
    static getCarrierSetupStatuses(state: BenefitsOfferingStateModel): CarrierSetupStatus[] {
        return state.carrierSetupStatuses;
    }
    @Selector()
    static getApprovedCarrierForms(state: BenefitsOfferingStateModel): CarrierFormWithCarrierInfo[] {
        return state.approvedCarrierForms;
    }
    @Selector()
    static getUnapprovedCarrierForms(state: BenefitsOfferingStateModel): CarrierFormWithCarrierInfo[] {
        return state.unApprovedCarrierForms;
    }
    @Selector()
    static getAllCarrierForms(state: BenefitsOfferingStateModel): CarrierFormWithCarrierInfo[] {
        const allForms = [];
        if (state.unApprovedCarrierForms && state.unApprovedCarrierForms.length > 0) {
            allForms.push(...state.unApprovedCarrierForms);
        }
        if (state.approvedCarrierForms && state.approvedCarrierForms.length > 0) {
            allForms.push(...state.approvedCarrierForms);
        }
        const formsWithoutDupes: CarrierFormWithCarrierInfo[] = [];
        allForms.forEach((currform) => {
            if (
                !formsWithoutDupes.map((form) => form.id).includes(currform.id) ||
                (!currform.id && !formsWithoutDupes.map((form) => form.carrierId).includes(currform.carrierId))
            ) {
                formsWithoutDupes.push(currform);
            }
        });
        return formsWithoutDupes.sort((a, b) => a.carrierId - b.carrierId);
    }
    @Selector()
    static getRegions(state: BenefitsOfferingStateModel): RegionNames[] {
        return state.region;
    }
    @Selector()
    static getProductCombinations(state: BenefitsOfferingStateModel): any[] {
        return state.combinations;
    }
    @Selector()
    static getPlanChoices(state: BenefitsOfferingStateModel): PlanChoice[] {
        return state.planChoices;
    }
    @Selector()
    static getUnapprovedPlanChoices(state: BenefitsOfferingStateModel): PlanChoice[] {
        return state.unApprovedPlanChoices;
    }
    @Selector()
    static getPlanEligibility(state: BenefitsOfferingStateModel): PlansEligibility[] {
        return state.planEligibilty;
    }
    @Selector()
    static GetExitPopupStatus(state: BenefitsOfferingStateModel): boolean {
        return state.exitPopupStatus;
    }
    @Selector()
    static GetUnapprovedPanel(state: BenefitsOfferingStateModel): PanelModel[] {
        return state.unapprovedPanelProducts;
    }
    @Selector()
    static GetNewPlanYearChoice(state: BenefitsOfferingStateModel): boolean {
        return state.userNewPlanYearChoice;
    }
    @Selector()
    static GetPlanYearId(state: BenefitsOfferingStateModel): number {
        return state.newPlanYearId;
    }
    @Selector()
    static GetNewPlanYearPanel(state: BenefitsOfferingStateModel): PanelModel[] {
        return state.newplanYearPanel;
    }
    @Selector()
    static GetNewPlanYearProductChoice(state: BenefitsOfferingStateModel): ProductSelection[] {
        return state.newPlanYearProductChoice;
    }
    @Selector()
    static GetUserPlanChoices(state: BenefitsOfferingStateModel): PlanChoice[] {
        return state.userPlanChoices;
    }
    @Selector()
    static hasIncompleteForms(state: BenefitsOfferingStateModel): boolean {
        return Boolean(
            [...state.approvedCarrierForms, ...state.unApprovedCarrierForms].find(
                (form) => form.formStatus === CarrierFormSetupStatus.INCOMPLETE,
            ),
        );
    }
    @Selector()
    static GetManagePlanYearChoice(state: BenefitsOfferingStateModel): string {
        return state.managePlanYearChoice;
    }
    @Selector()
    static GetProductsTabView(state: BenefitsOfferingStateModel): any[] {
        return state.productsTabView;
    }
    @Selector()
    static GetPlanYearDetail(state: BenefitsOfferingStateModel): PlanYear {
        return state.newPlanYearDetail;
    }
    @Selector()
    static GetApprovalStatus(state: BenefitsOfferingStateModel): ApprovalToasterStatus[] {
        return state.hasApprovalAppeared;
    }
    @Selector()
    static getOfferingStepperData(state: BenefitsOfferingStateModel): OfferingSteps {
        return state.offeringSteps;
    }
    @Selector()
    static getApprovedProductChoices(state: BenefitsOfferingStateModel): ProductSelection[] {
        return state.approvedProductChoices;
    }
    @Selector()
    static getUnapprovedProductChoices(state: BenefitsOfferingStateModel): ProductSelection[] {
        return state.unApprovedProductChoices;
    }
    @Selector()
    static getRSLIEligibility(state: BenefitsOfferingStateModel): RSLIEligibility {
        return state.rsliEligibility;
    }
    @Selector()
    static getErrorMessageKey(state: BenefitsOfferingStateModel): string {
        return state.errorMessageKey;
    }
    /**
     * This selector is used to return list of Vas Exceptions
     * @param state is instance of BenefitsOfferingStateModel
     * @returns list of Vas Exceptions
     */
    @Selector()
    static getVasExceptions(state: BenefitsOfferingStateModel): Exceptions[] {
        return state.exceptions;
    }
    /**
     * This function is used to fetch snapshot of attributeId
     * @param state is instance of BenefitsOfferingStateModel
     * @returns attributeId
     */
    @Selector()
    static getGroupAttributeId(state: BenefitsOfferingStateModel): number {
        return state.attributeId;
    }
    /**
     * This selector is used to return boolean value which represents whether account has TPP or not
     * @param state is instance of BenefitsOfferingStateModel
     * @returns boolean which represents whether account has TPP or not
     */
    @Selector()
    static getAccountTPPStatus(state: BenefitsOfferingStateModel): boolean {
        return state.isAccountTPP;
    }
    /**
     * This selector is used to return all eligiblePlans
     * @param state is instance of BenefitsOfferingStateModel
     * @returns array of plans
     */
    @Selector()
    static getEligiblePlans(state: BenefitsOfferingStateModel): Plan[] {
        return state.eligiblePlans;
    }
    /**
     * This selector is used to return third party platform requirement value
     * @param state is instance of BenefitsOfferingStateModel
     * @returns an object thirdPartyRequirement from state
     */
    @Selector()
    static getThirdPartyPlatformRequirements(state: BenefitsOfferingStateModel): ThirdPartyPlatformRequirement {
        return state.thirdPartyRequirement;
    }
    /**
     * This selector is used to return submit approval toaster status
     * @param state is instance of BenefitsOfferingStateModel
     */
    @Selector()
    static getSubmitToasterStatus(state: BenefitsOfferingStateModel): ApprovalToasterStatus[] {
        return state.submitApprovalToasterStatus;
    }
    /**
     * This selector is used to return current plan year id
     * @param state is instance of BenefitsOfferingStateModel
     * @returns current plan year id
     */
    @Selector()
    static getCurrentPlanYearId(state: BenefitsOfferingStateModel): number {
        return state.currentPlanYearId;
    }
    /**
     * This method is used to set all eligible plans
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     * @param param1 states contains list of all eligible plans; accountType Account type - AI/AG
     * @returns all offerable plans which are eligible
     */
    @Action(SetAllEligiblePlans)
    SetAllEligiblePlans(ctx: StateContext<BenefitsOfferingStateModel>, { states, accountType }: SetAllEligiblePlans): Observable<any> {
        const state = ctx.getState();
        let stateArray = states;
        if (states.length === 0) {
            stateArray = state.benefitOferingStates.map((benefitsofffferingstate) => benefitsofffferingstate.abbreviation);
        }
        if (!stateArray.length) {
            const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
            stateArray = [currentAccount.situs.state.abbreviation];
        }
        const planChoiceAPI$ = this.benefitOfferingService.getPlanChoices(false, false, state.mpGroup);
        const offerablePlansAPI$ = this.benefitOfferingService.getOfferablePlans(stateArray, state.mpGroup, accountType);
        return forkJoin([planChoiceAPI$, offerablePlansAPI$]).pipe(
            tap(([planChoice, offerablePlans]) => {
                let plans: Plan[] = [];
                if (offerablePlans.plans) {
                    plans = offerablePlans.plans.filter((offerablePlan) => {
                        const planChoices = planChoice.filter((choices) => choices.plan.id === offerablePlan.id);
                        return (
                            offerablePlan.planEligibility.eligibility === Eligibility.ELIGIBLE ||
                            offerablePlan.vasFunding === HQ ||
                            offerablePlan.planEligibility.inEligibleReason ||
                            planChoices.length
                        );
                    });
                }
                ctx.setState(
                    patch({
                        eligiblePlans: plans,
                    }),
                );
            }),
        );
    }
    /**
     * This method is used to set the list of vas Exceptions
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     * @returns list of Vas Exceptions
     */
    @Action(SetVasExceptions)
    SetVasExceptions(ctx: StateContext<BenefitsOfferingStateModel>): Observable<Exceptions[]> {
        const state = ctx.getState();
        return this.exceptionService.getSelectedVasExceptions(state.mpGroup.toString()).pipe(
            tap((response) => {
                ctx.patchState({
                    exceptions: response,
                });
            }),
        );
    }
    @Action(ResetState)
    resetState(context: StateContext<BenefitsOfferingStateModel>): void {
        context.setState(defaultState);
    }

    @Action(SetPlanChoices)
    SetPlanChoices(ctx: StateContext<BenefitsOfferingStateModel>, payload: SetPlanChoices): Observable<any> {
        const state = ctx.getState();
        return this.benefitOfferingService.getPlanChoices(payload.useUnapproved, false, state.mpGroup).pipe(
            tap((response) => {
                ctx.setState(
                    patch({
                        planChoices: response,
                    }),
                );
            }),
        );
    }
    @Action(SetEligibleEmployees)
    SetEligibleEmployees(ctx: StateContext<BenefitsOfferingStateModel>, { eligibleEmployees }: SetEligibleEmployees): void {
        ctx.setState(
            patch({
                eligibleEmployees: eligibleEmployees,
            }),
        );
    }

    /**
     * stores the isNewPlanYear value
     */
    @Action(SetNewPlanYearValue)
    SetNewPlanYearValue(ctx: StateContext<BenefitsOfferingStateModel>, { isNewPlanYear }: SetNewPlanYearValue): void {
        ctx.setState(
            patch({
                isNewPlanYear: isNewPlanYear,
            }),
        );
    }
    /**
     * stores the newPlanYearSelection value
     */
    @Action(SetNewPlanYearSelection)
    SetNewPlanYearSelection(ctx: StateContext<BenefitsOfferingStateModel>, { newPlanYear }: SetNewPlanYearSelection): void {
        ctx.setState(
            patch({
                newPlanYearSelection: newPlanYear,
            }),
        );
    }

    @Action(SetUnapprovedPlanChoices)
    SetUnapprovedPlanChoices(ctx: StateContext<BenefitsOfferingStateModel>): Observable<any> {
        const state = ctx.getState();
        return this.benefitOfferingService.getPlanChoices(true, false, state.mpGroup).pipe(
            tap((response) => {
                ctx.setState(
                    patch({
                        unApprovedPlanChoices: response,
                    }),
                );
            }),
        );
    }

    /**
     * This method is used to fetch account third party platforms and sets @var isAccountTPP
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     * @returns an observable of boolean which represents whether account has TPP or not
     */
    @Action(SetAccountThirdPartyPlatforms)
    SetAccountThirdPartyPlatforms(ctx: StateContext<BenefitsOfferingStateModel>): Observable<boolean> {
        const state = ctx.getState();
        return this.accountService.getAccountThirdPartyPlatforms(state.mpGroup.toString()).pipe(
            filter((response) => response !== null && response !== undefined),
            map((response) => Boolean(response.length)),
            tap((response) => {
                ctx.setState(
                    patch({
                        isAccountTPP: response,
                    }),
                );
            }),
        );
    }
    /**
     * This method is used to fetch third party platform requirement and sets @var thirdPartyRequirement
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     * @returns an observable of third party platform requirement
     */
    @Action(SetThirdPartyPlatformRequirement)
    SetThirdPartyPlatformRequirement(ctx: StateContext<BenefitsOfferingStateModel>): Observable<ThirdPartyPlatformRequirement> {
        return this.benefitOfferingService.getBenefitOfferingSettings().pipe(
            tap((response) => {
                ctx.setState(
                    patch({
                        thirdPartyRequirement: {
                            thirdPartyPlatformRequired: response.thirdPartyPlatformRequired,
                            expectedThirdPartyPlatform: response.expectedThirdPartyPlatform,
                            applicableThirdPartyPlatforms: response.applicableThirdPartyPlatforms,
                        } as ThirdPartyPlatformRequirement,
                    }),
                );
            }),
            catchError((error) => {
                ctx.setState(
                    patch({
                        thirdPartyRequirement: {
                            thirdPartyPlatformRequired: false,
                        } as ThirdPartyPlatformRequirement,
                    }),
                );
                return of(error);
            }),
        );
    }
    /**
     * Method sets the unapproved plan choices passed from component to store
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     * @param planChoices planchoices payload to update in store
     */
    @Action(SetUnapprovedPlanChoicesWithPayload)
    SetUnapprovedPlanChoicesWithPayload(
        ctx: StateContext<BenefitsOfferingStateModel>,
        { planChoices }: SetUnapprovedPlanChoicesWithPayload,
    ): void {
        ctx.setState(
            patch({
                unApprovedPlanChoices: planChoices,
            }),
        );
    }

    @Action(SetDefaultPlanChoices)
    setDefaultPlanChoices(ctx: StateContext<BenefitsOfferingStateModel>): Observable<any> {
        const state = ctx.getState();
        return this.benefitOfferingService.getPlanChoices(false, false).pipe(
            tap((response) => {
                ctx.setState(
                    patch({
                        planChoices: response,
                    }),
                );
            }),
        );
    }

    @Action(SetAllCarriers)
    SetAllCarriers(ctx: StateContext<BenefitsOfferingStateModel>): Observable<any> {
        return this.coreService.getCarriers().pipe(
            tap((response) => {
                ctx.setState(
                    patch({
                        allCarriers: response,
                    }),
                );
            }),
        );
    }
    @Action(SetAllProducts)
    SetProducts(ctx: StateContext<BenefitsOfferingStateModel>): Observable<any> {
        ctx.dispatch(new SetAllCarriers());
        return this.coreService.getProducts().pipe(
            tap((resp) => {
                ctx.setState(
                    patch({
                        allProducts: resp,
                    }),
                );
            }),
            catchError((error) => {
                ctx.patchState({});

                return EMPTY;
            }),
        );
    }

    @Action(UpdateProductsPanel)
    UpdateProductsPanel(ctx: StateContext<BenefitsOfferingStateModel>, { panelProducts }: UpdateProductsPanel): void {
        ctx.setState(
            patch({
                panelProducts: panelProducts,
            }),
        );
    }
    /**
     * This function is triggered when SetLanding flag action is dispatched to fetch dependent data
     * to render IBO steps and determine landing step
     * @param ctx is the state context object
     * @returns Observable returned by the forkJoin of api calls
     */
    @Action(SetLandingFlag)
    SetLandingFlag(ctx: StateContext<BenefitsOfferingStateModel>): Observable<any> {
        const state = ctx.getState();
        const IBO_GROUP_ATTRIBUTE_NAME = "group_benefit_offering_step";
        const ATTRIBUTE_INDEX = 0;
        const planChoiceAPI = this.benefitOfferingService.getPlanChoices(true, false, state.mpGroup);
        const benefitOfferingStatesAPI = this.benefitOfferingService.getBenefitOfferingSettings(state.mpGroup);
        const unapprovedProductOfferingAPI = this.benefitOfferingService.getProductChoices(state.mpGroup, true);
        const approvedProductOfferingAPI = this.benefitOfferingService.getProductChoices(state.mpGroup, false);
        const groupAttributeAPI$ = this.accountService.getGroupAttributesByName([IBO_GROUP_ATTRIBUTE_NAME], state.mpGroup);

        const defaultStatesAPI = this.benefitOfferingService.getBenefitOfferingDefaultStates(state.mpGroup);
        return forkJoin([
            planChoiceAPI,
            benefitOfferingStatesAPI,
            defaultStatesAPI,
            groupAttributeAPI$,
            unapprovedProductOfferingAPI,
            approvedProductOfferingAPI,
        ]).pipe(
            tap(([planChoices, boStates, defaultStates, attributes, approvedProductChoices, unApprovedProductChoices]) => {
                const defaultProdChoices: ProductSelection[] = [];
                defaultProdChoices.push(...approvedProductChoices);
                defaultProdChoices.push(...unApprovedProductChoices);
                const defaultStepValue = attributes[ATTRIBUTE_INDEX] ? +attributes[ATTRIBUTE_INDEX].value : 0;
                const isDefaultState = boStates.states.some((offeringState) =>
                    defaultStates.some((defaultStateAbbr) => defaultStateAbbr.abbreviation === offeringState.abbreviation),
                );
                const defaultStep = isDefaultState ? defaultStepValue : 1;
                ctx.setState(
                    patch({
                        planChoices: planChoices,
                        benefitOferingStates: boStates.states,
                        defaultStates: defaultStates,
                        productChoices: defaultProdChoices,
                        defaultStep: defaultStep,
                        attributeId: attributes[ATTRIBUTE_INDEX] ? +attributes[ATTRIBUTE_INDEX].id : null,
                    }),
                );
            }),
        );
    }
    /**
     * This action is used to set products panel based on eligiblePlans and stores planChoices, productChoices
     * @param ctx is the state context object
     * @returns array of panel model items
     */
    @Action(GetProductsPanel)
    GetProductsPanel(ctx: StateContext<BenefitsOfferingStateModel>): PanelModel[] {
        const panelProducts: PanelModel[] = [];
        const state = ctx.getState();
        const eligiblePlans: Plan[] = this.filterNonAGEligiblePlans(state.eligiblePlans);
        Array.from(new Set(eligiblePlans.map((plan) => plan.productId))).forEach((productId) => {
            panelProducts.push(this.arrangeEligiblePlansToPanel(eligiblePlans, productId, state, state.planChoices, state.productChoices));
        });
        panelProducts.sort((productData1, productData2) => {
            if (productData1.product && productData2.product) {
                if (productData1.product.displayOrder === productData2.product.displayOrder) {
                    return productData1.product.name.localeCompare(productData1.product.name);
                }
                return productData1.product.displayOrder - productData2.product.displayOrder;
            }
            return undefined;
        });
        ctx.setState(
            patch({
                panelProducts: panelProducts,
            }),
        );
        return panelProducts;
    }

    @Action(MapProductChoiceToPanelProduct)
    MapProductChoiceToPanelProducts(
        ctx: StateContext<BenefitsOfferingStateModel>,
        { selectedProducts }: MapProductChoiceToPanelProduct,
    ): void {
        const state = ctx.getState();
        const panelProducts = this.utilService.copy(state.panelProducts);
        panelProducts.forEach((product) => {
            const productChoice = selectedProducts.filter((pro) => pro.id === product.product.id).pop();
            if (productChoice) {
                product.productChoice = productChoice;
            } else {
                product.productChoice = null;
            }
        });
        ctx.setState(
            patch({
                panelProducts: panelProducts,
                productChoices: selectedProducts,
            }),
        );
        const benefitsOfferingMode = this.sideNavservice.getBenefitsOfferingMode();
        if (benefitsOfferingMode && benefitsOfferingMode === BenefitsOfferingMode.INITIAL) {
            ctx.dispatch(new MapPlanChoicesToPanelProducts());
        }
    }
    @Action(MapPlanChoicesToPlans)
    MapPlanChoicesToPlans(ctx: StateContext<BenefitsOfferingStateModel>, { updatedPlanchoices }: MapPlanChoicesToPlans): void {
        const state = ctx.getState();
        const panelProducts = this.utilService.copy(state.unapprovedPanelProducts);
        panelProducts.forEach((product) => {
            product.plans.forEach((planData) => {
                const planChoice = updatedPlanchoices
                    .filter((updatedPlanChoice) =>
                        updatedPlanChoice.id
                            ? planData.plan.id === updatedPlanChoice.plan.id
                            : planData.plan.id === updatedPlanChoice.planId,
                    )
                    .pop();
                if (planChoice && planChoice.id) {
                    planData.planChoice = planChoice;
                }
                if (planChoice && planChoice.id === 0) {
                    planData.planChoice = null;
                }
            });
        });
        ctx.setState(
            patch({
                unapprovedPanelProducts: panelProducts,
            }),
        );
    }
    @Action(MapPlanChoicesToPanelProducts)
    MapPlanChoicesToPanelProducts(ctx: StateContext<BenefitsOfferingStateModel>): Observable<any> {
        const state = ctx.getState();
        return forkJoin(
            this.benefitOfferingService.getPlanChoices(true, false, state.mpGroup),
            this.benefitOfferingService.getPlanChoices(false, false, state.mpGroup),
        ).pipe(
            tap((resp) => {
                let planChoices = [...resp[0]];
                planChoices = planChoices.concat([...resp[1]]);
                const panelProducts = this.utilService.copy(state.panelProducts);
                panelProducts.forEach((product) => {
                    product.plans.forEach((planData) => {
                        const planChoice = planChoices.filter((updatedPlanChoice) => planData.plan.id === updatedPlanChoice.plan.id).pop();
                        planData.planChoice = planChoice ? planChoice : null;
                    });
                });
                ctx.setState(
                    patch({
                        panelProducts: panelProducts,
                    }),
                );
            }),
        );
    }
    @Action(SetBenefitsStateMPGroup)
    SetBenefitsStateMPGroup({ patchState }: StateContext<BenefitsOfferingStateModel>, { mpGroup }: SetBenefitsStateMPGroup): void {
        patchState({
            mpGroup: mpGroup,
        });
    }
    @Action(DiscardPlanChoice)
    DiscardPlanChoice(ctx: StateContext<BenefitsOfferingStateModel>): void {
        const state = ctx.getState();
        state.planChoices.forEach((choice) => {
            if (!state.eligiblePlans.filter((plan) => plan.id === choice.planId).pop()) {
                const deletedPlan: DeletePlanChoice = {};
                let enrollmentEndDate;
                if (choice.continuous) {
                    enrollmentEndDate = this.datepipe.transform(
                        new Date(
                            choice.enrollmentPeriod.expiresAfter
                                ? choice.enrollmentPeriod.expiresAfter
                                : new Date().setDate(new Date().getDate() - 1),
                        ),
                        AppSettings.DATE_FORMAT,
                    );
                }
                this.benefitOfferingService
                    .deletePlanChoice(deletedPlan, choice.id, state.mpGroup, enrollmentEndDate)
                    .subscribe((resp) => {});
            }
        });
    }
    @Action(SetPlanEligibility)
    SetPlanEligibility(ctx: StateContext<BenefitsOfferingStateModel>): void {
        const state = ctx.getState();
        ctx.setState(
            patch({
                planEligibilty: state.eligiblePlans.map((plan) => plan.planEligibility),
            }),
        );
    }
    @Action(UpdateBenefitsOfferingState)
    UpdateBenefitsOfferingState(ctx: StateContext<BenefitsOfferingStateModel>, { states }: UpdateBenefitsOfferingState): any {
        ctx.setState(
            patch({
                benefitOferingStates: states,
            }),
        );
    }

    /**
     *Get all unapproved and approved carrier forms
     *
     * @param ctx is state context to retrieve BO state model
     * @param payload is the request payload
     * @returns Array of CarrierFormWithCarrierInfo observables.
     */
    @Action(SetCarrierForms)
    setCarrierForms(ctx: StateContext<BenefitsOfferingStateModel>, payload: SetCarrierForms): Observable<CarrierFormWithCarrierInfo[]> {
        const state = ctx.getState();
        let carriersWithForms: CarrierFormWithCarrierInfo[] = [];
        const allCarrierStatuses: CarrierSetupStatus[] = state.carrierSetupStatuses.filter(
            (formObj) => !formObj.validity || !formObj.validity.expiresAfter,
        );

        // if no form id is present, the status of the form is THE GCSS status
        carriersWithForms = allCarrierStatuses
            .filter((form) => !form.carrierFormId)
            .map((response) => ({
                id: null,
                name: null,
                status: response,
                pages: null,
                carrierId: response.carrierId,
                carrierName: response.carrierName,
                formName: this.getAlternateCarrierFormName(false, response.carrierName),
                formStatus: this.checkForCarrierFormStatus(payload.initialFlow, response.status),
            }));
        if (allCarrierStatuses.filter((form) => form.carrierFormId).length) {
            return forkJoin(
                allCarrierStatuses
                    .filter((form) => form.carrierFormId)
                    .map((carrier) =>
                        this.benefitOfferingService
                            .getCarrierForm(state.mpGroup, carrier.carrierId, carrier.carrierFormId, payload.useUnapproved)
                            .pipe(
                                map((form) => {
                                    if (form) {
                                        if (form.pages) {
                                            form.pages.forEach((page, pageIndex) => {
                                                if (page.questions.length > 0) {
                                                    page.questions.forEach((question, questionIndex) => {
                                                        if (question.hideUnless.length > 0 && question.hideUnless[0].response) {
                                                            const responseId = question.hideUnless[0].response;
                                                            page.questions.forEach((dependencyQuestion) => {
                                                                if (dependencyQuestion[OPTIONS]) {
                                                                    dependencyQuestion[OPTIONS].forEach((option) => {
                                                                        if (
                                                                            option.questionResponseId === +responseId &&
                                                                            !question.dependencies.length
                                                                        ) {
                                                                            form.pages[pageIndex].questions[questionIndex].dependencies[0] =
                                                                                {
                                                                                    questionId: dependencyQuestion.id,
                                                                                    required: true,
                                                                                    response: option.text,
                                                                                    flag: true,
                                                                                };
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        const areResponsesNonNull =
                                            form.pages
                                                .map((page) => page.questions.map((q) => q["response"]).filter((q) => q))
                                                .filter((p) => p.length > 0).length > 0;
                                        return Object.assign(form, {
                                            id: form.id,
                                            name: form.name,
                                            status: carrier,
                                            pages: form.pages,
                                            carrierId: carrier.carrierId,
                                            carrierName: carrier.carrierName,
                                            formName: form.name ? form.name : this.getAlternateCarrierFormName(false, carrier.carrierName),
                                            formStatus: carrier.status
                                                ? carrier.status === CarrierFormSetupStatus.INCOMPLETE
                                                    ? this.doesAnyQuestionHaveResponse(form)
                                                        ? CarrierFormSetupStatus.INCOMPLETE
                                                        : CarrierFormSetupStatus.NOT_STARTED
                                                    : this.checkAndSetForAllFormStatus(payload.initialFlow, carrier.status)
                                                : CarrierFormSetupStatus.NOT_STARTED,
                                        });
                                    }
                                    // if no form is present, show as auto approved
                                    return {
                                        id: null,
                                        name: null,
                                        status: carrier,
                                        pages: null,
                                        carrierId: carrier.carrierId,
                                        carrierName: carrier.carrierName,
                                        formName: this.getAlternateCarrierFormName(false, carrier.carrierName),
                                        formStatus: CarrierFormSetupStatus.APPROVED,
                                    };
                                }),
                                tap((form) => {
                                    carriersWithForms.push(form);
                                }),
                                map((forms) => Array.prototype.concat.apply([], forms)),
                                catchError((e: HttpErrorResponse) => throwError(e)),
                            ),
                    ),
            ).pipe(
                tap((form) => {
                    let patchObj;
                    carriersWithForms.sort((a, b) => a.carrierId - b.carrierId);
                    if (payload.useUnapproved) {
                        patchObj = {
                            unApprovedCarrierForms: carriersWithForms,
                        };
                    } else {
                        patchObj = {
                            approvedCarrierForms: carriersWithForms,
                        };
                    }
                    ctx.patchState(patchObj);
                }),
            );
        }
        let patchObjNew;
        carriersWithForms.sort((a, b) => a.carrierId - b.carrierId);
        if (payload.useUnapproved) {
            patchObjNew = {
                unApprovedCarrierForms: carriersWithForms,
            };
        } else {
            patchObjNew = {
                approvedCarrierForms: carriersWithForms,
            };
        }
        ctx.patchState(patchObjNew);
        return of(carriersWithForms);
    }
    @Action(SaveCarrierFormResponses)
    // Makes API call to save responses given.
    saveCarrierFormResponses(
        ctx: StateContext<BenefitsOfferingStateModel>,
        payload: SaveCarrierFormResponses,
    ): Observable<HttpResponse<void>> {
        return this.benefitOfferingService.saveCarrierFormResponses(
            ctx.getState().mpGroup,
            payload.carrierId,
            payload.carrierFormId,
            payload.responses,
        );
    }
    @Action(SetRegions)
    SetRegions(ctx: StateContext<BenefitsOfferingStateModel>, { regionList }: SetRegions): void {
        ctx.setState(
            patch({
                region: regionList,
            }),
        );
    }
    @Action(SetProductCombinations)
    SetProductCombinations(ctx: StateContext<BenefitsOfferingStateModel>, { combinations }: SetProductCombinations): void {
        ctx.setState(
            patch({
                combinations: combinations,
            }),
        );
    }
    @Action(SetPopupExitStatus)
    SetPopupExitStatus(ctx: StateContext<BenefitsOfferingStateModel>, { exitPopupStatus }: SetPopupExitStatus): void {
        ctx.setState(
            patch({
                exitPopupStatus: exitPopupStatus,
            }),
        );
    }
    @Action(SaveCarrierSetupStatus)
    setCarrierFormStatus(ctx: StateContext<BenefitsOfferingStateModel>, payload: SaveCarrierSetupStatus): Observable<HttpResponse<void>> {
        const state = ctx.getState();
        return this.benefitOfferingService.saveCarrierSetupStatus(ctx.getState().mpGroup, payload.carrierId, payload.statusPayload);
    }
    /**
     * This action is used to set planChoices, productChoices, default and benefit-offering states
     * @param param1 getState is the state context object of benefits offering state model
     * to get state; patchState is the state context object of benefits offering state model to patch state
     * @returns Observable with plan choices, product choices, default and benefit-offering states
     */
    @Action(SetMaintenanceRequiredData)
    setMaintenanceRequiredData({
        getState,
        patchState,
    }: StateContext<BenefitsOfferingStateModel>): Observable<
        [PlanChoice[], BenefitOfferingSettingsInfo, PlanChoice[], CountryState[], ProductSelection[], ProductSelection[]]
        > {
        const state = getState();
        const planChoiceAPI$: Observable<PlanChoice[]> = this.benefitOfferingService.getPlanChoices(false, false, state.mpGroup);
        const benefitOfferingStatesAPI = this.benefitOfferingService.getBenefitOfferingSettings(state.mpGroup);
        const productChoices = [];
        const unApprovedPlanChoices$: Observable<PlanChoice[]> = this.benefitOfferingService.getPlanChoices(true, false, state.mpGroup);
        const defaultStatesAPI = this.benefitOfferingService.getBenefitOfferingDefaultStates(state.mpGroup);
        const unapprovedProductOfferingAPI = this.benefitOfferingService.getProductChoices(state.mpGroup, true);
        const approvedProductOfferingAPI = this.benefitOfferingService.getProductChoices(state.mpGroup, false);
        return forkJoin([
            planChoiceAPI$,
            benefitOfferingStatesAPI,
            unApprovedPlanChoices$,
            defaultStatesAPI,
            unapprovedProductOfferingAPI,
            approvedProductOfferingAPI,
        ]).pipe(
            tap(
                ([
                    planChoice,
                    benefitOfferingStates,
                    unApprovedPlanChoices,
                    defaultStates,
                    unapprovedProductOffering,
                    approvedProductOffering,
                ]) => {
                    productChoices.push(...unapprovedProductOffering);
                    productChoices.push(...approvedProductOffering);
                    this.benefitOfferingService.setBenefitOfferingSettingsData(benefitOfferingStates);
                    patchState({
                        planChoices: planChoice,
                        benefitOferingStates: benefitOfferingStates.states,
                        unApprovedPlanChoices: unApprovedPlanChoices,
                        defaultStates: defaultStates,
                        unApprovedProductChoices: unapprovedProductOffering,
                        approvedProductChoices: approvedProductOffering,
                        productChoices: productChoices,
                    });
                },
            ),
        );
    }
    /**
     * This action is used to set unApproved products panel based on eligiblePlans and stores planChoices, productChoices
     * @param param0 getState is the state context object of benefits offering state model to get state;
     * patchState is the state context object of benefits offering state model to patch state
     */
    @Action(SetUnapprovedPanel)
    SetUnapprovedPanel({ getState, patchState }: StateContext<BenefitsOfferingStateModel>): void {
        const panelProducts: PanelModel[] = [];
        const state = getState();
        const eligiblePlans: Plan[] = this.filterNonAGEligiblePlans(state.eligiblePlans);
        Array.from(new Set(eligiblePlans.map((plan) => plan.productId))).forEach((productId) => {
            panelProducts.push(
                this.arrangeEligiblePlansToPanel(
                    eligiblePlans,
                    productId,
                    state,
                    state.unApprovedPlanChoices,
                    state.unApprovedProductChoices,
                ),
            );
        });
        panelProducts.sort((productData1, productData2) => {
            if (productData1.product && productData2.product) {
                return productData1.product.displayOrder - productData2.product.displayOrder;
            }
            return undefined;
        });
        patchState({
            unapprovedPanelProducts: panelProducts,
        });
    }
    @Action(MapProductChoiceToUnapprovedPanelProduct)
    MapProductChoiceToUnapprovedPanelProduct(
        ctx: StateContext<BenefitsOfferingStateModel>,
        { selectedProducts }: MapProductChoiceToUnapprovedPanelProduct,
    ): void {
        const state = ctx.getState();
        const panelProducts = this.utilService.copy(state.unapprovedPanelProducts);
        panelProducts.forEach((product) => {
            const productChoice = selectedProducts.filter((pro) => pro.id === product.product.id).pop();
            if (productChoice) {
                product.productChoice = productChoice;
                // unchecks the individual or group checkbox that contains both individual and group
                // making the plan choice of particular planData to null
                product.plans.forEach((planData) => {
                    if (
                        (planData.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL && productChoice.individual === false) ||
                        (planData.plan.policyOwnershipType === PolicyOwnershipType.GROUP && productChoice.group === false)
                    ) {
                        planData.planChoice = null;
                    }
                });
            } else {
                product.productChoice = null;
                product.plans.forEach((planData) => {
                    planData.planChoice = null;
                });
            }
        });
        ctx.setState(
            patch({
                unapprovedPanelProducts: panelProducts,
                unApprovedProductChoices: selectedProducts,
            }),
        );
    }
    @Action(UpdateNewPlanYearChoice)
    UpdateNewPlanYearChoice(
        { patchState }: StateContext<BenefitsOfferingStateModel>,
        { choice, planYearId, planYear }: UpdateNewPlanYearChoice,
    ): void {
        patchState({
            userNewPlanYearChoice: choice,
            newPlanYearId: planYearId,
            newPlanYearDetail: planYear,
            newPlanYearProductChoice: [],
        });
    }
    /**
     * This action is used to set new planYear products panel based on eligiblePlans and stores planChoices, productChoices
     * @param param0 getState is the state context object of benefits offering state model to get state;
     * patchState is the state context object of benefits offering state model to patch state
     */
    @Action(SetNewPlanYearPanel)
    SetNewPlanYearPanel({ getState, patchState }: StateContext<BenefitsOfferingStateModel>): void {
        const panelProducts: PanelModel[] = [];
        const state = getState();
        const eligiblePlans: Plan[] = this.filterNonAGEligiblePlans(state.eligiblePlans);
        Array.from(new Set(eligiblePlans.map((plan) => plan.productId))).forEach((productId) => {
            const carriers = [];
            const plans = [];
            const productChoice = null;
            let groupEligibility = false;
            let individualEligibility = false;

            const productSpecificPlans = eligiblePlans.filter((plan) => plan.productId === productId);
            productSpecificPlans.forEach((eligiblePlan) => {
                if (groupEligibility === false && eligiblePlan.policyOwnershipType.indexOf(AppSettings.GROUP) >= 0) {
                    groupEligibility = true;
                }
                if (individualEligibility === false && eligiblePlan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) >= 0) {
                    individualEligibility = true;
                }
                const carrierInfo = state.allCarriers.filter((carrier) => eligiblePlan.carrierId === carrier.id).pop();
                if (carrierInfo && carriers.findIndex((carrier) => carrier.id === carrierInfo.id) === -1) {
                    carriers.push({
                        id: carrierInfo.id,
                        name: eligiblePlan.carrierNameOverride ? eligiblePlan.carrierNameOverride : carrierInfo.name,
                    });
                }
                const eligibleStatePlan = this.utilService.copy(state.planEligibilty).find((plan) => plan.planId === eligiblePlan.id);
                plans.push({
                    plan: eligiblePlan,
                    planChoice: null,
                    states: eligibleStatePlan ? eligibleStatePlan.allowedStates.map((stateData) => stateData.state) : [],
                    planEligibilty: eligibleStatePlan,
                });
            });
            panelProducts.push({
                product: state.allProducts.filter((product) => product.id === productId).pop(),
                carrier: Array.from(new Set(carriers)),
                groupEligibility: groupEligibility,
                individualEligibility: individualEligibility,
                productChoice: null,
                plans: plans,
            });
        });
        panelProducts.sort((productData1, productData2) => {
            if (productData1.product && productData2.product) {
                return productData1.product.displayOrder - productData2.product.displayOrder;
            }
            return undefined;
        });
        patchState({
            newplanYearPanel: panelProducts,
        });
    }
    @Action(MapProductChoiceToNewPlanYearPanel)
    MapProductChoiceToNewPlanYearPanel(
        ctx: StateContext<BenefitsOfferingStateModel>,
        { selectedProducts }: MapProductChoiceToNewPlanYearPanel,
    ): void {
        const state = ctx.getState();
        const panelProducts = this.utilService.copy(state.newplanYearPanel);
        panelProducts.forEach((product) => {
            const productChoice = selectedProducts.filter((pro) => pro.id === product.product.id).pop();
            if (productChoice) {
                product.productChoice = productChoice;
            } else {
                product.productChoice = null;
                product.plans.forEach((planData) => {
                    planData.planChoice = null;
                });
            }
        });
        ctx.setState(
            patch({
                newplanYearPanel: panelProducts,
                newPlanYearProductChoice: selectedProducts,
            }),
        );
    }
    @Action(MapPlanChoicesToNewPlanYearPanel)
    MapPlanChoicesToNewPlanYearPanel(
        ctx: StateContext<BenefitsOfferingStateModel>,
        { updatedPlanchoices }: MapPlanChoicesToNewPlanYearPanel,
    ): void {
        const state = ctx.getState();
        const panelProducts = this.utilService.copy(state.newplanYearPanel);
        if (updatedPlanchoices.length) {
            panelProducts.forEach((product) => {
                product.plans.forEach((planData) => {
                    const planChoice = updatedPlanchoices
                        .filter((updatedPlanChoice) =>
                            updatedPlanChoice.id
                                ? planData.plan.id === updatedPlanChoice.plan.id
                                : planData.plan.id === updatedPlanChoice.planId,
                        )
                        .pop();
                    if (planChoice && planChoice.id) {
                        planData.planChoice = planChoice;
                    }
                    if (planChoice && planChoice.id === 0) {
                        planData.planChoice = null;
                    }
                });
            });
        } else {
            panelProducts.forEach((product) => {
                product.plans.forEach((planData) => {
                    planData.planChoice = null;
                });
            });
        }
        ctx.setState(
            patch({
                newplanYearPanel: panelProducts,
            }),
        );
    }
    @Action(SetUserPlanChoice)
    SetUserPlanChoice(ctx: StateContext<BenefitsOfferingStateModel>, { planChoices }: SetUserPlanChoice): void {
        ctx.setState(
            patch({
                userPlanChoices: planChoices,
            }),
        );
    }

    /**
     * For each carrier, fetch all approved & unapproved carrier setup statuses and maintain in the store
     *
     * @param ctx is state context to retrieve BO state model
     * @param payload is the request payload
     * @returns An array of CarrierSetupStatus observables
     */
    @Action(GetCarrierSetupStatuses)
    getCarrierSetupStatuses(
        ctx: StateContext<BenefitsOfferingStateModel>,
        payload: GetCarrierSetupStatuses,
    ): Observable<CarrierSetupStatus[][]> {
        const observables: Observable<CarrierFormStatus[]>[] = [];
        const indicesOfApprovedWageWorks: number[] = [];
        ctx.patchState({ planCarriers: payload.carrierIds });
        payload.carrierIds.forEach((carrierId, index) => {
            if (carrierId === CarrierId.WAGEWORKS) {
                indicesOfApprovedWageWorks.push(index * APPROVED_WAGES_INDEX_ADJUSTING_FACTOR + 1);
            }
            observables.push(this.benefitOfferingService.getCarrierSetupStatuses(ctx.getState().mpGroup, carrierId, true));
            observables.push(this.benefitOfferingService.getCarrierSetupStatuses(ctx.getState().mpGroup, carrierId, false));
        });
        if (observables.length) {
            return forkJoin(observables).pipe(
                catchError((err) => of([])),
                tap((results) => {
                    if (payload.filterWageWorks) {
                        indicesOfApprovedWageWorks.forEach((wwIndex) => {
                            results[wwIndex] = results[wwIndex].filter((result) => result.carrierId !== CarrierId.WAGEWORKS);
                        });
                    }
                    ctx.patchState({
                        carrierSetupStatuses: Array.prototype.concat.apply(
                            [],
                            results.filter((res) => res.length).map((result) => result),
                        ),
                    });
                }),
            );
        }
        return of([]);
    }
    @Action(SetManagePlanYearChoice)
    SetManagePlanYearChoice(ctx: StateContext<BenefitsOfferingStateModel>, { choice }: SetManagePlanYearChoice): void {
        ctx.setState(
            patch({
                managePlanYearChoice: choice,
            }),
        );
    }
    /**
     * This action is used to make store values empty
     * @param { patchState } is StateContext of BenefitsOfferingStateModel
     */
    @Action(MakeStoreEmpty)
    MakeStoreEmpty({ patchState }: StateContext<BenefitsOfferingStateModel>): void {
        patchState({
            allProducts: [],
            allCarriers: [],
            eligiblePlans: [],
            panelProducts: [],
            planChoices: [],
            planEligibilty: [],
            benefitOferingStates: [],
            productChoices: [],
            defaultStep: 0,
            approvedCarrierForms: null,
            unApprovedCarrierForms: null,
            region: [],
            combinations: [],
            unApprovedPlanChoices: [],
            unApprovedProductChoices: [],
            unapprovedPanelProducts: [],
            userNewPlanYearChoice: null,
            newPlanYearId: null,
            newplanYearPanel: [],
            newPlanYearProductChoice: [],
            userPlanChoices: [],
            carrierSetupStatuses: [],
            managePlanYearChoice: null,
            productsTabView: [],
            newPlanYearDetail: null,
            defaultStates: [],
            approvedProductChoices: [],
            isAccountTPP: null,
            eligibleEmployees: null,
            isNewPlanYear: null,
            newPlanYearSelection: null,
            thirdPartyRequirement: null,
        });
    }
    @Action(SetProductsTabView)
    SetProductsTabView({ patchState }: StateContext<BenefitsOfferingStateModel>, { view }: SetProductsTabView): void {
        patchState({
            productsTabView: view,
        });
    }

    @Action(SetApprovalToastValue)
    SetApprovalToastValue(
        { getState, patchState }: StateContext<BenefitsOfferingStateModel>,
        { approvalToasterAppeared }: SetApprovalToastValue,
    ): void {
        const approvalsList = this.utilService.copy(getState().hasApprovalAppeared);
        const index = approvalsList.findIndex((obj) => obj.mpGroup === approvalToasterAppeared.mpGroup);
        if (index > -1) {
            approvalsList[index].hasToasterAppeared = approvalToasterAppeared.hasToasterAppeared;
        } else {
            approvalsList.push({
                mpGroup: approvalToasterAppeared.mpGroup,
                hasToasterAppeared: approvalToasterAppeared.hasToasterAppeared,
            });
        }
        patchState({
            hasApprovalAppeared: approvalsList,
        });
    }
    /**
     * This action is used to set planChoices, productChoices
     * @param param1 getState is the state context object of benefits offering state model
     * to get state; patchState is the state context object of benefits offering state model to patch state
     * @returns Observable with plan and product choices
     */
    @Action(SetProductPlanChoices)
    SetProductPlanChoices({
        getState,
        patchState,
    }: StateContext<BenefitsOfferingStateModel>): Observable<[PlanChoice[], PlanChoice[], ProductSelection[], ProductSelection[]]> {
        const state = getState();
        const approvedPlanChoices$: Observable<PlanChoice[]> = this.benefitOfferingService.getPlanChoices(false, false, state.mpGroup);
        const unapprovedPlanChoices$: Observable<PlanChoice[]> = this.benefitOfferingService.getPlanChoices(true, false, state.mpGroup);
        const unapprovedProductOffering$ = this.benefitOfferingService.getProductChoices(state.mpGroup, true);
        const approvedProductOffering$ = this.benefitOfferingService.getProductChoices(state.mpGroup, false);
        return forkJoin([approvedPlanChoices$, unapprovedPlanChoices$, unapprovedProductOffering$, approvedProductOffering$]).pipe(
            tap(([approvedPlanChoices, unapprovedPlanChoices, unapprovedProductOffering, approvedProductOffering]) => {
                patchState({
                    planChoices: approvedPlanChoices,
                    unApprovedPlanChoices: unapprovedPlanChoices,
                    unApprovedProductChoices: unapprovedProductOffering,
                    approvedProductChoices: approvedProductOffering,
                    productChoices: unapprovedProductOffering.concat(approvedProductOffering),
                });
            }),
        );
    }
    // Returns an array of unique carriers from planChoices
    getUniqueCarriersFromPlanChoices(planChoices: PlanChoice[], allCarriers: Carrier[]): Carrier[] {
        return [
            ...new Set(
                planChoices
                    .map((choice) => choice.plan.carrierId)
                    .filter((carrierId) => carrierId) // filter out undefined, null values
                    .map((id) => Object.assign(allCarriers.find((carrier) => carrier.id === id))),
            ),
        ];
    }
    /**
     * Names a form if no name is provided.
     * If no form name provided and single form for carrier:
     *     <CarrierName> Group Application Form
     * No form names and multiple forms for same carrier:
     *     <CarrierName> Application Form 1
     *     <CarrierName> Application Form 2
     */
    getAlternateCarrierFormName(hasMultipleForms: boolean, carrierName: string, formNumber?: number): string {
        return (
            hasMultipleForms
                ? this.languageService
                    .fetchPrimaryLanguageValue("primary.portal.carrierforms.formName.noName.multiple")
                    .replace("#number", `${formNumber}`)
                : this.languageService.fetchPrimaryLanguageValue("primary.portal.carrierforms.formName.noName.single")
        ).replace("#carrierName", carrierName);
    }
    @Action(SetStepperData)
    setStepperData(ctx: StateContext<BenefitsOfferingStateModel>, payload: SetStepperData): void {
        ctx.patchState({
            offeringSteps: payload.steps,
        });
    }
    /**
     * function to arrange the eligible panel plans
     */
    arrangeEligiblePlansToPanel(
        eligiblePlans: Plan[],
        productId: number,
        state: BenefitsOfferingStateModel,
        planChoices: PlanChoice[],
        productChoices: ProductSelection[],
    ): PanelModel {
        const carriers = [];
        const plans = [];
        let groupEligibility = false;
        let individualEligibility = false;
        eligiblePlans
            .filter((plan) => plan.productId === productId)
            .forEach((eligiblePlan) => {
                if (groupEligibility === false && eligiblePlan.policyOwnershipType.indexOf(AppSettings.GROUP) >= 0) {
                    groupEligibility = true;
                }
                if (individualEligibility === false && eligiblePlan.policyOwnershipType.indexOf(AppSettings.INDIVIDUAL) >= 0) {
                    individualEligibility = true;
                }
                const carrierInfo = state.allCarriers.find((carrier) => eligiblePlan.carrierId === carrier.id);
                if (carrierInfo && carriers.findIndex((carrier) => carrier.id === carrierInfo.id) === -1) {
                    carriers.push({
                        id: carrierInfo.id,
                        name: eligiblePlan.carrierNameOverride ? eligiblePlan.carrierNameOverride : carrierInfo.name,
                    });
                }
                const choice = planChoices.find((planChoice) => planChoice.plan.id === eligiblePlan.id);
                const eligiblePlanState = state.planEligibilty.find((plan) => plan.planId === eligiblePlan.id);
                plans.push({
                    plan: eligiblePlan,
                    planChoice: choice ? choice : null,
                    states: eligiblePlanState ? eligiblePlanState.allowedStates.map((stateData) => stateData.state) : [],
                    planEligibilty: eligiblePlanState,
                });
            });
        return {
            product: state.allProducts.filter((product) => product.id === productId).pop(),
            carrier: Array.from(new Set(carriers)),
            groupEligibility: groupEligibility,
            individualEligibility: individualEligibility,
            productChoice: productChoices.filter((product) => product.id === productId).pop(),
            plans: plans,
        };
    }
    /**
     * Returns true if at least one question has a non-null "response" field.
     * @param form Carrier form
     * @returns boolean signifying whether form has at least one non-null response.
     */
    doesAnyQuestionHaveResponse(form: CarrierFormWithCarrierInfo): boolean {
        // Count response/s and return true if the result is greater than 0
        return (
            [].concat(...form.pages.map((page) => page.questions)).reduce((accumalator, question) => {
                if (
                    // Choice-type questions have "responses" field, others have "response"
                    (question.response && question.response.response) ||
                    (question.responses && question.responses.length > 0)
                ) {
                    return accumalator + 1;
                }
                return accumalator + 0;
            }, 0) > 0
        );
    }
    @Action(GetRSLIEligibility)
    getRSLIEligibility(ctx: StateContext<BenefitsOfferingStateModel>): Observable<RSLIEligibility> {
        return this.censusService.getRSLIEligibility(ctx.getState().mpGroup).pipe(
            tap(() => ctx.patchState({ errorMessageKey: null })), // reset errorMessageKey
            catchError((error) => {
                ctx.patchState({
                    errorMessageKey: `secondary.portal.benefitsOffering.getRSLIEligibility.${error.error.status}.${error.error.code}`,
                });
                return of(null);
            }),
            tap((rsliEligibility) => ctx.patchState({ rsliEligibility })),
        );
    }
    /**
     * This method is used to reset all variables used in the product-flow quasi modal
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     */
    @Action(ResetQuasiModalVariables)
    resetAllQuasiModalStoreVariables(ctx: StateContext<BenefitsOfferingStateModel>): void {
        const state = ctx.getState();
        ctx.patchState({
            userNewPlanYearChoice: null,
            newPlanYearId: null,
            newPlanYearDetail: null,
            newPlanYearProductChoice: [],
            userPlanChoices: [],
            managePlanYearChoice: null,
            panelProducts: this.resetProductChoices(this.utilService.copy(state.panelProducts)),
            productChoices: [],
            unapprovedPanelProducts: this.resetProductChoices(this.utilService.copy(state.unapprovedPanelProducts), true),
            unApprovedProductChoices: [],
            newplanYearPanel: this.resetProductChoices(this.utilService.copy(state.newplanYearPanel), true),
        });
    }

    /**
     * This method is used to reset all panel product product choices and plan choices to null
     * @param panelProducts is an PanelModel[]
     * @param resetPlanChoices is boolean which represents whether to reset planChoices are not.
     * @returns {PanelModel[]} after resetting panel model array
     */
    resetProductChoices(panelProducts: PanelModel[], resetPlanChoices: boolean = false): PanelModel[] {
        panelProducts.forEach((product) => {
            product.productChoice = null;
            if (resetPlanChoices) {
                product.plans.forEach((planData) => {
                    planData.planChoice = null;
                });
            }
        });
        return panelProducts;
    }
    /**
     * This method is used to set the submitted approval toaster status and represents
     * whether user closed the toaster or not based on mpGroup
     *
     * @param ctx is instance of StateContext<BenefitsOfferingStateModel>
     * @param approvalToasterStatus is inputted toaster status
     */
    @Action(SetSubmitApprovalToasterStatus)
    setSubmitApprovalToasterStatus(
        ctx: StateContext<BenefitsOfferingStateModel>,
        { approvalToasterStatus }: SetSubmitApprovalToasterStatus,
    ): void {
        const approvalsList: ApprovalToasterStatus[] = this.utilService.copy(ctx.getState().submitApprovalToasterStatus);
        const index: number = approvalsList.findIndex((obj) => +obj.mpGroup === +approvalToasterStatus.mpGroup);
        if (index > -1) {
            approvalsList[index].isSubmitToasterClosed = approvalToasterStatus.isSubmitToasterClosed;
        } else {
            approvalsList.push({
                mpGroup: approvalToasterStatus.mpGroup,
                isSubmitToasterClosed: approvalToasterStatus.isSubmitToasterClosed,
            });
        }
        ctx.patchState({
            submitApprovalToasterStatus: approvalsList,
        });
    }
    /**
     * This method is used to set the current plan year id
     * @param param1 is instance of StateContext<BenefitsOfferingStateModel>
     * @param param2 is the current plan year id
     */
    @Action(UpdateCurrentPlanYearId)
    updateCurrentPlanYearId(
        { patchState }: StateContext<BenefitsOfferingStateModel>,
        { currentPlanYearId }: UpdateCurrentPlanYearId,
    ): void {
        patchState({
            currentPlanYearId: currentPlanYearId,
        });
    }
    /**
     * check carrier form status for aflac products
     * @param initialFlow check if ibo or mbo
     * @param status carrier status from api
     * @returns CarrierFormSetupStatus enum for carrier form status
     */
    checkForCarrierFormStatus(initialFlow: boolean, status: CarrierFormSetupStatus | CarrierSetupStatusExtended): CarrierFormSetupStatus {
        let formStatus: CarrierFormSetupStatus = null;
        if (
            status === CarrierFormSetupStatus.APPROVED_AUTO ||
            status === CarrierFormSetupStatus.APPROVED_BY_CARRIER ||
            (status === CarrierFormSetupStatus.SIGNED_BY_GROUP && initialFlow)
        ) {
            formStatus = CarrierFormSetupStatus.APPROVED;
        } else if (status === CarrierFormSetupStatus.SIGNED_BY_GROUP && !initialFlow) {
            formStatus = CarrierFormSetupStatus.PENDING;
        } else {
            formStatus = CarrierFormSetupStatus.INCOMPLETE;
        }
        return formStatus;
    }
    /**
     * check carrier form status for partner carrier products
     * @param initialFlow check if ibo or mbo
     * @param status carrier status from api
     * @returns CarrierFormSetupStatus enum for carrier form status
     */
    checkAndSetForAllFormStatus(initialFlow: boolean, status: CarrierFormSetupStatus | CarrierSetupStatusExtended): CarrierFormSetupStatus {
        let formStatus: CarrierFormSetupStatus = null;
        if (
            status === CarrierFormSetupStatus.APPROVED_AUTO ||
            status === CarrierFormSetupStatus.APPROVED_BY_CARRIER ||
            (status === CarrierFormSetupStatus.SIGNED_BY_GROUP && initialFlow)
        ) {
            formStatus = CarrierFormSetupStatus.APPROVED;
        } else if (
            (status === CarrierFormSetupStatus.SIGNED_BY_GROUP && !initialFlow) ||
            status === CarrierFormSetupStatus.SIGNED_BY_BROKER ||
            status === CarrierFormSetupStatus.SUBMITTED_TO_CARRIER
        ) {
            formStatus = CarrierFormSetupStatus.PENDING;
        } else if (status === CarrierFormSetupStatus.DENIED_BY_CARRIER) {
            formStatus = CarrierFormSetupStatus.DENIED;
        } else if (status === CarrierFormSetupStatus.CANCELLED_MIN_PARTICIPATION || status === CarrierFormSetupStatus.CANCELED) {
            formStatus = CarrierFormSetupStatus.CANCELED;
        }
        return formStatus;
    }
    /**
     * This method is used to filter all non-Aflac Group, eligible plans from offerable plans
     * @param offerablePlans contains all offerable plans
     * @returns a clone of non-Aflac Group eligible plans
     */
    filterNonAGEligiblePlans(offerablePlans: Plan[]): Plan[] {
        return this.utilService.copy(
            offerablePlans.filter(
                (eachPlan: Plan) =>
                    eachPlan.carrierId !== CarrierId.AFLAC_GROUP &&
                    !eachPlan.planEligibility.inEligibleReason &&
                    eachPlan.planEligibility.eligibility === Eligibility.ELIGIBLE,
            ),
        );
    }
}
