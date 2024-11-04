import { ActivatedRoute, Router } from "@angular/router";
import {
    ShoppingService,
    LanguageModel,
    MemberService,
    CallCenter,
    ProducerService,
    StaticService,
    AflacService,
    ProducerInformation,
    EnrollmentMethodDetail,
    CrossBorderRule,
    EAAResponse,
    BenefitsOfferingService,
    WebexConnectInfo,
    AccountService,
} from "@empowered/api";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { Component, OnInit, Inject, AfterContentInit, OnDestroy, ViewChild } from "@angular/core";
import { Observable, Subject, forkJoin, Subscription, of, combineLatest, defer } from "rxjs";
import { startWith, map, takeUntil, tap, filter, switchMap, first, take, finalize, shareReplay } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { LanguageService, LanguageState } from "@empowered/language";
import { UserService } from "@empowered/user";
import { TitleCasePipe } from "@angular/common";

import {
    PortalType,
    ConfigName,
    CompanyCode,
    UserPermissionList,
    AppSettings,
    DualPlanYearSettings,
    EnrollmentMethod,
    ContactType,
    CountryState,
    ProducerCredential,
    AddressResult,
    Account,
} from "@empowered/constants";
import { AccountUtilService, SharedService } from "@empowered/common-services";
import { HttpResponse } from "@angular/common/http";
import {
    SetEnrollmentMethodSpecific,
    SetEnrollmentStateArray,
    Set8x8CallCenterDisabilityRestriction,
    SelectedShop,
    AccountListState,
} from "@empowered/ngxs-store";
import { ConfirmAddressDialogComponent } from "../confirm-address-dialog/confirm-address-dialog.component";
import { ExceptionBusinessService, StaticUtilService, SharedState } from "@empowered/ngxs-store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";

export interface MpGroup {
    mpGroup: number;
    stateAbbr: any;
    detail: any;
    route: ActivatedRoute;
    openingFrom?: string;
    method?: string;
}
export interface State {
    abbreviation: string;
    name: string;
}

const PR_STATE = "PR";
const VI_STATE = "VI";
const GU_STATE = "GU";
const COVERAGE_SUMMARY = "coverageSummary";
const LIFE_EVENT = "lifeEvent";
const NEW_EMPLOYEE = "newEmployee";

@Component({
    selector: "empowered-enrollment-method",
    templateUrl: "./enrollment-method.component.html",
    styleUrls: ["./enrollment-method.component.scss"],
})
export class EnrollmentMethodComponent implements OnInit, AfterContentInit, OnDestroy {
    @ViewChild("stateinput") matStateInput;
    @ViewChild("cityinput") matCityInput;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    enrollmentForm: FormGroup;
    states: CountryState[];
    methods;
    details: any;
    methodsArray;
    cityDisplay = true;
    stateDisplay = true;
    isGenericUser = false;
    statePrepopulated = false;
    headSet = false;
    isCallCenter = false;
    memberId: any;
    selectedEnrollmentMethod;
    selectedEnrollmentState;
    selectedEnrollmentCity;
    optionSelectedState: any;
    stateAbbreviation: any;
    cities = ["Florida", "South Dakota", "Tennessee", "Michigan"];
    methods$: Observable<string[]>;
    filterState = new FormControl("", Validators.required);
    filterCity = new FormControl("", Validators.required);
    filteredStateOptions: Observable<string[]>;
    filteredCityOptions: Observable<string[]>;
    stateArray = [];
    stateToCompare: string[] = [];
    temp: string[];
    defaultState: any;
    methodArray: any;
    enrollMethods: EnrollmentMethodDetail[];
    citiess: any;
    citiesRes = false;
    tempStateAbbr;
    headSetState: any;
    headSetStateAbbr: any;
    stateSubscription: any;
    citySubscription: any;
    enrollmentSubscription: any;
    memberSubscription: any;
    fieldErrorFlag = false;
    errorMsg: string;
    headsetAPIValue = "HEADSET";
    facetoFaceAPIValue = "FACE_TO_FACE";
    userTypeGeneric = "generic";
    userTypeSpecific = "specific";
    situsStateNY = "New York";
    situsStateNYAbbr = "NY";
    userCallCenter: CallCenter;
    isCallCenterError = false;
    isCallCenterAgent = false;
    isEfinancialAgent = false;
    isStrideAgent = false;
    isClearlinkAgent = false;
    isHybridUser = false;
    obj = [];
    stepHeaderDisplay = false;
    showEnrollmentInfoPopup = false;
    mpGroup: any;
    isDirect = false;
    sendingEnrollmentState: any;
    tempStateName: any;
    directStateSet = false;
    situsStateGAAbbr = "GA";
    producerNYLicenseForNonNYCustomer = false;
    stateList: string[];
    hybridUserPermission: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.placeholderSelect",
        "primary.portal.enrollmentMethod.requireMinEmp",
        "primary.portal.enrollmentMethod.step1",
        "primary.portal.enrollmentMethod.number",
        "primary.portal.shoppingExperience.header",
        "primary.portal.common.close",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.enrollmentMethod.notPermittedForEnrollment",
        "primary.portal.situsState.non-nyGroupMessage",
        "primary.portal.situsState.nyGroupMessage",
        "primary.portal.enrollmentMethod.nyGroupProducerNotLicensedInNY",
        "primary.portal.enrollmentMethod.usGroupProducerLicensedOnlyInNY",
        "primary.portal.enrollmentMethod.producerNotLicensedInEmployeeState",
        "primary.portal.enrollmentMethod.producerNotLicensedInCustomerState",
        "primary.portal.enrollmentMethod.eFinancialProducerNotLicensedInPR",
        "primary.portal.enrollmentMethod.eFinancialProducerNotLicensedInVI",
        "primary.portal.enrollmentMethod.eFinancialProducerNotLicensedInGU",
        "primary.portal.enrollmentMethod.Headset",
        "primary.portal.enrollmentMethod.shoppingMethod",
        "primary.portal.quoteShop.plansDisplay.crossBorderRestriction",
        "primary.portal.enrollmentMethod.missingEAAWarning",
        "primary.portal.enrollmentMethod.pinSignature",
        "primary.portal.enrollmentMethod.producerLicensedOnlyInNY",
        "primary.portal.enrollmentMethod.virtualFaceToFace",
        "primary.portal.enrollmentMethod.virtualFaceToFace.webexText",
        "primary.portal.enrollmentMethod.virtualFaceToFace.webexLink",
        "primary.portal.callCenter.8x8.form.alert.cannotEnrollDisability",
        "primary.portal.8x8.form.alert.addPinSignatureException",
    ]);
    employeeListConst = "EMPLOYEELIST";
    portal: string;
    isDisable = false;
    methodChangeNYacc: boolean;
    methodChangeNonNYAcc = false;
    isSpinnerLoading = false;
    private readonly unsubscribe$ = new Subject<void>();
    homeState: any;
    genericUserState: string;
    isNYGroupProducerNotLicensedInNY = false;
    isUSGroupProducerNotLicensedInUS = false;
    isProducerNotLicensedInEmployeeState = false;
    isProducerNotLicensedInCustomerState = false;
    producerNonNYCustomerNonNY = false;
    producerOnlyNYCustomerNonNY = false;
    producerId: number;
    crossBorderRules: CrossBorderRule[] = [];
    subscriptions: Subscription[] = [];
    eaaResponse: EAAResponse;
    disableNext = false;
    allowCrossBorderCheck = false;
    producerLicensedStates: CountryState[] = [];
    pinConfig: boolean;
    PIN_SIGNATURE_CONFIG = "broker.create.pin_signature_exception";
    isDirectDisablePR = false;
    isDirectClearlinkStateError = false;
    isDirectDisableClearlinkPR = false;
    isDirectDisableClearlinkVI = false;
    isDirectDisableClearlinkGU = false;
    isProducerPortal: boolean;
    isVirtualF2FInfoDisplay = false;
    showWebexWarning = false;
    webexMeetingLink: string;
    readonly VIRTUAL_FACE_TO_FACE_ENABLED = ConfigName.VIRTUAL_FACE_TO_FACE_ENABLED;
    companyCode: string;
    isInvalidCity = false;
    displayNyMsg = false;
    account$: Observable<Account>;

    // Shows disability enrollment info message based on selected enrollment method.
    callCenter8x8DisabilityRestricted$: Observable<boolean> = this.store.select(AccountListState).pipe(
        switchMap((accountDetails) =>
            this.exceptionBusinessService.callCenter8x8DisabilityRestricted(
                accountDetails.selectedGroup.id,
                ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ENABLED,
                ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_MIN_EMPLOYEES,
                ConfigName.CALL_CENTER_8X8_TRANSMITTAL_ALLOWED,
                this.staticUtilService,
                accountDetails.selectedGroup.employeeCount,
            ),
        ),
        map(({ callCenterDisabilityEnrollmentRestricted }) => callCenterDisabilityEnrollmentRestricted),
        tap((disabilityRestricted) => this.store.dispatch(new Set8x8CallCenterDisabilityRestriction(disabilityRestricted))),
        shareReplay(1),
    );

    disabilityEnrollmentRestrictionInfo$ = defer(() =>
        combineLatest([
            this.staticUtilService.cacheConfigValue(ConfigName.CALL_CENTER_8X8_TRANSMITTAL_DISABILITY_SUPPORT_EMAIL),
            this.callCenter8x8DisabilityRestricted$,
            this.enrollmentForm.controls.enrollmentMethod.valueChanges,
        ]).pipe(
            map(
                ([callCenterDisabilitySupportEmail, callCenterDisabilityEnrollmentRestricted, enrollmentMethod]) =>
                    (enrollmentMethod === EnrollmentMethod.CALL_CENTER &&
                        callCenterDisabilityEnrollmentRestricted && {
                            callCenterDisabilityEnrollmentRestricted,
                            callCenterDisabilitySupportEmail,
                        }) ||
                    null,
            ),
            finalize(() => {
                this.isSpinnerLoading = false;
            }),
        ),
    );
    pinSignatureMethodSelected: boolean;

    constructor(
        private readonly sharedService: SharedService,
        private readonly staticService: StaticService,
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly router: Router,
        private readonly shoppingService: ShoppingService,
        private readonly fb: FormBuilder,
        private readonly EnrollmentDialogRef: MatDialogRef<EnrollmentMethodComponent>,
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly data: MpGroup,
        private readonly userService: UserService,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly titlecasePipe: TitleCasePipe,
        private readonly producerService: ProducerService,
        private readonly aflacService: AflacService,
        private readonly accountService: AccountService,
        private readonly accountUtilService: AccountUtilService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly staticUtilService: StaticUtilService,
        private readonly exceptionBusinessService: ExceptionBusinessService,
        private readonly ngrxStore: NGRXStore,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    /**
     * ngOnInit method for initialization of value on component load.
     */
    ngOnInit(): void {
        this.isSpinnerLoading = true;
        if (this.router.url.indexOf("direct") >= 0) {
            this.isDirect = true;
        }
        this.subscriptions.push(
            this.staticUtilService.cacheConfigEnabled("general.feature.enable.cross_border_sales_rule").subscribe((resp) => {
                this.allowCrossBorderCheck = resp;
            }),
        );
        this.getConfigForPinEnrollment();
        this.subscriptions.push(
            combineLatest(
                this.userService.credential$,
                this.staticUtilService.hasPermission(UserPermissionList.HYBRID_USER),
                this.staticUtilService.hasPermission(UserPermissionList.AFLAC_E_FINANCE),
                this.staticUtilService.hasPermission(UserPermissionList.AFLAC_CLEAR_LINK),
                this.staticUtilService.hasPermission(UserPermissionList.AFLAC_STRIDE_LIFE_QUOTE),
            ).subscribe(
                ([credential, hybridUserPermission, aflacEFinance, aflacClearLink, aflacStrideLifeQuote]: [
                    ProducerCredential,
                    boolean,
                    boolean,
                    boolean,
                    boolean,
                ]) => {
                    if (aflacEFinance) {
                        this.isEfinancialAgent = true;
                    } else if (aflacClearLink) {
                        this.isClearlinkAgent = true;
                    } else if (aflacStrideLifeQuote) {
                        this.isStrideAgent = true;
                    }

                    if (credential.producerId && credential.callCenterId) {
                        if (hybridUserPermission) {
                            this.isHybridUser = true;
                        } else {
                            this.isCallCenterAgent = true;
                        }
                    }
                    this.producerId = credential.producerId;
                },
            ),
        );
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isProducerPortal = Boolean(this.portal === PortalType.PRODUCER);
        this.portal = "/" + this.portal.toLowerCase();
        this.tempStateAbbr = this.data.stateAbbr;
        this.details = this.data.detail;
        if (this.details) {
            this.memberId = this.data.detail.id;
        }
        if (this.isCallCenterAgent) {
            this.enrollmentForm = this.fb.group({
                enrollmentMethod: ["CALL_CENTER", Validators.required],
            });
        } else {
            this.enrollmentForm = this.fb.group({
                enrollmentMethod: ["FACE_TO_FACE", Validators.required],
                state: this.filterState,
                city: this.filterCity,
            });
        }
        if (this.isEfinancialAgent) {
            this.enrollmentForm = this.fb.group({
                enrollmentMethod: ["HEADSET", Validators.required],
            });
        }

        if (this.isEfinancialAgent || this.isStrideAgent || this.isClearlinkAgent) {
            this.enrollmentForm = this.fb.group({
                enrollmentMethod: ["HEADSET", Validators.required],
            });
        }

        if (this.memberId) {
            this.isGenericUser = false;
        } else {
            this.isGenericUser = true;
        }
        if (this.headSet || this.isCallCenter) {
            this.statePrepopulated = false;
        } else {
            this.statePrepopulated = true;
        }
        this.subscriptions.push(
            forkJoin([
                this.producerService.getProducerInformation(this.producerId.toString()),
                this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.data.mpGroup.toString()),
                this.aflacService.getCrossBorderRules(this.data.mpGroup, this.memberId),
                !this.isCallCenterAgent && !this.isDirect
                    ? this.benefitsOfferingService.getBenefitOfferingSettings(this.data.mpGroup)
                    : of({ states: [] }),
                this.accountService.getGroupAttributesByName(["company_code"], this.data.mpGroup).pipe(take(1)),
            ]).subscribe(
                ([producerInfoResp, memberContactResp, crossBorderRulesResp, benefitsOfferedStates, companyCodeResp]) => {
                    this.companyCode = companyCodeResp[0] ? companyCodeResp[0].value : undefined;
                    this.handleProducerInformation(producerInfoResp, benefitsOfferedStates.states);
                    this.crossBorderRules = crossBorderRulesResp;
                    if (memberContactResp) {
                        this.homeState = memberContactResp.body.address.state;
                        if (this.isEfinancialAgent && this.homeState === PR_STATE) {
                            this.isDirectDisablePR = true;
                        } else if (
                            this.isClearlinkAgent &&
                            (this.homeState === PR_STATE || this.homeState === VI_STATE || this.homeState === GU_STATE)
                        ) {
                            this.isDirectClearlinkStateError = true;

                            switch (this.homeState) {
                                case PR_STATE:
                                    this.isDirectDisableClearlinkPR = true;
                                    break;

                                case VI_STATE:
                                    this.isDirectDisableClearlinkVI = true;
                                    break;

                                case GU_STATE:
                                    this.isDirectDisableClearlinkGU = true;
                                    break;
                            }
                        }
                        this.handleMemberContact();
                    }
                    this.setInitialStateValues();
                    if (!this.isGenericUser) {
                        this.headSetStateAbbr = this.homeState;
                        const tempState = this.states.find((state) => state.abbreviation === this.homeState);
                        if (tempState) {
                            this.headSetState = tempState.name;
                        }
                    }
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    // Customer Address not on File
                    this.setDefaultState(false);
                    this.setStateArray(false);
                    this.setInitialStateValues();
                    this.isSpinnerLoading = true;
                },
            ),
        );

        this.enrollmentSubscription = this.shoppingService.getEnrollmentMethods(this.data.mpGroup).subscribe(
            (enrollmentMethods: EnrollmentMethodDetail[]) => {
                if (this.isCallCenterAgent) {
                    this.cityDisplay = false;
                    this.stateDisplay = false;
                }
                if (this.isProducerPortal === undefined) {
                    this.isProducerPortal = Boolean(this.store.selectSnapshot(SharedState.portal) === PortalType.PRODUCER);
                }
                this.enrollMethods = this.isProducerPortal
                    ? enrollmentMethods.filter((enrollmentMethod) => enrollmentMethod.name !== "SELF_SERVICE")
                    : enrollmentMethods;
            },
            (error) => {
                if (error.error.code === "forbidden" && error.error.status === AppSettings.API_RESP_403) {
                    this.isDisable = true;
                }
            },
        );
        if (this.data.method === EnrollmentMethod.VIRTUAL_FACE_TO_FACE) {
            if (this.enrollmentForm.controls.city) {
                this.enrollmentForm.controls.city.clearValidators();
                this.enrollmentForm.controls.city.updateValueAndValidity();
            }
            if (this.enrollmentForm.controls.state) {
                this.enrollmentForm.controls.state.clearValidators();
                this.enrollmentForm.controls.state.updateValueAndValidity();
            }
            this.enrollmentForm.patchValue({ enrollmentMethod: EnrollmentMethod.VIRTUAL_FACE_TO_FACE });
            this.stateDisplay = false;
            this.cityDisplay = false;
            this.isVirtualF2FInfoDisplay = true;
        }
        if (this.enrollmentForm.controls.state) {
            this.optionSelectedState = this.enrollmentForm.controls.state.value;
        }
        this.selectedEnrollmentMethod = this.enrollmentForm.controls.enrollmentMethod.value;
        if (this.isGenericUser) {
            this.stepHeaderDisplay = true;
        }
    }
    /**
     * @description method to get config for pin signature enrollment
     * @memberof EnrollmentMethodComponent
     */
    getConfigForPinEnrollment(): void {
        this.subscriptions.push(
            this.staticUtilService.cacheConfigEnabled(this.PIN_SIGNATURE_CONFIG).subscribe((config) => {
                this.pinConfig = config;
            }),
        );
    }
    /**
     *@description method to handle Member contact response
     * @returns {void} It returns void
     * @memberof EnrollmentMethodComponent
     */
    handleMemberContact(): void {
        this.setDefaultState(true);
        if (this.allowCrossBorderCheck && this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.FACE_TO_FACE) {
            this.eaaResponse = this.accountUtilService.checkCrossBorderRules(this.defaultState, this.crossBorderRules);
        }
        this.setStateArray(true);
        if (
            this.homeState &&
            this.homeState !== this.situsStateNYAbbr &&
            this.tempStateAbbr === this.situsStateNYAbbr &&
            !(this.data.stateAbbr === this.situsStateNYAbbr && this.companyCode && this.companyCode === CompanyCode.US) &&
            !this.isDirect
        ) {
            this.methodChangeNYacc = true;
            this.enrollmentForm.controls.enrollmentMethod.disable();
        }
        if (this.homeState && this.homeState === this.situsStateNYAbbr && this.companyCode !== CompanyCode.NY && !this.isDirect) {
            this.methodChangeNonNYAcc = true;
            this.enrollmentForm.controls.enrollmentMethod.disable();
        }
        if (this.companyCode === CompanyCode.NY && this.homeState !== this.situsStateNYAbbr) {
            this.displayNyMsg = true;
        }

        if (
            !this.isDirect &&
            this.tempStateAbbr !== this.situsStateNYAbbr &&
            !this.states.some((state) => state.abbreviation === this.homeState)
        ) {
            this.isProducerNotLicensedInEmployeeState = true;
            this.sharedService.changeProducerNotLicensedInEmployeeState(true);
            this.enrollmentForm.controls.enrollmentMethod.disable();
            if (!(this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.FACE_TO_FACE)) {
                this.enrollmentForm.patchValue({ enrollmentMethod: EnrollmentMethod.FACE_TO_FACE });
                this.enrollmentForm.controls.state.setValidators([Validators.required]);
                this.enrollmentForm.controls.city.setValidators([Validators.required]);
                this.enrollmentForm.updateValueAndValidity({ emitEvent: false });
                this.stateDisplay = true;
                this.cityDisplay = true;
                this.isVirtualF2FInfoDisplay = false;
            }
        } else {
            this.isProducerNotLicensedInEmployeeState = false;
            this.sharedService.changeProducerNotLicensedInEmployeeState(false);
        }
        // For direct customers
        this.producerNotLicensedInCustomerState();
        this.producerLicensedInCustomerState();
    }
    /**
     * This method consists of conditional checks for cases where the producer does not have license in customer states
     */
    producerNotLicensedInCustomerState(): void {
        const stateLength = 1;
        if (this.isDirect && !this.states.some((state) => state.abbreviation === this.homeState)) {
            if (this.isEfinancialAgent || this.isStrideAgent || this.isClearlinkAgent) {
                this.isProducerNotLicensedInCustomerState = true;
                this.sharedService.changeProducerNotLicensedInCustomerState(true);
                this.enrollmentForm.controls.enrollmentMethod.disable();
            } else if (
                this.homeState !== this.situsStateNYAbbr &&
                !this.states.some((state) => state.abbreviation !== this.situsStateNYAbbr)
            ) {
                // MON-47599 Customer state is US and producer doesn't have any US license
                this.producerOnlyNYCustomerNonNY = true;
                this.enrollmentForm.controls.state.disable();
                this.enrollmentForm.controls.city.disable();
                this.enrollmentForm.controls.enrollmentMethod.disable();
                this.disableNext = true;
            } else if (this.homeState !== this.situsStateNYAbbr) {
                // MON-47617
                this.states.forEach((state) => {
                    if (state.abbreviation.includes(this.situsStateNYAbbr) && this.states.length > stateLength) {
                        this.setStateArray(true);
                    } else {
                        this.producerNYLicenseForNonNYCustomer = false;
                    }
                });
                this.producerNonNYCustomerNonNY = true;
                this.enrollmentForm.controls.enrollmentMethod.disable();
            } else if (
                this.homeState === this.situsStateNYAbbr &&
                !this.states.some((state) => state.abbreviation === this.situsStateNYAbbr)
            ) {
                // Customer state is NY and producer doesn't have NY license
                this.isProducerNotLicensedInCustomerState = true;
                this.enrollmentForm.controls.state.disable();
                this.enrollmentForm.controls.city.disable();
                this.enrollmentForm.controls.enrollmentMethod.disable();
                this.statePrepopulated = false;
                this.filterState.setValue("");
                this.enrollmentForm.controls.state.setValue("");
            }
            this.sharedService.changeProducerNotLicensedInCustomerState(true);
        }
    }
    /**
     * This method consists of conditional checks for cases where the producer has license in customer states
     */
    producerLicensedInCustomerState(): void {
        if (this.isDirect && this.states.some((state) => state.abbreviation === this.homeState)) {
            if (this.isEfinancialAgent || this.isStrideAgent || this.isClearlinkAgent) {
                this.isProducerNotLicensedInCustomerState = false;
                this.sharedService.changeProducerNotLicensedInCustomerState(false);
            } else if (
                this.homeState === this.situsStateNYAbbr &&
                this.states.some((state) => state.abbreviation === this.situsStateNYAbbr)
            ) {
                // MON-47648
                // MON-75404/MON-75898 While setting default value, formValue changes/ filterOptions should not be triggered
                this.filterState.setValue(this.homeState, { emitEvent: false });
                this.getStateOptionSelected(this.homeState);
                if (this.enrollmentForm.controls.state) {
                    this.enrollmentForm.controls.state.disable();
                }
                this.directStateSet = true;
                this.statePrepopulated = true;
            } else {
                if (
                    !this.states.some((state) => state.abbreviation !== this.situsStateNYAbbr) &&
                    !(this.homeState === this.situsStateNYAbbr)
                ) {
                    this.getStateOptionSelected(this.homeState);
                }
                this.isProducerNotLicensedInCustomerState = false;
                this.sharedService.changeProducerNotLicensedInCustomerState(false);
                // MON-75404/MON-75898 While setting default value, formValue changes/ filterOptions should not be triggered
                this.filterState.setValue(this.homeState, { emitEvent: false });
                this.directStateSet = true;
                this.statePrepopulated = true;
                this.stateList = this.stateToCompare;
            }
        }
    }
    /**
     *@description method to handle producer information response
     * @param {ProducerInformation} resp is mandatory and used to check license state
     * @param {CountryState} offeredStates is mandatory and used to check states selected in benefits offering
     * @returns {void} returns void
     * @memberof EnrollmentMethodComponent
     */
    handleProducerInformation(resp: ProducerInformation, offeredStates: CountryState[]): void {
        if (this.isDirect || this.isCallCenterAgent) {
            this.states = resp.licenses.map((license) => license.state);
        } else {
            this.producerLicensedStates = resp.licenses.map((license) => license.state);
            this.states = offeredStates.filter((state) =>
                this.producerLicensedStates.some((producerState) => state.abbreviation === producerState.abbreviation),
            );
        }

        this.disableNext = this.states.length === 0;
        this.states.sort((state1, state2) => (state1.abbreviation < state2.abbreviation ? -1 : 1));
        if (
            this.tempStateAbbr !== this.situsStateNYAbbr &&
            !this.states.some((state) => state.abbreviation === this.tempStateAbbr) &&
            this.companyCode !== CompanyCode.NY
        ) {
            this.statePrepopulated = false;
            this.tempStateAbbr = "";
        }
        // Checks licenses for non-direct based on account company code
        if (!this.isDirect) {
            // Block enrollments for NY accounts without NY state license
            if (!this.states.some((state) => state.abbreviation === this.situsStateNYAbbr) && this.companyCode === CompanyCode.NY) {
                this.isNYGroupProducerNotLicensedInNY = true;
                this.enrollmentForm.controls.enrollmentMethod.disable();
                this.enrollmentForm.controls.state.disable();
                this.enrollmentForm.controls.city.disable();
            }

            // Block enrollments for US accounts without any US state license
            if (!this.states.some((state) => state.abbreviation !== this.situsStateNYAbbr) && this.companyCode !== CompanyCode.NY) {
                this.isUSGroupProducerNotLicensedInUS = true;
                this.enrollmentForm.controls.enrollmentMethod.disable();
                this.statePrepopulated = false;
                this.enrollmentForm.controls.state.disable();
                this.enrollmentForm.controls.city.disable();
            }
        }
    }

    setDefaultState(isCustomerAddressOnFile: boolean): void {
        if (this.isDirect) {
            if (isCustomerAddressOnFile && this.states.some((state) => state.abbreviation === this.homeState)) {
                this.defaultState = this.homeState;
            } else if (this.tempStateAbbr === this.situsStateNYAbbr) {
                this.defaultState = this.situsStateNYAbbr;
            } else {
                this.defaultState = "";
            }
        } else if (
            this.statePrepopulated &&
            !(this.data.stateAbbr === this.situsStateNYAbbr && this.companyCode && this.companyCode === CompanyCode.US)
        ) {
            // Payroll and has license in Situs state
            this.defaultState = this.companyCode === CompanyCode.NY ? this.companyCode : this.tempStateAbbr;
        } else if (this.statePrepopulated && this.companyCode === CompanyCode.US && this.homeState === this.situsStateNYAbbr) {
            // Payroll and no license in Situs state
            this.defaultState = this.situsStateGAAbbr;
        } else {
            this.defaultState = "";
        }
    }
    /**
     * This method is used to pre populate the state value field on page load
     */
    setInitialStateValues(): void {
        if (!this.directStateSet) {
            this.filterState.setValue("");
        }
        if (this.statePrepopulated) {
            if (this.enrollmentForm.controls.state) {
                // MON-75404/MON-75898 While setting default value, formValue changes/ filterOptions should not be triggered
                this.enrollmentForm.controls.state.setValue(this.defaultState, { emitEvent: false });
            }
            if (this.enrollmentForm.controls.state && this.enrollmentForm.controls.state.value === this.situsStateNYAbbr) {
                this.enrollmentForm.controls.state.disable();
            }
            this.tempStateAbbr = this.defaultState;
            if (this.tempStateAbbr) {
                this.getCity();
            }
        }
        const tempState = this.states.find(
            (state) => this.enrollmentForm.controls["state"] && state.abbreviation === this.enrollmentForm.controls["state"].value,
        );
        if (tempState) {
            this.stateAbbreviation = tempState.abbreviation;
        }
    }
    /**
     *This method is used set the value of state array during component initialization
     *@param isCustomerAddressOnFile is a boolean value based on which various conditions are executed
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
            } else if (this.homeState === this.situsStateNYAbbr) {
                // Customer Address on file in NY
                this.stateArray.push(this.situsStateNY);
                this.stateToCompare.push(this.situsStateNYAbbr);
                this.store.dispatch(new SetEnrollmentStateArray([{ name: this.situsStateNY, abbreviation: this.situsStateNYAbbr }]));
            } else if (this.producerNYLicenseForNonNYCustomer) {
                this.stateArray.push(this.situsStateNY);
                this.stateToCompare.push(this.situsStateNYAbbr);
            } else {
                // Customer Address on file in non-NY
                this.stateArray = this.states.filter((state) => state.abbreviation !== this.situsStateNYAbbr).map((state) => state.name);
                this.stateToCompare = this.states
                    .filter((state) => state.abbreviation !== this.situsStateNYAbbr)
                    .map((state) => state.abbreviation);
                this.store.dispatch(
                    new SetEnrollmentStateArray(this.states.filter((state) => state.abbreviation !== this.situsStateNYAbbr)),
                );
            }
        } else if (
            this.tempStateAbbr !== this.situsStateNYAbbr ||
            (this.tempStateAbbr === this.situsStateNYAbbr &&
                this.data.stateAbbr === this.situsStateNYAbbr &&
                this.companyCode &&
                this.companyCode === CompanyCode.US)
        ) {
            // Payroll Employee US Group
            this.stateArray = this.states.filter((state) => state.abbreviation !== this.situsStateNYAbbr).map((state) => state.name);
            this.stateToCompare = this.states
                .filter((state) => state.abbreviation !== this.situsStateNYAbbr)
                .map((state) => state.abbreviation);
            this.store.dispatch(new SetEnrollmentStateArray(this.states.filter((state) => state.abbreviation !== this.situsStateNYAbbr)));
        } else {
            // Payroll Employee NY Group
            this.stateArray.push(this.situsStateNY);
            this.stateToCompare.push(this.situsStateNYAbbr);
            this.store.dispatch(new SetEnrollmentStateArray([{ name: this.situsStateNY, abbreviation: this.situsStateNYAbbr }]));
        }
    }

    private filteredState(value: string): string[] {
        const filterValue = value.toLowerCase();

        return this.stateToCompare.filter((option) => option.toLowerCase().indexOf(filterValue) === 0);
    }
    private filteredCity(value: string): string[] {
        if (this.citiesRes) {
            const filterValue = value.toLowerCase();
            return this.citiess.filter((option) => option.toLowerCase().indexOf(filterValue) === 0);
        }
        return [];
    }

    /**
     * @description method to change the state and city dropdown values and handle cross border check
     * @param enrollmentState used to pass user selected state
     * @memberof EnrollmentMethodComponent
     */
    getStateOptionSelected(enrollmentState: string): void {
        this.selectedEnrollmentState = enrollmentState;
        if (this.enrollmentForm.controls.city && this.enrollmentForm.controls.city.value.length) {
            this.enrollmentForm.controls.city.setValue("");
        }
        if (this.enrollmentForm.controls.state) {
            this.enrollmentForm.controls.state.setValue(this.selectedEnrollmentState);
            this.getStateAbbr();
            this.disableAutoComplete();
        }
        if (this.allowCrossBorderCheck && this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.FACE_TO_FACE) {
            this.eaaResponse = this.accountUtilService.checkCrossBorderRules(this.selectedEnrollmentState, this.crossBorderRules);
        }
    }
    getStateAbbr(): void {
        this.tempStateAbbr = this.states
            .filter((item) => item.abbreviation === this.enrollmentForm.controls["state"].value)
            .map((item) => item.abbreviation);
        if (this.tempStateAbbr) {
            this.stateAbbreviation = this.tempStateAbbr[0];
            this.getCity();
        }
    }

    /**
     * This method is used to clear city dropdown values when the user changes the state value.
     */
    removeCity(): void {
        this.eaaResponse.isMissingEAAError = false;
        this.eaaResponse.isMissingEAAWarning = false;
        const index = this.stateToCompare.indexOf(this.matStateInput.nativeElement.value);
        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (index === -1 && this.enrollmentForm.controls["city"].value.length) {
            this.enrollmentForm.controls.city.setValue("");
        }
        this.disableAutoComplete();
    }

    /**
     * This method is used to clear state dropdown text value when the user enters an invalid state.
     */
    removeStateText(): void {
        // setTimeout to load data for prepopulating the form
        setTimeout(() => {
            const index = this.stateToCompare.find((state) => state.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase());
            const typedValue = this.stateToCompare.find(
                (item) => item.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase(),
            );
            if (index && typedValue.toLowerCase() === this.matStateInput.nativeElement.value.toLowerCase()) {
                this.enrollmentForm.controls["state"].setValue(typedValue);
                this.filterState.setValue(typedValue);
                this.getStateAbbr();
                this.getStateOptionSelected(typedValue);
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else if (index === undefined || this.matStateInput.nativeElement.value !== this.enrollmentForm.controls["state"].value) {
                this.matStateInput.nativeElement.value = "";
                this.enrollmentForm.controls.state.setValue("");
                if (this.statePrepopulated) {
                    this.filterState.setValue(this.defaultState);
                } else {
                    this.filterState.setValue("");
                }
                this.matCityInput.nativeElement.value = "";
                this.enrollmentForm.controls.city.setValue("");
                this.filterCity.setValue("");
                this.disableAutoComplete();
            }
        }, 250);
    }

    /**
     * @description function to get the selected city from dropdown
     * @param event selected city
     */
    getCityOptionSelected(event: string): void {
        this.isInvalidCity = false;
        this.selectedEnrollmentCity = event;
        this.enrollmentForm.controls.city.setValue(this.selectedEnrollmentCity);
        this.matCityInput.nativeElement.value = this.selectedEnrollmentCity;
    }

    /**
     * @description This method is used to clear city dropdown text value when the user enters an invalid city.
     */
    removeCityText(): void {
        // setTimeout to load data for prepopulating the form
        setTimeout(() => {
            const index = this.citiess.find((city) => city.toLowerCase() === this.matCityInput.nativeElement.value.toLowerCase());
            const typedValue = this.citiess.find((item) => item.toLowerCase() === this.matCityInput.nativeElement.value.toLowerCase());
            if (index && typedValue.toLowerCase() === this.matCityInput.nativeElement.value.toLowerCase()) {
                this.enrollmentForm.controls.city.setValue(typedValue);
                this.filterCity.setValue(typedValue);
                this.isInvalidCity = false;
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else if (index === undefined || this.matCityInput.nativeElement.value !== this.enrollmentForm.controls["city"].value) {
                this.matCityInput.nativeElement.value = "";
                this.enrollmentForm.controls.city.setValue("");
                this.filterCity.setValue("");
            }
        }, 250);
    }

    /**
     * @description To capture the valid city typed by user
     */
    captureTypedCity(): void {
        const typedValue = this.citiess.find((item) => item === this.matCityInput.nativeElement.value);
        this.isInvalidCity = !typedValue;
        if (typedValue === this.matCityInput.nativeElement.value) {
            this.enrollmentForm.controls.city.setValue(typedValue);
            this.filterCity.setValue(typedValue);
        }
    }
    /**
     * This method is triggered whenever there is change in the enrollment method
     * @param enrollmentType is the event triggered from the HTML which contains the type of enrollment selected
     */
    changeEnrollment(enrollmentType: any): void {
        this.pinSignatureMethodSelected = false;
        const enrollmentMethodsArray = [
            this.headsetAPIValue,
            EnrollmentMethod.CALL_CENTER,
            EnrollmentMethod.PIN_SIGNATURE,
            EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
        ];
        if (enrollmentMethodsArray.includes(enrollmentType.value)) {
            this.headSet = true;
            this.isCallCenter = true;
            if (this.enrollmentForm.controls.city) {
                this.enrollmentForm.controls.city.clearValidators();
                this.enrollmentForm.controls.city.updateValueAndValidity();
            }
            if (this.enrollmentForm.controls.state) {
                this.enrollmentForm.controls.state.clearValidators();
                this.enrollmentForm.controls.state.updateValueAndValidity();
            }
            this.stateDisplay = false;
            this.cityDisplay = false;
            if (this.eaaResponse) {
                this.eaaResponse.isMissingEAAError = false;
                this.eaaResponse.isMissingEAAWarning = false;
            }
            this.isVirtualF2FInfoDisplay = enrollmentType.value === EnrollmentMethod.VIRTUAL_FACE_TO_FACE;
            this.showWebexWarning = false;
            this.pinSignatureMethodSelected = enrollmentType.value === EnrollmentMethod.CALL_CENTER;
        } else {
            this.headSet = false;
            this.isCallCenter = false;
            this.cityDisplay = true;
            this.stateDisplay = true;
            if (this.statePrepopulated) {
                const stateValue = this.enrollmentForm.controls.state.value ? this.enrollmentForm.controls.state.value : this.defaultState;
                this.enrollmentForm.controls.state.setValue(stateValue);
                this.filterState.setValue(stateValue);
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
            this.isVirtualF2FInfoDisplay = false;
            this.showWebexWarning = false;
        }
        if (this.isGenericUser && (this.headSet || this.isCallCenter)) {
            this.statePrepopulated = false;
            this.filterState.setValue("");
            this.enrollmentForm.controls.state.setValue("");
        }
        this.handleMemberContact();
    }
    closePopup(): void {
        this.EnrollmentDialogRef.close({ action: "close" });
    }
    /**
     * This method is used to close enrollment dialog
     * @return data from the closed confirm address dialog
     */
    close(): Observable<void | [HttpResponse<void>, void]> {
        let observableToReturn: Observable<void | [HttpResponse<void>, void]>;
        if (this.isGenericUser) {
            this.showEnrollmentInfoPopup = true;
        } else {
            this.EnrollmentDialogRef.close();
            observableToReturn = this.openConfirmAddressDialogForEnroll();
        }
        return observableToReturn;
    }
    replaceUnderscore(method: string): string {
        if (method === EnrollmentMethod.HEADSET) {
            method = this.languageStrings["primary.portal.enrollmentMethod.Headset"];
        } else if (method === EnrollmentMethod.PIN_SIGNATURE) {
            method = this.languageStrings["primary.portal.enrollmentMethod.pinSignature"];
        } else if (method !== EnrollmentMethod.CALL_CENTER) {
            method = method.replace(/_/g, "-");
            method = this.titlecasePipe.transform(method);
        } else {
            method = "Call center";
        }
        return method;
    }
    /**
     * This method is Used to set/remove city/state or fetch config value based on enrollment menthods
     * @returns void
     */
    checkMethodAndSubmit(): void {
        if (this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.VIRTUAL_FACE_TO_FACE) {
            this.isSpinnerLoading = true;
            this.aflacService
                .getWebexConnectionAndLicenseStatus(this.data.mpGroup, this.memberId)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    switchMap((res: WebexConnectInfo) => {
                        if (res.meetingId) {
                            return this.quoteShop();
                        }
                        this.showWebexWarning = true;
                        this.isVirtualF2FInfoDisplay = false;
                        return this.sharedService.fetchWebexConfig();
                    }),
                    filter(() => this.showWebexWarning),
                    tap((resp: string) => {
                        this.webexMeetingLink = resp;
                    }),
                    finalize(() => (this.isSpinnerLoading = false)),
                )
                .subscribe();
        } else {
            this.quoteShop().pipe(first()).subscribe();
        }
    }
    /**
     *
     * @description Used to set/remove city/state based on enrollment menthods
     * @returns data from the closed confirm address dialog
     */
    // eslint-disable-next-line complexity
    quoteShop(): Observable<[HttpResponse<void>, void] | void> {
        let observableToReturn: Observable<[HttpResponse<void>, void] | void>;
        if (this.enrollmentForm.invalid) {
            this.fieldErrorFlag = true;
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            this.fieldErrorFlag = false;
            if (
                // eslint-disable-next-line max-len
                this.enrollmentForm.controls["enrollmentMethod"].value === this.facetoFaceAPIValue &&
                (this.matStateInput.nativeElement.value !== this.enrollmentForm.controls["state"].value ||
                    this.matCityInput.nativeElement.value !== this.enrollmentForm.controls["city"].value)
            ) {
                this.removeCityText();
                this.removeStateText();
                // eslint-disable-next-line sonarjs/no-collapsible-if
            } else {
                if (
                    this.enrollmentForm.controls.enrollmentMethod.value === this.headsetAPIValue ||
                    this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.VIRTUAL_FACE_TO_FACE
                ) {
                    observableToReturn = this.close();
                } else if (this.isCallCenterError && this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.CALL_CENTER) {
                    // NO ACTION: For user since Census is not uploaded
                } else if (
                    (this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.CALL_CENTER && !this.isCallCenterError) ||
                    this.enrollmentForm.controls.enrollmentMethod.value === EnrollmentMethod.PIN_SIGNATURE
                ) {
                    observableToReturn = this.close();
                } else {
                    // eslint-disable-next-line sonarjs/no-collapsible-if
                    if (!this.isGenericUser) {
                        if (this.data.detail.id) {
                            if (this.isDirect) {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `${this.portal}/direct/customers/${this.data.mpGroup}/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/`,
                                        +this.data.detail.id,
                                    ],
                                    {
                                        relativeTo: this.route,
                                        queryParamsHandling: "preserve",
                                    },
                                );
                                this.setStateValues();
                                this.closePopup();
                            } else if (this.data.openingFrom === "dashboard") {
                                this.navigateToShop();
                            } else if (this.data.openingFrom === this.employeeListConst) {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `../../member/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`,
                                    ],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );

                                this.setStateValues();
                                this.closePopup();
                            } else if (this.data.openingFrom === "directCustomer") {
                                this.router.navigate([`enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail}`], {
                                    relativeTo: this.route,
                                });
                                this.setStateValues();
                                this.closePopup();
                            } else if (this.data.openingFrom === COVERAGE_SUMMARY) {
                                this.navigateToShop();
                            } else if (this.data.openingFrom === LIFE_EVENT) {
                                this.navigateToShop();
                            } else {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `${this.portal}/payroll/${this.data.mpGroup}/member/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`,
                                    ],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );
                                this.setStateValues();
                                this.closePopup();
                            }
                        }
                        // eslint-disable-next-line sonarjs/no-collapsible-if
                    } else {
                        if (this.isDirect) {
                            this.router.navigate([`${this.portal}/direct/enrollment/quote-shop/${this.data.mpGroup}/generic`], {
                                relativeTo: this.route,
                            });
                            this.setStateValues();
                            this.closePopup();
                        } else {
                            this.router.navigate(
                                [
                                    // eslint-disable-next-line max-len
                                    `${this.portal}/payroll/${this.data.mpGroup}/employees/enrollment/quote-shop/${this.data.mpGroup}/generic`,
                                ],
                                {
                                    relativeTo: this.data.route,
                                },
                            );
                            this.setStateValues();
                            this.closePopup();
                        }
                    }
                }
            }
        }
        return observableToReturn;
    }

    /**
     * This method is used to navigate to the shop page
     * @returns void
     */

    navigateToShop(): void {
        // eslint-disable-next-line max-len
        const url = `/producer/payroll/${this.data.mpGroup}/member/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`;
        this.router
            .navigateByUrl(`/producer/payroll/${this.data.mpGroup}/member/${this.data.detail.id}`, {
                skipLocationChange: true,
            })
            .then(() => this.router.navigate([url]));
        this.setStateValues();
        this.closePopup();
    }
    getCity(): void {
        this.citySubscription = this.staticService.getCities(this.tempStateAbbr).subscribe((res) => {
            this.citiess = res;
            this.citiesRes = true;
            this.filterCityMethod();
        });
    }
    /**
     * Lifecycle method which gets called after the component's view has been initialized.
     */
    ngAfterContentInit(): void {
        this.citiess = [];
        if (this.stateToCompare) {
            this.filteredStateOptions = this.filterState.valueChanges.pipe(
                startWith(""),
                map((value) => (value ? this.filteredState(value) : this.stateToCompare.slice())),
            );
            this.subscriptions.push(
                this.filteredStateOptions.subscribe((res) => {
                    this.stateList = res;
                }),
            );
        }
        this.filterCityMethod();
    }
    filterCityMethod(): void {
        this.filteredCityOptions = this.filterCity.valueChanges.pipe(
            startWith(""),
            map((value) => (value ? this.filteredCity(value) : this.citiess.slice())),
        );
    }
    /**
     * In this method we are storing values where we are navigated, whether it Ole shop or Qle
     * shop
     */
    setStateValues(): void {
        if (this.data.openingFrom === LIFE_EVENT) {
            this.store.dispatch(new SelectedShop(DualPlanYearSettings.QLE_SHOP));
        }
        let userType = this.userTypeSpecific;
        let memberId = this.memberId;
        if (this.isGenericUser) {
            userType = this.userTypeGeneric;
            memberId = null;
        }

        this.tempStateName = this.states
            .filter((item) => item.abbreviation === this.enrollmentForm.controls["state"].value)
            .map((item) => item.name);
        if (this.tempStateName) {
            this.sendingEnrollmentState = this.tempStateName[0];
        }
        this.store.dispatch(
            new SetEnrollmentMethodSpecific({
                enrollmentMethod: this.enrollmentForm.controls["enrollmentMethod"].value,
                enrollmentState: this.sendingEnrollmentState,
                headSetState: this.headSetState,
                headSetStateAbbreviation: this.headSetStateAbbr,
                enrollmentStateAbbreviation: this.stateAbbreviation,
                enrollmentCity: this.enrollmentForm.controls["city"].value,
                userType: userType,
                memberId: memberId,
                mpGroup: this.data.mpGroup,
            }),
        );
    }
    disableAutoComplete(): void {
        const typedValue = this.stateToCompare.find((item) => item === this.matStateInput.nativeElement.value);
        if (typedValue === this.matStateInput.nativeElement.value) {
            this.enrollmentForm.controls.state.setValue(typedValue);
            this.filterState.setValue(typedValue);
        }
        if (this.enrollmentForm.controls["state"].value && this.enrollmentForm.controls["state"].value.length > 0) {
            this.enrollmentForm.controls["city"].enable();
        } else {
            this.enrollmentForm.controls["city"].disable();
        }
    }
    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        if (this.stateSubscription !== undefined) {
            this.stateSubscription.unsubscribe();
        }
        if (this.citySubscription !== undefined) {
            this.citySubscription.unsubscribe();
        }
        if (this.memberSubscription !== undefined) {
            this.memberSubscription.unsubscribe();
        }
        if (this.enrollmentSubscription !== undefined) {
            this.enrollmentSubscription.unsubscribe();
        }
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    /**
     *
     * @description Opens dialog box to confirm employees address and record consent
     * @memberof EnrollmentMethodComponent
     * @return data from the closed confirm address dialog
     */
    openConfirmAddressDialogForEnroll(): Observable<[HttpResponse<void>, void] | void> {
        let observableToReturn = of(null);
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: {
                memberId: this.memberId,
                mpGroup: this.data.mpGroup,
                purpose: "enroll",
                method: this.enrollmentForm.controls["enrollmentMethod"].value,
            },
        });
        observableToReturn = confirmAddressDialogRef.afterClosed().pipe(
            tap((result) => {
                if (result.action === "enrollmentSuccess") {
                    if (!this.isGenericUser) {
                        if (this.data.detail.id) {
                            if (this.isDirect) {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `${this.portal}/direct/customers/${this.data.mpGroup}/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`,
                                    ],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );
                            } else if (this.data.openingFrom === "dashboard") {
                                this.router.navigate([`enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`], {
                                    relativeTo: this.data.route,
                                });
                            } else if (this.data.openingFrom === this.employeeListConst) {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `../../member/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`,
                                    ],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );
                            } else if (this.data.openingFrom === COVERAGE_SUMMARY) {
                                this.router.navigate(
                                    [`../../../enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );
                            } else if (this.data.openingFrom === LIFE_EVENT) {
                                this.router.navigate([`../../enrollment/quote-shop/${this.data.mpGroup}/specific/`, +this.data.detail.id], {
                                    relativeTo: this.data.route,
                                });
                            } else if (this.data.openingFrom === NEW_EMPLOYEE) {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `${this.portal}/payroll/${this.data.mpGroup}/member/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/`,
                                        +this.data.detail.id,
                                    ],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );
                            } else {
                                this.router.navigate(
                                    [
                                        // eslint-disable-next-line max-len
                                        `${this.portal}/payroll/${this.data.mpGroup}/employees/enrollment/quote-shop/${this.data.mpGroup}/specific/`,
                                        +this.data.detail.id,
                                    ],
                                    {
                                        relativeTo: this.data.route,
                                    },
                                );
                            }
                        }
                        this.setStateValuesForEnroll(result);
                        // eslint-disable-next-line sonarjs/no-collapsible-if
                    } else {
                        if (this.isDirect) {
                            this.router.navigate([`${this.portal}/direct/enrollment/quote-shop/${this.data.mpGroup}/generic`], {
                                relativeTo: this.data.route,
                            });
                        } else if (this.data.openingFrom === "dashboard") {
                            this.router.navigate([`enrollment/quote-shop/${this.data.mpGroup}/specific/${this.data.detail.id}`], {
                                relativeTo: this.data.route,
                            });
                            this.setStateValuesForEnroll(result);
                        } else {
                            this.router.navigate(
                                [
                                    // eslint-disable-next-line max-len
                                    `${this.portal}/payroll/${this.data.mpGroup}/member/${this.data.detail.id}/enrollment/quote-shop/${this.data.mpGroup}/specific/`,
                                    +this.data.detail.id,
                                ],
                                {
                                    relativeTo: this.data.route,
                                },
                            );
                            this.setStateValuesForEnroll(result);
                        }
                    }
                }
            }),
        );
        return observableToReturn;
    }
    /**
     * set enrollment values required in loading shop page
     * @param addressResult address result from confirm address pop up
     */
    setStateValuesForEnroll(addressResult: AddressResult): void {
        let userType = this.userTypeSpecific;
        let memberId = this.memberId;
        if (this.isGenericUser) {
            userType = this.userTypeGeneric;
            memberId = null;
        }
        this.store.dispatch(
            new SetEnrollmentMethodSpecific({
                enrollmentMethod: this.enrollmentForm.controls["enrollmentMethod"].value,
                enrollmentState: addressResult.newState.name,
                headSetState: addressResult.newState.name,
                headSetStateAbbreviation: addressResult.newState.abbreviation,
                enrollmentStateAbbreviation: addressResult.newState.abbreviation,
                userType: userType,
                memberId: memberId,
                mpGroup: this.data.mpGroup,
                enrollmentCity: addressResult.newCity,
            }),
        );
    }
    onBackInfoModalClick(event: any): void {
        this.showEnrollmentInfoPopup = event;
    }

    /**
     * Navigates to the 'Enrollment options' page.
     */
    navigateToEnrollmentPage(): void {
        this.router.navigate([`/${this.portal}/payroll/${this.data.mpGroup}/dashboard/enrollment-options`]);
        this.close();
    }
}
