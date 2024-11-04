import { Injectable, Output, EventEmitter, Directive } from "@angular/core";
import { Store } from "@ngxs/store";
import { Observable, BehaviorSubject, forkJoin, of, iif } from "rxjs";
import { combineLatest } from "rxjs";
import { map, startWith, catchError, switchMap, filter } from "rxjs/operators";
import { UserState, UserService } from "@empowered/user";
import { EnrollmentService, MemberService, StaticService, AccountService, ACOOUNT_PRODUCER_ROLE } from "@empowered/api";
import {
    DateInfo,
    ConfigName,
    BooleanConst,
    EnrollmentMethod,
    PortalState,
    CompanyCode,
    ProducerDetails,
    AccountProducer,
    Portals,
    ContactType,
    Configurations,
    ProducerCredential,
    AddressResult,
    GroupAttributeEnum,
} from "@empowered/constants";
import { StaticUtilService } from "@empowered/ngxs-store";
import { PlanPanelModel, SharedState, SetEnrollmentMethodSpecific, EnrollmentMethodModel } from "@empowered/ngxs-store";

interface ShopReview {
    isReview: boolean;
    cartCount: number;
    totalCost: number;
    payfrequencyName: string;
}

interface UnpluggedParameters {
    allowAccess: boolean;
    isCheckedOut: boolean;
    hasMaintenanceLock: boolean;
}

const URLCONSTANTS = {
    ChangePassword: "/member/settings/change-password",
    NotificationPreferences: "/member/settings/notificationPreferences",
};

@Injectable({
    providedIn: "root",
})
/* eslint-disable-next-line @angular-eslint/directive-class-suffix */
export class SharedService {
    backURL: any;
    private isEDeliveryPortalAccessed$ = new BehaviorSubject<boolean>(false);
    currentMemberEDeliveryAccess = this.isEDeliveryPortalAccessed$.asObservable();
    private isProducerNotLicensedInEmployeeState$ = new BehaviorSubject<boolean>(false);
    private readonly stateZipFlag$ = new BehaviorSubject<boolean>(false);
    currentProducerNotLicensedInEmployeeState = this.isProducerNotLicensedInEmployeeState$.asObservable();
    private isProducerNotLicensedInCustomerState$ = new BehaviorSubject<boolean>(false);
    currentProducerNotLicensedInCustomerState = this.isProducerNotLicensedInCustomerState$.asObservable();
    private readonly isTpi$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private readonly unpluggedParam$: BehaviorSubject<UnpluggedParameters> = new BehaviorSubject<UnpluggedParameters>({
        allowAccess: true,
        isCheckedOut: false,
        hasMaintenanceLock: true,
    });
    currentUnpluggedDetails$ = this.unpluggedParam$.asObservable();
    currentTpi$ = this.isTpi$.asObservable();
    private readonly shopReviewPage$ = new BehaviorSubject<ShopReview>({
        isReview: false,
        cartCount: 0,
        totalCost: 0,
        payfrequencyName: "",
    });
    currentShopReviewPage = this.shopReviewPage$.asObservable();
    private readonly tpiAppFlowPDASubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    tpiAppFlowPDA$ = this.tpiAppFlowPDASubject$.asObservable();
    macTabConfig = false;
    trainingConfig = false;
    isOccupationClassA = false;
    isIndustryCodeA = false;
    userPortal$: Observable<PortalState> = combineLatest([
        this.store.select(SharedState.portal).pipe(startWith("")),
        this.store.select(UserState),
    ]).pipe(
        map(([loggedInPortal, credential]) => {
            if ("producerId" in credential && loggedInPortal !== "MEMBER") {
                return { type: "producer" };
            }

            if ("memberId" in credential && loggedInPortal === "MEMBER") {
                return { type: "member", subPortals: ["support"] };
            }

            if ("adminId" in credential && loggedInPortal === "ADMIN") {
                return { type: "admin" };
            }
            return { type: "public" };
        }),
    );
    constructor(
        private readonly store: Store,
        private readonly user: UserService,
        private readonly staticUtilService: StaticUtilService,
        private readonly enrollmentService: EnrollmentService,
        private readonly memberService: MemberService,
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
    ) {}

    /**
     * Function to change tpi flag for TPI flow
     * @param {boolean} newTpi parameter to decide tpi flag
     */
    changeTpi(newTpi: boolean): void {
        this.isTpi$.next(newTpi);
    }

    /**
     * Function to update the subject if PDA get submitted from app flow
     * @param isSubmit true if PDA gets submitted
     */
    appFlowPDASubmitted(isSubmit: boolean): void {
        this.tpiAppFlowPDASubject$.next(isSubmit);
    }
    changeProducerNotLicensedInEmployeeState(newProducerNotLicensedInEmployeeState: boolean): void {
        this.isProducerNotLicensedInEmployeeState$.next(newProducerNotLicensedInEmployeeState);
    }
    changeProducerNotLicensedInCustomerState(newProducerNotLicensedInCustomerState: boolean): void {
        this.isProducerNotLicensedInCustomerState$.next(newProducerNotLicensedInCustomerState);
    }
    /**
     * Function to update the subject if the E-Delivery prompt is accessed by the member
     * @param newEDeliveryAccess true if E-Delivery prompt is accessed
     */
    changeCurrentMemberEDeliveryAccess(newEDeliveryAccess: boolean): void {
        this.isEDeliveryPortalAccessed$.next(newEDeliveryAccess);
    }

    /**
     * Function to change Shop Review screen details
     * @param {ShopReview} newShopReviewPage
     */
    changeShopReviewPage(newShopReviewPage: ShopReview): void {
        this.shopReviewPage$.next(newShopReviewPage);
    }

    setBackUrl(url: any): void {
        const newUrl = this.backURL;
        if (url === URLCONSTANTS.ChangePassword || url === URLCONSTANTS.NotificationPreferences) {
            this.backURL = newUrl;
        } else {
            this.backURL = url;
        }
    }

    /**
     * This function is used to get response or error flag.
     * @returns BehaviorSubject<boolean>.
     */
    getStateZipFlag(): BehaviorSubject<boolean> {
        return this.stateZipFlag$;
    }
    /**
     * Since flag is defined as private, value is getting set in this function.
     * @param value boolean
     */
    setStateZipFlag(value: boolean): void {
        this.stateZipFlag$.next(value);
    }

    /**
     * function to check whether agent is self enrolled.
     * @returns Observable<boolean>
     */
    checkAgentSelfEnrolled(): Observable<boolean> {
        return this.user.credential$.pipe(
            map((credential: ProducerCredential) =>
                Boolean(this.store.selectSnapshot(SharedState.portal) === Portals.MEMBER && credential.producerId),
            ),
        );
    }
    /**
     * Function used to disable the last dates(29, 30, 31) of the month in the date picker
     * @param givenDate : Given Date
     * @returns dates except (29, 30, 31) of the month
     */
    dateClass = (givenDate: Date): number | undefined => {
        const date = givenDate ? new Date(givenDate).getDate() : null;
        return DateInfo.LAST_DATES_OF_MONTH.includes(date) ? undefined : date;
    };

    /**
     * get delete cart item observables
     * @param enrollmentMethod enrollment method
     * @param isPayrollHeadsetIDV payroll headset idv configuration value
     * @param isPayrollCallCenterIDV payroll call center idv configuration value
     * @param isPayrollVirtualF2FIDV payroll virtual F2F idv configuration value
     * @returns the configuration value(true/false) based on the enrollment method
     */
    checkPayrollMethodAndIdv(
        enrollmentMethod: string,
        isPayrollHeadsetIDV: boolean,
        isPayrollCallCenterIDV: boolean,
        isPayrollVirtualF2FIDV: boolean,
    ): boolean {
        switch (enrollmentMethod) {
            case EnrollmentMethod.HEADSET:
                return isPayrollHeadsetIDV;
            case EnrollmentMethod.CALL_CENTER:
                return isPayrollCallCenterIDV;
            case EnrollmentMethod.VIRTUAL_FACE_TO_FACE:
                return isPayrollVirtualF2FIDV;
            default:
                return false;
        }
    }
    /**
     * This function will return webex link value from the config key
     * @returns Observable<string>, the webex link
     */
    fetchWebexConfig(): Observable<string> {
        return this.staticUtilService.cacheConfigValue(ConfigName.WEBEX_LINK);
    }

    /**
     * This function sets the config values
     * @param trainingResourceConfig config value for changes for training resources
     * @param unpluggedResourceConfig config value for changes for unplugged documentation changes
     */
    setConfig(trainingResourceConfig: boolean, unpluggedResourceConfig: boolean): void {
        this.macTabConfig = unpluggedResourceConfig;
        this.trainingConfig = trainingResourceConfig;
    }

    /**
     * Method to set occupation class
     * @param carrierRiskClassId selected occupation class
     */
    setIsOccupationClassA(isCarrierRiskClassA: boolean): void {
        this.isOccupationClassA = isCarrierRiskClassA;
    }

    /**
     * Method to get occupation class
     * @returns boolean value if selected occupation class is A
     */
    getIsOccupationClassA(): boolean {
        return this.isOccupationClassA;
    }

    /**
     * Method to set if default occupation class is A
     * @param isIndustryCodeA
     */
    setIsDefaultOccupationClassA(isIndustryCodeA: boolean): void {
        this.isIndustryCodeA = isIndustryCodeA;
    }

    /**
     * Method to get value if default occupation class is A or not
     * @returns boolean value if default occupation class is A or not
     */
    getIsDefaultOccupationClassA(): boolean {
        return this.isIndustryCodeA;
    }

    /**
     * Method to sort plans
     * @param data input array
     */
    sortPlans(data: PlanPanelModel[]): void {
        data.sort((previousPlan, nextPlan) => {
            if (previousPlan && nextPlan) {
                if (previousPlan.plan?.displayOrder === nextPlan.plan?.displayOrder) {
                    return previousPlan.plan?.name.localeCompare(nextPlan.plan?.name, "en", { numeric: true });
                }
                return previousPlan.plan?.displayOrder - nextPlan.plan?.displayOrder;
            }
            return undefined;
        });
    }

    /**
     * Method to check if member belongs to PR state if config for pr template is enabled
     * @param memberId member Id number
     * @param mpGroupId mpGroup number
     * @returns Observable of boolean
     */
    checkPRState(memberId: number, mpGroupId: number): Observable<boolean> {
        return this.staticUtilService.cacheConfigEnabled(ConfigName.PR_PDA_TEMPLATE).pipe(
            switchMap((prConfigEnable) =>
                iif(
                    () => prConfigEnable,
                    forkJoin([
                        this.memberService.getMemberContact(memberId, ContactType.HOME, mpGroupId.toString()),
                        this.memberService
                            .getMemberContact(memberId, ContactType.WORK, mpGroupId.toString())
                            .pipe(catchError((error) => of(error))),
                        this.enrollmentService.getEnrollments(memberId, mpGroupId),
                    ]).pipe(
                        map(([homeContact, workContact, enrollments]) => {
                            const homeData = homeContact.body;
                            const workData = workContact.body;
                            const isHomeStatePR =
                                homeData && homeData.address && homeData.address.state && homeData.address.state === CompanyCode.PR;
                            const isWorkStatePR =
                                workData && workData.address && workData.address.state && workData.address.state === CompanyCode.PR;
                            const hasPREnrollment = enrollments.some(
                                (enrollment) => enrollment && enrollment.state && enrollment.state === CompanyCode.PR,
                            );
                            return isHomeStatePR || isWorkStatePR || hasPREnrollment;
                        }),
                    ),
                    of(false),
                ),
            ),
        );
    }
    /**
     * set enrollment values required in loading shop page
     * @param addressResult address result from confirm address pop up
     * @param currentEnrollmentObj current enrollment object
     */
    setEnrollmentValuesForShop(addressResult: AddressResult, currentEnrollmentObj: EnrollmentMethodModel): void {
        this.store.dispatch(
            new SetEnrollmentMethodSpecific({
                enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                enrollmentState: addressResult.newState.name,
                headSetState: addressResult.newState.name,
                headSetStateAbbreviation: addressResult.newState.abbreviation,
                enrollmentStateAbbreviation: addressResult.newState.abbreviation,
                userType: currentEnrollmentObj.userType,
                memberId: currentEnrollmentObj.memberId,
                mpGroup: currentEnrollmentObj.mpGroup,
                enrollmentCity: addressResult.newCity,
            }),
        );
    }

    /**
     * This function sets the details related to Unplugged account.
     * @param {unpluggedParameters} newUnpluggedDetails contains parameters status for unplugged operations
     */
    checkUnpluggedDetails(newUnpluggedDetails: UnpluggedParameters): void {
        this.unpluggedParam$.next(newUnpluggedDetails);
    }

    /**
     * Function will check whether SSN is mandatory or not for the given group to proceed with enrollment
     * @param mpGroup group number
     * @returns Observable<boolean>
     */
    isSSNRequiredForPartialCensus(mpGroup: number): Observable<boolean> {
        return this.staticService.getConfigurations(ConfigName.SSN_REQUIRED_FOR_EMPLOYEE_IN_PARTIAL_CENSUS, mpGroup).pipe(
            filter((configData) => !!configData.length),
            map((configData: Configurations[]) => configData[0].value?.toLowerCase() === BooleanConst.TRUE),
        );
    }
    /**
     * Function to get the primary producer information
     * @param groupId group id
     * @returns Observable<ProducerDetails> producer details based on group id
     */
    getPrimaryProducer(groupId: string): Observable<ProducerDetails> {
        return this.accountService
            .getAccountProducers(groupId)
            .pipe(
                map(
                    (accountProducer) =>
                        accountProducer.find((primary) => primary.role === ACOOUNT_PRODUCER_ROLE.PRIMARY_PRODUCER)?.producer,
                ),
            );
    }

    /**
     * Function to get the primary role of producer.
     * @param groupId group id
     * @returns Observable<ProducerDetails> producer role details based on group id
     */
    getEnroller(groupId: string): Observable<AccountProducer> {
        return this.accountService.getAccountProducers(groupId).pipe(
            map((accountProducer) => {
                const currentUser = accountProducer.find(
                    (producer) => producer.producer.id === JSON.parse(sessionStorage.getItem("userInfo")).producerId,
                );
                return currentUser?.role === ACOOUNT_PRODUCER_ROLE.ENROLLER ? currentUser : null;
            }),
        );
    }
    /**
     * Function to get privacy from config
     * @param pageName pagename
     * @returns boolean if config value is true for page else false.
     */
    getPrivacyConfigforEnroller(pageName: string): boolean {
        const configuration = JSON.parse(
            this.store.selectSnapshot(SharedState.getConfig(ConfigName.GA_ENABLE_PRIVACY_RULES_ENROLLER))?.value,
        );
        if (configuration) {
            return configuration.find((config) => config.PageName === pageName && config.Value);
        }
        return false;
    }
    /**
     * Function to check if standard demographic changes are enabled
     * @returns true if its enabled and false if its disabled
     */
    getStandardDemographicChangesConfig(): Observable<boolean> {
        return this.staticUtilService.cacheConfigEnabled(ConfigName.SEND_STANDALONE_DEMOGRAPHIC_CHANGE_DATA_TO_AFLAC);
    }

    /**
     * Checks if employer name field needs to be enabled and if employer name field must be readonly
     * @returns Observable<[boolean, boolean]>
     */
    isEmployerNameFieldEnabled(mpGroupId: number): Observable<[boolean, boolean]> {
        return combineLatest([
            this.staticUtilService.cacheConfigs([ConfigName.ENABLE_EMPLOYER_NAME_FIELD, ConfigName.EMPLOYER_NAME_FIELD_ACCOUNT_CATEGORIES]),
            this.accountService.getGroupAttributesByName([GroupAttributeEnum.ACCOUNT_CATEGORY], mpGroupId),
        ]).pipe(
            map(([[enableEmployerNameField, employerNameFieldAccCategories], [accountCategory]]) => {
                const iEmployerNameFieldEnabled = this.staticUtilService.isConfigEnabled(enableEmployerNameField);
                return [
                    iEmployerNameFieldEnabled,
                    !(iEmployerNameFieldEnabled && employerNameFieldAccCategories.value.split(",").includes(accountCategory?.value)),
                ];
            }),
        );
    }
}

export type PortalType = "producer" | "admin" | "member" | "public";
