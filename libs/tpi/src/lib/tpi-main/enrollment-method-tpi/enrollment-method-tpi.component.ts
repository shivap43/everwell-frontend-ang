import { AppSettings, EnrollmentMethod, ContactType, CountryState, MemberContact, ConfigName } from "@empowered/constants";
import {
    ShoppingService,
    LanguageModel,
    MemberService,
    CallCenter,
    ProducerService,
    StaticService,
    AccountService,
    AflacService,
    ProducerInformation,
    CommissionSplit,
    AuthenticationService,
    EAAResponse,
    CrossBorderRule,
    BenefitsOfferingService,
} from "@empowered/api";
import { TpiServices, AccountUtilService, SharedService } from "@empowered/common-services";
import { CompanyCode } from "@empowered/constants";
import { FormGroup, FormBuilder, FormControl, Validators, AbstractControl } from "@angular/forms";
import { Component, OnInit, AfterContentInit, OnDestroy, ViewChild, HostBinding } from "@angular/core";
import { Observable, Subscription, forkJoin, combineLatest, Subject, defer, iif, of } from "rxjs";
import { startWith, map, concatMap, filter, switchMap, takeUntil, tap, shareReplay } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { LanguageService, LanguageState } from "@empowered/language";
import { ExceptionBusinessService, TPIState, StaticUtilService, AccountInfoState } from "@empowered/ngxs-store";
import { Router } from "@angular/router";
import {
    SetEnrollmentMethod,
    SetEnrollmentState,
    SetDisabilityEnrollmentRestriction,
    SetEnrollmentMethodSpecific,
    SetEnrollmentStateArray,
} from "@empowered/ngxs-store";
import { HttpResponse } from "@angular/common/http";
import { MembersBusinessService } from "@empowered/ui";

const HEADSET_API_VALUE = "HEADSET";
const CALL_CENTER = "CALL_CENTER";
const USER_TYPE_SPECIFIC = "specific";
const SITUS_STATE_NY = "New York";
const SET_TIME = 250;
const FORBIDDEN = "forbidden";
const STATE = "state";
const CITY = "city";
const EXIT = "exit";
const HYBRID_CALL_CENTER_AGENT = "HYBRID_AGENT";
const NOT_HYBRID_CALL_CENTER_AGENT = "NOT_HYBRID_AGENT";
const HYBRID_USER_PERMISSION = "core.callCenter.hybridUser";
const RADIX_TEN = 10;
const FALSE = "false";
const COMPANY_CODE = "company_code";
@Component({
    selector: "empowered-tpi-enrollment-method",
    templateUrl: "./enrollment-method-tpi.component.html",
    styleUrls: ["./enrollment-method-tpi.component.scss"],
})
export class EnrollmentMethodTpiComponent implements OnInit, AfterContentInit, OnDestroy {
    @HostBinding("class") classes = "tpi-content-wrapper";
    @ViewChild("stateinput") matStateInput;
    @ViewChild("cityinput") matCityInput;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    enrollmentForm: FormGroup;
    states: CountryState[];
    methodsArray: string[];
    cityDisplay = true;
    stateDisplay = true;
    statePrepopulated = false;
    headSet = false;
    isCallCenter = false;
    memberId: number;
    selectedEnrollmentMethod: string;
    selectedEnrollmentState: string;
    selectedEnrollmentCity: string;
    optionSelectedState: string;
    stateAbbreviation: string;
    methods$: Observable<string[]>;
    filterState = new FormControl("");
    filterCity = new FormControl("");
    filteredStateOptions: Observable<string[]>;
    filteredCityOptions: Observable<string[]>;
    stateArray: string[] = [];
    stateToCompare: string[] = [];
    temp: string[];
    defaultState: string;
    enrollMethods: string[];
    cities: string[];
    citiesRes = false;
    tempStateAbbr: string;
    tempStateAbbrArray: string[];
    headSetState: string;
    headSetStateAbbr: string;
    fieldErrorFlag = false;
    errorMsg: string;
    userCallCenter: CallCenter;
    isCallCenterError = false;
    isCallCenterAgent = false;
    isHybridUser = false;
    showEnrollmentInfoPopup = false;
    isDirect = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.placeholderSelect",
        "primary.portal.enrollmentMethod.requireMinEmp",
        "primary.portal.enrollmentMethod.number",
        "primary.portal.shoppingExperience.header",
        "primary.portal.enrollmentMethod.notPermittedForEnrollment",
        "primary.portal.situsState.non-nyGroupMessage",
        "primary.portal.situsState.nyGroupMessage",
        "primary.portal.enrollmentMethod.nyGroupProducerNotLicensedInNY",
        "primary.portal.enrollmentMethod.usGroupProducerLicensedOnlyInNY",
        "primary.portal.enrollmentMethod.producerNotLicensedInEmployeeState",
        "primary.portal.enrollmentMethod.producerNotLicensedInCustomerState",
        "primary.portal.enrollmentMethod.Headset",
        "primary.portal.enrollmentMethod.headsetText",
        "primary.portal.coverage.pdaSelectionType1",
        "primary.portal.enrollmentMethod.callCenterText",
        "primary.portal.enrollmentMethod.selfServiceText",
        "primary.portal.members.dependent.contactInfo.method",
        "primary.portal.accounts.state",
        "primary.portal.accounts.city",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.common.continue",
        "primary.portal.common.selectionRequired",
        "primary.portal.selectEnrollment.hintEnrollee",
        "primary.portal.selectEnrollment.hintStateEnrollment",
        "primary.portal.shoppingExperience.header",
        "primary.portal.enrollmentMethod.pinSignature",
        "primary.portal.quoteShop.plansDisplay.crossBorderRestriction",
        "primary.portal.enrollmentMethod.missingEAAWarning",
        "primary.portal.enrollmentMethod.phoneEnrollmentTpi",
        "primary.portal.callCenter.8x8.form.alert.cannotEnrollDisability",
        "primary.portal.enrollmentMethod.carrierAppointment.licenseNotAvailableForState",
    ]);
    isDisable = false;
    methodChangeNYacc: boolean;
    methodChangenonNYacc: boolean;
    isSpinnerLoading = false;
    enrollmentSpinner = false;
    homeState: string;
    genericUserState: string;
    isNYGroupProducerNotLicensedInNY = false;
    isUSGroupProducerLicensedOnlyInNY = false;
    isProducerNotLicensedInEmployeeState = false;
    isProducerNotLicensedInCustomerState = false;
    producerId: number;
    subscriptionList: Subscription[] = [];
    mpGroup: string;
    situs: string;
    companyCode: string;
    headerInfo: string;
    key: number;
    tpiLnlMode = false;
    callCenterId: number;
    tpiCallCenterEnrollmentEnabled: boolean;
    hybridCallCenterAgent: string;
    allowCrossBorderCheck = false;
    eaaResponse: EAAResponse;
    crossBorderRules: CrossBorderRule[] = [];
    isInvalidCity = false;
    faceToFaceApiValue: string = EnrollmentMethod.FACE_TO_FACE;
    carrierAppointmentNotLicensed = false;
    benefitOfferingStates: CountryState[];
    // Gets any restrictions that apply on disability products.
    callCenter8x8DisabilityRestricted$: Observable<boolean> = this.store.select(TPIState.tpiSsoDetail).pipe(
        switchMap((tpiSSODetail) =>
            this.membersBusinessService.getActiveMembers(tpiSSODetail.user.groupId).pipe(
                switchMap((members) =>
                    this.exceptionBusinessService.callCenter8x8DisabilityRestricted(
                        tpiSSODetail.user.groupId,
                        ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ENABLED,
                        ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_MIN_EMPLOYEES,
                        ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ALLOWED,
                        this.staticUtil,
                        members.length,
                    ),
                ),
                map(({ callCenterDisabilityEnrollmentRestricted }) => callCenterDisabilityEnrollmentRestricted),
            ),
        ),
        shareReplay(1),
    );

    // Shows disability enrollment info message based on selected enrollment method.
    disabilityEnrollmentRestrictionInfo$: Observable<{
        callCenterDisabilityEnrollmentRestricted: boolean;
        callCenterDisabilitySupportEmail: string;
    }> = defer(() =>
        this.enrollmentForm.controls.enrollmentMethod.valueChanges.pipe(
            switchMap((enrollmentMethod) =>
                combineLatest([
                    this.staticUtil.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_SUPPORT_EMAIL),
                    iif(() => enrollmentMethod === CALL_CENTER, this.callCenter8x8DisabilityRestricted$, of(false)),
                ]),
            ),
            tap(([, callCenterDisabilityEnrollmentRestricted]) =>
                this.store.dispatch(new SetDisabilityEnrollmentRestriction(callCenterDisabilityEnrollmentRestricted)),
            ),
            map(
                ([callCenterDisabilitySupportEmail, callCenterDisabilityEnrollmentRestricted]) =>
                    (callCenterDisabilityEnrollmentRestricted && {
                        callCenterDisabilityEnrollmentRestricted,
                        callCenterDisabilitySupportEmail,
                    }) ||
                    null,
            ),
        ),
    );
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private readonly sharedService: SharedService,
        private readonly staticService: StaticService,
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
        private readonly fb: FormBuilder,
        private readonly aflac: AflacService,
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly producerService: ProducerService,
        private readonly router: Router,
        private readonly tpiService: TpiServices,
        private readonly authService: AuthenticationService,
        private readonly staticUtil: StaticUtilService,
        private readonly accountUtilService: AccountUtilService,
        private readonly membersBusinessService: MembersBusinessService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    /**
     * function to fetch values and data to prepopulate the form and set other values
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(TPIState).tpiSSODetail.user.groupId.toString();
        this.memberId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.memberId;
        this.staticUtil
            .cacheConfigEnabled(ConfigName.CROSS_BORDER_RULE_ENABLED)
            .pipe(
                filter((isCrossBorderRulesEnabled) => isCrossBorderRulesEnabled),
                switchMap(() => this.aflac.getCrossBorderRules(parseInt(this.mpGroup, RADIX_TEN), this.memberId)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((crossBorderRules) => {
                this.allowCrossBorderCheck = true;
                this.crossBorderRules = crossBorderRules;
            });
        const defaultCallCenterId = 0;
        this.enrollmentForm = this.fb.group({
            enrollmentMethod: ["FACE_TO_FACE", Validators.required],
            state: this.filterState,
            city: this.filterCity,
        });
        this.callCenterId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.callCenterId
            ? this.store.selectSnapshot(TPIState).tpiSSODetail.user.callCenterId
            : defaultCallCenterId;
        this.headerInfo = this.languageStrings["primary.portal.shoppingExperience.header"];
        this.isSpinnerLoading = true;
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();

        this.statePrepopulated = !(this.headSet || this.isCallCenter);
        this.getBenefitOfferingStates();
        this.getAccountInformation();
        this.getEnrollmentMethods();
    }

    /**
     *  function to get the BenefitOffering state information
     */
    getBenefitOfferingStates(): void {
        this.benefitsOfferingService
            .getBenefitOfferingSettings(+this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((settingsDetails) => (this.benefitOfferingStates = settingsDetails.states));
    }
    /**
     *  function to get the account information such as company code and situs code
     */
    getAccountInformation(): void {
        this.accountService
            .getGroupAttributesByName([COMPANY_CODE], Number(this.mpGroup))
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((groupAttribute) => {
                    this.companyCode = groupAttribute[0]?.value;
                }),
                switchMap((accountInfo) =>
                    this.store.selectSnapshot(AccountInfoState.getMpGroupId) === this.mpGroup
                        ? this.store.select(AccountInfoState.getAccountInfo)
                        : this.accountService.getAccount(this.mpGroup),
                ),
                tap((accountInfo) => {
                    if (accountInfo) {
                        this.situs = accountInfo.situs.state.abbreviation;
                        if (!this.companyCode) {
                            this.companyCode = this.situs;
                        }
                        this.tempStateAbbr = this.companyCode;
                        this.getProducerAndMemberInformation();
                    }
                }),
            )
            .subscribe(
                () => {
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     *  function to get the producer and member information like:
     *  producer license state
     *  and member home state
     */
    getProducerAndMemberInformation(): void {
        if (this.store.selectSnapshot(TPIState).tpiSSODetail.user.producerId) {
            this.producerId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.producerId;
            if (this.producerId) {
                this.enrollmentSpinner = true;
                this.getProducerMemberData()
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (result) => {
                            this.getProducerInfo(result);
                            this.getEnrollmentMethods();
                        },
                        (error) => {
                            this.enrollmentSpinner = false;
                        },
                    );
            }
        } else {
            this.aflac
                .getCommissionSplits(this.mpGroup)
                .pipe(
                    concatMap((resp) => this.getProducerMemberData(resp)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((response) => {
                    if (this.producerId) {
                        this.enrollmentSpinner = true;
                        this.getProducerInfo(response);
                        this.getEnrollmentMethods();
                    }
                });
        }
        if (this.enrollmentForm.controls.state) {
            this.optionSelectedState = this.enrollmentForm.controls.state.value;
        }
        this.selectedEnrollmentMethod = this.enrollmentForm.controls.enrollmentMethod.value;
    }
    /**
     *  function to get the producer and member data
     * @param result : array of object
     * @returns object of producer Info and Member Contact
     */

    getProducerMemberData(result?: CommissionSplit[]): Observable<[ProducerInformation, HttpResponse<MemberContact>]> {
        if (result) {
            this.producerId = result[0].defaultFor.producerId;
        }
        return forkJoin(
            this.producerService.getProducerInformation(this.producerId.toString()),
            this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroup),
        );
    }
    /**
     * function to get the info of logged in producer
     * @param data : get the info about producer and HttpResponse<MemberContact> get details of Member Contact
     */
    getProducerInfo(data: [ProducerInformation, HttpResponse<MemberContact>]): void {
        const producerData = data[0];
        const memberData = data[1];

        this.states = producerData.licenses.map((license) => license.state);
        this.states.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
        if (
            this.tempStateAbbr !== CompanyCode.NY &&
            !this.states.some(
                (state) =>
                    state.abbreviation === this.situs ||
                    this.benefitOfferingStates.some((benefitOfferingState) => benefitOfferingState.abbreviation === state.abbreviation),
            )
        ) {
            this.statePrepopulated = false;
            this.tempStateAbbr = "";
            this.enrollmentForm.controls.enrollmentMethod.disable();
            this.enrollmentForm.controls.city.disable();
        }
        if (this.tempStateAbbr !== CompanyCode.NY && this.states.length === 1 && this.states[0].abbreviation === CompanyCode.NY) {
            this.isUSGroupProducerLicensedOnlyInNY = true;
            this.enrollmentForm.controls.enrollmentMethod.disable();
            this.statePrepopulated = false;
            this.enrollmentForm.controls.state.disable();
            this.enrollmentForm.controls.city.disable();
        }
        this.isSpinnerLoading = true;
        this.getMemberInfo(memberData);
    }
    /**
     * function to get the enrollment methods
     */
    getEnrollmentMethods(): void {
        this.authService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe((permission) => {
            if (permission.find((data) => String(data) === HYBRID_USER_PERMISSION)) {
                this.hybridCallCenterAgent = HYBRID_CALL_CENTER_AGENT;
            } else {
                this.hybridCallCenterAgent = NOT_HYBRID_CALL_CENTER_AGENT;
            }
        });
        combineLatest([
            this.shoppingService.getEnrollmentMethods(+this.mpGroup),
            this.staticUtil.cacheConfigEnabled(ConfigName.TPI_CALL_CENTER_ENROLLMENT_ENABLE),
            this.staticService.getConfigurations(ConfigName.TPI_HEADSET_ENROLLMENT_ENABLE, +this.mpGroup),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([enrollment, isTpiCallCenterConfigEnabled, isTpiHeadsetEnabled]) => {
                    this.enrollmentSpinner = false;
                    this.tpiCallCenterEnrollmentEnabled = isTpiCallCenterConfigEnabled;
                    const methodArray = enrollment.map((enrollmentMethod) => enrollmentMethod.name);
                    this.enrollMethods = methodArray.filter((value) => {
                        if (isTpiHeadsetEnabled[0].value.toLowerCase() === FALSE) {
                            return value === this.faceToFaceApiValue;
                        }
                        return value === this.faceToFaceApiValue || value === HEADSET_API_VALUE;
                    });
                    if (this.callCenterId > 0 && this.tpiCallCenterEnrollmentEnabled && this.hybridCallCenterAgent) {
                        const isCallCentreOrPinSignatureAdded = methodArray.some(
                            (value) => value === CALL_CENTER || value === EnrollmentMethod.PIN_SIGNATURE,
                        );
                        if (isCallCentreOrPinSignatureAdded) {
                            this.callCenterAgentEnrollMethodsFilter(methodArray);
                        }
                    }
                },
                (error) => {
                    this.enrollmentSpinner = false;
                    if (error.error.code === FORBIDDEN && error.error.status === AppSettings.API_RESP_403) {
                        this.isDisable = true;
                    }
                },
            );
    }

    /**
     * Method to filter the enrollment methods for call center agents
     * @param optionsArray- enrollment options
     */
    callCenterAgentEnrollMethodsFilter(optionsArray: string[]): void {
        if (this.hybridCallCenterAgent !== HYBRID_CALL_CENTER_AGENT) {
            this.enrollMethods = [];
        }
        if (
            this.tpiCallCenterEnrollmentEnabled &&
            !this.methodChangeNYacc &&
            !(this.homeState && this.homeState === CompanyCode.NY && this.companyCode !== CompanyCode.NY)
        ) {
            this.stateDisplay = false;
            this.cityDisplay = false;
            this.enrollmentForm.controls.city.clearValidators();
            this.enrollmentForm.controls.city.updateValueAndValidity();
            this.enrollmentForm.controls.state.clearValidators();
            this.enrollmentForm.controls.state.updateValueAndValidity();
            const temp = optionsArray.find((value) => value === CALL_CENTER);
            const pinSignature = optionsArray.find((value) => value === EnrollmentMethod.PIN_SIGNATURE);
            if (temp) {
                this.isCallCenter = true;
                this.enrollmentForm.controls.enrollmentMethod.setValue(CALL_CENTER);
                this.enrollMethods.push(temp);
            }
            if (pinSignature) {
                this.enrollmentForm.controls.enrollmentMethod.setValue(EnrollmentMethod.PIN_SIGNATURE);
                this.enrollMethods.push(pinSignature);
            }
        } else {
            this.setEnrollmentMethodForNYEmployee();
        }
    }
    /**
     * function to get the member contact information
     * @param memberContact : it will get the array of object
     */
    getMemberInfo(memberContact: HttpResponse<MemberContact>): void {
        this.homeState = memberContact.body.address.state;
        if (this.homeState) {
            this.statePrepopulated = this.homeState === CompanyCode.NY;
            this.setDefaultState();
            this.setStateArray(true);
        } else {
            // Customer Address not on File
            this.setDefaultState();
            this.setStateArray(false);
            this.setInitialStateValues();
            this.isSpinnerLoading = false;
        }
        if (
            this.allowCrossBorderCheck &&
            this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.FACE_TO_FACE &&
            this.defaultState
        ) {
            this.eaaResponse = this.accountUtilService.checkCrossBorderRules(this.defaultState, this.crossBorderRules);
        }
        this.checkHomeStateRestrictions();
        if (
            !this.isDirect &&
            this.tempStateAbbr !== CompanyCode.NY &&
            !this.states.some((state) => state.abbreviation === this.homeState)
        ) {
            this.isProducerNotLicensedInEmployeeState = true;
            this.sharedService.changeProducerNotLicensedInEmployeeState(true);
        } else {
            this.isProducerNotLicensedInEmployeeState = false;
            this.sharedService.changeProducerNotLicensedInEmployeeState(false);
        }
        if (this.isDirect && !this.states.some((state) => state.abbreviation === this.homeState)) {
            this.isProducerNotLicensedInCustomerState = true;
            this.sharedService.changeProducerNotLicensedInCustomerState(true);
            this.enrollmentForm.controls.enrollmentMethod.disable();
        } else {
            this.isProducerNotLicensedInCustomerState = false;
            this.sharedService.changeProducerNotLicensedInCustomerState(false);
        }
        this.setInitialStateValues();
        this.headSetStateAbbr = this.homeState;
        const tempState = this.states.find((state) => state.abbreviation === this.homeState);
        if (tempState) {
            this.headSetState = tempState.name;
        }
        this.isSpinnerLoading = false;
    }

    /**
     * Check home state restrictions to disable enrollment method drop down
     */
    checkHomeStateRestrictions(): void {
        if (this.homeState && this.homeState !== CompanyCode.NY && this.tempStateAbbr === CompanyCode.NY && !this.isDirect) {
            this.methodChangeNYacc = true;
            this.setEnrollmentMethodForNYEmployee();
            this.defaultState = this.tempStateAbbr;
            this.enrollmentForm.controls.state.setValue(this.defaultState);
            this.optionSelectedState = this.tempStateAbbr;
        }
        if (this.homeState && this.homeState === CompanyCode.NY && this.tempStateAbbr !== CompanyCode.NY && !this.isDirect) {
            this.methodChangenonNYacc = true;
            this.enrollmentForm.controls.enrollmentMethod.disable();
        }
    }

    /**
     * Set enrollment method
     */
    setEnrollmentMethodForNYEmployee(): void {
        this.enrollmentForm.controls.enrollmentMethod.setValue(EnrollmentMethod.FACE_TO_FACE);
        this.selectedEnrollmentMethod = EnrollmentMethod.FACE_TO_FACE;
        this.cityDisplay = true;
        this.stateDisplay = true;
        this.statePrepopulated = true;
        this.enrollmentForm.controls.enrollmentMethod.disable();
    }

    /**
     * function to set the default value of the state based on license of producer
     */
    setDefaultState(): void {
        if (this.statePrepopulated) {
            // Payroll and has license in Situs state
            this.defaultState = this.tempStateAbbr === CompanyCode.NY ? this.tempStateAbbr : this.situs;
        } else {
            // Payroll and no license in Situs state
            this.defaultState = "";
        }
    }
    /**
     * this function is used to prepopulate the state field of the enrollment method form
     */
    setInitialStateValues(): void {
        this.filterState.setValue("");
        if (this.statePrepopulated && !(this.homeState === CompanyCode.NY && this.companyCode !== CompanyCode.NY)) {
            if (this.enrollmentForm.controls.state) {
                this.enrollmentForm.controls.state.setValue(this.defaultState);
            }
            if (
                this.enrollmentForm.controls.state &&
                this.enrollmentForm.controls.state.value === CompanyCode.NY &&
                !this.methodChangeNYacc
            ) {
                this.enrollmentForm.controls.state.disable();
            }
            this.tempStateAbbr = this.defaultState;
            if (this.tempStateAbbr) {
                this.getCity();
            }
        }
        const tempState = this.states.find(
            (state) => this.enrollmentForm.controls[STATE] && state.abbreviation === this.enrollmentForm.controls[STATE].value,
        );
        if (tempState) {
            this.stateAbbreviation = tempState.abbreviation;
        }
    }
    /**
     * function to set the values for state dropdown
     * @param isCustomerAddressOnFile : check if member address is present in db
     */
    setStateArray(isCustomerAddressOnFile: boolean): void {
        if (this.isDirect) {
            // Direct Customers (No Group check required)
            if (!isCustomerAddressOnFile) {
                // No Customer Address On File
                this.stateArray = this.states.map((state) => state.name);
                this.stateToCompare = this.states.map((state) => state.abbreviation);
                // Direct and Resident state not NY
                this.store.dispatch(new SetEnrollmentStateArray(this.states));
            } else if (this.homeState === CompanyCode.NY) {
                // Customer Address on file in NY
                this.stateArray.push(SITUS_STATE_NY);
                this.stateToCompare.push(CompanyCode.NY);
                this.store.dispatch(new SetEnrollmentStateArray([{ name: SITUS_STATE_NY, abbreviation: CompanyCode.NY }]));
            } else {
                // Customer Address on file in non-NY
                this.stateArray = this.states.filter((state) => state.abbreviation !== CompanyCode.NY).map((state) => state.name);
                this.stateToCompare = this.states
                    .filter((state) => state.abbreviation !== CompanyCode.NY)
                    .map((state) => state.abbreviation);
                this.store.dispatch(new SetEnrollmentStateArray(this.states.filter((state) => state.abbreviation !== CompanyCode.NY)));
            }
        } else if (this.tempStateAbbr !== CompanyCode.NY) {
            // Payroll Employee US Group
            this.stateArray = this.states.filter((state) => state.abbreviation !== CompanyCode.NY).map((state) => state.name);
            this.stateToCompare = this.states.filter((state) => state.abbreviation !== CompanyCode.NY).map((state) => state.abbreviation);
            this.store.dispatch(new SetEnrollmentStateArray(this.states.filter((state) => state.abbreviation !== CompanyCode.NY)));
        } else {
            // Payroll Employee NY Group
            this.stateArray.push(SITUS_STATE_NY);
            this.stateToCompare.push(CompanyCode.NY);
            this.store.dispatch(new SetEnrollmentStateArray([{ name: SITUS_STATE_NY, abbreviation: CompanyCode.NY }]));
        }
    }
    /**
     * function to modify state dropdown values based on input
     * @param value : current value entered in state field
     * @returns string[] for state dropdown
     */
    private filteredState(value: string): string[] {
        return this.stateToCompare.filter((option) => option.toLowerCase().indexOf(value.toLowerCase()) === 0);
    }
    /**
     * function to modify city dropdown values based on input
     * @param value : current value entered in city field
     * @returns string[] for city dropdown
     */
    private filteredCity(value: string): string[] {
        if (this.citiesRes) {
            return this.cities.filter((option) => option.toLowerCase().indexOf(value.toLowerCase()) === 0);
        }
        return [];
    }
    /**
     * function to get the state value selected from dropdown
     * @param event : state selected from dropdown
     */
    getStateOptionSelected(event: string): void {
        this.selectedEnrollmentState = event;
        this.enrollmentForm.controls.state.setValue(this.selectedEnrollmentState);
        this.matStateInput.nativeElement.value = this.selectedEnrollmentState;
        if (this.enrollmentForm.controls[CITY].value.length) {
            this.enrollmentForm.controls.city.setValue("");
        }
        this.getStateAbbr();
        this.disableAutoComplete();
        if (this.allowCrossBorderCheck && this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.FACE_TO_FACE) {
            this.eaaResponse = this.accountUtilService.checkCrossBorderRules(this.selectedEnrollmentState, this.crossBorderRules);
        }
    }

    /**
     * function to get the abbreviation of the selected state
     */
    getStateAbbr(): void {
        this.tempStateAbbrArray = this.states
            .filter((item) => item.abbreviation === this.enrollmentForm.controls[STATE].value)
            .map((item) => item.abbreviation);
        if (this.tempStateAbbrArray && this.tempStateAbbrArray.length > 0) {
            this.stateAbbreviation = this.tempStateAbbrArray[0];
            this.tempStateAbbr = this.tempStateAbbrArray[0];
            this.getCity();
        }
    }
    /**
     * function to remove selected city on change of state
     */
    removeCity(): void {
        const index = this.stateToCompare.indexOf(this.matStateInput.nativeElement.value);
        if (index === -1 && this.enrollmentForm.controls[CITY].value.length) {
            this.enrollmentForm.controls.city.setValue("");
        }
        this.disableAutoComplete();
    }
    /**
     * function to keep or remove typed value in state field based on comparison with state array
     */
    removeStateText(): void {
        // setTimeout to load data for prepopulating the form
        setTimeout(() => {
            const index = this.stateToCompare.find((state) => state.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase());
            const typedValue = this.stateToCompare.find(
                (item) => item.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase(),
            );
            if (index && typedValue.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase()) {
                this.enrollmentForm.controls[STATE].setValue(typedValue);
                this.filterState.setValue(typedValue);
                this.getStateAbbr();
            } else if (index === undefined || this.matStateInput.nativeElement.value !== this.enrollmentForm.controls[STATE].value) {
                this.matStateInput.nativeElement.value = "";
                this.enrollmentForm.controls.state.setValue("");
                this.filterState.setValue("");
                this.matCityInput.nativeElement.value = "";
                this.enrollmentForm.controls.city.setValue("");
                this.filterCity.setValue("");
                this.disableAutoComplete();
            }
        }, SET_TIME);
    }
    /**
     * fuction to get the selected city from dropdown
     * @param event selected city
     */
    getCityOptionSelected(event: string): void {
        this.isInvalidCity = false;
        this.selectedEnrollmentCity = event;
        this.enrollmentForm.controls.city.setValue(this.selectedEnrollmentCity);
        this.matCityInput.nativeElement.value = this.selectedEnrollmentCity;
    }
    /**
     * function to keep or remove typed value in city field based on comparison with city array
     */
    removeCityText(): void {
        // setTimeout to load data for prepopulating the form
        setTimeout(() => {
            const index = this.cities.find((city) => city.toLowerCase() === this.matCityInput.nativeElement.value.toLowerCase());
            const typedValue = this.cities.find((item) => item.toLowerCase() === this.matCityInput.nativeElement.value.toLowerCase());
            if (index && typedValue.toLowerCase() === this.matCityInput.nativeElement.value.toLowerCase()) {
                this.enrollmentForm.controls.city.setValue(typedValue);
                this.filterCity.setValue(typedValue);
                this.isInvalidCity = false;
            } else if (index === undefined || this.matCityInput.nativeElement.value !== this.enrollmentForm.controls[CITY].value) {
                this.matCityInput.nativeElement.value = "";
                this.enrollmentForm.controls.city.setValue("");
                this.filterCity.setValue("");
            }
        }, SET_TIME);
    }
    /**
     * function to select city by typing values into city field
     */
    captureTypedCity(): void {
        const typedValue = this.cities.find((item) => item === this.matCityInput.nativeElement.value);
        this.isInvalidCity = !typedValue;
        if (typedValue === this.matCityInput.nativeElement.value) {
            this.enrollmentForm.controls.city.setValue(typedValue);
            this.filterCity.setValue(typedValue);
        }
    }
    /**
     * function to handle change of enrollment method type
     * @param enrollmentType current enrollment method selection from dropdown
     */
    changeEnrollment(enrollmentType: string): void {
        this.carrierAppointmentNotLicensed = false;
        if (
            enrollmentType === HEADSET_API_VALUE ||
            enrollmentType === EnrollmentMethod.CALL_CENTER ||
            enrollmentType === EnrollmentMethod.PIN_SIGNATURE
        ) {
            this.headSet = true;
            this.isCallCenter = true;
            this.enrollmentForm.controls.city.clearValidators();
            this.enrollmentForm.controls.city.updateValueAndValidity();
            this.enrollmentForm.controls.state.clearValidators();
            this.enrollmentForm.controls.state.updateValueAndValidity();
            this.stateDisplay = false;
            this.cityDisplay = false;
            this.eaaResponse.isMissingEAAError = false;
            this.eaaResponse.isMissingEAAWarning = false;
        } else {
            this.headSet = false;
            this.isCallCenter = false;
            this.cityDisplay = true;
            this.stateDisplay = true;
            if (this.statePrepopulated) {
                this.enrollmentForm.controls.state.setValue(this.defaultState);
                this.filterState.setValue(this.defaultState);
            } else {
                this.enrollmentForm.controls.state.setValue("");
                this.filterState.setValue("");
            }
            if (this.allowCrossBorderCheck && this.enrollmentForm.controls.state.value) {
                this.eaaResponse = this.accountUtilService.checkCrossBorderRules(
                    this.enrollmentForm.controls.state.value,
                    this.crossBorderRules,
                );
            }
        }
        if (this.headSet || this.isCallCenter) {
            this.filterState.setValue("");
            this.enrollmentForm.controls.state.setValue("");
        }
    }
    /**
     * function to convert headset to required string to be displayed in dropdown
     * @param method : selected enrollment method
     * @returns string value for enrollment headset method
     */
    replaceUnderscore(method: string): string {
        switch (method) {
            case EnrollmentMethod.HEADSET:
                return this.languageStrings["primary.portal.enrollmentMethod.phoneEnrollmentTpi"];
            case EnrollmentMethod.FACE_TO_FACE:
                return this.languageStrings["primary.portal.coverage.pdaSelectionType1"];
            case EnrollmentMethod.PIN_SIGNATURE:
            case EnrollmentMethod.CALL_CENTER:
                return this.languageStrings["primary.portal.enrollmentMethod.pinSignature"];
            case EnrollmentMethod.SELF_SERVICE:
                return this.languageStrings["primary.portal.enrollmentMethod.selfServiceText"];
            default:
                return method;
        }
    }
    /**
     * function to get the cities for the selected state
     */
    getCity(): void {
        this.staticService
            .getCities(this.tempStateAbbr)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((res) => {
                this.cities = res;
                this.citiesRes = true;
                this.filterCityMethod();
            });
    }
    /**
     * function to get state dropdown values after content init
     */
    ngAfterContentInit(): void {
        this.cities = [];
        if (this.stateToCompare) {
            this.filteredStateOptions = this.filterState.valueChanges.pipe(
                startWith(""),
                map((value) => (value ? this.filteredState(value) : this.stateToCompare.slice())),
            );
        }
        this.filterCityMethod();
    }
    /**
     * function to change available options in dropdown based on input
     */
    filterCityMethod(): void {
        this.filteredCityOptions = this.filterCity.valueChanges.pipe(
            startWith(""),
            map((value) => (value ? this.filteredCity(value) : this.cities.slice())),
        );
    }
    /**
     * function to store the selected values in store
     */
    setStateValues(): void {
        this.store.dispatch(
            new SetEnrollmentMethodSpecific({
                enrollmentMethod: this.enrollmentForm.controls["enrollmentMethod"].value,
                enrollmentState:
                    this.enrollmentForm.controls[STATE].value !== ""
                        ? this.states.find((item) => item.abbreviation === this.enrollmentForm.controls[STATE].value).name
                        : "",
                headSetState: this.headSetState,
                headSetStateAbbreviation: this.headSetStateAbbr,
                enrollmentStateAbbreviation: this.stateAbbreviation,
                enrollmentCity: this.enrollmentForm.controls[CITY].value,
                userType: USER_TYPE_SPECIFIC,
                memberId: this.memberId,
                mpGroup: this.mpGroup,
            }),
        );
    }
    /**
     * function to populate state field and state dropdown based on input into the state field
     */
    disableAutoComplete(): void {
        this.carrierAppointmentNotLicensed = false;
        const typedValue = this.stateToCompare.find((item) => item === this.matStateInput.nativeElement.value);
        if (typedValue === this.matStateInput.nativeElement.value) {
            this.enrollmentForm.controls.state.setValue(typedValue);
            this.filterState.setValue(typedValue);
        }
        if (this.enrollmentForm.controls[STATE].value && this.enrollmentForm.controls[STATE].value.length > 0) {
            this.enrollmentForm.controls[CITY].enable();
        } else {
            this.enrollmentForm.controls[CITY].disable();
        }
    }

    /**
     * Function called on click of 'Exit' button
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * Function to check if the producer has license in the selected state
     */
    checkStateCarrierAppointment(): void {
        this.selectedEnrollmentState = this.enrollmentForm.controls[STATE].value;
        this.getProducerMemberData()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (producerData) => {
                    const states = producerData[0]?.carrierAppointments.map((carrierAppointment) => carrierAppointment.state);
                    states.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
                    this.carrierAppointmentNotLicensed = !states.some((state) => state.abbreviation === this.selectedEnrollmentState);
                    if (!this.carrierAppointmentNotLicensed) {
                        this.storeFormValues();
                    }
                },
                (error) => {
                    this.enrollmentSpinner = false;
                },
            );
    }

    /**
     * Function to store the form values and route to next screen
     */
    storeFormValues(): void {
        const control: AbstractControl = this.enrollmentForm.controls.enrollmentMethod;
        if (control.value === EnrollmentMethod.FACE_TO_FACE) {
            this.store.dispatch(new SetEnrollmentMethod(EnrollmentMethod.FACE_TO_FACE));
            this.store.dispatch(new SetEnrollmentState(this.enrollmentForm.controls[STATE].value));
            this.setStateValues();
            this.router.navigate(["tpi/partial-census"]);
        } else if (
            control.value === EnrollmentMethod.HEADSET ||
            control.value === EnrollmentMethod.CALL_CENTER ||
            control.value === EnrollmentMethod.PIN_SIGNATURE
        ) {
            this.store.dispatch(new SetEnrollmentMethod(control.value));
            this.setStateValues();
            this.router.navigate(["tpi/confirm-address"]);
        }
    }

    /**
     * Function called on click of Next / continue
     */
    onSubmit(): void {
        if (this.enrollmentForm.valid) {
            if (this.headSet || this.isCallCenter) {
                this.storeFormValues();
            } else {
                this.checkStateCarrierAppointment();
            }
        }
    }

    /**
     * function to unsubscribe on component destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
