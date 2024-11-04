/* eslint-disable no-unused-expressions */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable no-underscore-dangle */
import {
    Component,
    OnInit,
    Input,
    OnDestroy,
    EventEmitter,
    Output,
    AfterViewChecked,
    ChangeDetectorRef,
    ElementRef,
    ViewChild,
} from "@angular/core";
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl } from "@angular/forms";
import {
    MemberService,
    County,
    AccountService,
    DependentContact,
    StaticService,
    HideReadOnlyElementSetting,
    MemberIdentifierType,
    DependentVerification,
    GenderDetails,
    SSNMask,
    AccountDetails,
} from "@empowered/api";

import { ProfileChangesConfirmPromptComponent, ConfirmationDialogData, MembersBusinessService } from "@empowered/ui";
import { Store, Select } from "@ngxs/store";
import { Subscription, Subject, Observable, EMPTY, iif, defer, combineLatest, concat, of } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { DependentExitDialogComponent } from "../dependent-exit-dialog/dependent-exit-dialog.component";
import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { NgxMaskPipe } from "ngx-mask";

import {
    ConfigName,
    ClientErrorResponseCode,
    ClientErrorResponseType,
    MemberHeight,
    MemberProfileChanges,
    BeneficiaryType,
    AppSettings,
    ProfileChangesConfirmModel,
    VerificationStatus,
    Address,
    ContactType,
    Configurations,
    CountryState,
    MemberBeneficiary,
    TobaccoStatus,
    Vocabulary,
    Relations,
    MemberDependent,
    MemberContact,
} from "@empowered/constants";
import { filter, map, tap, switchMap, catchError, takeUntil, reduce, take, mergeMap } from "rxjs/operators";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import {
    DependentListState,
    SetActiveDependentId,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const LOCATION = "location";
const SLASH = "/";
const SELECT = "Select";
const HEIGHT_FEET = "heightFeet";
const HEIGHT_INCH = "heightInch";
const ITIN = "ITIN";
const SSN_MIN_LENGTH = 11;

@Component({
    selector: "empowered-dependent-personal-info",
    templateUrl: "./dependent-personal-info.component.html",
    styleUrls: ["./dependent-personal-info.component.scss"],
    providers: [DatePipe],
})
export class DependentPersonalInfoComponent implements OnInit, OnDestroy, AfterViewChecked {
    @ViewChild("zipInput") zipInput: ElementRef;
    title = "dependent";
    suffixes: string[];
    states: CountryState[];
    counties: County[];
    countries: string[];
    heightFeets = MemberHeight.MEMBER_HEIGHTINFEET;
    heightInches = AppSettings.HEIGHTININCH;
    ethnicities: string[];
    genders: GenderDetails[];
    relations: Relations[];
    maritalStatuses: string[];
    citizenships: string[];
    languagePreferences: any[];
    tobaccoUsers: any[];
    verificationStatusList = [VerificationStatus.VERIFIED, VerificationStatus.UNVERIFIED, VerificationStatus.REJECTED];
    dependentVerificationStatus: DependentVerification;
    statusVerified = "VERIFIED";
    statusUnverified = "UNVERIFIED";
    statusRejected = "REJECTED";
    statusApprove = "APPROVE";
    statusReject = "REJECT";
    isHomeAddressSameAsEmployee = false;
    isStudent: boolean;
    initialAddress: DependentContact;
    emptyAddress: DependentContact = {
        address: {
            address1: null,
            address2: null,
            city: null,
            state: null,
            zip: null,
            countyId: null,
            country: null,
        },
    };
    contact: DependentContact = {
        address: {
            address1: null,
            address2: null,
            city: null,
            state: null,
            zip: null,
            countyId: null,
            country: null,
        },
    };
    employeeAddress: Address;
    initialFormValues: MemberDependent;
    personalInfoForm: FormGroup;
    memberId: number;
    MpGroup = 0;
    beneficiaryEnum = BeneficiaryType;
    heightInFeet: number;
    heightInInch: number;
    dependentResponse: MemberDependent = null;
    dependentContact: DependentContact;
    maxDate = new Date();
    previousMinDate = new Date();
    minDate: Date;
    subscriber: Subscription[] = [];
    memberAddress: DependentContact;
    dependentAddress: DependentContact;
    memberIdentifierTypes: MemberIdentifierType[] = [];
    dependentSsn: string;
    validationConfigurations = [];
    editForm: boolean;
    addForm: boolean;
    checkAlert = false;
    isLoading: boolean;
    navigationFlag: boolean;
    showErrorMessage: boolean;
    errorMessage: string;
    errorMessageArray = [];
    spouseMinAge: number;
    childMaxAge: number;
    stateChildMaxAge: number;
    nyChildMaxAge: number;
    isMemberAndDependentAddressSame: boolean;
    isSaved: boolean;
    customIdFields: any;
    dateErrorMessage: boolean;
    dependentContactForEdit: DependentContact = {
        address: {
            address1: null,
            address2: null,
            city: null,
            state: null,
            zip: null,
            countyId: null,
            country: null,
        },
    };
    submitPersonalInfoForm: FormGroup;
    isMaskedTrue: boolean;
    isPartiallyMasked = false;
    isFullyMasked = false;
    isFullyVisible = false;
    maskedSSNReadonly: boolean;
    maskedSSNValue: string;
    unmaskedSSNValue: string;
    maskedSSN: string;
    portal: string;
    isMember: boolean;
    initialCustomIDs = {};
    SSN = "ssn";
    SPOUSE = "spouse";
    CHILD = "child";
    GRANDCHILD = "grandchild";
    WI_STATE = "WI";
    NY_STATE = "NY";
    BODY = "body";
    PROFILE = "profile";
    STUDENT = "student";
    FORMVALIDATIONPATH = "portal.member.form.personalInfoForm.*";
    HOMEADDRESSSAMEASEMPLOYEE = "homeAddressSameAsEmployee";
    FORBIDDEN = "forbidden";
    REQUIRED = "required";
    NAME = "name";
    FIRSTNAME = "firstName";
    LASTNAME = "lastName";
    ADDRESS = "address";
    ZIP = "zip";
    COUNTYID = "countyId";
    readonly HIDDEN = "hidden";
    READONLY = "readonly";
    SSNID = "1";
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    BIRTHDATE = "birthDate";
    DISABLED = "disabled";
    CITY = "city";
    ADDRESS1 = "address1";
    nameWithHypenApostrophesValidation: RegExp;
    invalidSSNValidation: any;
    isFormValueChange = false;
    isDirectCustomer: boolean;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        suffix: true,
        maidenName: true,
        nickname: true,
        homeAddressSameAsEmployee: true,
        address1: true,
        address2: true,
        city: true,
        state: true,
        zip: true,
        countyId: true,
        country: true,
        birthDate: true,
        gender: true,
        dependentRelationId: true,
        birthState: true,
        heightFeet: true,
        heightInch: true,
        height: true,
        weight: true,
        ethnicity: true,
        maritalStatus: true,
        citizenship: true,
        driversLicenseNumber: true,
        driversLicenseState: true,
        languagePreference: true,
        tobaccoStatus: true,
        medicareEligibility: true,
        dependentOrder: true,
        disabled: true,
        handicapped: true,
        hiddenFromEmployee: true,
        verified: true,
        ineligibleForCoverage: true,
        courtOrdered: true,
        student: true,
        school: true,
        ssn: true,
        verificationStatus: true,
    };
    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        id: false,
        firstName: false,
        middleName: false,
        lastName: false,
        suffix: false,
        maidenName: false,
        nickname: false,
        homeAddressSameAsEmployee: false,
        address1: false,
        address2: false,
        city: false,
        state: false,
        zip: false,
        countyId: false,
        country: false,
        birthDate: false,
        gender: false,
        dependentRelationId: false,
        birthState: false,
        heightFeet: false,
        heightInch: false,
        height: false,
        weight: false,
        ethnicity: false,
        maritalStatus: false,
        citizenship: false,
        driversLicenseNumber: false,
        driversLicenseState: false,
        languagePreference: false,
        tobaccoStatus: false,
        medicareEligibility: false,
        dependentOrder: false,
        disabled: false,
        handicapped: false,
        hiddenFromEmployee: false,
        verified: false,
        ineligibleForCoverage: false,
        courtOrdered: false,
        student: false,
        school: false,
        ssn: false,
        verificationStatus: false,
    };
    ssnErrorMessage = "";
    ssnMaxLength = 11;
    ssnMaskedLength = 5;
    zipMinLength = 5;
    zipMaximumLength = 10;
    spouseAgeErrorString = "";
    @Input() routeMemberId: number;
    @Input() routeDependentId: number;
    @Output() updateName: EventEmitter<string> = new EventEmitter<string>();
    @Output() dependentSaved: EventEmitter<boolean> = new EventEmitter();
    allowNavigation: Subject<boolean>;
    isAddress1Mandatory = true;
    isCityMandatory = true;
    langStrings = {};
    requiredFields = [];
    isDateInvalid = false;
    isContactInfoChange = false;
    validationRegex: any;
    @Select(SharedState.regex) regex$: Observable<any>;
    regexSubscription: Subscription;
    language: any;
    readonly UNKNOWN = "UNKNOWN";
    isCustomIdChanged: boolean;
    memberAddress$: Observable<DependentContact>;
    memberIdentifierTypes$: Observable<MemberIdentifierType[]>;
    hiddenFromEmployee$ = this.staticUtil.cacheConfigValue(ConfigName.HIDDEN_FROM_EMPLOYEE);
    hideIneligibleForCoverage$ = this.staticUtil.cacheConfigValue(ConfigName.INELIGIBLE_FOR_COVERAGE);
    hideDisabledCheckbox$ = this.staticUtil.cacheConfigValue(ConfigName.HIDE_DISABLED_CHECKBOX);
    accountInfo: AccountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
    nyAccount = false;
    WIStatedependantErrorMessage: string;
    isAge = false;
    childId: number;
    spouseId: number;
    grandchildId: number;
    CHILD_MAX_AGE_INDEX = 1;
    isInchDisabled: boolean;
    private readonly unsubscribe$: Subject<void> = new Subject();
    ftSelect = SELECT;
    inchSelect = SELECT;
    feet = "Feet";
    inch = "Inches";
    ssnMinLength = SSN_MIN_LENGTH;
    currentProfileData = new Map<string, string>();
    updatedProfileData = new Map<string, string>();
    hasCIFNumber = false;
    languageStrings = {
        lastName: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.lastName"),
        firstName: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.firstName"),
        ssn: this.languageService.fetchPrimaryLanguageValue("primary.portal.member.ssn_itin"),
        gender: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.gender"),
        streetAddress1: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.streetAddress1"),
        streetAddress2: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.streetAddress2"),
        city: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.city"),
        state: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.state"),
        zip: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.personalLabel.zip"),
    };
    isStandaloneDemographicEnabled: boolean;

    constructor(
        private readonly memberService: MemberService,
        private readonly staticService: StaticService,
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly _accountService: AccountService,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly cd: ChangeDetectorRef,
        private readonly languageService: LanguageService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly utilService: UtilService,
        private readonly router: Router,
        private readonly staticUtil: StaticUtilService,
        private readonly membersBusinessService: MembersBusinessService,
        private readonly modalService: EmpoweredModalService,
        private readonly sharedService: SharedService,
        private readonly dateService: DateService,
    ) {
        this.isSaved = false;
    }
    /**
     * Function to fetch language strings from DB based on the key
     */
    getLanguageStrings(): void {
        const primaryLanguageValues = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.members.dependent.personalInfo.title",
            "primary.portal.common.show",
            "primary.portal.common.hide",
            "primary.portal.members.personalLabel.tobaccoText",
            "primary.portal.members.personalLabel.nonTobaccoText",
            "primary.portal.members.personalLabel.undefinedText",
            "primary.portal.common.placeholderSelect",
            "primary.portal.common.optional",
            "primary.portal.members.dependent.personalInfo.firstName",
            "primary.portal.members.dependent.personalInfo.middleName",
            "primary.portal.members.dependent.personalInfo.lastName",
            "primary.portal.members.dependent.personalInfo.maidenName",
            "primary.portal.members.dependent.personalInfo.nickName",
            "primary.portal.members.dependent.personalInfo.streetAddress1",
            "primary.portal.members.dependent.personalInfo.streetAddress2",
            "primary.portal.members.dependent.personalInfo.city",
            "primary.portal.members.dependent.personalInfo.zip",
            "primary.portal.members.dependent.personalInfo.birthDate",
            "primary.portal.members.dependent.personalInfo.weight",
            "primary.portal.members.dependent.personalInfo.optionYes",
            "primary.portal.members.dependent.personalInfo.ariaUndoChanges",
            "primary.portal.members.dependent.personalInfo.ariaSave",
            "primary.portal.members.dependent.personalInfo.ariaSaved",
            "primary.portal.common.save",
            "primary.portal.common.doNotSave",
            "primary.portal.census.manualEntry.zipErrorMsg",
            "primary.portal.common.select",
            "primary.portal.members.personalLabel.heightFeet",
            "primary.portal.members.personalLabel.heightInches",
            "primary.portal.common.selectFt",
            "primary.portal.common.selectIn",
            "primary.portal.members.personalLabel.select",
            "primary.portal.members.api.ssn.duplicate.nonMmp",
            "primary.portal.members.dependentValidationMsg.WIState",
            "primary.portal.member.ssn_itin",
            "primary.portal.members.api.ssn_itin.duplicate.nonMmp",
        ]);
        const secondaryLanguageValues = this.languageService.fetchSecondaryLanguageValues([
            "secondary.portal.members.dependent.personalInfo.tabChangeMsg",
            "secondary.portal.common.invalidDateFormat",
            "secondary.portal.members.requiredField",
            "secondary.portal.applicationFlow.demographics.invalidHeight",
            "secondary.portal.members.selectionRequired",
            "secondary.portal.census.manualEntry.spouseValidAge",
        ]);
        this.langStrings = Object.assign([], primaryLanguageValues, secondaryLanguageValues);
    }
    /**
     * This method is responsible for getting memberidentifier and member address along with member dependent and dependent contact
     * @returns void
     */
    ngOnInit(): void {
        this.isInchDisabled = true;
        this.subscriber.push(
            this.regex$.subscribe((data) => {
                if (data) {
                    this.validationRegex = data;
                }
            }),
        );
        if (this.router.url.indexOf(AppSettings.DIRECT) >= 0) {
            this.isDirectCustomer = true;
        }
        this.getLanguageStrings();
        const mpGroup = this.store.selectSnapshot(DependentListState.groupId);
        this.MpGroup = mpGroup ? mpGroup : this.route.parent.snapshot.parent.parent.params.prospectId;
        this.memberId = this.store.selectSnapshot(DependentListState.memberId);
        this.isFullyVisible = true;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.getUserType();
        this.subscriber.push(this.membersBusinessService.getSpinnerStatus().subscribe((response) => (this.isLoading = response)));
        this.checkAlert = true;
        this.isLoading = true;
        this.hideErrorAlertMessage();
        this.nameWithHypenApostrophesValidation = new RegExp(this.validationRegex.NAME_WITH_HYPENS_APOSTROPHES);
        this.invalidSSNValidation = new RegExp(this.validationRegex.INVALID_SSN);
        this.getMemberIdentifierType();
        this.getMemberAddress();
        this.constructFormControls();
        this.getDropdownValuesFromAPI();
        this.createListners();
        this.getConfigurations();
        this.getEmployeeLanguage();
        this.routeDependentId = this.store.selectSnapshot(DependentListState.activeDependentId);
        if (this.routeDependentId) {
            this.isLoading = true;
            this.getMemberDependent();
            this.editForm = true;
            this.dependentSaved.emit(true);
            this.addForm = false;
            this.getDependentContact(this.memberId, this.routeDependentId.toString(), this.MpGroup);
            this.getDependentVerificationStatus();
        } else {
            this.subscriber.push(this.memberIdentifierTypes$.subscribe());
            this.initialFormValues = {} as MemberDependent;
            this.editForm = false;
            this.addForm = true;
            this.configureAddress1AndCity();
        }
        this.setCurrentProfileData();
        this.initialAddress = this.emptyAddress;
        this.isDateInvalid = true;
        this.tobaccoUsers = [
            {
                name: TobaccoStatus.TOBACCO,
                value: this.langStrings["primary.portal.members.personalLabel.tobaccoText"],
            },
            {
                name: TobaccoStatus.NONTOBACCO,
                value: this.langStrings["primary.portal.members.personalLabel.nonTobaccoText"],
            },
            {
                name: TobaccoStatus.UNDEFINED,
                value: this.langStrings["primary.portal.members.personalLabel.undefinedText"],
            },
        ];
        this.subscriber.push(
            this.personalInfoForm.controls.profile.get(HEIGHT_FEET).valueChanges.subscribe((heightFt) => {
                this.isInchDisabled = false;
                if (heightFt === this.ftSelect || Number.isNaN(heightFt) || heightFt === "") {
                    this.personalInfoForm.controls.profile.patchValue({
                        heightInch: SELECT,
                    });
                    this.inchSelect = SELECT;
                    this.isInchDisabled = true;
                }

                this.checkHeight();
            }),
        );
        this.subscriber.push(
            this.personalInfoForm.controls.profile.get(HEIGHT_INCH).valueChanges.subscribe((heightIn) => {
                this.checkHeight();
            }),
        );
        this.setCurrentProfileData();
    }

    /**
     * Function to add form data to map for comparison
     * @param data data which is to stored
     * @param dataMap map where the member data is to be updated
     */
    setProfileData(data: ProfileChangesConfirmModel, dataMap: Map<string, string>): void {
        dataMap.set("lastName", data.lastName);
        dataMap.set("firstName", data.firstName);
        dataMap.set("ssn", data.ssn);
        dataMap.set("address1", data.address1);
        dataMap.set("address2", data.address2);
        dataMap.set("city", data.city);
        dataMap.set("state", data.state);
        dataMap.set("zip", data.zip);
        dataMap.set("gender", data.gender);
    }

    /**
     * Function to set existing data
     */
    setCurrentProfileData(): void {
        combineLatest([
            this.memberService.getMemberDependent(this.routeMemberId, this.routeDependentId, true, this.MpGroup),
            this.memberService.getDependentContact(this.memberId, this.routeDependentId.toString(), this.MpGroup),
        ])
            .pipe(
                tap(([dependentProfile, contactData]) => {
                    this.hasCIFNumber = !!dependentProfile?.customerInformationFileNumber;
                    this.setProfileData(
                        {
                            lastName: dependentProfile.name.lastName,
                            firstName: dependentProfile.name.firstName,
                            ssn: null,
                            address1: contactData.address.address1,
                            address2: contactData.address.address2,
                            city: contactData.address.city,
                            state: contactData.address.state,
                            zip: contactData.address.zip,
                            gender: dependentProfile.gender,
                        },
                        this.currentProfileData,
                    );
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.memberService
            .getMemberIdentifierTypes()
            .pipe(
                mergeMap((result) => result),
                filter((res) => res.type === "SSN"),
                mergeMap((response) =>
                    this.memberService.getDependentIdentifier(
                        this.memberId,
                        this.routeDependentId.toString(),
                        response.id,
                        this.MpGroup,
                        false,
                    ),
                ),
                filter(([memberIdentifier]) => !!memberIdentifier),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((dependentIdentifier) => this.currentProfileData.set("ssn", dependentIdentifier));
    }

    ngAfterViewChecked(): void {
        this.cd.detectChanges();
    }

    getUserType(): void {
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMember = true;
        } else {
            this.isMember = false;
        }
    }

    changeAddEditAction(): void {
        this.editForm = true;
        this.addForm = false;
    }

    /**
     * This method is used for getting the member Address
     * @returns void
     */
    getMemberAddress(): void {
        this.memberAddress$ = this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.MpGroup.toString()).pipe(
            tap((address: DependentContact) => {
                this.memberAddress = address[this.BODY];
            }),
        );
    }

    /**
     * This method will return whether the member address and dependent address are same or not
     * @param memberAddress details of member address
     * @param dependentAddress details of dependent address
     * @returns boolean
     */
    compareMemberAndDependentAddress(memberAddress: DependentContact, dependentAddress: DependentContact): boolean {
        const memberAddr = memberAddress.address;
        const dependentAddr = dependentAddress.address;
        const keys = new Set(Object.keys(memberAddr).concat(Object.keys(dependentAddr)));
        let flag = true;
        keys.forEach((key) => {
            if (
                (memberAddr[key] && memberAddr[key] === "" && dependentAddr[key] && dependentAddr[key] !== null) ||
                (!memberAddr[key] && dependentAddr[key] && dependentAddr[key] !== null) ||
                (!dependentAddr[key] && memberAddr[key] && memberAddr[key] !== null)
            ) {
                flag = false;
            } else if (memberAddr[key] && dependentAddr[key] && memberAddr[key] !== dependentAddr[key]) {
                flag = false;
            }
        });
        return flag;
    }
    /**
     * Initializes personal info form.
     */
    constructFormControls(): void {
        this.personalInfoForm = this.fb.group({
            id: [""],
            name: this.fb.group(
                {
                    firstName: ["", Validators.compose([Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)])],
                    middleName: ["", Validators.pattern(this.validationRegex.NAME)],
                    lastName: ["", Validators.pattern(this.validationRegex.NAME_WITH_SPACE_ALLOWED)],
                    suffix: [""],
                    maidenName: ["", Validators.pattern(this.validationRegex.NAME)],
                    nickname: ["", Validators.pattern(this.validationRegex.NAME)],
                },
                { updateOn: "blur" },
            ),
            homeAddressSameAsEmployee: [""],
            address: this.fb.group({
                address1: [
                    "",
                    {
                        validators: Validators.compose([
                            Validators.pattern(this.validationRegex.ADDRESS),
                            Validators.maxLength(AppSettings.MAX_LENGTH_100),
                        ]),
                        updateOn: "blur",
                    },
                ],
                address2: [
                    "",
                    {
                        validators: Validators.compose([
                            Validators.pattern(this.validationRegex.ADDRESS),
                            Validators.maxLength(AppSettings.MAX_LENGTH_100),
                        ]),
                        updateOn: "blur",
                    },
                ],
                city: [
                    "",
                    {
                        validators: Validators.compose([
                            Validators.pattern(this.validationRegex.NAME_WITH_SPACE_BETWEEN_WORDS),
                            Validators.maxLength(AppSettings.MAX_LENGTH_100),
                        ]),
                        updateOn: "blur",
                    },
                ],
                state: [""],
                zip: ["", Validators.pattern(this.validationRegex.ZIP_CODE)],
                countyId: ["", { updateOn: "blur" }],
                country: ["", { updateOn: "blur" }],
            }),
            birthDate: [""],
            gender: ["", { updateOn: "blur" }],
            dependentRelationId: [""],
            profile: this.fb.group({
                birthState: ["", { updateOn: "blur" }],
                heightFeet: ["", { updateOn: "blur" }],
                heightInch: ["", { updateOn: "blur" }],
                height: ["", { updateOn: "blur" }],
                weight: ["", Validators.pattern(this.validationRegex.WEIGHT)],
                ethnicity: ["", { updateOn: "blur" }],
                maritalStatus: ["", { updateOn: "blur" }],
                citizenship: ["", { updateOn: "blur" }],
                driversLicenseNumber: ["", { updateOn: "blur" }],
                driversLicenseState: ["", { updateOn: "blur" }],
                languagePreference: [Vocabulary.ENGLISH, { updateOn: "blur" }],
                tobaccoStatus: ["", { updateOn: "blur" }],
                medicareEligibility: ["", { updateOn: "blur" }],
                dependentOrder: ["", { updateOn: "blur" }],
                disabled: [""],
                handicapped: ["", { updateOn: "blur" }],
                hiddenFromEmployee: ["", { updateOn: "blur" }],
                verified: [VerificationStatus.UNVERIFIED, { updateOn: "blur" }],
                ineligibleForCoverage: ["", { updateOn: "blur" }],
                courtOrdered: ["", { updateOn: "blur" }],
                student: [""],
                school: ["", { updateOn: "blur" }],
            }),
            customID: this.fb.group({}),
            verificationStatus: ["", { updateOn: "blur" }],
            state: [""],
        });
    }

    get customIDAliases(): FormGroup {
        return this.personalInfoForm.get("customID") as FormGroup;
    }

    settingValidations(regiForm: FormGroup): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (key === this.ADDRESS1 || key === this.CITY) {
                return;
            }
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.REQUIRED)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = false;
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = true;
            }
        });
    }

    getValidationValueForKey(key: string, validationString: string): boolean {
        let flag = false;
        this.validationConfigurations.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === validationString.toLowerCase()
            ) {
                flag = true;
                this.requiredFields.push(element);
            }
        });
        return flag;
    }

    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.personalInfoForm.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }
    /**
     * Method to get all the data for the dropdowns.
     */
    getDropdownValuesFromAPI(): void {
        // TODO: Need to get these values form common store
        this.subscriber.push(
            this.staticService.getStates().subscribe(
                (res) => {
                    this.states = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this.staticService.getSuffixes().subscribe(
                (res) => {
                    this.suffixes = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this.staticService.getCountries().subscribe(
                (res) => {
                    this.countries = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this.staticService.getEthnicities().subscribe(
                (res) => {
                    this.ethnicities = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this.staticService.getGenders().subscribe(
                (res) => {
                    this.genders = this.memberService.refactorGenders(res);
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this.staticService.getMaritalStatuses().subscribe(
                (res) => {
                    this.maritalStatuses = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this.staticService.getUSCitizenshipOptions().subscribe(
                (res) => {
                    this.citizenships = res;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
        this.subscriber.push(
            this._accountService.getDependentRelations(this.MpGroup).subscribe(
                (res) => {
                    this.relations = res;
                    const spouse = this.relations.find((dep) => dep.relationType.toLowerCase() === this.SPOUSE);
                    const child = this.relations.find((dep) => dep.relationType.toLowerCase() === this.CHILD);
                    const grandchild = this.relations.find((dep) => dep.name.toLowerCase() === this.GRANDCHILD);
                    this.spouseId = spouse ? spouse.id : undefined;
                    this.childId = child ? child.id : undefined;
                    this.grandchildId = grandchild ? grandchild.id : undefined;
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
    }

    getEmployeeLanguage(): void {
        this.subscriber.push(
            this._accountService.getVocabularies(this.MpGroup.toString()).subscribe((Response) => {
                this.languagePreferences = Response;
            }),
        );
    }

    populateHomeAddress(): void {
        if (this.isHomeAddressSameAsEmployee) {
            if (this.memberAddress) {
                this.getCounties(this.memberAddress.address.state);
            }
            this.personalInfoForm.controls.address.disable();
        } else {
            this.personalInfoForm.controls.address.enable();
            if (this.dependentAddress) {
                this.getCounties(this.dependentAddress.address.state);
            }
        }
    }

    getCounties(stateCode: any): void {
        if (stateCode) {
            this.isLoading = true;
            this.subscriber.push(
                this.staticService.getCounties(stateCode).subscribe(
                    (res) => {
                        this.counties = res;
                        if ((this.editForm || this.addForm) && this.personalInfoForm.controls.homeAddressSameAsEmployee.value) {
                            this.patchMemberAddress();
                        }
                        this.isLoading = false;
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                ),
            );
        } else {
            this.counties = [];
        }
    }

    patchMemberAddress(): void {
        if (this.memberAddress) {
            this.personalInfoForm.patchValue({ address: this.memberAddress.address });
        }
    }

    /**
     * Function to submit form data
     * @param boolean true if tab is changed
     * @return Observable<boolean> if the submission is valid or not
     */
    onSubmit(isTabChange: boolean): Observable<boolean> {
        const formControl = this.personalInfoForm.controls;
        this.personalInfoForm.patchValue({ state: formControl.address.value.state });
        this.isContactInfoChange = formControl.address.dirty;
        this.isCustomIdChanged = formControl.customID.dirty;
        this.submitPersonalInfoForm = this.personalInfoForm;
        this.customIdFields = this.submitPersonalInfoForm.value.customID;
        delete this.submitPersonalInfoForm.value.customID;
        if (this.hasCIFNumber && !isTabChange && this.isStandaloneDemographicEnabled) {
            this.openConfirmationModal();
            return of(true);
        } else {
            return this.submitForm();
        }
    }

    /**
     * Function to open profile confirmation changes modal
     */
    openConfirmationModal(): void {
        this.compareUpdatedData();
        if (!this.getProfileChangesData().length) {
            this.submitForm();
        } else {
            if (this.isStandaloneDemographicEnabled) {
                this.modalService
                    .openDialog(ProfileChangesConfirmPromptComponent, {
                        data: {
                            data: this.getProfileChangesData(),
                            isAgentAssisted: false,
                        },
                    })
                    .afterClosed()
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        filter((isSaved) => !!isSaved),
                        tap(() => {
                            this.saveProfileChangesData();
                        }),
                    )
                    .subscribe();
            } else {
                this.saveProfileChangesData();
            }
        }
    }

    /**
     * Function to save the profile changes
     */
    saveProfileChangesData(): void {
        const nameControl = this.personalInfoForm.get(MemberProfileChanges.NAME);
        const addressControl = this.personalInfoForm.get(MemberProfileChanges.ADDRESS);
        this.setProfileData(
            {
                firstName: nameControl.get(MemberProfileChanges.FIRSTNAME).value,
                lastName: nameControl.get(MemberProfileChanges.LASTNAME).value,
                ssn:
                    this.personalInfoForm.get("customID").get("SSN").value && this.unmaskedSSNValue
                        ? this.unmaskedSSNValue.replace(/-/g, "")
                        : null,
                gender: this.personalInfoForm.get(MemberProfileChanges.GENDER).value,
                address1: addressControl.get(MemberProfileChanges.ADDRESS1).value,
                address2: addressControl.get(MemberProfileChanges.ADDRESS2).value,
                city: addressControl.get(MemberProfileChanges.CITY).value,
                state: addressControl.get(MemberProfileChanges.STATE).value,
                zip: addressControl.get(MemberProfileChanges.ZIP).value,
            },
            this.currentProfileData,
        );
        this.updatedProfileData.clear();
        this.submitForm();
    }

    /**
     * Function to fetch updated profile data
     * @return string[] updated data
     */
    getProfileChangesData(): string[] {
        const updatedData: string[] = [];
        for (const key of this.updatedProfileData.keys()) {
            if (this.updatedProfileData.get(key) !== null) {
                updatedData.push(this.updatedProfileData.get(key));
            }
        }
        return updatedData;
    }

    /**
     * Function to get the updated SSN value
     * @return updated ssn
     */
    getSSNUpdatedValue(): string {
        const ssnControl = this.personalInfoForm.get("customID").get("SSN");
        const currentSSN = this.currentProfileData.get(MemberProfileChanges.SSN);
        const unmaskedSSN = ssnControl.touched && ssnControl.value ? this.unmaskedSSNValue.replace(/-/g, "") : null;
        return ssnControl.touched && currentSSN !== unmaskedSSN ? `${this.languageStrings.ssn} : ${ssnControl.value}` : null;
    }

    /**
     * Function to get the updated gender value
     * @return updated gender
     */
    getGenderUpdatedValue(): string {
        const genderControl = this.personalInfoForm.get(MemberProfileChanges.GENDER);
        const currentGender = this.currentProfileData.get(MemberProfileChanges.GENDER);
        return genderControl.touched && currentGender !== genderControl.value
            ? `${this.languageStrings.gender} : ${genderControl.value}`
            : null;
    }

    /**
     * Function to compare the updated form data
     */
    compareUpdatedData(): void {
        const lastNameControl = this.personalInfoForm.get(MemberProfileChanges.NAME).get(MemberProfileChanges.LASTNAME);
        const currentLastName = this.currentProfileData.get(MemberProfileChanges.LASTNAME);
        const lastName =
            lastNameControl.touched && currentLastName !== lastNameControl.value
                ? `${this.languageStrings.lastName} : ${lastNameControl.value}`
                : null;
        const firstNameControl = this.personalInfoForm.get(MemberProfileChanges.NAME).get(MemberProfileChanges.FIRSTNAME);
        const currentFirstName = this.currentProfileData.get(MemberProfileChanges.FIRSTNAME);
        const firstName =
            firstNameControl.touched && currentFirstName !== firstNameControl.value
                ? `${this.languageStrings.firstName} : ${firstNameControl.value}`
                : null;
        const ssn = this.getSSNUpdatedValue();
        const gender = this.getGenderUpdatedValue();
        const address1Control = this.personalInfoForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ADDRESS1);
        const currentAddress1 = this.currentProfileData.get(MemberProfileChanges.ADDRESS1);
        const address1 =
            (this.isHomeAddressSameAsEmployee || address1Control.touched) && currentAddress1 !== address1Control.value
                ? `${this.languageStrings.streetAddress1} : ${address1Control.value}`
                : null;
        const address2Control = this.personalInfoForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ADDRESS2);
        const currentAddress2 = this.currentProfileData.get(MemberProfileChanges.ADDRESS2);
        const address2 =
            (this.isHomeAddressSameAsEmployee || address2Control.touched) && currentAddress2 !== address2Control.value
                ? `${this.languageStrings.streetAddress2} : ${address2Control.value}`
                : null;
        const cityControl = this.personalInfoForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.CITY);
        const currentCity = this.currentProfileData.get(MemberProfileChanges.CITY);
        const city =
            (this.isHomeAddressSameAsEmployee || cityControl.touched) && currentCity !== cityControl.value
                ? `${this.languageStrings.city} : ${cityControl.value}`
                : null;
        const stateControl = this.personalInfoForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.STATE);
        const currentState = this.currentProfileData.get(MemberProfileChanges.STATE);
        const state =
            (this.isHomeAddressSameAsEmployee || stateControl.touched) && currentState !== stateControl.value
                ? `${this.languageStrings.state} : ${stateControl.value}`
                : null;
        const zipControl = this.personalInfoForm.get(MemberProfileChanges.ADDRESS).get(MemberProfileChanges.ZIP);
        const currentZip = this.currentProfileData.get(MemberProfileChanges.ZIP);
        const zip =
            (this.isHomeAddressSameAsEmployee || zipControl.touched) && currentZip !== zipControl.value
                ? `${this.languageStrings.zip} : ${zipControl.value}`
                : null;
        this.setProfileData(
            {
                firstName,
                lastName,
                ssn,
                gender,
                address1,
                address2,
                city,
                state,
                zip,
            },
            this.updatedProfileData,
        );
    }

    /**
     * submitForm() is used to submit the dependent form information including personal information as well as contact information
     * Before submit the information, it checks the contact information is changed or not
     * Also validating all form fields by calling validateAllFormFields
     * createMemberDependent() is used to create new dependent and updateMemberDependent() is used to update the existing dependent
     * @returns Observable of type boolean is used to track whether the form submission valid or not
     */
    submitForm(): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        if (this.submitPersonalInfoForm.valid) {
            this.isLoading = true;
            this.hideErrorAlertMessage();
            this.submitPersonalInfoForm.value.name.firstName = this.submitPersonalInfoForm.value.name.firstName.trim();
            this.submitPersonalInfoForm.value.name.lastName = this.submitPersonalInfoForm.value.name.lastName.trim();
            this.memberService.changeFirstName(this.submitPersonalInfoForm.value.name.firstName);
            this.memberService.changeLastName(this.submitPersonalInfoForm.value.name.lastName);
            if (
                this.submitPersonalInfoForm.value.profile.heightFeet === SELECT ||
                this.submitPersonalInfoForm.value.profile.heightFeet === ""
            ) {
                this.submitPersonalInfoForm.value.profile.heightFeet = null;
            }
            if (
                this.submitPersonalInfoForm.value.profile.heightInch === SELECT ||
                this.submitPersonalInfoForm.value.profile.heightInch === ""
            ) {
                this.submitPersonalInfoForm.value.profile.heightInch = null;
            }
            this.submitPersonalInfoForm.value.profile.height =
                this.submitPersonalInfoForm.value.profile.heightFeet || this.submitPersonalInfoForm.value.profile.heightInch
                    ? this.getHeightInInches(
                          this.submitPersonalInfoForm.value.profile.heightFeet,
                          this.submitPersonalInfoForm.value.profile.heightInch,
                      )
                    : null;
            if (this.submitPersonalInfoForm.value.homeAddressSameAsEmployee) {
                this.contact.address = this.memberAddress.address;
                this.isContactInfoChange = this.submitPersonalInfoForm.value.homeAddressSameAsEmployee;
            } else {
                this.contact.address = this.submitPersonalInfoForm.value.address;
            }
            delete this.submitPersonalInfoForm.value.homeAddressSameAsEmployee;
            delete this.submitPersonalInfoForm.value.id;
            delete this.submitPersonalInfoForm.value.address;
            delete this.submitPersonalInfoForm.value.verificationStatus;
            Object.keys(this.submitPersonalInfoForm.value.profile).forEach((key) => {
                if (this.submitPersonalInfoForm.value.profile[key] === null || this.submitPersonalInfoForm.value.profile[key] === "") {
                    delete this.submitPersonalInfoForm.value.profile[key];
                }
            });
            this.submitPersonalInfoForm.value.birthDate = this.dateFormatter(this.submitPersonalInfoForm.value.birthDate);
            this.subscriber.push(
                iif(
                    () => this.addForm,
                    defer(() => this.createMemberDependent()),
                    defer(() => this.updateMemberDependent()),
                )
                    .pipe(
                        tap((flag) => {
                            returnFlag.next(flag);
                            if (flag) {
                                this.submitPersonalInfoForm.markAsPristine();
                            }
                            this.isLoading = false;
                        }),
                    )
                    .subscribe(),
            );
        } else {
            this.validateAllFormFields(this.submitPersonalInfoForm);
            returnFlag.next(false);
        }
        return returnFlag.asObservable();
    }

    dateFormatter(date: any): any {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }

    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            if (control["controls"]) {
                for (const subField in control["controls"]) {
                    if (subField) {
                        control["controls"][subField].markAsTouched({ onlySelf: true });
                    }
                }
            } else {
                control.markAsTouched({ onlySelf: true });
            }
        });
    }

    /**
     * Creates a dependent
     * @returns whether dependent was created successfully
     */
    createMemberDependent(): Observable<boolean> {
        return this.memberService.createMemberDependent(this.personalInfoForm.value, this.memberId, this.MpGroup).pipe(
            map((result) => result.headers.get(LOCATION).split(SLASH).pop()),
            tap((dependentId) => {
                this.dependentSaved.emit(true);
                this.initialFormValues = this.utilService.copy(this.personalInfoForm.value);
                this.routeDependentId = +dependentId;
                this.store.dispatch(new SetActiveDependentId(this.routeDependentId));
                this.changeAddEditAction();
                this.dependentVerificationStatus = {
                    verificationAction: "",
                    documentIds: [],
                };
                this.updateName.emit(
                    `${this.personalInfoForm.controls.name.value.firstName} ${this.personalInfoForm.controls.name.value.lastName}`,
                );
            }),
            switchMap((result) => this.updateDependentVerificationStatus()),
            switchMap((result) => this.UpdateDependentContactandCustomeID(this.contact, this.routeDependentId.toString())),
            catchError((error) => {
                this.showErrorAlertMessage(error);
                return of(false);
            }),
        );
    }

    /**
     * updateMemberDependent is used to update the dependent personal information and contact information.
     * @returns Observable of type boolean used to track whether the update is successful or not
     */
    updateMemberDependent(): Observable<boolean> {
        const serviceCalls$: Observable<boolean>[] = [
            this.memberService
                .updateMemberDependent(this.personalInfoForm.value, Number(this.memberId), this.routeDependentId.toString(), this.MpGroup)
                .pipe(
                    switchMap((result) =>
                        iif(
                            () => this.personalInfoForm.value.profile.verified.toLowerCase() !== this.statusUnverified.toLowerCase(),
                            defer(() => this.updateDependentVerificationStatus()),
                            of(true),
                        ),
                    ),
                    tap((result) => {
                        this.initialFormValues = this.utilService.copy(this.personalInfoForm.value);
                        this.changeAddEditAction();
                        this.contact.contactTimeOfDay = this.dependentContactForEdit.contactTimeOfDay;
                        this.contact.correspondenceLocation = this.dependentContactForEdit.correspondenceLocation;
                        this.contact.correspondenceType = this.dependentContactForEdit.correspondenceType;
                        this.contact.emailAddresses = this.dependentContactForEdit.emailAddresses;
                        this.contact.phoneNumbers = this.dependentContactForEdit.phoneNumbers;
                        this.contact.immediateContactPreference = this.dependentContactForEdit.immediateContactPreference;
                        this.updateName.emit(
                            `${this.personalInfoForm.controls.name.value.firstName} ${this.personalInfoForm.controls.name.value.lastName}`,
                        );
                    }),
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        return of(false);
                    }),
                ),
        ];
        if (this.isCustomIdChanged || this.isContactInfoChange) {
            const saveCustomIDs$ = this.UpdateDependentContactandCustomeID(this.contact, this.routeDependentId.toString());
            if (saveCustomIDs$) {
                serviceCalls$.push(saveCustomIDs$);
            }
        }
        return concat(...serviceCalls$).pipe(
            take(serviceCalls$.length),
            reduce((acc, curr) => acc && curr, true),
            tap((result) => {
                this.isSaved = result;
                this.isFormValueChange = !result;
            }),
        );
    }

    getDependentVerificationStatus(): void {
        this.subscriber.push(
            this.memberService.getDependentVerificationStatus(this.memberId, this.routeDependentId, this.MpGroup).subscribe(
                (res) => {
                    this.dependentVerificationStatus = res;
                    if (this.dependentVerificationStatus.verificationStatus.toLowerCase() !== "unspecified") {
                        this.verificationStatusList = this.verificationStatusList.filter((x) => x !== "UNVERIFIED");
                    }
                },
                (err) => {
                    this.isLoading = false;
                },
            ),
        );
    }

    /**
     * Updates dependent's verification status
     * @returns observable of whether update was successful
     */
    updateDependentVerificationStatus(): Observable<boolean> {
        if (
            this.personalInfoForm.value.profile.verified &&
            this.personalInfoForm.value.profile.verified.toLowerCase() === this.statusVerified.toLowerCase()
        ) {
            this.dependentVerificationStatus.verificationAction = this.statusApprove;
        } else if (
            this.personalInfoForm.value.profile.verified &&
            this.personalInfoForm.value.profile.verified.toLowerCase() === this.statusRejected.toLowerCase()
        ) {
            this.dependentVerificationStatus.verificationAction = this.statusReject;
        }
        if (this.dependentVerificationStatus && this.dependentVerificationStatus.verificationStatus) {
            delete this.dependentVerificationStatus.verificationStatus;
        }
        return iif(
            () =>
                this.personalInfoForm.value.profile.verified &&
                this.personalInfoForm.value.profile.verified.toLowerCase() !== this.statusUnverified.toLowerCase(),
            defer(() =>
                this.memberService
                    .updateDependentVerificationStatus(this.memberId, this.routeDependentId, this.dependentVerificationStatus, this.MpGroup)
                    .pipe(
                        tap((result) => {
                            if (this.personalInfoForm.value.profile.verified !== this.statusUnverified) {
                                this.verificationStatusList = this.verificationStatusList.filter((x) => x !== this.statusUnverified);
                            }
                        }),
                        map((result) => true),
                        catchError((error) => {
                            this.showErrorAlertMessage(error);
                            return of(false);
                        }),
                    ),
            ),
            of(true),
        );
    }

    /**
     * Updates dependent contact and custom IDs
     * @param contact dependent contact object
     * @param dependentId dependent Id
     * @returns whether dependent contact and custom ids were created successfully
     */
    UpdateDependentContactandCustomeID(contact: DependentContact, dependentId: string): Observable<boolean> {
        const observables$: Observable<boolean>[] = this.getDependentcustomIdsObserver(dependentId).map((obs) =>
            obs.pipe(
                // map every successful response to true, errors to false
                map((result) => true),
                catchError((error) => of(false)),
            ),
        );
        if (this.isContactInfoChange) {
            observables$.push(this.getSaveDependentContactObserver(this.contact, this.routeDependentId.toString()));
        }
        if (!observables$.length) {
            return null;
        }
        return combineLatest(observables$).pipe(
            map((result) => result.reduce((acc, curr) => acc && curr, true)),
            tap((result) => {
                const ssnControl = this.customIDAliases.get(this.SSN.toUpperCase());
                this.initialAddress.address = this.utilService.copy(contact.address);
                this.isSaved = true;
                this.isFormValueChange = false;
                if (this.unmaskedSSNValue) {
                    this.dependentSsn = this.unmaskedSSNValue.replace(/-/g, "");
                    ssnControl.setValue(this.unmaskedSSNValue);
                } else {
                    this.unmaskedSSNValue = ssnControl.value;
                }
                this.isFullyVisible = ssnControl.valid ? !(this.isPartiallyMasked || this.isFullyMasked) : true;
                this.maskSSN();
                this.ssnMaskingToggler(false);
            }),
            catchError((error) => {
                this.showErrorAlertMessage(error);
                return of(false);
            }),
        );
    }
    /**
     * method used to return the dependent custom id observable to perform save or delete operation for identifier
     * @param dependentId dependent id value
     * @returns observable list of identifier subscriptions
     */
    getDependentcustomIdsObserver(dependentId: string): Observable<any>[] {
        const ObservableList: Observable<any>[] = [];
        Object.keys(this.customIdFields).forEach((key) => {
            if (key === this.SSN.toUpperCase()) {
                const customId = this.getIdentifierId(key);
                let customIDValueArray = [];
                let customIDValue = null;
                if (key === this.SSN.toUpperCase()) {
                    if (this.customIdFields[key]) {
                        if (this.unmaskedSSNValue) {
                            customIDValueArray = this.unmaskedSSNValue.match(/.{1,3}/g);
                        } else {
                            customIDValueArray = this.customIdFields[key].match(/.{1,3}/g);
                        }
                        customIDValue = customIDValueArray.join("-");
                    } else {
                        customIDValue = null;
                    }
                } else {
                    customIDValue = this.customIdFields[key];
                }
                if (customIDValue && customIDValue !== null && customIDValue.replace(/-/g, "") !== this.dependentSsn) {
                    ObservableList.push(
                        this.memberService
                            .saveDependentIdentifier(this.memberId, dependentId, customId, this.MpGroup, customIDValue, true)
                            .pipe(
                                catchError((error) => {
                                    this.showErrorAlertMessage(error);
                                    throw error;
                                }),
                            ),
                    );
                } else if (this.editForm && (customIDValue === "" || customIDValue === null) && this.dependentSsn) {
                    ObservableList.push(
                        this.memberService.deleteDependentIdentifier(
                            this.memberId,
                            this.routeDependentId.toString(),
                            customId,
                            this.MpGroup,
                        ),
                    );
                }
            } else {
                const customId = this.getIdentifierId(key);
                let customIDValue: string;
                // eslint-disable-next-line prefer-const
                customIDValue = this.customIdFields[key];
                if (customIDValue && customIDValue !== this.initialCustomIDs[key]) {
                    this.subscriber.push(
                        this.memberService
                            .saveDependentIdentifier(this.memberId, dependentId, customId, this.MpGroup, customIDValue)
                            .subscribe(
                                (res) => {
                                    this.initialCustomIDs[key] = customIDValue;
                                    this.isLoading = false;
                                },
                                (err) => {
                                    this.showErrorAlertMessage(err);
                                    this.isLoading = false;
                                },
                            ),
                    );
                } else if (this.initialCustomIDs[key] && !customIDValue) {
                    this.subscriber.push(
                        this.memberService
                            .deleteDependentIdentifier(this.memberId, this.routeDependentId.toString(), customId, this.MpGroup)
                            .subscribe(
                                (r) => {
                                    this.initialCustomIDs[key] = "";
                                },
                                (err) => {
                                    this.isLoading = false;
                                },
                            ),
                    );
                }
            }
        });
        return ObservableList;
    }

    /**
     * Verifies dependent's address and updates it
     * @param contact dependent's contact info
     * @param dependentId dependent's ID
     * @returns observable of whether info was successfully saved
     */
    getSaveDependentContactObserver(contact: DependentContact, dependentId: string): Observable<boolean> {
        if (contact.address === undefined) {
            contact.address = this.memberAddress.address;
        }
        Object.keys(contact.address).forEach((key) => {
            if (contact.address[key] === "" || contact.address[key] === null) {
                contact.address[key] = null;
            }
        });
        return this.membersBusinessService
            .verifyAddress(contact.address, this.memberService, this.modalService, this.languageService, this.staticUtil)
            .pipe(
                switchMap((address) =>
                    iif(
                        () => Boolean(address),
                        defer(() =>
                            this.memberService
                                .saveDependentContact({ ...contact, address: address }, this.memberId, dependentId.toString(), this.MpGroup)
                                .pipe(
                                    switchMap((resp) => this.updateBeneficiaryDetails()),
                                    tap((result) => this.personalInfoForm.controls.address.patchValue(address)),
                                    map((result) => true),
                                    catchError((error) => {
                                        this.showErrorAlertMessage(error);
                                        return of(false);
                                    }),
                                ),
                        ),
                        of(false),
                    ),
                ),
            );
    }
    /**
     * update beneficiary if dependent is a beneficiary
     * @returns observable of boolean
     */
    updateBeneficiaryDetails(): Observable<boolean> {
        return this.memberService.getMemberBeneficiaries(Number(this.memberId), this.MpGroup, true).pipe(
            switchMap((beneficiaries) => {
                if (beneficiaries.length && beneficiaries.find((beneficiary) => beneficiary.dependentId === this.routeDependentId)) {
                    const beneficiaryInfo = beneficiaries.find((beneficiary) => beneficiary.dependentId === this.routeDependentId);
                    return this.memberService.updateMemberBeneficiary(
                        Number(this.memberId),
                        this.MpGroup,
                        beneficiaryInfo.id,
                        this.constructBeneficiaryInfoPayload(beneficiaryInfo, this.contact.address),
                    );
                }
                return of(null);
            }),
            map((result) => true),
        );
    }
    /**
     * constructing payload for update beneficiary API call
     * @param beneficiaryInfo current beneficiary information from getMemberBeneficiaries api
     * @param address updated address information
     * @returns MemberBeneficiary object for payload
     */
    constructBeneficiaryInfoPayload(beneficiaryInfo: MemberBeneficiary, address: Address): MemberBeneficiary {
        return {
            type: beneficiaryInfo.type,
            details: beneficiaryInfo.details,
            contact: {
                address: address,
                phoneNumbers: beneficiaryInfo.contact.phoneNumbers,
                emailAddresses: beneficiaryInfo.contact.emailAddresses,
            },
            name: this.personalInfoForm.controls.name.value,
            dependentId: beneficiaryInfo.dependentId,
            relationshipToMember: this.relations.find((dep) => dep.id === +this.personalInfoForm.controls.dependentRelationId.value).name,
            gender: this.personalInfoForm.controls.gender.value,
            birthDate: this.personalInfoForm.controls.birthDate.value,
            ssn: this.customIDAliases.get(this.SSN.toUpperCase()).value,
        };
    }

    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
    }
    /**
     * @description Function is used to show error messages
     * @param err Error Object containing error details
     * @return void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            if (error[this.DETAILS][0].code === "zip.stateMismatch") {
                this.showMismMtchStateError();
                return;
            }
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.code === ClientErrorResponseType.DUPLICATE) {
            if (error.details && error.details.some((detail) => detail.field === this.SSN.toUpperCase())) {
                this.errorMessage = this.langStrings["primary.portal.members.api.ssn.duplicate.nonMmp"];
            } else if (error.details && error.details.some((detail) => detail.field.toUpperCase() === ITIN)) {
                this.errorMessage = this.langStrings["primary.portal.members.api.ssn_itin.duplicate.nonMmp"].replace(
                    "##identifier##",
                    ITIN,
                );
            } else {
                this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                    `secondary.api.dependent.${error.status}.${error.code}`,
                );
            }
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }

        this.showErrorMessage = true;
    }

    showMismMtchStateError(): void {
        this.personalInfoForm.get("address").get("zip").setErrors({ mismatch: true });
    }

    /**
     * This method will get member dependent details
     * @returns void
     */
    getMemberDependent(): void {
        this.subscriber.push(
            this.memberIdentifierTypes$
                .pipe(
                    switchMap((resp) =>
                        this.memberService.getMemberDependent(this.routeMemberId, this.routeDependentId, true, this.MpGroup),
                    ),
                )
                .subscribe(
                    (res) => {
                        const response = res;
                        this.memberService.changeFirstName(res.name.firstName);
                        this.memberService.changeLastName(res.name.lastName);
                        this.getHeightInFeetsAndInches(response.profile.height);
                        if (this.heightInFeet === 0) {
                            this.personalInfoForm.controls.profile.patchValue({
                                heightInch: SELECT,
                                heightFeet: SELECT,
                            });
                        }
                        response.profile.heightFeet = this.heightInFeet;
                        if (this.heightInInch) {
                            response.profile.heightInch = this.heightInInch;
                        } else {
                            response.profile.heightInch = null;
                        }
                        if (this.heightInInch === 0) {
                            response.profile.heightInch = 0;
                        }
                        this.personalInfoForm.patchValue(response);
                        this.updateName.emit(
                            `${this.personalInfoForm.controls.name.value.firstName} ${this.personalInfoForm.controls.name.value.lastName}`,
                        );
                        this.dependentResponse = response;
                        this.initialFormValues = this.utilService.copy(this.dependentResponse);
                        if (response.ssn) {
                            this.checkForSSNConfiguration();
                        } else {
                            this.isFullyVisible = true;
                        }
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                ),
        );
    }

    getDependentIdentifier(): void {
        this.memberIdentifierTypes.forEach((element) => {
            if (!(element.type === this.SSN.toUpperCase())) {
                const customId = this.getIdentifierId(element.type);
                this.subscriber.push(
                    this.memberService
                        .getDependentIdentifier(this.memberId, this.routeDependentId.toString(), customId, this.MpGroup)
                        .subscribe(
                            (res: string) => {
                                const elementType = element.type;
                                this.customIDAliases.get(elementType).patchValue(res);

                                this.initialCustomIDs[elementType] = res;
                            },
                            (err) => {
                                this.isLoading = false;
                            },
                        ),
                );
            }
        });
    }

    /**
     * This method is used to get dependent contact information
     * @params memberId: id of member
     * @params dependentId: id of dependent
     * @params mpGroup: group number
     * @returns void
     */
    getDependentContact(memberId: number, dependentId: string, mpGroup: number): void {
        this.subscriber.push(
            this.memberAddress$
                .pipe(switchMap((resp) => this.memberService.getDependentContact(this.memberId, dependentId, this.MpGroup)))
                .subscribe(
                    (res) => {
                        const response = res;
                        this.contact.phoneNumbers = response.phoneNumbers;
                        this.contact.emailAddresses = response.emailAddresses;
                        this.dependentContactForEdit = res;
                        this.initialAddress = response;
                        this.dependentAddress = response;
                        this.personalInfoForm.patchValue({ address: this.dependentAddress.address });
                        this.isMemberAndDependentAddressSame = this.compareMemberAndDependentAddress(
                            this.memberAddress,
                            this.dependentAddress,
                        );
                        this.getCounties(this.dependentAddress.address.state);
                        this.personalInfoForm.patchValue({
                            homeAddressSameAsEmployee: this.isMemberAndDependentAddressSame,
                        });
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                ),
        );
    }

    getHeightInInches(heightInFeet: number, heightInInch: number): number {
        return heightInFeet * 12 + heightInInch;
    }

    getHeightInFeetsAndInches(height: number): void {
        this.heightInFeet = Math.floor(height / 12);
        this.heightInInch = height % 12;
    }

    /**
     * This method is used to Undo form changes
     */
    revertForm(): void {
        this.personalInfoForm.reset();
        this.personalInfoForm.patchValue(this.initialFormValues);
        this.personalInfoForm.patchValue({ address: this.initialAddress.address });
        this.personalInfoForm.markAsPristine();
        this.personalInfoForm.patchValue({
            homeAddressSameAsEmployee: this.compareMemberAndDependentAddress(this.memberAddress, this.initialAddress),
        });
        this.getDependentIdentifier();
        this.checkForSSNConfiguration();
        this.isSaved = false;
        this.isFormValueChange = false;
        this.customIDAliases.get(this.SSN.toUpperCase()).setErrors(null);
        this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
        this.personalInfoForm.controls.birthDate.markAsUntouched();
        this.hideErrorAlertMessage();
    }
    /**
     * function to check dependent's birth date
     */
    checkDependentBirthDate(): void {
        this.maxDate = new Date();
        this.minDate = null;
        const year = this.maxDate.getFullYear();
        const month = this.maxDate.getMonth();
        const day = this.maxDate.getDate();
        this.dateErrorMessage = false;
        if (this.personalInfoForm.value.dependentRelationId === this.spouseId) {
            this.maxDate = new Date(year - this.spouseMinAge, month, day);
            this.spouseAgeErrorString =
                this.langStrings["secondary.portal.census.manualEntry.spouseValidAge"] + this.spouseMinAge.toString();
            this.personalInfoForm.controls[this.BIRTHDATE].markAsTouched();
        } else if (
            this.personalInfoForm.value.dependentRelationId === this.childId ||
            this.personalInfoForm.value.dependentRelationId === this.grandchildId
        ) {
            if (this.personalInfoForm.get(this.PROFILE).get(this.DISABLED).value) {
                this.minDate = null;
            } else if (
                (this.personalInfoForm.value.address && this.personalInfoForm.value.address.state === this.WI_STATE) ||
                (this.isHomeAddressSameAsEmployee && this.memberAddress.address.state === this.WI_STATE)
            ) {
                this.minDate = new Date(year - this.stateChildMaxAge, month, day + 1);
                this.isAge = false;
                this.nyAccount = false;
                this.WIStatedependantErrorMessage = this.langStrings["primary.portal.members.dependentValidationMsg.WIState"].replace(
                    "##stateChildMaxAge##",
                    this.stateChildMaxAge,
                );
            } else if (this.accountInfo && this.accountInfo.situs.state.abbreviation === this.NY_STATE) {
                this.minDate = new Date(year - this.nyChildMaxAge, month, day + 1);
                this.isAge = true;
                this.nyAccount = true;
            } else {
                this.minDate = new Date(year - this.childMaxAge, month, day + 1);
                this.isAge = true;
                this.nyAccount = false;
            }
            this.maxDate = new Date();
            this.personalInfoForm.controls[this.BIRTHDATE].markAsTouched();
        }
        if (this.personalInfoForm.value.dependentRelationId !== this.spouseId && this.personalInfoForm.controls[this.BIRTHDATE]?.value) {
            this.dateErrorMessage = this.dateService.checkIsAfter(
                this.dateService.toDate(this.personalInfoForm.controls[this.BIRTHDATE].value),
                this.dateService.toDate(this.maxDate),
            );
        }
    }

    /**
     * This method will get the member identifier types
     * @returns void
     */
    getMemberIdentifierType(): void {
        this.memberIdentifierTypes$ = this.memberService.getMemberIdentifierTypes().pipe(
            tap((res) => {
                this.memberIdentifierTypes.push(...res);
                this.memberIdentifierTypes = this.memberIdentifierTypes.filter((x) => x.dependentEligible === true);
                this.memberIdentifierTypes.forEach((item) => {
                    item.type.toLowerCase() === this.SSN.toLowerCase()
                        ? this.customIDAliases.addControl(item.type, this.fb.control("", Validators.pattern(this.validationRegex.SSN)))
                        : this.customIDAliases.addControl(item.type, this.fb.control(""));
                });
                if (this.editForm) {
                    this.getDependentIdentifier();
                }
            }),
            catchError((err) => {
                this.isLoading = false;
                return EMPTY;
            }),
        );
    }

    getIdentifierId(identifierType: string): number {
        const identifierId = this.memberIdentifierTypes.filter((x) => x.type === identifierType);
        return identifierId[0].id;
    }

    /**
     * This function is used to get config values
     * @returns void
     */
    getConfigurations(): void {
        this.subscriber.push(
            this.staticService.getConfigurations(this.FORMVALIDATIONPATH, this.MpGroup).subscribe(
                (res) => {
                    this.validationConfigurations = res;
                    this.settingValidations(this.personalInfoForm);
                    if (this.addForm) {
                        this.isLoading = false;
                    }
                },
                (err) => {
                    if (this.addForm) {
                        this.isLoading = false;
                    }
                },
            ),
        );

        // Group-specific config calls
        this.subscriber.push(
            this.staticUtil
                .fetchConfigs(
                    [ConfigName.SPOUSE_MINIMUM_AGE, ConfigName.CHILDREN_MAX_AGE, ConfigName.CHILD_MAX_AGE, ConfigName.CHILD_MAX_AGE_NY],
                    this.MpGroup,
                )
                .subscribe(([spouseMinAge, stateChildMaxAge, childMaxAge, nyChildMaxAge]) => {
                    this.spouseMinAge = +spouseMinAge.value;
                    this.stateChildMaxAge = +stateChildMaxAge.value
                        .split(",")
                        .find((state) => state.includes(this.WI_STATE))
                        .split("=")[this.CHILD_MAX_AGE_INDEX];
                    this.childMaxAge = +childMaxAge.value;
                    this.nyChildMaxAge = +nyChildMaxAge.value;
                }),
        );

        this.subscriber.push(
            this.staticUtil
                .cacheConfigValue(ConfigName.SSN_MASKING_CONFIG)
                .pipe(filter(Boolean))
                .subscribe((ssnConfig: SSNMask) => {
                    // Code for handling SSN Masking Config
                    this.isPartiallyMasked = ssnConfig === SSNMask.PARTIALLY_MASKED;
                    this.isFullyMasked = ssnConfig === SSNMask.FULLY_MASKED;
                    this.isFullyVisible = ssnConfig === SSNMask.FULLY_VISIBLE || this.addForm;
                }),
        );

        // Config to check if Standalone Demographic Change is enabled
        this.subscriber.push(
            this.sharedService
                .getStandardDemographicChangesConfig()
                .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled)),
        );
    }

    /**
     * Function to set data and open alert on tabchange
     */
    openAlert(): void {
        const name =
            (this.initialFormValues &&
                this.initialFormValues.name &&
                `${this.initialFormValues.name.firstName} ${this.initialFormValues.name.lastName}'s`) ||
            "";
        if (this.hasCIFNumber) {
            this.compareUpdatedData();
        }
        if (this.personalInfoForm.dirty) {
            this.checkAlert = false;
            const dialogData: ConfirmationDialogData = {
                title: "",
                content: this.langStrings["secondary.portal.members.dependent.personalInfo.tabChangeMsg"].replace("#name", `${name}`),
                primaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.save"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.doNotSave"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, false),
                },
                profileChangesData: this.hasCIFNumber ? this.getProfileChangesData() : [],
                isStandaloneDemographicEnabled: this.isStandaloneDemographicEnabled,
            };

            const dialogRef = this.dialog.open(DependentExitDialogComponent, {
                width: "667px",
                data: dialogData,
            });
        }
    }

    /**
     * Function to open confirmation dialog on tab change
     * @param boolean if the changes are saved or not
     */
    OnConfirmDialogAction(isSave: boolean): void {
        this.checkAlert = true;
        this.navigationFlag = true;
        if (isSave) {
            this.subscriber.push(
                this.onSubmit(true).subscribe((flag) => {
                    this.navigationFlag = flag;
                    this.allowNavigation.next(this.navigationFlag);
                    this.allowNavigation.complete();
                }),
            );
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }
    /**
     * Create Listeners for form control value changes
     * @returns void
     */
    createListners(): void {
        this.subscriber.push(
            this.personalInfoForm
                .get(this.PROFILE)
                .get(this.STUDENT)
                .valueChanges.subscribe((res) => {
                    this.isStudent = res;
                }),
        );

        this.subscriber.push(
            this.memberAddress$
                .pipe(switchMap((data) => this.personalInfoForm.get(this.HOMEADDRESSSAMEASEMPLOYEE).valueChanges))
                .subscribe((res) => {
                    this.isHomeAddressSameAsEmployee = res;
                    this.configureAddress1AndCity();
                    this.populateHomeAddress();
                    this.checkDependentBirthDate();
                }),
        );

        this.subscriber.push(
            this.personalInfoForm.get(this.BIRTHDATE).valueChanges.subscribe((res) => {
                if (this.personalInfoForm.get(this.BIRTHDATE).value) {
                    this.checkDependentBirthDate();
                }
            }),
        );

        this.subscriber.push(
            this.personalInfoForm
                .get(this.PROFILE)
                .get(this.DISABLED)
                .valueChanges.subscribe((res) => {
                    this.checkDependentBirthDate();
                }),
        );

        this.subscriber.push(
            this.personalInfoForm
                .get(this.ADDRESS)
                .get(this.ZIP)
                .valueChanges.subscribe((res) => {
                    if (res && !this.personalInfoForm.controls.homeAddressSameAsEmployee.value) {
                        this.personalInfoForm.controls.address.get(this.COUNTYID).enable();
                    } else {
                        this.personalInfoForm.controls.address.get(this.COUNTYID).disable();
                    }
                    this.checkDependentBirthDate();
                }),
        );
    }

    configureAddress1AndCity(): void {
        if (!this.isHomeAddressSameAsEmployee) {
            this.getAddressControl(this.ADDRESS1).setValidators(
                Validators.compose([Validators.required, this.getAddressControl(this.ADDRESS1).validator]),
            );
            this.getAddressControl(this.CITY).setValidators(
                Validators.compose([Validators.required, this.getAddressControl(this.CITY).validator]),
            );
        } else {
            this.getAddressControl(this.ADDRESS1).setValidators(
                Validators.compose([Validators.pattern(this.validationRegex.ADDRESS), Validators.maxLength(AppSettings.MAX_LENGTH_100)]),
            );
            this.getAddressControl(this.CITY).setValidators(
                Validators.compose([Validators.pattern(this.validationRegex.CITY), Validators.maxLength(AppSettings.MAX_LENGTH_100)]),
            );
        }
        this.getAddressControl(this.ADDRESS1).updateValueAndValidity();
        this.getAddressControl(this.CITY).updateValueAndValidity();
        const address1Validator = this.getAddressControl(this.ADDRESS1).validator({} as AbstractControl);
        this.isAddress1Mandatory = address1Validator && address1Validator.required;
        const isCityValidator = this.getAddressControl(this.CITY).validator({} as AbstractControl);
        this.isCityMandatory = isCityValidator && isCityValidator.required;
    }

    getAddressControl(control: string): FormControl {
        return this.personalInfoForm.get(this.ADDRESS).get(control) as FormControl;
    }

    /**
     * Masks/unmasks SSN
     * @param maskedFlag whether SSN is to be masked
     */
    ssnMaskingToggler(maskedFlag: boolean): void {
        this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
        this.customIDAliases
            .get(this.SSN.toUpperCase())
            .setValidators([Validators.minLength(SSN_MIN_LENGTH), Validators.pattern(this.validationRegex.UNMASKSSN_ITIN)]);
        if (!this.customIDAliases.get(this.SSN.toUpperCase()).value) {
            this.unmaskedSSNValue = "";
        }
        if (!this.isFullyVisible && this.customIDAliases.get(this.SSN.toUpperCase()).valid) {
            if (maskedFlag) {
                this.isMaskedTrue = false;
                this.unmaskedSSNValue = (this.unmaskedSSNValue || "").replace(/(\d{3})(\d{2})(\d{4})/, "$1-$2-$3");
                this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.unmaskedSSNValue);
                this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
                this.customIDAliases
                    .get(this.SSN.toUpperCase())
                    .setValidators([Validators.minLength(SSN_MIN_LENGTH), Validators.pattern(this.validationRegex.UNMASKSSN_ITIN)]);
                this.customIDAliases.get(this.SSN.toUpperCase()).markAsTouched({ onlySelf: true });
                this.customIDAliases.get(this.SSN.toUpperCase()).updateValueAndValidity();
            } else {
                this.isMaskedTrue = true;
                this.ssnMaxLength = 11;
                this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.maskedSSNValue);
                this.customIDAliases.get(this.SSN.toUpperCase()).setErrors(null);
                this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
                this.customIDAliases.get(this.SSN.toUpperCase()).updateValueAndValidity();
            }
        }
    }

    /**
     * This method is used to get ssn visibility configuration
     * @returns void
     */
    checkForSSNConfiguration(): void {
        this.isPartiallyMasked = false;
        this.isFullyMasked = false;
        this.isFullyVisible = false;
        this.maskedSSNReadonly = false;
        this.subscriber.push(
            this.staticService.getConfigurations(ConfigName.SSN_MASKING_CONFIG, this.MpGroup).subscribe((response) => {
                this.isMaskedTrue = true;
                if (response.length) {
                    if (response[0].value === SSNMask.PARTIALLY_MASKED) {
                        this.isPartiallyMasked = true;
                    } else if (response[0].value === SSNMask.FULLY_MASKED) {
                        this.isFullyMasked = true;
                    } else if (response[0].value === SSNMask.FULLY_VISIBLE) {
                        this.isFullyVisible = true;
                        this.isMaskedTrue = false;
                    }
                }
            }),
        );
        this.getMaskedSSN(true);
        this.getMaskedSSN(false);
        if (this.customIDAliases && this.customIDAliases.get(this.SSN.toUpperCase())) {
            this.customIDAliases.get(this.SSN.toUpperCase()).setErrors(null);
            this.customIDAliases.get(this.SSN.toUpperCase()).clearValidators();
        }
    }

    setSSNOnView(): void {
        if (this.isFullyMasked || this.isPartiallyMasked) {
            this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.maskedSSNValue);
            this.maskedSSN = this.maskedSSNValue;
        } else if (this.isFullyVisible) {
            this.customIDAliases.get(this.SSN.toUpperCase()).setValue(this.unmaskedSSNValue);
            this.maskedSSN = this.unmaskedSSNValue;
        }
        this.isLoading = false;
    }

    /**
     * Masks SSN, partially/fully
     */
    maskSSN(): void {
        const ssnControl = this.customIDAliases.get(this.SSN.toUpperCase());
        this.isFullyVisible = ssnControl.valid ? !(this.isPartiallyMasked || this.isFullyMasked) : true;
        if (!this.isFullyVisible && ssnControl.value && ssnControl.valid) {
            let tempMask = "";
            const SsnFormValue = ssnControl.value.replace(/-/g, "");
            if (SsnFormValue !== this.unmaskedSSNValue) {
                const lengthUnmaskedSSN = SsnFormValue.length;
                tempMask = "XXX-XX-" + SsnFormValue.slice(this.ssnMaskedLength, lengthUnmaskedSSN);
                this.maskedSSNValue = tempMask;
                this.unmaskedSSNValue = SsnFormValue;
                ssnControl.setValue(this.maskedSSNValue);
                this.isMaskedTrue = true;
                ssnControl.clearValidators();
                ssnControl.updateValueAndValidity();
                ssnControl.setErrors(null);
            }
        } else if (ssnControl.value === "") {
            this.isFullyVisible = true;
        }
    }

    /**
     *
     * @param event zip text field keyboard event
     */
    numberValidation(event: KeyboardEvent): void {
        this.utilService.numberValidation(event);
    }

    /**
     * Gets dependent's SSN
     * @param maskingFlag boolean indicating whether SSN should be masked
     */
    getMaskedSSN(maskingFlag: boolean): void {
        this.maskedSSNReadonly = false;
        if (maskingFlag) {
            this.maskedSSNReadonly = true;
        }
        const memberIdentifierTypeSSN = this.memberIdentifierTypes.filter((x) => x.type.toLowerCase() === this.SSN.toLowerCase());
        memberIdentifierTypeSSN.forEach((element) => {
            if (element.type === this.SSN.toUpperCase()) {
                this.subscriber.push(
                    this.memberService
                        .getDependentIdentifier(this.memberId, this.routeDependentId.toString(), element.id, this.MpGroup, maskingFlag)
                        .subscribe(
                            (data) => {
                                if (maskingFlag) {
                                    this.maskedSSNValue = data;
                                } else {
                                    this.unmaskedSSNValue = data.replace(/-/g, "");
                                    this.dependentSsn = data.replace(/-/g, "");
                                }
                                if (this.maskedSSNValue && this.unmaskedSSNValue) {
                                    this.setSSNOnView();
                                }
                            },
                            (err) => {
                                this.isLoading = false;
                            },
                        ),
                );
            }
        });
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    validateDate(control: string, form: string, event: any, iteration?: string): string | undefined {
        if (
            (this.personalInfoForm.controls[control].value === null || this.personalInfoForm.controls[control].value === "") &&
            event !== ""
        ) {
            return this.langStrings["secondary.portal.common.invalidDateFormat"];
        }
        if (!this.personalInfoForm.controls[control].value) {
            this.personalInfoForm.controls[control].setErrors({ required: true });
            return this.langStrings["secondary.portal.members.requiredField"];
        }
        return undefined;
    }
    /**
     *
     * This function is used to validate state and zip code.
     * @returns void
     */
    checkZipCode(): void {
        const value = this.zipInput.nativeElement.value;
        const addressForm = this.personalInfoForm.get("address");
        const zipFormControl = addressForm.get("zip");
        const stateValue = addressForm.get("state").value;
        if ((value.length === this.zipMaximumLength || value.length === this.zipMinLength) && stateValue !== "") {
            this.isLoading = true;
            this.subscriber.push(
                this.staticService.validateStateZip(stateValue, value).subscribe(
                    (response) => {
                        this.isLoading = false;
                        if (response.status === AppSettings.API_RESP_204) {
                            zipFormControl.setErrors(null);
                        }
                    },
                    (error) => {
                        this.isLoading = false;
                        if (error.status === AppSettings.API_RESP_400) {
                            zipFormControl.setErrors({ zipMismatch: true });
                            zipFormControl.markAsTouched();
                        }
                    },
                ),
            );
        }
    }
    /**
     *  Checks and sets invalid error for height on change
     */
    checkHeight(): void {
        const heightFeet = this.personalInfoForm.controls.profile.get(HEIGHT_FEET);
        const heightInch = this.personalInfoForm.controls.profile.get(HEIGHT_INCH);
        heightFeet.setErrors(null);
        heightInch.setErrors(null);
        if (heightFeet.value === 0 && heightInch.value === 0) {
            heightFeet.setErrors({ invalid: true });
            heightInch.setErrors({ invalid: true });
        }
        if (
            (heightFeet.value === SELECT || heightFeet.value === "") &&
            (heightInch.value === null || heightInch.value === undefined || heightInch.value === SELECT)
        ) {
            heightInch.setErrors(null);
        } else if (
            (heightFeet.value || heightFeet.value === 0) &&
            heightInch.value !== 0 &&
            (!heightInch.value || heightInch.value === SELECT)
        ) {
            heightInch.setErrors({ invalidSelection: true });
        }
    }

    ngOnDestroy(): void {
        this.checkAlert = false;
        this.subscriber.forEach((el) => {
            if (el) {
                el.unsubscribe();
            }
        });
    }
}
