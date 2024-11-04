import { Component, OnInit, ViewChild, Inject, OnDestroy } from "@angular/core";
import { HttpResponse, HttpErrorResponse } from "@angular/common/http";
import { ActivatedRoute, Router } from "@angular/router";
import {
    MemberService,
    StaticService,
    CensusService,
    EmailTypes,
    AccountService,
    GenderDetails,
    MemberIdentifier,
    DependentContact,
    ValidateMemberProfile,
    MemberListDisplayItem,
} from "@empowered/api";
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MatStepper } from "@angular/material/stepper";
import { AbstractControl, FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import {
    ConfirmAddressDialogComponent,
    AddressVerificationComponent,
    validateStateAndZipCode,
    EnrollmentMethodComponent,
} from "@empowered/ui";
import { DatePipe, TitleCasePipe } from "@angular/common";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { forkJoin, Observable, Subscription, Subject, of, combineLatest } from "rxjs";
import { STEPPER_GLOBAL_OPTIONS } from "@angular/cdk/stepper";
import { takeUntil, filter, switchMap, tap, catchError, map, switchMapTo, delay, take } from "rxjs/operators";

import {
    ClientErrorResponseCode,
    ServerErrorResponseCode,
    ConfigName,
    AddressConfig,
    JOB_TITLE_MAX_LENGTH,
    SHOP_SUCCESS,
    SECOND_IN_MILLISECONDS,
    ZIP_CODE_MIN_LENGTH,
    ZIP_CODE_MAX_LENGTH,
    JOB_FIELD_MAX_LENGTH,
    AppSettings,
    PhoneContactTypes,
    EnrollmentMethod,
    Address,
    PersonalAddress,
    ContactType,
    CountryState,
    Vocabulary,
    MemberProfile,
    VerificationInformation,
    Relations,
    MemberDependent,
    MemberContact,
} from "@empowered/constants";
import { DateService } from "@empowered/date";

import {
    EnrollmentMethodState,
    SetEnrollmentMethodSpecific,
    SetMemberIdentity,
    SetMemberInfo,
    EnrollmentMethodModel,
    EnrollmentMethodStateModel,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

interface Details {
    id: any;
    employeeId: any;
    name?: string;
}

// Component level constants
const NY_ABBR = "NY";
const PATTERN = "pattern";
const CHECK_ZERO_INDEX = 0;
const DEPARTMENT_ERROR = "workInformation.departmentNumbers";
const INVALID_BIRTH_DATE = "Invalid Date of Birth";
const ADDRESS_BOTH_OPTION = "bothOption";
const ADDRESS_SINGLE_OPTION = "singleOption";
const CHECK_ONE_INDEX = 1;
const FORM_CONTROLS = "controls";
const STATE_FORM_CONTROL = "state";
const FORM_VALUE = "value";
const ZIP_FORM_CONTROL = "zip";
const FIRST_NAME_MSG = "secondary.portal.members.personalValidationMsg.firstNameMsg1";
const INVALID_EMAIL_DOMAIN = "ValidEmail";
const LOCATION_HEADER = "location";
const SLASH = "/";
const RELATION_IDS = {
    spouse: 1,
    child: 2,
    grandChild: 3,
};

@Component({
    selector: "empowered-add-customer",
    templateUrl: "./add-customer.component.html",
    styleUrls: ["./add-customer.component.scss"],
    providers: [
        {
            provide: STEPPER_GLOBAL_OPTIONS,
            useValue: { displayDefaultIndicatorType: false },
        },
    ],
})
export class AddCustomerComponent implements OnInit, OnDestroy {
    ZIP_CODE_MIN_LENGTH = ZIP_CODE_MIN_LENGTH;
    ZIP_CODE_MAX_LENGTH = ZIP_CODE_MAX_LENGTH;

    @ViewChild("adressVerification") empAdressVerificationForm;
    @ViewChild("empForm") empForm;
    @ViewChild("deptForm") deptForm;
    @ViewChild("progressIndicator", { static: true }) progressIndicator;
    @ViewChild("stepper") stepper: MatStepper;
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    private readonly memberContactInfoSave$ = new Subject<boolean>();
    memberContactInfoSaveAction = this.memberContactInfoSave$.asObservable();
    workInfoForm: FormGroup;
    employeeForm: FormGroup;
    dependentsForm: FormGroup;
    employeesDepartments: any[];
    employeeGenders: GenderDetails[];
    phonenumberType = PhoneContactTypes.HOME;
    genderError = false;
    employeeStates: any[];
    phoneNumberTypes: string[];
    enrollmentState: EnrollmentMethodStateModel;
    mpGroup: number;
    stateZip: string;
    maxLength = AppSettings.CALENDAR_MAX_LEN;
    phoneMaxLength = AppSettings.PHONE_NUM_MAX_LENGTH;
    changeStepper: number;
    disableCheckBox = true;
    validStatus = 0;
    enableDependentFlag = false;
    changedName = "";
    memberObject: MemberProfile;
    verificationInformation: VerificationInformation;
    dependentsCount = 0;
    saveAndShopFlag = false;
    locationPreferance = [];
    dependentsReleation: Relations[] = [];
    zipFlag = false;
    dependentObj: MemberDependent[] = [];
    memberId: string;
    dependentRelationId: number;
    contactInfo: any;
    memberIdParsing: number;
    addressResp: boolean;
    addressMessage: string[] = [];
    stateAbr: any;
    step1 = 1;
    step2 = 2;
    step3 = 3;
    openAddressModal = false;
    salaryInfo: any;
    memberIdentifierId = "";
    identifierTypeId = 2;
    dateFormat = AppSettings.DATE_FORMAT;
    zipError = false;
    errorMessage: any;
    EnrollmentDialogRef: any;
    errorResponse: boolean;
    dependentResponse: boolean;
    dependentErr: any;
    workInfoResponse: boolean;
    workInfoMsg: any;
    emailAddressType: string;
    contactType: ContactType;
    dependentsFormMap = [];
    deepCopyDependent = [];
    dependentsId: string[] = [];
    totalDependentsCount = 1;
    selectLabel: string;
    stepPosition = 0;
    isMemberContactSaved = false;
    workinfoflag = false;
    englishLabel: string;
    today = new Date();
    maxHireDate = new Date();
    isSpouseSelected = [];
    spouseFormName: string;
    employeeZipFlag = true;
    updateMemberFlag = false;
    updateDependentFlag = false;
    isDependentRequired = false;
    validWorkInfoForm = false;
    updateMemberSaved = false;
    createSalarySaved = false;
    createMemberIdentifierSaved = false;
    isPersonalInfoChanged = false;
    dependentContactInfo: any;
    isEmpDOBInvalid = true;
    isWorkInfoHireDate = false;
    isEmployeeFormSubmit = false;
    isDependentFormInvalid = false;
    isWorkInfoFormInvalid = false;
    dependentDOB = false;
    dependentContactSaved = false;
    preferance = [];
    relationshipType: any[] = [];
    minimumSubscriberAge: number;
    minimumSpouseAge: number;
    minimumFutureDays: number;
    specificEnrollmentObj: EnrollmentMethodModel;
    visitedMpGroupStateObj: string[];
    isLoading = false;
    suggestedAddress: Address;
    tempMemberAddress: Address;
    max_length = JOB_FIELD_MAX_LENGTH;
    relationshipTypes: any[] = [
        {
            value: 1,
            type: "Spouse",
        },
        {
            value: 2,
            type: "Child",
        },
    ];
    isShopEnabled = true;
    preferedLanguage: any[] = [];
    unpluggedFeatureFlag: boolean;
    isMobile = false;
    employeeMinBirthYear: number;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.census.manualEntry.firstName",
        "primary.portal.census.manualEntry.state",
        "primary.portal.census.manualEntry.phoneType",
        "primary.portal.census.manualEntry.isMobilenumber",
        "primary.portal.census.manualEntry.preferredLanguage",
        "primary.portal.census.manualEntry.department",
        "primary.portal.census.manualEntry.annualSalary",
        "primary.portal.census.manualEntry.gender",
        "primary.portal.census.manualEntry.hoursWeek",
        "primary.portal.census.manualEntry.hireDate",
        "primary.portal.census.manualEntry.employeeID",
        "primary.portal.census.manualEntry.lastName",
        "primary.portal.census.manualEntry.birthdate",
        "primary.portal.census.manualEntry.hireDate",
        "primary.portal.census.manualEntry.emailAddress",
        "primary.portal.census.manualEntry.phoneNumber",
        "primary.portal.census.manualEntry.addDependent",
        "primary.portal.census.manualEntry.addAnotherdependent",
        "primary.portal.census.manualEntry.stepperSave&shop",
        "primary.portal.census.manualEntry.zip",
        "primary.portal.census.manualEntry.stepperTitle.personalInfo",
        "primary.portal.census.manualEntry.stepperTitle.dependents",
        "primary.portal.census.manualEntry.stepperTitle.workInfo",
        "primary.portal.census.manualEntry.dropdownEngish",
        "primary.portal.census.manualEntry.title",
        "primary.portal.members.dependentValidationMsg.zipMsg",
        "primary.portal.census.manualEntry.zipErrorMsg",
        "primary.portal.census.manualEntry.dependentsTitle",
        "primary.portal.census.manualEntry.workinfoTitle",
        "primary.portal.direct.addCustomer.streetAddress1",
        "primary.portal.direct.addCustomer.streetAddress2",
        "primary.portal.direct.addCustomer.city",
        "primary.portal.direct.addCustomer.addCustomer",
        "primary.portal.direct.addCustomer.employerName",
        "primary.portal.direct.addCustomer.jobTitle",
        "primary.portal.direct.addCustomer.verifyAddress",
        "primary.portal.direct.addCustomer.verifyAddressMsg",
        "primary.portal.direct.addCustomer.suggestedAddress",
        "primary.portal.direct.addCustomer.providedAddress",
        "primary.portal.direct.addCustomer.planInfo",
        "primary.portal.direct.addCustomer.paper",
        "primary.portal.direct.addCustomer.electronic",
        "primary.portal.direct.addCustomer.sendTo",
        "primary.portal.common.optional",
        "primary.portal.common.select",
        "primary.portal.common.close",
        "primary.portal.common.edit",
        "primary.portal.common.next",
        "primary.portal.common.back",
        "primary.portal.common.remove",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.members.mmpPolicyDeliveryMsgElectronic",
        "primary.portal.members.mappPolicyDeliveryMsgElectronic",
        "primary.portal.members.mmpPolicyDeliveryMsgPaper",
        "primary.portal.members.mappPolicyDeliveryMsgPaper",
        "primary.portal.common.city.patternError",
        "primary.portal.direct.addCustomer.employeeMinBirthYear",
        "primary.portal.census.manualEntry.customerRelationship",
        "primary.portal.direct.addCustomer.customerRelationship",
        "primary.portal.common.placeholderSelect",
        "primary.portal.common.stronglyRecommended",
        "primary.portal.common.stronglyRecommended.email.tooltip",
        "primary.portal.common.customer",
    ]);

    languageSecondStringsArray: Record<string, string>;
    isEmailOptional = false;
    isPaper = false;
    portal: string;
    selectedAddress: string;
    subscriptions: Subscription[] = [];
    storedState: CountryState[];
    phNumberReplaceRegex = /[-]/g;
    private readonly unsubscribe$ = new Subject<void>();
    isOverallAddressVerification: boolean;
    EMAIL_ADDRESSES = "emailAddresses";
    PHONE_NUMBERS = "phoneNumbers";
    isDisplaySendTo = false;
    emailDomainError = "";
    duplicateDependentError = false;
    childMaxAge: number;
    stronglyRecommendedEmailConfig$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.STRONGLY_RECOMMEND_EMAIL);
    emailToolTip: string;
    additionalEmailLabel: string;
    worksiteLocationEnabled$: Observable<boolean> = this.staticUtilService.cacheConfigEnabled(ConfigName.WORKSITE_LOCATION_ENABLED);

    constructor(
        private readonly fb: FormBuilder,
        private readonly memberService: MemberService,
        private readonly staticService: StaticService,
        private readonly censusService: CensusService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly datePipe: DatePipe,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<AddCustomerComponent>,
        private readonly route: ActivatedRoute,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly utilService: UtilService,
        private readonly accountService: AccountService,
        private readonly sharedService: SharedService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly titleCase: TitleCasePipe,
        private readonly dateService: DateService,
    ) {}

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        this.stronglyRecommendedEmailConfig$.pipe(takeUntil(this.unsubscribe$)).subscribe((config) => {
            this.additionalEmailLabel = config
                ? this.languageStrings["primary.portal.common.stronglyRecommended"]
                : this.languageStrings["primary.portal.common.optional"];
            this.emailToolTip = this.languageStrings["primary.portal.common.stronglyRecommended.email.tooltip"].replace(
                "##Type##",
                this.languageStrings["primary.portal.common.customer"],
            );
        });
        this.subscriptions.push(
            this.sharedService.getStateZipFlag().subscribe((resp) => {
                this.isLoading = resp;
            }),
        );
        this.fetchSecondaryLanguages();
        this.unpluggedFeatureFlag = false;
        this.subscriptions.push(
            combineLatest([this.store.select(SharedState.portal), this.regex$])
                .pipe(
                    filter(([portal, regex]) => !!(portal && regex)),
                    tap(([portal, regex]) => {
                        this.validationRegex = regex;
                        this.portal = SLASH + portal.toLowerCase();
                    }),
                )
                .subscribe(),
        );

        this.mpGroup = this.data.mpGroup;
        this.phoneNumberTypes = [ContactType.HOME, ContactType.WORK];
        this.locationPreferance.push(ContactType.HOME);
        this.getDependentRelations();
        this.preferance.push("Electronic");
        this.preferance.push("Paper");
        // this.preferedLanguage.push(AppSettings.ENGLISH), this.preferedLanguage.push(AppSettings.SPANISH);
        this.changeStepper = 1;
        this.selectLabel = this.language.fetchPrimaryLanguageValue("primary.portal.common.select");
        this.englishLabel = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.dropdownEngish");
        this.employeeForm = this.fb.group({
            firstName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            lastName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            birthDate: ["", Validators.required],
            genderName: ["", Validators.required],
            address1: ["", [Validators.required, Validators.pattern(this.validationRegex.ADDRESS)]],
            address2: ["", Validators.pattern(this.validationRegex.ADDRESS)],
            city: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_BETWEEN_WORDS)]],
            state: ["", [Validators.required, Validators.pattern(this.validationRegex.STATE)]],
            zip: ["", [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            emailAddress: ["", [Validators.required, Validators.pattern(this.validationRegex.EMAIL)]],
            phoneNumber: ["", [Validators.required, Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))]],
            preferredLanguage: [Vocabulary.ENGLISH],
            deliveryPreferance: [this.preferance[0]],
            sendTo: [this.locationPreferance[0]],
            phoneType: [this.phoneNumberTypes[0]],
            cellType: [false],
        });
        this.getConfigs();
        this.dependentsForm = this.fb.group({});
        this.workInfoData();
        this.getEmployeeState();
        this.getEmployeeGender();
        this.getEmployeeLanguage();
        this.subscriptions.push(
            this.memberContactInfoSaveAction.pipe(filter((isContactSaved) => isContactSaved && this.isMemberContactSaved)).subscribe(() => {
                this.stepPosition = this.step1;
                this.changeStepper = this.step2;
                if (this.progressIndicator.selected) {
                    this.progressIndicator.selected.completed = true;
                }
                if (this.progressIndicator.selected) {
                    this.progressIndicator.selected.completed = true;
                }
            }),
        );
    }
    /**
     * Function to fetch secondary languages
     */
    fetchSecondaryLanguages(): void {
        this.languageSecondStringsArray = this.language.fetchSecondaryLanguageValues([
            "secondary.portal.census.manualEntry.spouseValidAge",
            "secondary.portal.census.manualEntry.maxChildAge",
            "secondary.portal.census.manualEntry.requiredField",
            "secondary.portal.census.manualEntry.invalidDateFormat",
            "secondary.portal.census.manualEntry.futureDate",
            "secondary.portal.census.manualEntry.memberTooYoung",
            "secondary.portal.census.manualEntry.mustBePastDate",
            "secondary.portal.common.sorryPermissionDenied",
            "secondary.portal.common.memberAlreadyExists",
            "secondary.portal.common.internalServerError",
            "secondary.portal.census.manualEntry.birthdateMustBePastOrPresent",
            "secondary.portal.census.manualEntry.spouseIsYoung",
            "secondary.portal.census.manualEntry.dependentChildNotMoreThan26",
            "secondary.portal.register.personalInfo.badParameter",
            "secondary.portal.census.manualEntry.hyphenandapostrophes",
            "secondary.portal.common.errorAflacService",
            "secondary.portal.register.personalInfo.api.duplicateMemberError",
            "secondary.portal.census.manualEntry.departmentSizeError",
            "secondary.portal.census.manualEntry.duplicateEmployeeID",
            "secondary.portal.census.manualEntry.400.badParameter.phoneNumbers",
            "secondary.portal.census.manualEntry.400.badParameter.emailAddresses",
            FIRST_NAME_MSG,
        ]);
        if (!this.languageSecondStringsArray[FIRST_NAME_MSG]) {
            this.subscriptions.push(
                this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*")).subscribe(() => this.fetchSecondaryLanguages()),
            );
        }
    }

    /**
     * Function to check if birthDate has value.
     */
    dobRequired(): void {
        if (!this.employeeForm.controls.birthDate.value) {
            this.employeeForm.controls.birthDate.setErrors({ required: true });
        }
    }
    emailAdressRequired(): void {
        if (
            this.employeeForm.controls.deliveryPreferance.value !== "" &&
            this.employeeForm.controls.deliveryPreferance.value === "Electronic" &&
            this.employeeForm.controls.deliveryPreferance.value !== "Paper" &&
            this.employeeForm.controls.emailAddress.value === ""
        ) {
            this.employeeForm.controls.emailAddress.setErrors({ required: true });
        } else if (
            this.employeeForm.controls.deliveryPreferance.value === "" ||
            this.employeeForm.controls.deliveryPreferance.value === "Paper"
        ) {
            this.employeeForm.controls.emailAddress.setErrors(null);
        }
    }

    onPreferenceChange(deliveryPreference: any): void {
        this.isEmailOptional = true;
        if (deliveryPreference.value === "Electronic") {
            this.isEmailOptional = false;
            this.isPaper = false;
        } else if (
            this.employeeForm.controls.deliveryPreferance.value === "" ||
            this.employeeForm.controls.deliveryPreferance.value === "Paper"
        ) {
            this.employeeForm.controls.emailAddress.setErrors(null);
            this.isPaper = true;
        }
    }
    /**
     * This function is used to get config values
     */
    getConfigs(): void {
        // Group Specific configs shouldn't be cached
        combineLatest([
            this.staticUtilService.fetchConfigs(
                [
                    ConfigName.MINIMUM_SUBSCRIBER_AGE,
                    ConfigName.SPOUSE_MINIMUM_AGE,
                    ConfigName.FUTURE_DAYS_ALLOWED_FOR_NEW_HIRE_DATE,
                    ConfigName.CHILD_MAX_AGE,
                    ConfigName.UNPLUGGED_CONFIG,
                ],
                this.mpGroup,
            ),
            this.staticUtilService.cacheConfigs([
                AddressConfig.ADDRESS_VALIDATION,
                AddressConfig.CITY_NAME_MIN_LENGTH,
                ConfigName.SUBSCRIBER_MIN_BIRTH_YEAR,
            ]),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([
                    [minimumSubscriberAge, minimumSpouseAge, minimumFutureDays, childMaxAge, unpluggedFeatureFlag],
                    [addressValidationEnabled, cityNameMinLength, subscriberMinimumBirthYear],
                ]) => {
                    this.minimumSubscriberAge = +minimumSubscriberAge.value;
                    this.minimumSpouseAge = +minimumSpouseAge.value;
                    this.minimumFutureDays = +minimumFutureDays.value;
                    this.childMaxAge = +childMaxAge.value;

                    this.maxHireDate.setDate(this.maxHireDate.getDate() + this.minimumFutureDays);
                    this.unpluggedFeatureFlag = this.staticUtilService.isConfigEnabled(unpluggedFeatureFlag);

                    this.isOverallAddressVerification = this.staticUtilService.isConfigEnabled(addressValidationEnabled);
                    if (cityNameMinLength) {
                        this.employeeForm.controls.city.setValidators([
                            this.employeeForm.controls.city.validator,
                            Validators.minLength(+cityNameMinLength),
                        ]);
                    }
                    this.employeeMinBirthYear = +subscriberMinimumBirthYear?.value;
                },
            );
    }
    /**
     * form group prepared for work info data
     * @returns void
     */
    workInfoData(): void {
        this.workInfoForm = this.fb.group(
            {
                employerName: ["", Validators.required],
                jobTitle: [
                    "",
                    [Validators.required, Validators.maxLength(JOB_TITLE_MAX_LENGTH), Validators.pattern(this.validationRegex.JOB_TITLE)],
                ],
            },
            { updateOn: "blur" },
        );
        this.addWorkStateAndZipFormControls();
    }

    /**
     * Add State and Zip FormControls into workInfoForm if Config is "on"
     * @returns void
     */
    addWorkStateAndZipFormControls(): void {
        this.worksiteLocationEnabled$.pipe(takeUntil(this.unsubscribe$)).subscribe((config) => {
            if (config) {
                this.workInfoForm.addControl("workState", new FormControl(""));
                this.workInfoForm.addControl("workZip", new FormControl(""));
            }
        });
    }

    /**
     * This function is used to validate state and zip code.
     * @param workZip work zip code value.
     * @param workState selected work state value
     */
    checkWorkInfoZipCode(workZip: string, workState: string): void {
        this.subscriptions.push(
            validateStateAndZipCode(workState, workZip, this.workInfoForm.controls.workZip, this.staticService, this.sharedService),
        );

        if (workZip && workZip?.length !== 5 && workZip?.length !== 9) {
            this.workInfoForm.controls.workZip.setErrors({ length: true });
        }
        if (!workZip && workState) {
            this.workInfoForm.controls.workZip.setErrors({ workZipRequired: true });
            this.workInfoForm.controls.workZip.markAsTouched();
        }
        if (workZip && !workState) {
            this.workInfoForm.controls.workState.setErrors({ workStateRequired: true });
            this.workInfoForm.controls.workState.markAsTouched();
        }
        if (!workZip && !workState) {
            this.workInfoForm.controls.workState.reset();
            this.workInfoForm.controls.workZip.reset();
        }
    }

    /**
     * Creates the dependent info form with set of validations
     * @returns created form
     */
    addDependentForm(): FormGroup {
        return this.fb.group({
            firstName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            lastName: ["", [Validators.required, Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)]],
            birthDate: ["", Validators.required],
            gender: ["", Validators.required],
            state: [this.employeeForm.controls.state.value, [Validators.required, Validators.pattern(this.validationRegex.STATE)]],
            zip: [this.employeeForm.controls.zip.value, [Validators.required, Validators.pattern(this.validationRegex.ZIP_CODE)]],
            dependentRelationId: ["", Validators.required],
        });
    }

    /**
     * This function is used to validate state and zip code.
     * @param value zip code value.
     */
    checkZipCode(value: string): void {
        this.subscriptions.push(
            validateStateAndZipCode(
                this.employeeForm.value.state,
                value,
                this.employeeForm.controls.zip,
                this.staticService,
                this.sharedService,
            ),
        );
    }
    numberValidation(event: any): void {
        if (event.type === "keypress" && !(event.keyCode <= 57 && event.keyCode >= 48)) {
            event.preventDefault();
        }
    }

    closeForm(): void {
        this.dialogRef.close();
    }

    /**
     * Returns ID of a newly created member or dependent from the response headers
     *
     * @param response http response on a create or update api call
     * @returns id of the member or dependent
     */
    getMemberId(response: HttpResponse<unknown>): string {
        return response.headers.get(LOCATION_HEADER).split(SLASH).pop();
    }
    cellType(evt: any): any {
        this.phonenumberType = PhoneContactTypes.HOME;
        if (evt.checked) {
            this.isMobile = true;
        } else {
            this.phonenumberType = this.employeeForm.controls.phoneType.value;
            this.isMobile = false;
        }
    }
    phoneNumberValid(): void {
        if (this.employeeForm.controls["phoneNumber"].invalid && this.employeeForm.controls["phoneNumber"].value === "") {
            this.disableCheckBox = true;
        } else {
            this.disableCheckBox = false;
        }
    }

    /**
     * This function is used to get dependent relations form accountService.
     * @returns void
     */
    getDependentRelations(): void {
        /** *
         * passing mpGroup to getDependentRelations api to get dependent relations.
         */
        this.subscriptions.push(
            this.accountService.getDependentRelations(this.mpGroup).subscribe(
                (res) => {
                    this.dependentsReleation = res;
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
    }
    /**
     * This method saves the member contact information
     */
    saveMemberContact(): void {
        const tempContactInfo = {
            address: {},
            emailAddresses: [],
            phoneNumbers: [],
        };
        if (this.isMemberContactSaved && this.selectedAddress !== undefined) {
            tempContactInfo.address =
                this.selectedAddress === AppSettings.TEMPORARY_ADDRESS ? this.tempMemberAddress : this.suggestedAddress;
        } else {
            tempContactInfo.address = this.tempMemberAddress;
        }

        if (this.employeeForm.controls.emailAddress.value !== "") {
            if (this.employeeForm.controls.phoneType.value === ContactType.WORK) {
                tempContactInfo.emailAddresses = [
                    {
                        email: this.employeeForm.controls.emailAddress.value,
                        type: EmailTypes.WORK,
                        primary: true,
                    },
                ];
            } else {
                tempContactInfo.emailAddresses = [
                    {
                        email: this.employeeForm.controls.emailAddress.value,
                        type: EmailTypes.PERSONAL,
                        primary: true,
                    },
                ];
            }
        }
        if (this.employeeForm.controls.phoneNumber.value !== "") {
            tempContactInfo.phoneNumbers = [
                {
                    phoneNumber: this.employeeForm.controls.phoneNumber.value.replace(this.phNumberReplaceRegex, ""),
                    type: this.employeeForm.controls.phoneType.value,
                    primary: true,
                    isMobile: this.isMobile,
                },
            ];
        }
        if (
            this.contactInfo === undefined ||
            !this.isMemberContactSaved ||
            (this.contactInfo !== undefined && !JSON.stringify(this.contactInfo).includes(JSON.stringify(tempContactInfo)))
        ) {
            const addressValidationDate = this.contactInfo ? this.contactInfo.addressValidationDate : undefined;
            this.contactInfo = {};
            this.contactType = this.employeeForm.controls.phoneType.value;
            this.contactInfo = this.utilService.copy(tempContactInfo);
            this.contactInfo.addressValidationDate = addressValidationDate;
            if (this.isMemberContactSaved) {
                this.subscriptions.push(
                    this.memberService
                        .getMemberContact(this.memberIdParsing, this.contactType, this.mpGroup.toString())
                        .subscribe((contact) => {
                            if (contact.body.phoneNumbers.length) {
                                this.contactInfo.phoneNumbers[0].id = contact.body.phoneNumbers[0].id;
                            }
                            if (contact.body.emailAddresses.length) {
                                this.contactInfo.emailAddresses[0].id = contact.body.emailAddresses[0].id;
                            }
                            this.saveMemberContactInfo();
                        }),
                );
            } else {
                this.saveMemberContactInfo();
            }
        } else {
            this.errorResponse = false;
            this.validStatus++;
            this.stepPosition = this.step1;
            this.changeStepper = this.step2;
            if (this.progressIndicator.selected !== undefined) {
                this.progressIndicator.selected.completed = true;
            }
        }
    }

    updateMember(): void {
        this.memberService
            .updateMember(this.memberObject, this.mpGroup.toString(), this.memberId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    if (this.progressIndicator.selected !== undefined) {
                        this.progressIndicator.selected.completed = true;
                    }
                    this.saveMemberContact();
                },
                (error) => {
                    if (error.status === AppSettings.API_RESP_400) {
                        this.errorMessage = this.language.fetchPrimaryLanguageValue(
                            "primary.portal.censusManualEntry.failedToUpdateEmployee",
                        );
                    } else {
                        this.errorMessage = this.showErrorAlertMessage(error);
                    }
                },
            );
    }

    /**
     * Method used to save member contact data
     * @returns void
     */
    saveMemberContactInfo(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.censusService.saveMemberContact(this.memberIdParsing, this.contactInfo, this.contactType, this.mpGroup).subscribe(
                (response) => {
                    this.errorResponse = false;
                    this.isMemberContactSaved = true;
                    if (this.isOverallAddressVerification) {
                        this.verifyAddressDetails(this.tempMemberAddress);
                    } else {
                        this.selectedAddress = AppSettings.TEMPORARY_ADDRESS;
                        this.addressResp = false;
                        this.isLoading = false;
                        this.memberContactInfoSave$.next(this.isMemberContactSaved);
                    }
                },
                (erresp) => {
                    this.isMemberContactSaved = false;
                    this.memberContactInfoSave$.next(this.isMemberContactSaved);
                    this.changeStepper = this.step1;
                    this.isLoading = false;
                    this.errorResponse = true;
                    if (erresp.status === AppSettings.API_RESP_400) {
                        for (const detail of erresp.error["details"]) {
                            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                                "secondary.portal.register.personalInfo.api." +
                                    erresp.error.status +
                                    "." +
                                    detail.code +
                                    "." +
                                    detail.field,
                            );
                        }
                    } else if (erresp.status === AppSettings.API_RESP_409) {
                        this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.duplicate");
                    } else if (erresp.status === AppSettings.API_RESP_500) {
                        this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.censusManualEntry.internalServerError");
                    } else if (erresp.status === AppSettings.API_RESP_403) {
                        this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.censusManualEntry.permissionDenied");
                    } else {
                        this.errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
                    }
                },
            ),
        );
    }
    /**
     * Function to update dependent information
     * @returns Observable of type HttpResponse
     */
    updateDependents(): Observable<HttpResponse<unknown>[]> {
        this.deepCopyDependent.forEach((element, idx) => {
            const index = this.dependentsFormMap.indexOf(element);
            if (index === -1) {
                const dependentId = this.dependentsId.splice(idx, 1).pop();
                return this.memberService.deleteMemberDependent(this.memberIdParsing, dependentId, this.mpGroup).pipe(
                    tap((resp) => {
                        this.deepCopyDependent.splice(idx, 1);
                    }),
                );
            }
            return undefined;
        });
        const createDependentObservables = [];
        this.dependentsFormMap.forEach((ele, idx) => {
            const index = this.deepCopyDependent.indexOf(ele);
            if (index === -1) {
                const dependentObjs = this.getDependentForm(this.dependentsForm.controls[ele][FORM_CONTROLS]);
                createDependentObservables.push(
                    this.memberService.createMemberDependent(dependentObjs, this.memberIdParsing, this.mpGroup),
                );
            }
        });
        if (createDependentObservables.length) {
            return forkJoin(createDependentObservables).pipe(
                tap((resp: HttpResponse<unknown>[]) => {
                    this.dependentResponse = false;
                    this.updateDependentFlag = true;
                    this.dependentsId = resp.map((response) => this.getMemberId(response));
                    this.deepCopyDependent = this.utilService.copy(this.dependentsFormMap);
                }),
            );
        }
        const dependentsObservables = [];
        this.dependentObj.forEach((obj, index) => {
            dependentsObservables.push(
                this.memberService.updateMemberDependent(obj, this.memberIdParsing, this.dependentsId[index], this.mpGroup),
            );
        });
        return forkJoin(dependentsObservables).pipe(
            tap((resp) => {
                this.saveDependentsContactInfo();
            }),
            catchError(() => of(null)),
        );
    }

    /**
     * function to fetch all the employee states
     */
    getEmployeeState(): void {
        this.staticService
            .getStates()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((states) => {
                this.employeeStates = states;
            });
    }

    /**
     * function to fetch all the employee genders
     */
    getEmployeeGender(): void {
        this.staticService
            .getGenders()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((genders) => {
                this.employeeGenders = this.memberService.refactorGenders(genders);
            });
    }

    /**
     * function to fetch all the employee languages
     */
    getEmployeeLanguage(): void {
        this.subscriptions.push(
            this.accountService.getVocabularies(this.mpGroup.toString()).subscribe((Response) => {
                this.preferedLanguage = Response;
            }),
        );
    }
    stepChanged(event: any): void {
        this.changedName = ": " + this.employeeForm.controls.firstName.value + " " + this.employeeForm.controls.lastName.value;
        if (event.selectedIndex === 0) {
            this.changeStepper = this.step1;
        } else if (event.selectedIndex === 1) {
            this.changeStepper = this.step2;
        } else {
            this.changeStepper = this.step3;
        }
    }
    /**
     * Method to go back to customer personal info
     * @returns void
     */
    onClickBack(): void {
        if (this.isMobile) {
            this.employeeForm.controls["cellType"].setValue(true);
        }
        if (this.changeStepper === this.step2) {
            this.changeStepper = this.step1;
            this.openAddressModal = false;
            this.errorResponse = false;
        } else {
            this.changeStepper = this.step2;
            this.dependentResponse = false;
        }
    }
    /**
     * get error message based on form data
     * @param formControlName form data
     * @returns error message
     */
    getEmployeeFormErrorMessage(formControlName: string): string {
        if (formControlName === "genderName" || formControlName === "state") {
            return this.employeeForm.controls[formControlName].hasError("required") ? "primary.portal.common.selectionRequired" : "";
        }
        return this.employeeForm.controls[formControlName].hasError("required") ? "primary.portal.common.requiredField" : "";
    }
    /**
     * get error message for dependent info form
     * @param iteration form field position
     * @param formControlName data of the form control
     * @returns error message
     */
    getDependentsFormErrorMessage(iteration: string, formControlName: string): string {
        if (formControlName === "dependentRelationId" || formControlName === "state" || formControlName === "gender") {
            return this.dependentsForm.controls[iteration]["controls"][formControlName].hasError("required")
                ? "primary.portal.common.selectionRequired"
                : "";
        }
        return this.dependentsForm.controls[iteration]["controls"][formControlName].hasError("required")
            ? "primary.portal.common.requiredField"
            : "";
    }
    /**
     * get error message for work information form
     * @param formControlName form control data
     * @returns error message
     */
    getWorkInfoFormErrorMessage(formControlName: string): string {
        return this.workInfoForm.controls[formControlName].hasError("required") ? "primary.portal.common.requiredField" : "";
    }
    onClickOnRemove(value: string): void {
        this.dependentsForm.removeControl(value);
        const index = this.dependentsFormMap.indexOf(value);
        this.dependentsFormMap.splice(index, 1);
        this.dependentsCount--;
        this.relationshipType.splice(index, 1);
        this.isDependentFormInvalid = false;
        this.genderError = false;
        this.duplicateDependentError = false;
        this.workInfoResponse = false;
        if (this.dependentsCount === 0) {
            this.enableDependentFlag = false;
        }
        this.updateSpouseSelection(value);
    }
    markFormGroupTouched(formGroup: FormGroup): void {
        (Object as any).values(formGroup.controls).forEach((control) => {
            if (!(control.value && control.value !== "")) {
                control.markAsTouched();
            }

            if (control.controls) {
                this.markFormGroupTouched(control);
            }
        });
    }

    /**
     * This method is used to get Name Error Messages
     * @param form: string - current form ie employeeForm, dependentForm or workInfoForm
     * @param control: string - formControl ie firstName, lastName, employerName or jobTitle
     * @param iteration: string - iteration of dependentsFormMap
     * @returns string: returns error messages with respect to conditions
     */
    getNameErrorMessages(form: string, control: string, iteration?: string): string | undefined {
        switch (form) {
            case "employeeForm": {
                const empFormControl = this.employeeForm.controls[control];
                if (this.isEmployeeFormSubmit && !empFormControl.value) {
                    return "primary.portal.common.requiredField";
                }
                if (this.validateHyphenApostrophe(empFormControl.value)) {
                    return empFormControl.hasError(PATTERN) ? "secondary.portal.census.manualEntry.hyphenandapostrophes" : "";
                }
                return empFormControl.hasError(PATTERN) ? FIRST_NAME_MSG : "";
            }
            case "dependentsForm": {
                this.dependentDOB = true;
                const depFormControl = this.dependentsForm.controls[iteration]["controls"][control];
                if (!depFormControl.value) {
                    return "primary.portal.common.requiredField";
                }
                if (this.validateHyphenApostrophe(depFormControl.value)) {
                    return depFormControl.hasError(PATTERN) ? "secondary.portal.census.manualEntry.hyphenandapostrophes" : "";
                }
                return depFormControl.hasError(PATTERN) ? FIRST_NAME_MSG : "";
            }
            case "workInfoForm":
                return this.workinfoflag && !this.workInfoForm.controls[control].value ? "primary.portal.common.requiredField" : "";
        }
        return undefined;
    }

    /**
     * Method to validate a string if it has a hyphen or apostrophy at the beginning or end of the passed value and return the boolean value
     * @param value : type string
     * @returns boolean: returns true if string starts or ends with "-" or "/"
     */
    validateHyphenApostrophe(value: string): boolean {
        return value.startsWith("-") || value.startsWith("'") || value.endsWith("-") || value.endsWith("'");
    }

    /**
     * Function to validate date
     * @param control control name
     * @param form form name
     * @param event event value
     * @param iteration index value for dependentForm
     * @returns error message
     */
    validateDate(control: string, form: string, event: any, iteration?: string): string | undefined {
        switch (form) {
            case "employeeForm": {
                this.employeeForm.controls.birthDate.setErrors({ invalid: true });
                if (this.isEmployeeFormSubmit && !this.employeeForm.controls[control].value) {
                    return this.languageSecondStringsArray["secondary.portal.census.manualEntry.requiredField"];
                }
                if (
                    (this.employeeForm.controls[control].value === null || this.employeeForm.controls[control].value === "") &&
                    event !== ""
                ) {
                    return this.languageSecondStringsArray["secondary.portal.census.manualEntry.invalidDateFormat"];
                }
                const dateInput = this.dateService.toDate(this.employeeForm.controls[control].value);
                return this.dateValidation(dateInput, form);
            }
            case "dependentsForm": {
                this.dependentsForm.controls[iteration]["controls"][control].setErrors({ required: true });
                if (
                    (this.isDependentFormInvalid || this.dependentsForm.controls[iteration]["controls"][control].touched) &&
                    !this.dependentsForm.controls[iteration]["controls"][control].value
                ) {
                    return this.languageSecondStringsArray["secondary.portal.census.manualEntry.requiredField"];
                }
                if (
                    (this.dependentsForm.controls[iteration]["controls"][control].value === null ||
                        this.dependentsForm.controls[iteration]["controls"][control].value === "") &&
                    event !== ""
                ) {
                    return this.languageSecondStringsArray["secondary.portal.census.manualEntry.invalidDateFormat"];
                }
                const dependentDOB = this.dateService.toDate(this.dependentsForm.controls[iteration]["controls"][control].value);
                return this.dateValidation(dependentDOB, form, iteration, control);
            }
        }
        return undefined;
    }
    /**
     * This function is used to validate age of employee
     * @param dateInput birth date entered by the user
     * @param form form group
     * @param iteration dependent form iteration if there will be multiple dependents
     * @param control form control
     * @returns error message from language table
     */
    dateValidation(dateInput: any, form: string, iteration?: string, control?: string): string | undefined {
        if (dateInput <= this.today && !(dateInput.getMonth() + 1 && dateInput.getDate() && dateInput.getFullYear())) {
            return this.languageSecondStringsArray["secondary.portal.census.manualEntry.invalidDateFormat"];
        }
        if (this.today < dateInput) {
            return this.languageSecondStringsArray["secondary.portal.census.manualEntry.futureDate"];
        }
        if (form === "employeeForm") {
            if (this.today.getFullYear() - dateInput.getFullYear() < this.minimumSubscriberAge) {
                return "Employee must be " + this.minimumSubscriberAge + " years or older";
            }
            if (dateInput.getFullYear() < this.employeeMinBirthYear) {
                return this.languageStrings["primary.portal.direct.addCustomer.employeeMinBirthYear"];
            }
            if (!this.employeeForm.controls.birthDate.value) {
                this.employeeForm.controls.birthDate.setErrors({ required: true });
            } else {
                this.employeeForm.controls.birthDate.setErrors(null);
                return null;
            }
        }
        if (form === "dependentsForm") {
            const dependentAge = this.dateService.getYearsFromNow(dateInput);
            const relation = this.dependentsForm.controls[iteration]["controls"]["dependentRelationId"].value;
            if (relation && relation === RELATION_IDS.spouse && dependentAge < this.minimumSpouseAge) {
                return this.languageSecondStringsArray["secondary.portal.census.manualEntry.spouseValidAge"] + this.minimumSpouseAge;
            }
            if (relation && (relation === RELATION_IDS.child || relation === RELATION_IDS.grandChild) && dependentAge >= this.childMaxAge) {
                return this.languageSecondStringsArray["secondary.portal.census.manualEntry.maxChildAge"];
            }
            this.dependentsForm.controls[iteration]["controls"][control].setErrors(null);
            return null;
        }
        return undefined;
    }
    /**
     * Method to handle api error for work tab
     * @param erroresp - API error to be handled
     */
    workTabErrorHandling(erroresp: HttpErrorResponse): void {
        this.workInfoResponse = true;
        if (erroresp.status === ClientErrorResponseCode.RESP_400) {
            if (
                erroresp.error.details &&
                erroresp.error.details.length &&
                erroresp.error.details[CHECK_ZERO_INDEX].field === DEPARTMENT_ERROR
            ) {
                this.workInfoMsg = this.languageSecondStringsArray["secondary.portal.census.manualEntry.departmentSizeError"];
            } else {
                this.workInfoMsg = this.languageSecondStringsArray["secondary.portal.register.personalInfo.badParameter"];
            }
        } else if (erroresp.status === ClientErrorResponseCode.RESP_403) {
            this.workInfoMsg = this.languageSecondStringsArray["secondary.portal.common.sorryPermissionDenied"];
        } else if (erroresp.status === ServerErrorResponseCode.RESP_500) {
            this.workInfoMsg = this.languageSecondStringsArray["secondary.portal.common.internalServerError"];
        } else if (erroresp.status === ClientErrorResponseCode.RESP_409) {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.duplicate");
        } else {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
        }
    }

    /**
     * Method to initialize member object
     * @param isWorkTab - Determines where this method is being called
     * @returns MemberProfile object contains all member profile information
     */
    initializeMemberObject(isWorkTab: boolean): ValidateMemberProfile {
        const memberObject: ValidateMemberProfile = {
            name: {
                firstName: this.employeeForm.controls.firstName.value.trim(),
                lastName: this.employeeForm.controls.lastName.value.trim(),
            },
            birthDate: this.dateService.toDate(
                this.utilService.getCurrentTimezoneOffsetDate(this.employeeForm.controls.birthDate.value.toString()),
            ),
            gender: this.employeeForm.controls.genderName.value,
            profile: {
                languagePreference: this.employeeForm.controls.preferredLanguage.value,
                correspondenceType: this.employeeForm.controls.deliveryPreferance.value,
                correspondenceLocation:
                    this.employeeForm.controls.deliveryPreferance.value === this.preferance[1]
                        ? this.employeeForm.controls.sendTo.value
                        : null,
            },
            address: {
                address1: this.employeeForm.controls.address1.value,
                address2: this.employeeForm.controls.address2.value,
                city: this.employeeForm.controls.city.value,
                state: this.employeeForm.controls.state.value,
                zip: this.employeeForm.controls.zip.value,
            },
            verificationInformation: {
                zipCode: this.employeeForm.controls.zip.value,
                verifiedEmail: this.employeeForm.controls.emailAddress.value,
                verifiedPhone: this.employeeForm.controls.phoneNumber.value.replace(this.phNumberReplaceRegex, ""),
            },
        };
        if (isWorkTab) {
            this.updateMemberObjForWorkTab(memberObject);
        } else {
            if (this.employeeForm.controls.emailAddress.value) {
                memberObject.email = this.employeeForm.controls.emailAddress.value;
            }
            if (this.employeeForm.controls.phoneNumber.value) {
                memberObject.phoneNumber = this.employeeForm.controls.phoneNumber.value;
            }
        }
        return memberObject;
    }
    /**
     * Method to validate member information
     * @param isWorkTab - To differentiate where this method is being called
     * @returns Observable of boolean which represents whether member has valid info or not
     */
    validateMember(isWorkTab: boolean): Observable<boolean> {
        const validateMember: ValidateMemberProfile = this.initializeMemberObject(isWorkTab);
        return this.memberService.validateMember(validateMember, this.mpGroup.toString()).pipe(
            takeUntil(this.unsubscribe$),
            tap((res) => {
                this.errorResponse = false;
                if (isWorkTab) {
                    this.saveEmployeeInformation();
                } else {
                    this.isLoading = false;
                    this.validStatus++;
                    this.stepPosition = this.step1;
                    this.changeStepper = this.step2;
                    if (this.progressIndicator.selected) {
                        this.progressIndicator.selected.completed = true;
                    }
                }
            }),
            catchError((error) => {
                this.isLoading = false;
                this.openAddressModal = false;
                this.errorResponse = true;
                if (error.error.status === ClientErrorResponseCode.RESP_400) {
                    if (isWorkTab) {
                        this.workTabErrorHandling(error);
                    } else if (error.error.details && error.error.details.length) {
                        if (error.error.details[0].code === INVALID_EMAIL_DOMAIN) {
                            this.errorResponse = false;
                            this.employeeForm.controls.emailAddress.setErrors({ domain: true });
                            this.emailDomainError = this.language.fetchPrimaryLanguageValue(error.error.details[0].message);
                        } else {
                            this.errorMessage = this.language.fetchPrimaryLanguageValue(error.error.details[CHECK_ZERO_INDEX].message);
                        }
                    }
                } else if (error.error.status === ClientErrorResponseCode.RESP_409) {
                    if (error.error.details && error.error.details.length) {
                        this.errorMessage = error.error.details[CHECK_ZERO_INDEX].message;
                    } else {
                        this.errorMessage = this.languageSecondStringsArray[
                            "secondary.portal.register.personalInfo.api.duplicateMemberError"
                        ].replace("##name##", this.titleCase.transform(`${validateMember.name.firstName} ${validateMember.name.lastName}`));
                    }
                } else {
                    this.errorMessage = this.showErrorAlertMessage(error);
                }
                return of(error);
            }),
        );
    }
    buttonClicked(): void {
        if (this.changeStepper === 1) {
            this.empForm.ngSubmit.emit();
            this.markFormGroupTouched(this.employeeForm);
        }
        if (this.changeStepper === 2 && this.dependentsFormMap.length) {
            this.deptForm.ngSubmit.emit();
            this.markFormGroupTouched(this.dependentsForm);
        }
        this.onClickNext();
    }

    /**
     * function to validate provided address
     * @returns void
     */
    validateAddressRequest(): void {
        if (this.employeeForm.valid) {
            this.isLoading = true;
            this.tempMemberAddress = {
                address1: this.employeeForm.controls.address1.value,
                address2: this.employeeForm.controls.address2.value,
                city: this.employeeForm.controls.city.value,
                state: this.employeeForm.controls.state.value,
                zip: this.employeeForm.controls.zip.value,
            };
            if (this.isOverallAddressVerification) {
                this.verifyAddressDetails(this.tempMemberAddress);
            } else {
                this.nextAfterVerifyAdress();
            }
        }
    }
    /**
     * Validates the member and dependents details
     * @returns void
     */
    // eslint-disable-next-line complexity
    onClickNext(): void {
        this.duplicateDependentError = false;
        this.changedName = ": " + this.employeeForm.controls.firstName.value + " " + this.employeeForm.controls.lastName.value;
        if (this.changeStepper === 1) {
            if (
                this.employeeForm.controls.deliveryPreferance.value !== "" ||
                this.employeeForm.controls.deliveryPreferance.value !== "Paper"
            ) {
                this.emailAdressRequired();
            }
            this.dobRequired();
            if (this.employeeForm.invalid) {
                const firstElementWithError = document.querySelector(".ng-invalid");
                if (firstElementWithError) {
                    firstElementWithError.scrollIntoView({ behavior: "smooth" });
                }

                if (!this.employeeForm.controls.birthDate.value) {
                    this.employeeForm.controls.birthDate.setErrors({ invalid: true });
                }
                this.isEmployeeFormSubmit = true;
                this.isDependentFormInvalid = false;
                this.isWorkInfoFormInvalid = false;
            } else if (this.zipFlag === false) {
                if (!this.updateMemberFlag) {
                    if (!this.isOverallAddressVerification) {
                        this.subscriptions.push(this.validateMember(false).subscribe());
                    } else {
                        this.validateAddressRequest();
                    }
                } else {
                    this.saveEmployeeInformation();
                }
            }
        } else if (this.changeStepper === this.step2) {
            this.dependentDOB = true;
            this.stepPosition = this.step1;
            if (this.dependentsForm.invalid) {
                this.dependentsForm.controls["DependentForm" + (this.dependentsFormMap.length - 1).toString()]["controls"][
                    "birthDate"
                ].setErrors({ required: true });
                this.isEmployeeFormSubmit = false;
                this.isDependentFormInvalid = true;
                this.isWorkInfoFormInvalid = false;
                this.validStatus++;
                this.genderError = true;
                this.isDependentRequired = true;
                if (this.progressIndicator.selected !== undefined) {
                    this.progressIndicator.selected.completed = false;
                }
            } else if (this.checkDuplicateDependent()) {
                this.isEmployeeFormSubmit = false;
                this.isDependentFormInvalid = true;
                this.isWorkInfoFormInvalid = false;
                this.validStatus++;
                this.duplicateDependentError = true;
                if (this.progressIndicator.selected) {
                    this.progressIndicator.selected.completed = false;
                }
            } else if (this.dependentsFormMap.length) {
                this.isLoading = true;
                if (!this.updateDependentFlag) {
                    this.validateDependentInfo(true);
                } else {
                    this.isLoading = false;
                    this.validStatus++;
                    this.changeStepper = this.step3;
                    this.stepPosition = this.step2;
                    if (this.progressIndicator.selected !== undefined) {
                        this.progressIndicator.selected.completed = true;
                    }
                }
            } else if (!this.dependentsFormMap.length && !this.deepCopyDependent.length) {
                this.validStatus++;
                this.changeStepper = this.step3;
                this.stepPosition = this.step2;
                if (this.progressIndicator.selected !== undefined) {
                    this.progressIndicator.selected.completed = true;
                }
            }
        }
    }
    enableDependent(): void {
        this.dependentsCount++;
        this.enableDependentFlag = true;
        this.dependentsForm.addControl("DependentForm" + (this.totalDependentsCount - 1), this.addDependentForm());
        const form = "DependentForm" + (this.totalDependentsCount - 1);
        this.relationshipType[form] = this.relationshipTypes;
        this.dependentsFormMap.push("DependentForm" + (this.totalDependentsCount - 1));
    }
    /**
     * Method to validate member information
     * @param onNext - To differentiate where this method is being called
     */
    validateDependentInfo(onNext: boolean): void {
        const formControlName: string = this.dependentsFormMap[this.dependentsFormMap.length - 1];
        const dependentObjs: MemberDependent = this.getDependentForm(this.dependentsForm.controls[formControlName][FORM_CONTROLS]);
        this.memberService
            .validateDependent(dependentObjs, this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.dependentResponse = false;
                this.isLoading = false;
                if (onNext) {
                    this.validStatus++;
                    this.dependentContactSaved = true;
                    this.changeStepper = this.step3;
                    this.stepPosition = this.step2;
                    if (this.progressIndicator.selected !== undefined) {
                        this.progressIndicator.selected.completed = true;
                    }
                } else {
                    this.addAnotherDependentForm();
                }
            });
    }
    /**
     * Method to add another dependent form
     */
    addAnotherDependentForm(): void {
        this.totalDependentsCount++;
        this.dependentsCount++;
        this.dependentsForm.addControl("DependentForm" + (this.totalDependentsCount - 1), this.addDependentForm());
        const form = "DependentForm" + (this.totalDependentsCount - 1);
        if (this.dependentsFormMap.length) {
            const type = [...this.relationshipTypes];
            this.dependentsFormMap.forEach((value) => {
                const val = this.dependentsForm.controls[`${value}`]["controls"]["dependentRelationId"]["value"];
                if (val === 1) {
                    type.splice(type.indexOf(type.find((ele) => ele.value === 1)), 1);
                }
            });
            this.relationshipType[form] = type;
        }
        this.dependentsFormMap.push("DependentForm" + (this.totalDependentsCount - 1));
    }
    /**
     * Method to save member information
     */
    saveEmployeeInformation(): void {
        this.workInfoMsg = "";
        const memberObject: ValidateMemberProfile = this.initializeMemberObject(true);
        const saveMemberApi: Observable<HttpResponse<void>> = !this.updateMemberFlag
            ? this.memberService.createMember(memberObject as MemberProfile, this.mpGroup)
            : this.memberService.updateMember(memberObject as MemberProfile, this.mpGroup.toString(), this.memberId);
        saveMemberApi
            .pipe(
                tap(
                    (response) => {
                        if (response instanceof HttpResponse) {
                            this.memberId = this.getMemberId(response);
                            this.updateMemberFlag = true;
                        }
                    },
                    (error) => {
                        this.isLoading = false;
                        this.workInfoResponse = true;
                        this.updateMemberFlag = false;
                        this.workInfoMsg = this.showErrorAlertMessage(error);
                    },
                ),
                switchMap((res) => this.saveMemberContactObservable()),
                switchMap(() => {
                    this.memberService.updateMemberList(true);
                    if (this.dependentsFormMap.length) {
                        return this.saveMemberDependents();
                    }
                    this.navigateAfterCreateMember();
                    // We need to return an Observable for switchMap to not throw an error
                    return of(null);
                }),
                catchError((error) => {
                    this.isLoading = false;
                    this.isMemberContactSaved = false;
                    this.workInfoResponse = true;
                    this.handleCreateMemberError(error);
                    return of(null);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * Method to create saveMemberContact observables
     * @returns the save member contact API observables
     */
    saveMemberContactObservable(): Observable<void[]> {
        const saveMemberContactObservables: Observable<void>[] = [];
        const memberHomeContactInfo: MemberContact = {
            address: {
                address1: this.employeeForm.controls.address1.value,
                address2: this.employeeForm.controls.address2.value,
                city: this.employeeForm.controls.city.value,
                state: this.employeeForm.controls.state.value,
                zip: this.employeeForm.controls.zip.value,
            },
        };

        if (this.employeeForm.controls.emailAddress.value !== "") {
            memberHomeContactInfo.emailAddresses = [
                {
                    email: this.employeeForm.controls.emailAddress.value,
                    type: EmailTypes.PERSONAL,
                    primary: true,
                    verified: true,
                },
            ];
        }
        if (this.employeeForm.controls.phoneNumber.value) {
            const phoneNumbers = [
                {
                    phoneNumber: this.employeeForm.controls.phoneNumber.value,
                    type: this.employeeForm.controls.phoneType.value,
                    primary: true,
                    isMobile: this.isMobile,
                    verified: true,
                },
            ];
            if (this.employeeForm.controls.phoneType.value === PhoneContactTypes.HOME) {
                memberHomeContactInfo.phoneNumbers = phoneNumbers;
            } else {
                const memberWorkContactInfo = {
                    address: null,
                    phoneNumbers: phoneNumbers,
                };
                if (memberHomeContactInfo.phoneNumbers) {
                    delete memberHomeContactInfo.phoneNumbers;
                }
                saveMemberContactObservables.push(
                    this.memberService.saveMemberContact(+this.memberId, ContactType.WORK, memberWorkContactInfo, this.mpGroup.toString()),
                );
            }
        }
        if (this.workInfoForm.controls.workZip?.value) {
            saveMemberContactObservables.push(this.saveMemberWorkStateAndZip());
        }
        saveMemberContactObservables.push(
            this.memberService.saveMemberContact(+this.memberId, ContactType.HOME, memberHomeContactInfo, this.mpGroup.toString()),
        );
        return saveMemberContactObservables[CHECK_ZERO_INDEX].pipe(
            delay(saveMemberContactObservables.length > CHECK_ONE_INDEX ? SECOND_IN_MILLISECONDS : 0),
            switchMap((res) => {
                if (saveMemberContactObservables.length > CHECK_ONE_INDEX) {
                    return saveMemberContactObservables[CHECK_ONE_INDEX];
                }
                return of(Array[0]);
            }),
        );
    }
    /**
     * Method to save member work state and zip information
     * @returns Observable of void
     */
    saveMemberWorkStateAndZip(): Observable<void> {
        const workAddress = {
            state: this.workInfoForm.controls.workState?.value as string,
            zip: this.workInfoForm.controls.workZip?.value as string,
        };
        const memberWorkInfoDetails = {
            address: workAddress,
        };
        return this.memberService.saveMemberContact(+this.memberId, ContactType.WORK, memberWorkInfoDetails, this.mpGroup.toString());
    }
    /**
     * Method to save member dependents information
     * @returns Observable of type HttpResponse
     */
    saveMemberDependents(): Observable<HttpResponse<Response>[] | HttpErrorResponse[] | HttpResponse<unknown>[]> {
        let dependentObs: Observable<HttpResponse<Response>[] | HttpErrorResponse[]> | Observable<HttpResponse<unknown>[]>;
        if (this.updateDependentFlag) {
            dependentObs = this.updateDependents();
        } else {
            const createDependentObservables: Observable<HttpResponse<Response>>[] = [];
            this.dependentsFormMap.forEach((ele, idx) => {
                const dependentObjs = this.getDependentForm(this.dependentsForm.controls[ele][FORM_CONTROLS]);
                createDependentObservables.push(this.memberService.createMemberDependent(dependentObjs, +this.memberId, this.mpGroup));
                this.dependentObj.push(dependentObjs);
            });

            dependentObs = this.saveDependents(createDependentObservables);
        }
        return dependentObs;
    }
    /**
     * Method to call saveMemberDependents API
     * @param createDependentObservables - Array of observables to call saveMemberDependent api
     * @returns Observable of type HttpResponse
     */
    saveDependents(
        createDependentObservables: Observable<HttpResponse<unknown>>[],
    ): Observable<HttpResponse<Response>[] | HttpErrorResponse[]> {
        return forkJoin(createDependentObservables).pipe(
            switchMap((resp: HttpResponse<unknown>[]) => {
                this.dependentsId = resp.map((response) => this.getMemberId(response));
                this.workInfoResponse = false;
                this.updateDependentFlag = true;
                this.deepCopyDependent = this.utilService.copy(this.dependentsFormMap);
                return this.saveDependentsContactInfo();
            }),
            catchError((errorResp) => {
                this.updateDependentFlag = false;
                this.workTabErrorHandling(errorResp);
                return of(null);
            }),
            takeUntil(this.unsubscribe$),
        );
    }
    /**
     * Method to save member dependents contact information
     * @returns Observable of type HttpResponse
     */
    saveDependentsContactInfo(): Observable<HttpErrorResponse[]> {
        const dependetsContactInfo: DependentContact[] = [];
        this.dependentsFormMap.forEach((element) => {
            const dependentContactObjs: DependentContact = {
                address: {
                    state: this.dependentsForm.controls[`${element}`][FORM_CONTROLS][STATE_FORM_CONTROL][FORM_VALUE],
                    zip: this.dependentsForm.controls[`${element}`][FORM_CONTROLS][ZIP_FORM_CONTROL][FORM_VALUE],
                },
            };
            dependetsContactInfo.push(dependentContactObjs);
        });
        const dependentContactObservables: Observable<HttpResponse<Response>>[] = [];
        this.dependentsId.forEach((element, index) => {
            dependentContactObservables.push(
                this.memberService.saveDependentContact(dependetsContactInfo[index], +this.memberId, element.toString(), this.mpGroup),
            );
        });
        return this.saveDependentsContact(dependentContactObservables);
    }
    /**
     * Method to call saveDependentContact API
     * @param dependentContactObservables - Array of observables to call saveDependentContact api
     * @returns Observable of type HttpResponse
     */
    saveDependentsContact(dependentContactObservables: Observable<HttpResponse<Response>>[]): Observable<HttpErrorResponse[]> {
        return forkJoin(dependentContactObservables).pipe(
            switchMap((resp) => {
                this.workInfoResponse = false;
                this.dependentContactSaved = true;
                return this.saveEmployeeWorkInformation();
            }),
            catchError((errorResp) => {
                this.dependentContactSaved = false;
                this.workTabErrorHandling(errorResp);
                return of(null);
            }),
            takeUntil(this.unsubscribe$),
        );
    }
    /**
     * Method to navigate user after creating member
     */
    navigateAfterCreateMember(): void {
        this.isLoading = false;
        this.workInfoResponse = false;
        if (this.progressIndicator.selected !== undefined) {
            this.progressIndicator.selected.completed = true;
        }
        this.store.dispatch(new SetMemberIdentity(+this.memberId));
        const data: Details = {
            id: this.memberId,
            employeeId: this.memberIdentifierId,
            name: `${this.employeeForm.value.lastName}, ${this.employeeForm.value.firstName}`,
        };
        if (this.saveAndShopFlag) {
            this.closeFormOnSuccess(this.memberId);
            this.specificShopNav(data);
        } else {
            this.store.dispatch(new SetMemberInfo(data));
            this.navigateToPersonalInfo();
        }
    }
    /**
     * Method to get Member Identifier Observable
     * @returns Observable<HttpErrorResponse>
     */
    getMemberIdentifierObservable(): Observable<HttpErrorResponse> {
        const memberIdentifier: MemberIdentifier = {
            id: Number(this.memberId),
            memberIdentifierTypeId: this.identifierTypeId,
            value: this.memberIdentifierId,
            version: null,
        };
        return this.memberService.saveMemberIdentifier(memberIdentifier, this.mpGroup).pipe(
            tap((resp) => {
                this.createMemberIdentifierSaved = true;
            }),
            catchError((error) => {
                this.createMemberIdentifierSaved = false;
                this.workInfoResponse = true;
                let errorMsg = "";
                if (error.status === ClientErrorResponseCode.RESP_400) {
                    errorMsg = this.languageSecondStringsArray["secondary.portal.register.personalInfo.badParameter"];
                } else if (error.status === ClientErrorResponseCode.RESP_409) {
                    errorMsg = this.languageSecondStringsArray["secondary.portal.census.manualEntry.duplicateEmployeeID"];
                } else {
                    errorMsg = this.showErrorAlertMessage(error);
                }
                this.workInfoMsg = this.workInfoMsg ? errorMsg : `${this.workInfoMsg}, ${errorMsg}`;
                return of(error);
            }),
        );
    }
    /**
     * Method to handle create/update member api error
     * @param error - API error to be handled
     */
    handleCreateMemberError(error: HttpErrorResponse): void {
        if (error.status === ClientErrorResponseCode.RESP_400) {
            this.workInfoMsg = this.duplicateContactError(error);
        } else if (error.status === ClientErrorResponseCode.RESP_409) {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.duplicate");
        } else if (error.status === ServerErrorResponseCode.RESP_500) {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.censusManualEntry.internalServerError");
        } else if (error.status === ClientErrorResponseCode.RESP_403) {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.censusManualEntry.permissionDenied");
        } else {
            this.workInfoMsg = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
        }
    }
    /**
     * This method will be called on occurrence of duplicate contact error for saveMemberContact()
     * @param erresp it is http error response
     * @returns language string on the basis of error response.
     */
    duplicateContactError(erresp: HttpErrorResponse): string {
        if (erresp.error.details && erresp.error.details.length && erresp.error.details[CHECK_ZERO_INDEX]) {
            if (erresp.error.details[CHECK_ZERO_INDEX].field.includes("email")) {
                return this.languageSecondStringsArray[
                    `secondary.portal.census.manualEntry.${erresp.status}.${erresp.error.code}.emailAddresses`
                ];
            }
            return this.languageSecondStringsArray[
                `secondary.portal.census.manualEntry.${erresp.status}.${erresp.error.code}.${erresp.error.details[CHECK_ZERO_INDEX].field}`
            ];
        }
        return this.languageSecondStringsArray["secondary.portal.register.personalInfo.badParameter"];
    }
    /**
     * This function is used to navigate to customer personal info tab
     */
    navigateToPersonalInfo(): void {
        if (this.errorResponse === false && this.memberId != null) {
            let url = "";
            const portal = this.portal.toLowerCase();
            url = `/${portal}/direct/customers/${this.mpGroup}/${this.memberId}/memberadd`;
            this.router
                .navigate([url, { id: this.memberId, mpGroupId: this.mpGroup }], {
                    skipLocationChange: true,
                })
                .finally(() => {
                    this.isLoading = false;
                    this.dialogRef.close();
                });
        }
    }
    /**
     * Function to add another dependent and validate the existing dependent
     */
    addAnotherDependent(): void {
        this.isLoading = true;
        this.validateDependentInfo(false);
    }
    /**
     * This function is used to modify memberObj based on isAccountRatingCodePEO boolean value
     * @param memberObject - previously initialize member object of type ValidateMemberProfile and
     * preparing workInfo object for passing members api call
     * @returns void
     */
    updateMemberObjForWorkTab(memberObject: ValidateMemberProfile): void {
        const workInfo = {
            occupation: this.workInfoForm.controls.jobTitle.value,
            employerName: this.workInfoForm.controls.employerName.value,
        };
        memberObject.workInformation = this.utilService.copy(workInfo);
    }
    /**
     * Method to save member's work information
     * @returns Observable of type HttpResponse
     */
    saveEmployeeWorkInformation(): Observable<HttpErrorResponse[]> {
        const workObservable: Observable<HttpErrorResponse>[] = [];
        if (this.workInfoForm.controls.employeeId && this.workInfoForm.controls.employeeId.value) {
            this.memberIdentifierId = this.workInfoForm.controls.employeeId.value;
            workObservable.push(this.getMemberIdentifierObservable());
        }
        if (!workObservable.length) {
            this.navigateAfterCreateMember();
        } else {
            return forkJoin(workObservable).pipe(
                tap((results) => {
                    const isError: boolean = results.some((res) => res !== null && res.error);
                    if (!isError) {
                        this.workInfoResponse = false;
                        this.navigateAfterCreateMember();
                    } else {
                        this.isLoading = false;
                    }
                }),
                takeUntil(this.unsubscribe$),
            );
        }
        return of(null);
    }
    checkRadioButtonValidations(control: any): any {
        if (control.value) {
            return null;
        }
        if (!control.value) {
            return { require: true };
        }
    }

    /**
     * This method is used to check the ZIP of the dependent
     * @param value: string; it is the zip value
     * @param index: number; it is the dependent index
     */
    checkDependentZip(value: string, index: number): void {
        const controlName = this.dependentsFormMap[index];
        const state = this.dependentsForm.controls[`${controlName}`]["controls"]["state"]["value"];
        const zipFormControl = this.dependentsForm.controls[`${controlName}`]["controls"]["zip"];
        this.subscriptions.push(validateStateAndZipCode(state, value, zipFormControl, this.staticService, this.sharedService));
    }
    /**
     * Function triggered when save and saveAndShop button is clicked and to validate the member
     * and redirecting to particular page
     * @param saveAndShop boolean to know if save or saveAndShop is clicked
     */
    onClickSaveAndShop(saveAndShop: boolean): void {
        this.isWorkInfoFormInvalid = true;
        if (this.workInfoForm.invalid) {
            this.workinfoflag = true;
            this.isEmployeeFormSubmit = false;
            this.isDependentFormInvalid = false;
            this.isWorkInfoFormInvalid = true;
            this.markFormGroupTouched(this.workInfoForm);
        } else {
            this.isLoading = true;
            if (!this.updateMemberFlag) {
                this.subscriptions.push(this.validateMember(true).subscribe());
            } else {
                this.saveEmployeeInformation();
            }
            this.saveAndShopFlag = saveAndShop;
        }
    }
    updateSpouse(index: number, relation: string, formName: string): void {
        if (relation === "Spouse" && !this.isSpouseSelected.length) {
            this.isSpouseSelected[0] = index;
            this.spouseFormName = formName;
        } else if (index === this.isSpouseSelected[0] && relation !== "Spouse") {
            this.isSpouseSelected.splice(0, 1);
            this.spouseFormName = "";
        }
    }
    updateSpouseSelection(formName: string): void {
        if (formName === this.spouseFormName) {
            this.isSpouseSelected.splice(0, 1);
            this.spouseFormName = "";
        }
    }
    specificShopNav(data: any): void {
        this.specificEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.specificEnrollmentMethod);
        this.visitedMpGroupStateObj = this.store.selectSnapshot(EnrollmentMethodState.visitedMpGroups);
        if (data.id) {
            this.enrollmentState = this.store.selectSnapshot(EnrollmentMethodState);
            this.store.dispatch(new SetMemberIdentity(data.id));
            this.store.dispatch(new SetMemberInfo(data));
            const mpGroupstring = this.mpGroup.toString();
            if (
                !(
                    this.specificEnrollmentObj &&
                    (this.specificEnrollmentObj.enrollmentMethod || this.specificEnrollmentObj.enrollmentState) &&
                    this.specificEnrollmentObj.mpGroup &&
                    this.specificEnrollmentObj.mpGroup === mpGroupstring &&
                    this.visitedMpGroupStateObj.indexOf(mpGroupstring) >= 0
                )
            ) {
                this.isLoading = false;
                this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                    data: {
                        mpGroup: this.mpGroup,
                        detail: data,
                        route: this.route,
                        stateAbbr: this.stateAbr,
                        openingFrom: "dashboard",
                    },
                });
            } else {
                const currentEnrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
                this.storedState = this.store.selectSnapshot(EnrollmentMethodState.getEnrollmentStateArray);
                if (
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.HEADSET ||
                    currentEnrollmentObj.enrollmentMethod === EnrollmentMethod.CALL_CENTER
                ) {
                    this.memberService
                        .getMemberContact(data.id, ContactType.HOME, mpGroupstring)
                        .pipe(take(1))
                        .subscribe((result) => {
                            if (result) {
                                if (!this.storedState.some((state) => state.abbreviation === result.body.address.state)) {
                                    this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroup,
                                            detail: data,
                                            route: this.route,
                                            stateAbbr: this.stateAbr,
                                            openingFrom: "dashboard",
                                        },
                                    });
                                } else {
                                    this.openConfirmAddressDialogForShop(data, currentEnrollmentObj);
                                }
                            }
                        });
                } else {
                    this.memberService
                        .getMemberContact(data.id, ContactType.HOME, mpGroupstring)
                        .pipe(take(1))
                        .subscribe((result) => {
                            if (result) {
                                if (
                                    (currentEnrollmentObj.enrollmentStateAbbreviation !== NY_ABBR &&
                                        result.body.address.state === NY_ABBR) ||
                                    (currentEnrollmentObj.enrollmentStateAbbreviation === NY_ABBR && result.body.address.state !== NY_ABBR)
                                ) {
                                    this.EnrollmentDialogRef = this.empoweredModalService.openDialog(EnrollmentMethodComponent, {
                                        data: {
                                            mpGroup: this.mpGroup,
                                            detail: data,
                                            route: this.route,
                                            stateAbbr: result.body.address.state,
                                        },
                                    });
                                } else {
                                    const newEnrollmentStateAbbr = result.body.address.state;
                                    const homeState = this.storedState.find((state) => state.abbreviation === newEnrollmentStateAbbr);
                                    const newEnrollmentStateName = homeState ? homeState.name : "";
                                    this.store.dispatch(new SetMemberIdentity(data.id));
                                    this.store.dispatch(new SetMemberInfo(data));
                                    this.store.dispatch(
                                        new SetEnrollmentMethodSpecific({
                                            enrollmentMethod: currentEnrollmentObj.enrollmentMethod,
                                            enrollmentState: this.enrollmentState.currentEnrollment.enrollmentState,
                                            enrollmentCity: this.enrollmentState.currentEnrollment.enrollmentCity,
                                            headSetState: newEnrollmentStateName,
                                            headSetStateAbbreviation: newEnrollmentStateAbbr,
                                            enrollmentStateAbbreviation: this.enrollmentState.currentEnrollment.enrollmentStateAbbreviation,
                                            userType: currentEnrollmentObj.userType,
                                            memberId: currentEnrollmentObj.memberId,
                                            mpGroup: currentEnrollmentObj.mpGroup,
                                        }),
                                    );
                                    if (!this.storedState.some((state) => state.abbreviation === newEnrollmentStateAbbr)) {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(true);
                                    } else {
                                        this.sharedService.changeProducerNotLicensedInCustomerState(false);
                                    }
                                    this.router.navigate(
                                        [
                                            // eslint-disable-next-line max-len
                                            `${this.portal}/direct/customers/${this.mpGroup}/${data.id}/enrollment/quote-shop/${this.mpGroup}/specific/`,
                                            +data.id,
                                        ],
                                        {
                                            relativeTo: this.route,
                                        },
                                    );
                                }
                            }
                        });
                }
            }
        }
    }
    /**
     * opens confirm address pop up and saves enrollment data required for shop page
     * @param details - member details with member id and work employee id
     * @param currentEnrollmentObj current enrollment data
     */
    openConfirmAddressDialogForShop(details: MemberListDisplayItem, currentEnrollmentObj: EnrollmentMethodModel): void {
        const confirmAddressDialogRef = this.dialog.open(ConfirmAddressDialogComponent, {
            width: "750px",
            data: { memberId: details.id, mpGroup: this.mpGroup, purpose: "shop" },
        });
        confirmAddressDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((addressResult) => {
                if (addressResult.action === SHOP_SUCCESS) {
                    this.store.dispatch(new SetMemberIdentity(details.id));
                    this.store.dispatch(new SetMemberInfo(details));
                    this.sharedService.setEnrollmentValuesForShop(addressResult, currentEnrollmentObj);
                    this.navigateToSpecificShop(details.id);
                }
            });
    }
    navigateToSpecificShop(customerId: number): void {
        this.router.navigate(
            [
                this.portal +
                    "/direct/customers/" +
                    `${this.mpGroup}/${customerId}` +
                    "/enrollment/quote-shop/" +
                    this.mpGroup +
                    "/specific/" +
                    customerId,
            ],
            {
                relativeTo: this.route,
            },
        );
    }
    /**
     * This method will open the address-verify modal.
     * @param option type of modal options
     * @param errorStatus API error status
     * @returns Observable of boolean which represents after the user selects the option whether action is to be taken or not
     */
    openModal(option: string, errorStatus?: number): Observable<boolean> {
        this.openAddressModal = true;
        const addressDialog = this.empoweredModalService.openDialog(AddressVerificationComponent, {
            data: {
                suggestedAddress: this.suggestedAddress,
                providedAddress: this.tempMemberAddress,
                addressResp: this.addressResp,
                addressMessage: this.addressMessage,
                option: option,
                errorStatus: errorStatus,
            },
        });
        return addressDialog.afterOpened().pipe(
            tap(() => (this.isLoading = false)),
            switchMapTo(addressDialog.afterClosed()),
            map((verifyAddressData) => {
                if (verifyAddressData && verifyAddressData.data.isVerifyAddress) {
                    this.isLoading = true;
                    this.selectedAddress = verifyAddressData.data.selectedAddress;
                    this.memberContactInfoSave$.next(this.isMemberContactSaved);
                }
                if (!verifyAddressData || !verifyAddressData.data.isVerifyAddress) {
                    this.closeModal();
                    return false;
                }
                return verifyAddressData;
            }),
            filter((verifyAddressData) => verifyAddressData && verifyAddressData.data.isVerifyAddress),
            switchMapTo(this.validateMember(false)),
        );
    }
    // This method will close address-verify modal.
    closeModal(): void {
        this.openAddressModal = false;
        this.changeStepper = this.step1;
        this.addressResp = false;
    }
    /**
     * This method will be trigger when user will click on next in verify address popup.
     * @returns void
     */
    nextAfterVerifyAdress(): void {
        this.saveMemberContact();
    }
    /**
     * This method will update the verified address .
     * @param tempMemberAddress  user provided address.
     * @returns void
     */
    verifyAddressDetails(tempMemberAddress: PersonalAddress): void {
        this.subscriptions.push(
            this.memberService
                .verifyMemberAddress(tempMemberAddress)
                .pipe(
                    tap((resp) => {
                        this.addressResp = false;
                        this.suggestedAddress = resp.suggestedAddress;
                    }),
                    switchMap((resp) => {
                        if (resp.matched) {
                            this.memberContactInfoSave$.next(this.isMemberContactSaved);
                            return this.openModal(ADDRESS_SINGLE_OPTION);
                        }
                        return this.openModal(ADDRESS_BOTH_OPTION).pipe(tap((res) => of(res)));
                    }),
                    catchError((error) => {
                        this.addressResp = true;
                        this.isLoading = false;
                        this.addressMessage = [];
                        if (error.status === ClientErrorResponseCode.RESP_400) {
                            if (error.error && error.error.details) {
                                error.error.details.map((item) => this.addressMessage.push(item.message));
                            } else {
                                this.addressMessage.push(
                                    this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.invalidAdressdata"),
                                );
                            }
                        } else if (error.status === ServerErrorResponseCode.RESP_503) {
                            this.addressMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.directAccount.serverUnreachable"),
                            );
                        } else if (error.status === ServerErrorResponseCode.RESP_500) {
                            this.addressMessage.push(
                                this.language.fetchSecondaryLanguageValue("secondary.portal.accountPendingEnrollments.internalServer"),
                            );
                        } else if (error.error.details.length) {
                            this.addressMessage.push(error.error.details[0].message);
                        }
                        if (!this.openAddressModal) {
                            return this.openModal(ADDRESS_SINGLE_OPTION, error.status).pipe(tap((res) => of(res)));
                        }
                        return undefined;
                    }),
                )
                .subscribe(),
        );
    }
    /**
     * Method to close the form
     * @param memberId member id
     * @returns void
     */
    closeFormOnSuccess(memberId: string): void {
        this.dialogRef.close(memberId);
    }
    /**
     * This function is used to check api error response
     * @param err Api error response
     * @returns error message from language table
     */
    showErrorAlertMessage(err: Error): string {
        const error = err["error"];
        let errorMessage;
        if (error.status === AppSettings.API_RESP_403) {
            errorMessage = this.languageSecondStringsArray["secondary.portal.common.sorryPermissionDenied"];
        } else if (error.status === AppSettings.API_RESP_409) {
            errorMessage = this.languageSecondStringsArray["secondary.portal.common.memberAlreadyExists"];
        } else if (error.status === AppSettings.API_RESP_500) {
            errorMessage = this.languageSecondStringsArray["secondary.portal.common.internalServerError"];
        } else if (error.status === AppSettings.API_RESP_400) {
            if (error.details[0].message === INVALID_BIRTH_DATE) {
                errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.invalidDateOfBirth");
            } else {
                errorMessage = this.languageSecondStringsArray["secondary.portal.register.personalInfo.badParameter"];
            }
        } else {
            errorMessage = this.language.fetchPrimaryLanguageValue("primary.portal.census.manualEntry.notSaved");
        }
        return errorMessage;
    }

    /**
     * Creates object to be passed to create and update dependent endpoints in the request body
     *
     * @param formControl has dependent's info
     * @returns dependent info in the required format
     */
    getDependentForm(formControl: { [key: string]: AbstractControl }): MemberDependent {
        return {
            name: {
                firstName: formControl.firstName.value.trim(),
                lastName: formControl.lastName.value.trim(),
            },
            birthDate: this.datePipe.transform(formControl.birthDate.value, this.dateFormat),
            gender: formControl.gender.value,
            dependentRelationId: +formControl.dependentRelationId.value,
            state: formControl.state.value,
        };
    }

    /**
     * Checking for duplicate dependent in list.
     * @returns boolean flag for having duplicate dependent
     */
    checkDuplicateDependent(): boolean {
        const dependentList: MemberDependent[] = this.dependentsFormMap.map((form) =>
            this.getDependentForm(this.dependentsForm.controls[form][FORM_CONTROLS]),
        );
        return dependentList.some(
            (dependent) =>
                dependentList.filter(
                    (record) =>
                        (record.dependentRelationId === dependent.dependentRelationId &&
                            record.dependentRelationId === RELATION_IDS.spouse) ||
                        (record.name.firstName === dependent.name.firstName &&
                            record.name.lastName === dependent.name.lastName &&
                            record.birthDate === dependent.birthDate),
                ).length > 1,
        );
    }

    ngOnDestroy(): void {
        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
