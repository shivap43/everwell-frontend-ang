/**
 * This service is used to store few commonly used methods across the MBO functionalities
 * This service is used to store few values which can be accessed throughout MBO functionalities
 * This service is used to declare/store few behavior subject which are used throughout MBO functionalities
 */
import { Injectable, OnDestroy } from "@angular/core";
import { Subject, BehaviorSubject, Observable, forkJoin, of, combineLatest } from "rxjs";
import { AccountDetails } from "@empowered/api";
import { MatTableDataSource } from "@angular/material/table";
import { BenefitOfferingUtilService } from "@empowered/ui";
import { AbstractControl, ValidationErrors, FormControl, FormGroup } from "@angular/forms";
import { tap, takeUntil, catchError, map } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { Store } from "@ngxs/store";
import {
    CarrierId,
    ArgusConfig,
    ProductId,
    CarrierIdType,
    PlanChoice,
    Plan,
    AdminCredential,
    PlanYear,
    ARGUS_CONFIG_API_RESPONSE_INDEX,
    ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX,
    ARGUS_CONFIG_API_RESPONSE_VISION_INDEX,
    ConfigName,
    ArgusCarrier,
    ArgusCarrierRestriction,
    ArgusConfigTier,
    PlanPanel,
    ArgusADVTiers,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import {
    AlertModel,
    BenefitsOfferingState,
    ResetQuasiModalVariables,
    SetNewPlanYearPanel,
    AccountInfoState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

const FL_SITUS_STATE_CODE = "FL";
const ALL_SITUS_STATES_EXCEPT_FL = "ALL";
const SINGLE_CARRIER_RESTRICTED_PLANS_COUNT = 1;
const MAX_PLANS_PER_TIER = 3;
const MAX_PLANS_SELECTED = 2;
const NINETY_DAYS = 90;
const DAYS = "days";
const INACTIVE = "INACTIVE";

@Injectable({
    providedIn: "root",
})
export class ProductsPlansQuasiService implements OnDestroy {
    nextChange$ = new Subject<any>();
    selectedProductId = new BehaviorSubject<any>({ selectedProductId: 0 });
    stepClicked$ = new Subject<any>();
    planChanged$ = new Subject<number>();
    defaultStepPositionChanged$ = new Subject<number>();
    planChoiceMade$ = new Subject<any>();
    isApprovalRequired$ = new Subject<any>();

    // Global variable which stores selected products of quasi
    selectedProducts: Observable<void>[] = [];
    // Global variable which stores selected planChoices of quasi
    selectedPlanChoices: Observable<void>[] = [];
    createdPlanYear: Observable<void>[] = [];

    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public executePlanOnNext$ = new Subject<string>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public changeProduct$ = new Subject<boolean>();

    // This variable is used to store existingPlanYear value of type PlanYear id
    existingPlanYear: number;
    selectedPlanYearControl: string;
    private readonly carriersForApproval$ = new BehaviorSubject<string[]>([]);
    carriersForApproval = this.carriersForApproval$.asObservable();
    employerPaidPlans: number[];
    dhmoPlanId: number;
    tierGroupPlanIds: number[];

    private handleDeclinedAlert$: Subject<AlertModel> = new Subject<AlertModel>();
    private readonly unapprovedCarrierPlans$: Subject<boolean> = new Subject<boolean>();
    private readonly isQuasiClosed$: Subject<boolean> = new Subject<boolean>();
    private readonly unsubscribe$ = new Subject<void>();
    deletedPlanChoices: Observable<void>[] = [];
    constructor(
        private readonly userService: UserService,
        private readonly store: Store,
        private readonly utilService: UtilService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * This method is used to set values to selectedProducts variable
     * @param products are array of observable of create ProductChoice and update ProductChoice
     */
    setProducts(products: Observable<void>[]): void {
        if (products && products.length) {
            this.selectedProducts = products;
        }
    }
    /**
     * This method is used to set all observable values of quasi-modal to null / empty
     */
    resetQuasiObservableValues(): void {
        this.selectedProducts = [];
        this.selectedPlanChoices = [];
        this.createdPlanYear = [];
        this.deletedPlanChoices = [];
        this.existingPlanYear = null;
    }
    /**
     * This method is used to set all store values of quasi-modal to null / empty
     * @returns void
     */
    resetQuasiStoreValues(): void {
        this.store.dispatch(new SetNewPlanYearPanel());
        this.store.dispatch(new ResetQuasiModalVariables());
    }
    /**
     * This method is used to fetch selectedProducts values which are stored
     * @returns array of create ProductChoice, update ProductChoice Observables
     */
    getProducts(): Observable<void>[] {
        return this.selectedProducts;
    }
    /**
     * This method is used to set values to selectedPlanChoices variable
     * @param planChoices are array of observable of create PlanChoice, update PlanChoice
     */
    setPlansChoices(planChoices: Observable<void>[]): void {
        if (planChoices && planChoices.length) {
            this.selectedPlanChoices.push(...planChoices);
        }
    }
    /**
     * This method is used to fetch selectedPlanChoices values which are stored
     * @returns array of observable of create PlanChoice, update PlanChoice
     */
    getPlanChoices(): Observable<void>[] {
        return this.selectedPlanChoices;
    }
    /**
     * This method is used to set values to selectedPlanChoices variable
     * @param planChoices are array of observable of delete PlanChoice
     */
    setDeletePlansChoices(planChoices: Observable<void>[]): void {
        if (planChoices && planChoices.length) {
            this.deletedPlanChoices.push(...planChoices);
        }
    }
    /**
     * This method is used to fetch selectedPlanChoices values which are stored
     * @returns array of observable of delete PlanChoice
     */
    getDeletePlanChoices(): Observable<void>[] {
        return this.deletedPlanChoices;
    }
    /**
     * This method is used to set values to createdPlanYear variable
     * @param planYearObservable are array of observable of delete planYear
     */
    setCreatedPlanYear(planYearObservable: Observable<void>): void {
        if (planYearObservable) {
            this.createdPlanYear.push(planYearObservable);
        }
    }
    /**
     * This method is used to fetch createdPlanYear values which are stored
     * @returns array of observable of delete planYears
     */
    getCreatedPlanYears(): Observable<void>[] {
        return this.createdPlanYear;
    }
    /**
     * updated selected product id
     * @param id product id with Individual and group attached
     */
    updateSelectedProductId(id: string): void {
        this.selectedProductId.next(id);
    }

    /**
     * This method is used to set the value of handleDeclinedAlert observable
     * This method is called from products,approvals tab in maintenance of benefits offering
     * @param status is used to set status of handleDeclinedAlert behavior subject
     */
    setDeclineAlert(status: AlertModel): void {
        this.handleDeclinedAlert$.next(status);
    }

    /**
     * This method is used to get the value of handleDeclinedAlert as an observable
     * This method is used for show / hide of declined alert in maintenance-of-benefits offering
     * @returns handleDeclinedAlert value as an Observable
     */
    getDeclinedAlert(): Observable<AlertModel> {
        return this.handleDeclinedAlert$.asObservable();
    }

    /**
     * This method is used to check whether the logged user is admin or not
     * @returns boolean which states logged-in user is admin or not
     */
    isAdminLoggedIn(): boolean {
        let isAdmin = false;
        this.userService.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((credential: AdminCredential) => {
                    if (credential && credential.adminId) {
                        isAdmin = true;
                    }
                }),
            )
            .subscribe();
        return isAdmin;
    }

    /**
     * This method is used to get loggedIn user details
     * @returns AdminCredential observable which provide loggedIn details
     */
    loggedInDetails(): Observable<AdminCredential> {
        return this.userService.credential$ as Observable<AdminCredential>;
    }

    /**
     * This method is used to store @var existingPlanYear value
     * @param planYearId is the plan-year-id value
     */
    storePlanYearValue(planYearId: number): void {
        this.existingPlanYear = planYearId;
    }

    /**
     * This method is used to return already stored existingPlanYear value
     * @returns existingPlanYear value
     */
    getExistingPlanYearValue(): number {
        return this.existingPlanYear;
    }

    /**
     * This method is used to store selected planYear control value
     * @param planYearControl is the selected planYear control value
     */
    storePlanYearControl(planYearControl: string): void {
        this.selectedPlanYearControl = planYearControl;
    }

    /**
     * This method is used to return already stored existingPlanYear control value
     * @returns existingPlanYear control value
     */
    getExistingPlanYearControl(): string {
        return this.selectedPlanYearControl;
    }

    /**
     * This method is used to check current planChoice is existing or not.
     * If current planChoice exists, this method will return existing planChoice else null
     * @param planChoice is current planChoice to check
     *
     * @returns PlanChoice / null based on filtered value
     */
    checkExistingPlanChoice(planChoice: PlanChoice): PlanChoice | null {
        let existingPlanChoices: PlanChoice[] = [];
        const approvedPlanChoices: PlanChoice[] = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices));
        const unApprovedPlanChoices: PlanChoice[] = this.utilService.copy(
            this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices),
        );
        approvedPlanChoices.push(...unApprovedPlanChoices);
        existingPlanChoices = approvedPlanChoices.filter((eachPlanChoice) => eachPlanChoice.plan.id === planChoice.planId);
        return existingPlanChoices && existingPlanChoices.length ? existingPlanChoices.pop() : null;
    }
    /**
     * This method is used to create a planChoice object required for create/update PlanChoice API call
     * @param existingPlanChoice is current planChoice with which create planChoice object is created
     * @returns planChoice object used to pass in create/update planChoice observable
     */
    getCreatePlanChoiceObject(existingPlanChoice: PlanChoice): PlanChoice {
        const planChoice: PlanChoice = {
            id: existingPlanChoice.id,
            planId: existingPlanChoice.planId ? existingPlanChoice.planId : existingPlanChoice.plan.id,
            continuous: existingPlanChoice.continuous,
            taxStatus: existingPlanChoice.taxStatus,
            agentAssisted: existingPlanChoice.agentAssisted,
        };
        if (!existingPlanChoice.continuous) {
            planChoice.planYearId = existingPlanChoice.planYearId;
        } else {
            planChoice.enrollmentPeriod = existingPlanChoice.enrollmentPeriod;
            planChoice.coverageStartFunction = existingPlanChoice.coverageStartFunction;
        }
        return planChoice;
    }
    /**
     * This method is used to check length of formed observable and return observable based on it
     * @param observables are array of observable with which we have to return observable
     * @returns Observable<void> or Observable<void[]> based on input
     */
    checkAndCreateObservable(observables: Observable<void>[]): Observable<void | void[]> {
        if (observables && observables.length) {
            return forkJoin(observables).pipe(
                takeUntil(this.unsubscribe$),
                catchError((error) => of(error)),
            );
        }
        return of(null);
    }
    /**
     * This method is used to check approved planChoice
     * If current planChoice is approved, this method will return existing planChoice else null
     * @param planChoice is current planChoice to check
     *
     * @returns PlanChoice / null based on filtered value
     */
    checkForApprovedPlanChoice(planChoice: PlanChoice): PlanChoice | null {
        let existingPlanChoices: PlanChoice[] = [];
        const approvedPlanChoices: PlanChoice[] = this.utilService.copy(this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices));
        existingPlanChoices = approvedPlanChoices.filter((eachPlanChoice) => eachPlanChoice.plan.id === planChoice.planId);
        return existingPlanChoices && existingPlanChoices.length ? existingPlanChoices.pop() : null;
    }
    /**
     * Function to check restricted stated plans available or not
     * @param plans list of plans available
     * @param restrictedStatesList list of restricted states
     * @param isRole20User check if user is role 20
     * @param isCheckbox if for checkbox property
     * @returns boolean if restricted states present or not
     */
    getRestrictedPlans(plans: Plan[], restrictedStatesList: string[], isRole20User: boolean, isCheckbox: boolean): boolean {
        let isGetAgentAssistance = false;
        if (!isRole20User) {
            if (isCheckbox) {
                isGetAgentAssistance = plans.some((plan) =>
                    plan.states.some((checkedState) => restrictedStatesList.includes(checkedState.abbreviation)),
                );
            } else {
                isGetAgentAssistance = isCheckbox;
                plans.forEach((plan) => {
                    if ((isGetAgentAssistance && isCheckbox) || (!isGetAgentAssistance && !isCheckbox)) {
                        isGetAgentAssistance = plan.states.some((uncheckedState) =>
                            restrictedStatesList.includes(uncheckedState.abbreviation),
                        );
                    }
                });
            }
        }
        return isGetAgentAssistance;
    }
    /**
     * Turns the string provided into an array of values
     * @param argusValue a string of argus tier plans
     * @returns an array of argus planIds organized by tiers
     */
    splitArgusString(argusValue: string): string[] {
        return argusValue.replace(/\s/g, "").split(";");
    }

    // TODO: If time permits we should look into adding these values to the object we receive from the backend
    // so we do not have to manually add all these plans.
    /**
     * This method is used to form observable to fetch configs related to argus and return the same.
     * @returns Observable of config values
     */
    getArgusConfigObservableValue(): Observable<ArgusConfigTier> {
        return combineLatest([
            this.staticUtilService.cacheConfigValue(ArgusConfig.VISION_PLAN_MAP),
            this.staticUtilService.cacheConfigValue(ArgusConfig.DENTAL_PLAN_MAP),
            this.staticUtilService.cacheConfigValue(ArgusConfig.DENTAL_TIER_PLANS),
            this.staticUtilService.cacheConfigValue(ArgusConfig.DENTAL_EMPLOYER_PAID_PLANS),
            this.staticUtilService.cacheConfigValue(ArgusConfig.VISION_TIER_PLANS),
            this.staticUtilService.cacheConfigValue(ArgusConfig.DENTAL_FL_PLANS),
            this.staticUtilService.cacheConfigValue(ArgusConfig.DHMO_ARGUS_PLAN),
        ]).pipe(
            map(([visionMap, dentalMap, dentalPlans, dentalEmployerPaidPlans, visionPlans, dentalFLPlans, dhmoPlanId]) => {
                const dentalTierPlans: string[] = this.splitArgusString(dentalPlans);
                const dentalTierFLPlans: string[] = this.splitArgusString(dentalFLPlans);
                const visionTierPlans: string[] = this.splitArgusString(visionPlans);
                this.employerPaidPlans = this.benefitOfferingUtilService.getArgusDentalTierPlans(dentalEmployerPaidPlans);
                this.dhmoPlanId = Number(dhmoPlanId);
                return {
                    visionCarrierMaps: this.benefitOfferingUtilService.getArgusRestrictions(visionMap),
                    dentalCarrierMaps: this.benefitOfferingUtilService.getArgusRestrictions(dentalMap),
                    dentalPlansTier1All: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_ONE_ALL_STATES_PLANS_INDEX],
                    ),
                    dentalPlansTier2All: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_TWO_ALL_STATES_PLANS_INDEX],
                    ),
                    dentalPlansTier1PPO: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_ONE_PPO_PLANS_INDEX],
                    ),
                    dentalPlansTier1MAC: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_ONE_MAC_PLANS_INDEX],
                    ),
                    dentalPlansTier2PPO: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_TWO_PPO_PLANS_INDEX],
                    ),
                    dentalPlansTier2MAC: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_TWO_MAC_PLANS_INDEX],
                    ),
                    dentalPlansTier1PPOER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_ONE_PPO_ER_PLANS_INDEX],
                    ),
                    dentalPlansTier1MACER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_ONE_MAC_ER_PLANS_INDEX],
                    ),
                    dentalPlansTier2PPOER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_TWO_PPO_ER_PLANS_INDEX],
                    ),
                    dentalPlansTier2MACER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_TWO_MAC_ER_PLANS_INDEX],
                    ),
                    visionPlansTier1EP: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        visionTierPlans[ARGUS_CONFIG_API_RESPONSE_VISION_INDEX.VISION_TIER_ONE_EMPLOYEE_PAID],
                    ),
                    visionPlansTier2EP: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        visionTierPlans[ARGUS_CONFIG_API_RESPONSE_VISION_INDEX.VISION_TIER_TWO_EMPLOYEE_PAID],
                    ),
                    visionPlansTier1ER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        visionTierPlans[ARGUS_CONFIG_API_RESPONSE_VISION_INDEX.VISION_TIER_ONE_EMPLOYER_PAID],
                    ),
                    visionPlansTier2ER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        visionTierPlans[ARGUS_CONFIG_API_RESPONSE_VISION_INDEX.VISION_TIER_TWO_EMPLOYER_PAID],
                    ),
                    dentalPlansTier1FLPPO: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_ONE_PPO_PLANS_INDEX],
                    ),
                    dentalPlansTier1FLMAC: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_ONE_MAC_PLANS_INDEX],
                    ),
                    dentalPlansTier2FLPPO: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_TWO_PPO_PLANS_INDEX],
                    ),
                    dentalPlansTier2FLMAC: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_TWO_MAC_PLANS_INDEX],
                    ),
                    dentalPlansTier1FLPPOER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_ONE_PPO_ER_PLANS_INDEX],
                    ),
                    dentalPlansTier1FLMACER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_ONE_MAC_ER_PLANS_INDEX],
                    ),
                    dentalPlansTier2FLPPOER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_TWO_PPO_ER_PLANS_INDEX],
                    ),
                    dentalPlansTier2FLMACER: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_TIER_TWO_MAC_ER_PLANS_INDEX],
                    ),
                    dentalPlansFLDHMO: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierFLPlans[ARGUS_CONFIG_API_RESPONSE_FLORIDA_INDEX.DENTAL_DHMO_PLANS_INDEX],
                    ),
                    dentalPlansTier1Fl: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_ONE_FL_STATE_PLANS_INDEX],
                    ),
                    dentalPlansTier2Fl: this.benefitOfferingUtilService.getArgusDentalTierPlans(
                        dentalTierPlans[ARGUS_CONFIG_API_RESPONSE_INDEX.DENTAL_TIER_TWO_FL_STATE_PLANS_INDEX],
                    ),
                };
            }),
        );
    }

    /**
     * This method is used to filter out argus plan restrictions based on eligible employees and situsState
     * @param argusCarrierDetails is array of ArgusCarrier contains restrictions according to stateCode
     * @param situsState is the situsState of current group / account
     * @param eligibleEmployees is number of estimated eligible employees in current group / account
     * @returns planRestriction of type ArgusCarrierRestriction based on eligible employees and situsState
     */
    checkArgusPlanRestriction(argusCarrierDetails: ArgusCarrier[], situsState: string, eligibleEmployees: number): ArgusCarrierRestriction {
        let planRestriction: ArgusCarrierRestriction;
        let argumentToCompare: string = situsState;
        if (situsState !== FL_SITUS_STATE_CODE) {
            argumentToCompare = ALL_SITUS_STATES_EXCEPT_FL;
        }
        argusCarrierDetails.forEach((argusCarrierDetail) => {
            if (argusCarrierDetail.stateName === argumentToCompare) {
                planRestriction = argusCarrierDetail.restrictions
                    .filter((restriction) => restriction.maxEmployees >= eligibleEmployees && restriction.minEmployees <= eligibleEmployees)
                    .pop();
            }
        });
        return planRestriction;
    }
    /**
     * This method is used to check all argus plan selections and enable/disable plan check-boxes
     * based on planRestrictions and tiered config plans
     * @param argusDentalCarrierMaps is argusCarrier dental plan restrictions based on states
     * @param argusVisionCarrierMaps is argusCarrier vision plan restrictions based on states
     * @param situsState is the situs state of the account
     * @param eligibleEmployees is estimated eligible employee count of the account
     * @param currentPlanList is the current plan list which is getting displayed on screen
     * @param isRestrictedToSinglePlan is the variable which represents whether current carrier is restricted to single plan or not
     * @param selectedCarriers is the current selected carrier
     * @param disableArgusTierPlans is used to disable enable/disable all argus related plans
     * @param productId is the current selected product
     * @param argusDentalTiers all tiers that belong to the dentalPlan
     * @param selectedPlan current plan the user has selected
     */
    checkArgusSelectedPlans(
        argusDentalCarrierMaps: ArgusCarrier[],
        argusVisionCarrierMaps: ArgusCarrier[],
        situsState: string,
        eligibleEmployees: number,
        currentPlanList: PlanPanel[],
        isRestrictedToSinglePlan: boolean,
        selectedCarriers: number[],
        disableArgusTierPlans: { planId: { disableStatus: boolean } },
        productId: string,
        argusDentalTiers: ArgusADVTiers,
        selectedPlan: PlanPanel,
    ): void {
        const planRestrictionDental = this.checkArgusPlanRestriction(argusDentalCarrierMaps, situsState, eligibleEmployees);
        const planRestrictionVision = this.checkArgusPlanRestriction(argusVisionCarrierMaps, situsState, eligibleEmployees);
        currentPlanList.forEach((eachPlan) => {
            disableArgusTierPlans[eachPlan.planId] = false;
        });
        if (argusDentalTiers) {
            const newSelectedPlan = selectedPlan ? selectedPlan : currentPlanList.filter((plan) => plan.selected).pop();
            this.checkArgusPlanEligibility(currentPlanList, disableArgusTierPlans, argusDentalTiers, productId, newSelectedPlan);
        }
        if (+selectedCarriers === CarrierId.ARGUS && !isRestrictedToSinglePlan) {
            if (
                productId === ProductId.DENTAL.toString() &&
                planRestrictionDental &&
                currentPlanList.filter((eachPlan) => eachPlan.selected).length === planRestrictionDental.allowedPlans
            ) {
                this.disableUnselectedArgusPlans(currentPlanList, disableArgusTierPlans);
            } else if (
                productId === ProductId.VISION.toString() &&
                planRestrictionVision &&
                currentPlanList.filter((eachPlan) => eachPlan.selected).length === planRestrictionVision.allowedPlans
            ) {
                this.disableUnselectedArgusPlans(currentPlanList, disableArgusTierPlans);
            }
        }
    }
    /**
     * This method will execute only if selected plans reaches max allowed plans
     * This method is used to disable all unselected plans in the current plans screen
     * @param currentPlanList is the current plan list which is getting displayed on screen
     * @param disableArgusTierPlans is used to disable enable/disable all argus related plans
     */
    disableUnselectedArgusPlans(currentPlanList: PlanPanel[], disableArgusTierPlans: { planId: { disableStatus: boolean } }): void {
        currentPlanList
            .filter((eachPlan) => !eachPlan.selected)
            .forEach((eachPlan) => {
                disableArgusTierPlans[eachPlan.planId] = true;
            });
    }
    /**
     * Checks to see if the selected plan belongs to the plan tier.
     * @param tierPlans a group of plans that was selected.
     * @param selectedPlan the plan that the user selected.
     * @returns a boolean that determines if the selected plan belongs to the plan tier provided.
     */
    matchSelectedPlan(tierPlans: number[], selectedPlan: PlanPanel): boolean {
        return tierPlans.length ? tierPlans.includes(selectedPlan.planId) : false;
    }
    /**
     * Disables all plans that are employer paid.
     * @param disableArgusTierPlans plans that should be disabled.
     */
    disableEmployerPaidPlans(disableArgusTierPlans: { planId: { disableStatus: boolean } }): void {
        this.employerPaidPlans.forEach((plan) => {
            disableArgusTierPlans[plan] = true;
        });
    }
    /**
     * Disables all plans that are unavailable outside of the tier group.
     * @param currentPlanList is the current plan list which is getting displayed on screen.
     * @param tierPlans a group of plans of the same type.
     * @param disableArgusTierPlans plans that should be disabled.
     */
    disableUnavailableTierPlans(
        currentPlanList: PlanPanel[],
        tierPlans: number[],
        disableArgusTierPlans: { planId: { disableStatus: boolean } },
    ): void {
        const unavailablePlans: PlanPanel[] = currentPlanList.filter((plan) => !tierPlans.includes(plan.planId));

        unavailablePlans.forEach((plan) => {
            disableArgusTierPlans[plan.planId] = true;
        });
    }
    /**
     * Disables all plans that should not be available to the user.
     * @param tierPlans a group of plans of the same type.
     * @param currentPlanList is the current plan list which is getting displayed on screen.
     * @param disableArgusTierPlans plans that should be disabled.
     * @param productId is the currently selected product.
     * @param selectedPlan the plan that has currently been selected by the user.
     * @param allSelectedPlans all plans currently selected.
     */
    disableArgusTierPlans(
        tierPlans: number[],
        currentPlanList: PlanPanel[],
        disableArgusTierPlans: { planId: { disableStatus: boolean } },
        productId: string,
        selectedPlan: PlanPanel,
        allSelectedPlans: PlanPanel[],
    ): void {
        const erPlans = tierPlans.filter((tier) => this.employerPaidPlans.includes(tier));
        const currentPlanListCopy: PlanPanel[] = this.utilService.copy(currentPlanList);
        const withoutDHMOPlanList: PlanPanel[] = currentPlanListCopy.filter((plan) => plan.planId !== this.dhmoPlanId);
        const availablePlans: PlanPanel[] = currentPlanListCopy.filter((plan) => tierPlans.includes(plan.planId));
        const selectedInTierGroup: PlanPanel[] = availablePlans.filter((plan) => plan.selected);

        if (selectedPlan.planId === this.dhmoPlanId) {
            if (allSelectedPlans.length < MAX_PLANS_SELECTED) {
                this.disableEmployerPaidPlans(disableArgusTierPlans);
            } else if (selectedPlan.selected && allSelectedPlans.length <= MAX_PLANS_SELECTED) {
                this.disableUnavailableTierPlans(withoutDHMOPlanList, this.tierGroupPlanIds, disableArgusTierPlans);
            } else {
                this.disableUnselectedArgusPlans(withoutDHMOPlanList, disableArgusTierPlans);
            }
        } else if (
            selectedPlan.planId !== this.dhmoPlanId &&
            (selectedInTierGroup.length === MAX_PLANS_SELECTED || productId === ProductId.VISION.toString())
        ) {
            this.disableUnselectedArgusPlans(withoutDHMOPlanList, disableArgusTierPlans);
        } else if (selectedPlan.planId !== this.dhmoPlanId && availablePlans.length < MAX_PLANS_PER_TIER) {
            this.disableUnselectedArgusPlans(currentPlanListCopy, disableArgusTierPlans);
        } else if (!erPlans.length) {
            if (selectedPlan.selected) {
                this.tierGroupPlanIds = tierPlans;
            }
            if (selectedInTierGroup.length) {
                this.disableUnavailableTierPlans(withoutDHMOPlanList, tierPlans, disableArgusTierPlans);
            } else {
                this.disableEmployerPaidPlans(disableArgusTierPlans);
            }
        }

        if (erPlans.length && this.dhmoPlanId !== selectedPlan.planId) {
            this.disableUnselectedArgusPlans(currentPlanListCopy, disableArgusTierPlans);
        }
    }
    /**
     * Used to enable/disable all argus related plans
     * @param currentPlanList is the current plan list which is getting displayed on screen
     * @param disableArgusTierPlans is used to disable enable/disable all argus related plans
     * @param argusADVTiers all dental tiers that argus provides
     * @param productId is the current selected product
     * @param selectedPlan the plan that is currently selected.
     */
    checkArgusPlanEligibility(
        currentPlanList: PlanPanel[],
        disableArgusTierPlans: { planId: { disableStatus: boolean } },
        argusADVTiers: ArgusADVTiers,
        productId: string,
        selectedPlan: PlanPanel,
    ): void {
        const allSelectedPlans: PlanPanel[] = this.utilService.copy(currentPlanList).filter((plan) => plan.selected);
        if (allSelectedPlans.length) {
            Object.values(argusADVTiers).forEach((tier) => {
                if (this.matchSelectedPlan(tier, selectedPlan)) {
                    this.disableArgusTierPlans(tier, currentPlanList, disableArgusTierPlans, productId, selectedPlan, allSelectedPlans);
                }
            });
        }
    }
    /**
     * This method is used to checkArgusPlanRestrictions and to return argus plan restriction.
     * @param productId is the current selected product.
     * @param argusVisionCarrierMaps is argusCarrier vision plan restrictions based on states.
     * @param argusDentalCarrierMaps is argusCarrier dental plan restrictions based on states.
     * @param situsState is the situs state of the account.
     * @param eligibleEmployees is estimated eligible employee count of the account.
     * @returns whether argus plans is restricted to single plan or not.
     */
    getArgusPlanRestriction(
        productId: string,
        argusVisionCarrierMaps: ArgusCarrier[],
        argusDentalCarrierMaps: ArgusCarrier[],
        situsState: string,
        eligibleEmployees: number,
    ): boolean {
        let planRestriction: ArgusCarrierRestriction = null;
        if (productId === ProductId.VISION.toString()) {
            planRestriction = this.checkArgusPlanRestriction(argusVisionCarrierMaps, situsState, eligibleEmployees);
        }
        if (productId === ProductId.DENTAL.toString()) {
            planRestriction = this.checkArgusPlanRestriction(argusDentalCarrierMaps, situsState, eligibleEmployees);
        }
        return planRestriction && planRestriction.allowedPlans === SINGLE_CARRIER_RESTRICTED_PLANS_COUNT;
    }
    /**
     * This method is used to load carrier restricted plans
     * @param selectedCarriers is the current selected carriers information
     * @param carrierMaps is the variable containing carrier ids related to carrier name
     * @param isRestrictedToSinglePlan is the variable which represents whether current carrier is restricted to single plan or not
     * @param productId is the current selected product
     * @param argusVisionCarrierMaps is argusCarrier vision plan restrictions based on states
     * @param argusDentalCarrierMaps is argusCarrier dental plan restrictions based on states
     * @param situsState is the situs state of the account
     * @param eligibleEmployees is estimated eligible employee count of the account
     * @param plans is list of plan filtered based on carrier ids
     * @param plansToCompare is the list of plans which contains all plans
     * @param allPlans is the MatTableDataSource of PlanPanel model
     * @returns an object containing variables which are getting modified in this method
     */
    loadCarrierRestrictedPlans(
        selectedCarriers: number[],
        carrierMaps: { carrier: string; ids: string[] }[],
        isRestrictedToSinglePlan: boolean,
        productId: string,
        argusVisionCarrierMaps: ArgusCarrier[],
        argusDentalCarrierMaps: ArgusCarrier[],
        situsState: string,
        eligibleEmployees: number,
        plans: PlanPanel[],
        plansToCompare: PlanPanel[],
        allPlans: MatTableDataSource<PlanPanel>,
        isERSelected?: boolean,
    ): {
        isNoneSelected: boolean;
        isADVEROption: boolean;
        isERSelection: boolean;
        showDisclaimerForRSLICarrier: boolean;
        isRestrictedToSinglePlan: boolean;
        plans: PlanPanel[];
        allPlans: MatTableDataSource<PlanPanel>;
    } {
        let planCarriers: number[] = [];
        let showDisclaimerForRSLICarrier: boolean;
        let isNoneSelected: boolean;
        let tempObject: {
            isADVEROption: boolean;
            isERSelection: boolean;
        };
        if (selectedCarriers) {
            const advCarriers: number[] = this.getCarrierIds(CarrierIdType.ADV, carrierMaps);
            const argusCarriers: number[] = this.getCarrierIds(CarrierIdType.ARGUS, carrierMaps);
            planCarriers = selectedCarriers.filter(
                (carrier) => (argusCarriers && argusCarriers.includes(carrier)) || (advCarriers && advCarriers.includes(carrier)),
            );
            if (planCarriers.length) {
                isRestrictedToSinglePlan = this.getArgusPlanRestriction(
                    productId,
                    argusVisionCarrierMaps,
                    argusDentalCarrierMaps,
                    situsState,
                    eligibleEmployees,
                );
            } else {
                const singleRestrictedCarriers: number[] = this.getCarrierIds(CarrierIdType.SINGLE_PLAN_CARRIERS, carrierMaps);
                planCarriers = selectedCarriers.filter((carrier) => singleRestrictedCarriers.indexOf(carrier) >= 0);
                if (planCarriers.length) {
                    isRestrictedToSinglePlan = true;
                }
            }
            plans = this.utilService.copy(plansToCompare).filter((plan) => selectedCarriers.indexOf(plan.carrierId) >= 0);
            tempObject = this.benefitOfferingUtilService.advPlanTypeSelection(selectedCarriers, advCarriers, plans, isERSelected, allPlans);
            showDisclaimerForRSLICarrier = this.checkRSLIPlanExist(plans);
            isNoneSelected = false;
        } else {
            showDisclaimerForRSLICarrier = false;
            isNoneSelected = true;
            tempObject = { isADVEROption: false, isERSelection: false };
            allPlans.data = [];
        }
        return {
            isNoneSelected,
            isADVEROption: tempObject.isADVEROption,
            isERSelection: tempObject.isERSelection,
            showDisclaimerForRSLICarrier,
            isRestrictedToSinglePlan,
            plans,
            allPlans,
        };
    }

    /**
     *
     * @param allPlans is the MatTableDataSource of PlanPanel model
     * @return boolean indicating if tax status set per plan is true or false
     */
    defaultSetPerPlan(allPlans: MatTableDataSource<PlanPanel>): boolean {
        return allPlans.data && allPlans.data.length && allPlans.data.some((plan) => plan.taxStatus !== allPlans.data[0].taxStatus);
    }

    /**
     * To check whether the RSLI products are available to display the respective disclaimer
     * @param allPlans contains plans list of current product and carrier selection
     * @returns a boolean which represents whether RSLI plans are present or not
     */
    checkRSLIPlanExist(allPlans: PlanPanel[]): boolean {
        return allPlans.some((plan) => plan.carrierId === CarrierId.RSLI && plan.selected);
    }
    /**
     * Gets the carrier ids mapped in config based on the carrierName passed
     * @param carrierName is the carrier name from config to get carrier id's
     * @param carrierMaps is the variable containing carrier ids related to carrier name
     * @returns carrier ids based on carrier name inputted
     */
    getCarrierIds(carrierName: string, carrierMaps: { carrier: string; ids: string[] }[]): number[] {
        return carrierMaps.filter((carrierData) => carrierData.carrier === carrierName).map((carrier) => carrier.ids.map((id) => +id))[0];
    }
    /**
     * checks for ineligible plan choices based on coverage dates
     * @param effectiveStarting coverage effective starting
     * @param expiresAfter coverage expires after
     * @param currentPlansSelected list of currently selected plans
     * @param allPlanYears list of allPlanYears for that group
     * @returns list of ineligible plans
     */
    getIneligiblePlans(
        effectiveStarting: Date, // copy to coverage dates
        expiresAfter: Date, // copy to coverage dates
        currentPlansSelected: PlanChoice[], // copy from plans
        allPlanYears: PlanYear[],
    ): PlanChoice[] {
        let ineligiblePlans: PlanChoice[] = [];
        const overlappingPlanYears: PlanYear[] = allPlanYears.filter(
            (planYear) =>
                (this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(effectiveStarting || ""),
                    this.dateService.toDate(planYear.coveragePeriod.effectiveStarting || ""),
                ) &&
                    this.dateService.getIsAfterOrIsEqual(
                        this.dateService.toDate(expiresAfter || ""),
                        this.dateService.toDate(planYear.coveragePeriod.effectiveStarting || ""),
                    )) ||
                (this.dateService.isBeforeOrIsEqual(
                    this.dateService.toDate(planYear.coveragePeriod.effectiveStarting || ""),
                    this.dateService.toDate(effectiveStarting || ""),
                ) &&
                    this.dateService.isBeforeOrIsEqual(
                        this.dateService.toDate(effectiveStarting || ""),
                        this.dateService.toDate(planYear.coveragePeriod.expiresAfter || ""),
                    )),
        );
        const overlappingPlansList: PlanChoice[] = [];
        if (overlappingPlanYears && overlappingPlanYears.length) {
            const allPlanChoices = this.store
                .selectSnapshot(BenefitsOfferingState.getPlanChoices)
                .concat(this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices));
            overlappingPlanYears.forEach((planYear) => {
                overlappingPlansList.push(...allPlanChoices.filter((planChoice) => planChoice.planYearId === planYear.id));
            });
            ineligiblePlans = currentPlansSelected.filter((currentPlan) =>
                overlappingPlansList.some((plan) => plan.plan.id === currentPlan.plan.plan.id),
            );
        }
        return ineligiblePlans;
    }
    /**
     * Function to get restricted carriers from config
     */
    getConfigurationSpecifications(): void {
        this.staticUtilService
            .cacheConfigValue(ConfigName.BROKER_NON_AFLAC_CARRIERS_PLAN_YEAR_APPROVAL)
            .pipe(
                takeUntil(this.unsubscribe$),
                map((carriers) => carriers.concat(",", CarrierId.AFLAC_GROUP.toString())),
            )
            .subscribe((data) => {
                this.carriersForApproval$.next(data.split(","));
            });
    }
    /**
     * function to get all vas plans
     * @returns list of vas plans
     */
    getAllVasPlans(): Plan[] {
        const panelModel = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts);
        return panelModel
            .filter((eachProduct) => eachProduct.product.valueAddedService)
            .map((eachProduct) => eachProduct.plans)
            .reduce((prevValue, currValue) => [...prevValue, ...currValue], [])
            .map((plans) => plans.plan);
    }
    /**
     * function to set value if unapproved carrier plan is present
     * @param status true/false depending upon unapproved plans
     */
    setUnapprovedCarrierPlans(status: boolean): void {
        this.unapprovedCarrierPlans$.next(status);
    }
    /**
     * function to get value if unapproved plan available
     * @returns Observable<boolean>
     */
    getUnapprovedCarrierPlans(): Observable<boolean> {
        return this.unapprovedCarrierPlans$.asObservable();
    }
    /**
     * function to set value if quasi modal is closed or not
     * @param status true/false: value if quasi modal is closed or not
     */
    setQuasiClosedStatus(status: boolean): void {
        this.isQuasiClosed$.next(status);
    }
    /**
     * function to get value if quasi modal is closed or not
     * @returns Observable of boolean which presents if quasi modal is closed or not
     */
    getQuasiClosedStatus(): Observable<boolean> {
        return this.isQuasiClosed$.asObservable();
    }
    /**
     * checks number of ending plan choices based on plan year
     * @param approvedPlanYearChoices list of approved plan choices
     * @param unapprovedPlanYearChoices list of unapproved plan choices
     * @param planYearResponse list of plan years
     * @returns number of ending plans
     */
    checkPlanYearEnding(
        approvedPlanYearChoices: PlanChoice[],
        unapprovedPlanYearChoices: PlanChoice[],
        planYearResponse: PlanYear[],
    ): number {
        const endingPlans: PlanChoice[] = [];
        const nonEndingPlans: PlanChoice[] = [];
        const currentAccount: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const allPlans: PlanChoice[] = approvedPlanYearChoices.concat(unapprovedPlanYearChoices);
        if (planYearResponse.length && currentAccount && currentAccount.status && currentAccount.status !== INACTIVE) {
            planYearResponse.forEach((planYearDetails) => {
                if (
                    !(
                        this.dateService.getDifferenceInDays(
                            this.dateService.toDate(planYearDetails.coveragePeriod.expiresAfter || ""),
                            new Date(),
                        ) > NINETY_DAYS
                    )
                ) {
                    endingPlans.push(
                        ...allPlans.filter(
                            (planChoice) =>
                                planChoice.planYearId === planYearDetails.id && planChoice.expirationDate && planChoice.requiredSetup,
                        ),
                    );
                } else {
                    nonEndingPlans.push(...allPlans.filter((planChoice) => planChoice.planYearId === planYearDetails.id));
                }
            });
        }
        return endingPlans.filter((endingPlan) => !nonEndingPlans.some((plan) => plan.plan.id === endingPlan.plan.id)).length;
    }
    /**
     * Method to set tax status as per pre-selected plans
     * @param plans plan panel data
     * @returns plans with tax status being set to common
     */
    setCommonTaxStatus(plans: PlanPanel[]): PlanPanel[] {
        const selectedTaxStatus = plans.find((plan) => plan.selected).taxStatus;
        const selectedPlans = plans.filter((plan) => plan.selected);
        if (selectedPlans.every((plan) => plan.taxStatus === selectedTaxStatus)) {
            plans.forEach((plan) => {
                if (!plan.taxStatusReadOnly) {
                    plan.taxStatus = selectedTaxStatus;
                }
            });
        }
        return plans;
    }
    /**
     * Method to set the selection value in plans list
     * @param plansList list of all plans
     * @param plansToCompare plans of current plan panel
     * @param editedPlanChoices edited plans of current plan panel
     * @returns plansList after setting the selection value
     */
    setDeselectedPlans(plansList: PlanPanel[], plansToCompare: PlanPanel[], editedPlanChoices: PlanPanel[]): PlanPanel[] {
        const deselectedPlans = plansToCompare.filter(
            (plan) => !plan.selected && !editedPlanChoices.some((editedPlan) => editedPlan.planId === plan.planId),
        );
        return plansList.map((plan) => {
            if (deselectedPlans.some((deselectedPlan) => deselectedPlan.planId === plan.planId)) {
                plan.selected = false;
            }
            return plan;
        });
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscription
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
