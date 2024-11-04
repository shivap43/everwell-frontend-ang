import { Component, OnInit, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { BehaviorSubject, Observable, Subscription, Subject, forkJoin, combineLatest, of } from "rxjs";
import { Store, Select } from "@ngxs/store";
import {
    StaticService,
    MemberService,
    MemberContactPhonePreferences,
    MemberContactEmailPreferences,
    Configuration,
    HideReadOnlyElementSetting,
    AccountService,
    EnrollmentService,
    PrimaryContact,
    EnrollmentStatusType,
    PendingEnrollmentReason,
} from "@empowered/api";
import {
    PhoneFormatConverterPipe,
    ProfileChangesConfirmPromptComponent,
    ConfirmationDialogData,
    ConfirmationDialogComponent,
} from "@empowered/ui";
import { MatDialog } from "@angular/material/dialog";
import { ContactInfoPopupComponent } from "../contact-info/contact-info-popup/contact-info-popup.component";
import { LanguageService } from "@empowered/language";
import { switchMap, takeUntil, filter, map, first, tap, delay, catchError } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { UserService } from "@empowered/user";

import {
    Permission,
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    SECOND_IN_MILLISECONDS,
    ActivityPageCode,
    ConfigName,
    AppSettings,
    ContactManageOptions,
    Portals,
    RegistrationStatus,
    ContactType,
    Email,
    Phone,
    CommunicationPreference,
    CorrespondenceType,
    MemberProfile,
    TimeOfDay,
    MemberContact,
} from "@empowered/constants";
import { Router } from "@angular/router";
import { AddMemberInfo, Member, MemberInfoState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { TPIRestrictionsForHQAccountsService, SharedService, EmpoweredModalService } from "@empowered/common-services";

const PHONE_NUMBERS_CHECK = "phoneNumbers";
const EMAIL_ADDRESS_CHECK = "emailAddresses";
const ActionType = {
    EDIT: "Save",
    ADD: "Add",
};
const CONTACT_PREFERENCES = ["deliveryPreference", "notificationPreference", "contactPreference", "contactTimeOfDay", "typeOfContact"];
const DIRECT = "direct";

interface ContactFormModel {
    contactPreference?: string;
    contactTimeOfDay?: string;
    typeOfContact?: string;
    deliveryPreference?: string;
    notificationPreference?: string;
}

const EMAIL_WORK = "WORK";

@Component({
    selector: "empowered-contact-info",
    templateUrl: "./contact-info.component.html",
    styleUrls: ["./contact-info.component.scss"],
    providers: [PhoneFormatConverterPipe],
})
export class ContactInfoComponent implements OnInit, OnDestroy {
    isVestedAgent: boolean;
    isAgentSelfEnrolled: boolean;
    get formControls(): unknown {
        return this.memberContactForm.controls;
    }
    state: any;
    @Select(MemberInfoState) memberState$: Observable<Member>;
    allowNavigation: Subject<boolean>;
    readonly CONTACT_TYPE = "CELL";
    saveMemberContactHomeObservable$: Observable<any>;
    saveMemberContactWorkObservable$: Observable<any>;
    updateMemberObservable$: Observable<any>;
    permissionEnum = Permission;
    isActiveEnrollment = false;
    isUpdateDelivery = false;
    updatedContactData: string[] = [];
    languageSecondaryStrings: Record<string, string> = this.langService.fetchSecondaryLanguageValues([
        "secondary.portal.members.requiredField",
    ]);
    languageStringsArray: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.members.contactLabel.contactInfo",
        "primary.portal.members.contactLabel.addPhone",
        "primary.portal.members.contactLabel.addEmail",
        "primary.portal.members.contactLabel.contactPreferences",
        "primary.portal.common.undoChanges",
        "primary.portal.common.save",
        "primary.portal.common.saved",
        "primary.portal.members.contactLabel.notificationPreferences.noMobileNumberListed",
        "primary.portal.members.contactLabel.notificationPreferences.primaryEmail",
        "primary.portal.members.contactLabel.notificationPreferences",
        "primary.portal.members.contactLabel.sendTo",
        "primary.portal.members.contactLabel.planInfoDeliveryPreference",
        "primary.portal.common.optional",
        "primary.portal.members.contactLabel.timeOfDay",
        "primary.portal.members.contactLabel.select",
        "primary.portal.members.contactLabel.method",
        "primary.portal.members.contactLabel.manage",
        "primary.portal.members.contactLabel.primary",
        "primary.portal.members.contactLabel.verified",
        "primary.portal.members.contactLabel.type",
        "primary.portal.members.contactLabel.address",
        "primary.portal.members.contactLabel.email",
        "primary.portal.members.contactLabel.extention",
        "primary.portal.members.contactLabel.number",
        "primary.portal.members.contactLabel.phone",
        "primary.portal.members.contactLabel.ariaLabel.notification.preferences",
        "primary.portal.members.contactLabel.ariaLabel.info.primaryPhone",
    ]);

    memberContactForm: FormGroup;
    phonenumberTypes: string[];
    emailTypes: string[];
    displayedPhoneColumns: MemberContactPhonePreferences[];
    displayedEmailColumns: MemberContactEmailPreferences[];
    phoneDataSource: { next: (arg0: Phone[]) => void };
    emailDataSource: { next: (arg0: Email[]) => void };
    ELECTRONIC = CorrespondenceType.ELECTRONIC;
    PAPER = CorrespondenceType.PAPER;

    CorrespondenceType: string[] = [CorrespondenceType.ELECTRONIC, CorrespondenceType.PAPER];
    CommunicationPreference: string[] = [CommunicationPreference.PHONE, CommunicationPreference.EMAIL];
    TimeOfDay: string[] = [TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING];
    ContactType: string[] = [ContactType.HOME, ContactType.WORK];
    ManageContactOptions: string[] = [ContactManageOptions.EDIT, ContactManageOptions.REMOVE, ContactManageOptions.VERIFY];
    memberId: number;
    memberFirstName: string;
    configurations: Configuration[];
    phoneData = [];
    emailData = [];
    primaryPhone: any;
    primaryEmail: any;
    selectedCorrespondenceType: string;
    selectedContactPreference: string;
    selectedCorrespondenceLocation: string;
    selectedContactTimeofDay: string;
    selectedCommunicationPreference: string;
    initialSelectedCorrespondenceType: string;
    initialSelectedContactPreference: string;
    initialSelectedCorrespondenceLocation: string;
    initialSelectedContactTimeofDay: string;
    initialSelectedCommunicationPreference: string;
    MpGroup: string;
    getMemberContactsData: MemberContact[];
    getMemberContactWorkData: any;
    getMemberContactHomeData: any;
    getMemberData: any;
    validationConfigurations = [];
    isSaved = false;
    isLoading: boolean;
    checkAlert: boolean;
    navigationFlag: boolean;
    errorMessage: string;
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";
    requiredFields = [];
    langStrings = {};
    private readonly memberContactFormDirty$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    isMemberContactFormDirty$ = this.memberContactFormDirty$.asObservable();
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        contactPreference: true,
        contactTimeOfDay: true,
        deliveryPreference: true,
        typeOfContact: true,
        notificationPreference: true,
    };

    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        contactPreference: false,
        contactTimeOfDay: false,
        deliveryPreference: false,
        typeOfContact: false,
        notificationPreference: false,
    };
    languageStrings = {
        select: this.langService.fetchPrimaryLanguageValue("primary.portal.common.select"),
        phoneNumber: this.langService.fetchPrimaryLanguageValue("primary.portal.members.contactLabel.phoneNumber"),
        emailAddress: this.langService.fetchPrimaryLanguageValue("primary.portal.members.contactLabel.emailAddress"),
        dontSave: this.langService.fetchPrimaryLanguageValue("primary.portal.common.doNotSave"),
        notificationPreferences: this.langService.fetchPrimaryLanguageValue(
            "primary.portal.members.contactLabel.notificationPreferences.tooltip",
        ),
        phoneReceiveText: this.langService.fetchPrimaryLanguageValue(
            "primary.portal.members.contactLabel.notificationPreferences.phoneReceiveText",
        ),
    };
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    showErrorMessage: boolean;
    errorMessageArray = [];
    memberContactControls: any;

    notificationPreferenceEnabled = false;
    deliveryPref: string[];
    showEAAMessage = false;
    country = AppSettings.COUNTRY_US;
    isMemberPortal = false;
    portal: string;
    private unsubscribe$ = new Subject<void>();
    canAccessTPIModule$: Observable<boolean>;
    isAflacReadOnly = false;
    isPartialEdit = false;
    isDisableAddPhoneEmail: boolean;
    maxNumberOfPhoneContact = 4;
    maxNumberOfEmailContact = 3;
    private readonly returnFlagSubject$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    returnFlag$: Observable<boolean> = this.returnFlagSubject$.asObservable();
    disableFormFields = false;
    isFormValueChange = false;
    saveInProgress = false;
    updateWorkContact = false;
    communicationPreference = CommunicationPreference;
    hasCifNumber = false;
    isStandaloneDemographicEnabled: boolean;
    isApprovedEnrollment = false;

    constructor(
        private readonly staticService: StaticService,
        private readonly dialog: MatDialog,
        private readonly formBuilder: FormBuilder,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly langService: LanguageService,
        private readonly ref: ChangeDetectorRef,
        private readonly language: LanguageService,
        private readonly datePipe: DatePipe,
        private readonly userService: UserService,
        private readonly utilService: UtilService,
        private readonly accountService: AccountService,
        private readonly staticUtilService: StaticUtilService,
        private readonly tpiRestrictionsService: TPIRestrictionsForHQAccountsService,
        private readonly sharedService: SharedService,
        private readonly router: Router,
        private readonly enrollmentsService: EnrollmentService,
        private readonly empoweredModalService: EmpoweredModalService,
    ) {
        this.checkAlert = true;
        this.displayedPhoneColumns = [
            MemberContactPhonePreferences.PHONE_NUMBER,
            MemberContactPhonePreferences.PHONE_EXTENSION,
            MemberContactPhonePreferences.PHONE_TYPE,
            MemberContactPhonePreferences.PHONE_MOBILE,
            MemberContactPhonePreferences.PHONE_VERIFIED,
            MemberContactPhonePreferences.PHONE_PRIMARY,
            MemberContactPhonePreferences.PHONE_MANAGE,
        ];
        this.displayedEmailColumns = [
            MemberContactEmailPreferences.EMAIL_ADDRESS,
            MemberContactEmailPreferences.EMAIL_TYPE,
            MemberContactEmailPreferences.EMAIL_VERIFIED,
            MemberContactEmailPreferences.EMAIL_PRIMARY,
            MemberContactEmailPreferences.EMAIL_MANAGE,
        ];
        this.staticService
            .getConfigurations("portal.member_communication_preference.enabled")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((configs) => {
                this.notificationPreferenceEnabled = configs.length && configs[0].value.toLowerCase() === "true";
            });
        // To set the isAgentSelfEnrolled flag
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isAgentSelfEnrolled) => (this.isAgentSelfEnrolled = isAgentSelfEnrolled));
    }

    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.members.contactLabel.phone",
            "primary.portal.members.contactLabel.AddPhoneTooltip",
            "primary.portal.members.contactLabel.AddEmailTooltip",
            "primary.portal.common.save",
            "primary.portal.members.contactLabel.contactPreferences",
            "primary.portal.common.undoChanges",
            "primary.portal.members.contactLabel.addEmail",
            "primary.portal.members.contactLabel.addPhone",
            "primary.portal.members.contactLabel.number",
            "primary.portal.members.contactLabel.type",
            "primary.portal.members.contactLabel.sendTo",
            "primary.portal.members.contactLabel.extention",
            "primary.portal.members.contactLabel.verified",
            "primary.portal.members.contactLabel.primary",
            "primary.portal.members.contactLabel.manage",
            "primary.portal.members.contactLabel.address",
            "primary.portal.members.contactLabel.planInfoDeliveryPreference",
            "primary.portal.members.contactLabel.notificationPreferences.primaryEmail",
            "primary.portal.members.contactLabel.notificationPreferences.primaryPhone",
            "primary.portal.members.contactLabel.notificationPreferences",
            "primary.portal.common.saved",
            "primary.portal.members.mmpPolicyDeliveryMsgElectronic",
            "primary.portal.members.mappPolicyDeliveryMsgElectronic",
            "primary.portal.members.mmpPolicyDeliveryMsgPaper",
            "primary.portal.members.mappPolicyDeliveryMsgPaper",
            "primary.portal.members.planInfoDeliveryPreference.eaaMessage",
            "primary.portal.members.contactLabel.phoneNumber",
        ]);
    }
    /*
        Component life cycle hook
        OnInit
        Setting the following modal properties:
        1. getPhoneEmailTypes() - Fetch the Phone and Email contact type
        2. getStateManagement() - Fetch State of Member for its information.
        3. getMemberContactDetail(): Fetch Member contact details need to display.
        4. createFormControl(): To create form with FormBuilder.
        5. getConfigurations() : To fetch configuration for Field validation.
        6. getLanguageStrings(): Fetch Languages from DB.
        7. checkTPIRestrictions(): To check TPI restrictions for aflac hq accounts based on portal.
        8. checkAgentSelfEnrolled() :- Get if the Agent is SelfEnrolled or not and return a boolean value
        9. checkForVestedAgents() :- check for Vested agents and make controls readonly
    */
    ngOnInit(): void {
        this.isLoading = true;
        this.getPhoneEmailTypes();
        this.getStateManagement();
        this.getMemberContactDetail(this.memberId, this.MpGroup);
        this.createFormControl();
        this.getConfigurations();
        this.getLanguageStrings();
        this.memberContactForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            setTimeout(() => {
                this.ref.detectChanges();
            }, 300);
        });
        this.deliveryPref = [];
        this.userService.portal$.pipe(takeUntil(this.unsubscribe$)).subscribe((type) => {
            this.portal = type;
            if (this.portal === Portals.MEMBER.toLowerCase()) {
                this.isMemberPortal = true;
            }
        });
        if (!this.router.url.includes(DIRECT)) {
            this.checkTPIRestrictions(this.portal);
        }
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule")
            .pipe(
                first(),
                takeUntil(this.unsubscribe$),
                filter((isCrossBorderRulesEnabled) => isCrossBorderRulesEnabled === true),
                switchMap(() =>
                    forkJoin([
                        this.accountService.getAccount(this.MpGroup),
                        this.staticUtilService
                            .cacheConfigValue("general.enrollment.crossBorderSales.states_requiring_epolicy_delivery")
                            .pipe(first()),
                        this.staticUtilService
                            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule_for_state_md.payroll")
                            .pipe(first()),
                        this.staticUtilService
                            .cacheConfigEnabled("general.feature.enable.cross_border_sales_rule_for_state_mo.payroll")
                            .pipe(first()),
                        this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.MpGroup),
                    ]),
                ),
                map(([account, eaaMessageStates, cbsEnabledMdPayroll, cbsEnabledMoPayroll, memberContact]) => {
                    let eaaStates: string[] = [];
                    if (eaaMessageStates !== undefined && eaaMessageStates !== null && eaaMessageStates.trim() !== "") {
                        eaaStates = eaaMessageStates.split(",");
                    }
                    let memberResidenceState = "";
                    if (memberContact.body.address) {
                        memberResidenceState = memberContact.body.address.state;
                    }
                    const MARYLAND = "MD";
                    const MISSOURI = "MO";
                    return (
                        !account.enrollmentAssistanceAgreement &&
                        eaaStates.includes(memberResidenceState) &&
                        account.partnerAccountType === "PAYROLL" &&
                        ((memberResidenceState !== MARYLAND && memberResidenceState !== MISSOURI) ||
                            (memberResidenceState === MARYLAND && cbsEnabledMdPayroll) ||
                            (memberResidenceState === MISSOURI && cbsEnabledMoPayroll))
                    );
                }),
            )
            .subscribe((resp) => (this.showEAAMessage = resp));
        this.checkFormDisable();
        this.checkForVestedAgents();
        this.checkCifNumber();
    }
    /**
     * This method is to check for role 71 and make readonly
     * @returns void
     */
    checkForVestedAgents(): void {
        this.staticUtilService
            .hasPermission(Permission.CENSUS_CONTACT_UPDATE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isVestedAgent = !response;
                this.manageReadOnlyFields();
            });
    }
    createFormControl(): void {
        const formGroupMap = {
            contactPreference: [""],
            contactTimeOfDay: [""],
            typeOfContact: [""],
            deliveryPreference: [""],
            notificationPreference: [""],
        };
        this.memberContactForm = this.formBuilder.group(formGroupMap);
        this.memberContactControls = this.memberContactForm.controls;
    }
    getStateManagement(): void {
        this.memberState$.pipe(takeUntil(this.unsubscribe$)).subscribe((state: Member) => {
            this.state = { ...state };
        });
        this.memberId = this.state.activeMemberId;
        this.memberFirstName = this.state.memberInfo.name.firstName;
        this.MpGroup = this.state.mpGroupId;
        this.configurations = this.state.configurations;
        this.getMemberData = this.state.memberInfo;
        if (this.getMemberData.profile.communicationPreference) {
            this.selectedCommunicationPreference = this.getMemberData.profile.communicationPreference;
            this.initialSelectedCommunicationPreference = this.selectedCommunicationPreference;
        } else {
            this.selectedCommunicationPreference = CommunicationPreference.EMAIL;
            this.initialSelectedCommunicationPreference = this.selectedCommunicationPreference;
        }
        if (this.getMemberData.profile.correspondenceType) {
            this.selectedCorrespondenceType = this.getMemberData.profile.correspondenceType;
            this.initialSelectedCorrespondenceType = this.selectedCorrespondenceType;
        } else {
            this.selectedCorrespondenceType = CorrespondenceType.ELECTRONIC;
            this.initialSelectedCorrespondenceType = this.selectedCorrespondenceType;
        }
        if (this.getMemberData.profile.correspondenceLocation) {
            this.selectedCorrespondenceLocation = this.getMemberData.profile.correspondenceLocation;
            this.initialSelectedCorrespondenceLocation = this.selectedCorrespondenceLocation;
        } else {
            this.selectedCorrespondenceLocation = ContactType.HOME;
            this.initialSelectedCorrespondenceLocation = this.selectedCorrespondenceLocation;
        }
    }
    // This function is used to get configurations about form fields.
    getConfigurations(): void {
        const mpgroup = parseInt(this.MpGroup, 10);
        this.staticService
            .getConfigurations("portal.member.form.contact.*", mpgroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((r) => {
                this.validationConfigurations = r;
                this.settingValidations(this.memberContactForm);
            });

        // Config to check if Standalone Demographic Changes is enabled
        this.sharedService
            .getStandardDemographicChangesConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled));
    }
    validateMessage(formGroupName: string, fieldName: string): boolean | undefined {
        if (this.memberContactControls) {
            const fieldNameControl = this.memberContactForm.get(fieldName);
            return fieldNameControl.touched && fieldNameControl.errors && fieldNameControl.errors.required;
        }
        return undefined;
    }
    // this function is used to set validations based on configurations.
    settingValidations(regiForm: any): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key]);
            } else if (this.getValidationForKey(key)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            }
        });
        this.getReadOnlyHiddenValidation(this.memberContactForm);
    }
    // this function is used to set validations based on configurations.
    getReadOnlyHiddenValidation(memberContactForm: FormGroup): void {
        Object.keys(memberContactForm.controls).forEach((key) => {
            if (memberContactForm.controls[key] instanceof FormGroup) {
                this.getReadOnlyHiddenValidation(memberContactForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = !this.getValidationValueForKey(key, this.HIDDEN);
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = this.getValidationValueForKey(key, this.READONLY);
            }
        });
    }
    // this function is used to set validations based on configurations.
    getValidationValueForKey(key: any, validationString: string): boolean {
        let flag = false;
        this.state.configurations.payload.contact.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === validationString.toLowerCase()
            ) {
                flag = true;
                this.getValidationValueForKey(key, this.REQUIRED);
            }
        });
        return flag;
    }
    getValidationForKey(key: string): boolean {
        let flag = false;
        this.validationConfigurations.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.name.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === this.REQUIRED
            ) {
                flag = true;
                this.requiredFields.push(element);
            }
        });
        return flag;
    }
    /**
     * This function is used to reset the form and prepopulate data.
     */
    revertForm(): void {
        this.memberContactForm.reset();
        this.errorMessageArray = [];
        this.phoneData = [];
        this.emailData = [];
        this.getMemberContactDetail(this.memberId, this.MpGroup);
        this.memberContactForm.markAsPristine();
        this.memberContactFormDirty$.next(false);
        this.isFormValueChange = false;
    }
    //
    /**
     * this function is used to get all types of member contacts (HOME,WORK)
     * @param memberId number: member Id which contact details need to fetch
     * @param MpGroup string:  Mp group
     * @param afterSave boolean(optional): after save flag it will be true if we are calling after saving contacts.
     */
    getMemberContactDetail(memberId: number, MpGroup: string, afterSave?: boolean): void {
        this.isLoading = true;
        this.memberService
            .getMemberContacts(memberId, MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.deliveryPref = [];
                    this.isLoading = false;
                    if (Response.length > 0) {
                        this.isLoading = false;
                        this.getMemberContactsData = Response;
                        this.bindDatatoTable(this.getMemberContactsData);
                        this.memberContactForm.patchValue({ contactPreference: this.selectedContactPreference });
                        this.memberContactForm.patchValue({ contactTimeOfDay: this.selectedContactTimeofDay });
                        this.memberContactForm.patchValue({ typeOfContact: this.selectedCorrespondenceLocation });
                        this.memberContactForm.patchValue({ deliveryPreference: this.selectedCorrespondenceType });
                        this.selectedCommunicationPreference = this.getDefaultCommunicationPreference();
                        if (this.notificationPreferenceEnabled) {
                            this.memberContactForm.patchValue({
                                notificationPreference: this.selectedCommunicationPreference,
                            });
                        }
                        if (this.getMemberContactsData.length > 0 && this.getMemberContactsData[0].address) {
                            this.deliveryPref.push(ContactType.HOME);
                        }
                        if (this.getMemberContactsData[1] && this.getMemberContactsData[1].address) {
                            this.deliveryPref.push(ContactType.WORK);
                        }
                        const state = { ...this.state.memberInfo };
                        state.workAddress = { ...this.getMemberContactsData[1] };
                        this.store.dispatch(
                            new AddMemberInfo({
                                memberInfo: state,
                                activeMemberId: this.memberId,
                                mpGroupId: this.MpGroup,
                            }),
                        );
                    }
                    if (afterSave && !this.showErrorMessage) {
                        this.isSaved = true;
                        this.isFormValueChange = false;
                    }
                },
                (Error) => {
                    // TODO - Need to handle error response
                    this.isLoading = false;
                    this.isSaved = false;
                    this.isFormValueChange = true;
                    this.errorMessageArray = [];
                    this.showErrorAlertMessage(Error);
                },
            );
    }

    /**
     * Initializes contact table.
     *
     * @param memberContactdata contact details
     */
    bindDatatoTable(memberContactdata: MemberContact[]): void {
        this.primaryPhone = null;
        this.primaryEmail = null;
        for (const membercontacts of memberContactdata) {
            if (membercontacts.phoneNumbers.length > 0) {
                for (const phonedetail of membercontacts.phoneNumbers) {
                    this.phoneData.push(phonedetail);
                    if (phonedetail.primary) {
                        this.primaryPhone = phonedetail;
                    }
                }
            }
            if (membercontacts.emailAddresses.length > 0) {
                for (const emaildetail of membercontacts.emailAddresses) {
                    this.emailData.push(emaildetail);
                    if (emaildetail.primary) {
                        this.primaryEmail = emaildetail;
                    }
                }
            }
            this.selectedContactPreference = membercontacts.immediateContactPreference;
            this.initialSelectedContactPreference = this.selectedContactPreference;
            this.selectedContactTimeofDay = membercontacts.contactTimeOfDay;
            this.initialSelectedContactTimeofDay = this.selectedContactTimeofDay;
        }
        this.phoneDataSource = new BehaviorSubject([]);
        this.phoneDataSource.next(this.phoneData);
        this.emailDataSource = new BehaviorSubject([]);
        this.emailDataSource.next(this.emailData);
    }
    /**
     * this function is used to open phone and email popup forms.
     * @param dialogFor is string used to get dialog information for which it triggers
     * @param rowData is type any used to define data in row
     * @param formType is string used to get formType which is optional
     * @param rowindex is number to get row index
     */
    openDialog(dialogFor: string, rowData?: any, formType?: string, rowindex?: number): void {
        const dialogRef = this.dialog.open(ContactInfoPopupComponent, {
            width: "667px",
            data: {
                title:
                    dialogFor === "Phone"
                        ? `${formType} ${this.languageStrings.phoneNumber.toLowerCase()}`
                        : `${formType} ${this.languageStrings.emailAddress.toLowerCase()}`,
                inputlabel: dialogFor === "Phone" ? this.languageStrings.phoneNumber : this.languageStrings.emailAddress,
                fieldType: dialogFor === "Phone" ? this.phonenumberTypes : this.emailTypes,
                isPhone: dialogFor === "Phone" ? true : false,
                inputName: dialogFor === "Phone" ? "phoneNumber" : "email",
                vaidatorMaxLength: dialogFor === "Phone" ? AppSettings.PHONE_NUM_MAX_LENGTH : null,
                rowData: rowData,
                contactButton: formType === ActionType.ADD ? ActionType.ADD : ActionType.EDIT,
                rowindex: rowindex,
                deletePopupFlag: formType === "Delete" ? true : false,
                contactLength: dialogFor === "Phone" ? this.phoneData.length : this.emailData.length,
                mpGroup: this.MpGroup,
                action: ActionType.EDIT,
                chekboxLabel: dialogFor === "Phone" ? "phone" : "email",
                contactData: dialogFor === "Phone" ? this.phoneData : this.emailData,
                emailLabel: this.isActiveEnrollment,
            },
        });
        // This function is used once phone and email popup has been closed.
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((contactdetails) => {
                this.errorMessageArray = [];
                if (contactdetails && contactdetails.formType === ActionType.ADD) {
                    if (contactdetails.isPhone) {
                        this.checkPrimaryContact(contactdetails);
                        this.phoneDataSource = new BehaviorSubject([]);
                        this.phoneData.push(contactdetails);
                        this.updateTextNotificationPreference(this.phoneData);
                        this.phoneDataSource.next(this.phoneData);
                    } else {
                        this.checkPrimaryContact(contactdetails);
                        this.emailDataSource = new BehaviorSubject([]);
                        this.emailData.push(contactdetails);
                        this.emailDataSource.next(this.emailData);
                        if (this.isUpdateDelivery) {
                            this.memberContactForm.patchValue({
                                deliveryPreference: CorrespondenceType.ELECTRONIC,
                            });
                        }
                    }
                }
                if (contactdetails && contactdetails.formType === ActionType.EDIT) {
                    if (contactdetails.isPhone) {
                        this.checkPrimaryContact(contactdetails, true);
                        if (contactdetails.type !== ContactType.WORK) {
                            contactdetails.extension = "";
                        }
                        this.phoneDataSource = new BehaviorSubject([]);
                        this.phoneData[contactdetails.rowindex] = contactdetails;
                        this.updateTextNotificationPreference(this.phoneData);
                        this.phoneDataSource.next(this.phoneData);
                        this.updateWorkContact = contactdetails.updateWorkContact;
                    } else {
                        this.checkPrimaryContact(contactdetails, true);
                        this.emailDataSource = new BehaviorSubject([]);
                        this.emailData[contactdetails.rowindex] = contactdetails;
                        this.emailDataSource.next(this.emailData);
                    }
                }
                if (contactdetails && contactdetails.deletePopupFlag) {
                    if (contactdetails.isPhone) {
                        this.phoneDataSource = new BehaviorSubject([]);
                        this.phoneData.splice(contactdetails.rowindex, 1);
                        this.phoneDataSource.next(this.phoneData);
                    } else {
                        this.emailDataSource = new BehaviorSubject([]);
                        this.emailData.splice(contactdetails.rowindex, 1);
                        this.emailDataSource.next(this.emailData);
                    }
                }
                if (contactdetails) {
                    this.isSaved = false;
                    this.isFormValueChange = true;
                    this.memberContactForm.markAsDirty();
                    this.memberContactFormDirty$.next(this.memberContactForm.dirty);
                }
                this.updatePaperDelivery(contactdetails);
            });
    }
    /**
     * method to update back to paper delivery if no contact details present
     * @param contactDetails updated contact details
     */
    updatePaperDelivery(contactDetails: Phone): void {
        if (this.isActiveEnrollment && !contactDetails) {
            this.memberContactForm.patchValue({
                deliveryPreference: CorrespondenceType.PAPER,
            });
        }
        this.isUpdateDelivery = false;
    }
    /**
     * This function is used to hide and show delivery preference drop down.
     * @param event { any } any html events either mouse click or keyboard
     * @returns Nothing
     */
    updateDeliveryPreference(event: any): void {
        this.memberContactForm.markAsDirty();
        this.memberContactFormDirty$.next(this.memberContactForm.dirty);
        if (event.value === CorrespondenceType.ELECTRONIC) {
            const actionEmail = "Email";
            this.getMemberEnrollments()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((activeEnrollment) => {
                    this.isLoading = false;
                    this.isActiveEnrollment = activeEnrollment;
                    if (activeEnrollment && !this.emailData.length) {
                        this.isUpdateDelivery = true;
                        this.openDialog(actionEmail, "", ActionType.ADD);
                    } else {
                        this.memberContactForm.patchValue({
                            deliveryPreference: CorrespondenceType.ELECTRONIC,
                        });
                    }
                });
        } else {
            this.memberContactForm.patchValue({ deliveryPreference: CorrespondenceType.PAPER });
        }
        this.formValueChange();
    }
    /**
     * This function is used to get member enrollment length
     * @returns Observable<boolean>
     */
    getMemberEnrollments(): Observable<boolean> {
        this.isLoading = true;
        return this.enrollmentsService.searchMemberEnrollments(this.state.activeMemberId, this.state.mpGroupId).pipe(
            tap((enrollmentData) => {
                // isApprovedEnrollment is set to true if the enrollment status is approved and application complete status is complete
                // api returns status as approved If enrollment status is approved and application status is complete
                // if status pending then check for the pending reason
                // if pending reason is carrier approval or admin approval set the flag to true
                // flag is set to true if one of the enrollment has enrollment status approved application status complete
                const approvedAndCompletedEnrollment = enrollmentData
                    .filter((enroll) => !enroll.riderOfEnrollmentId)
                    .some(
                        (enrollment) =>
                            enrollment.status === EnrollmentStatusType.APPROVED ||
                            (enrollment.status === EnrollmentStatusType.PENDING &&
                                (enrollment.pendingReason === PendingEnrollmentReason.CARRIER_APPROVAL ||
                                    enrollment.pendingReason === PendingEnrollmentReason.ADMIN_APPROVAL)),
                    );
                if (approvedAndCompletedEnrollment) {
                    this.isApprovedEnrollment = true;
                }
            }),
            map((data) => data && data.length > 0),
            takeUntil(this.unsubscribe$),
            catchError(() => {
                this.isLoading = false;
                return of(null);
            }),
        );
    }
    // This function is used to get phone and email types from API.
    getPhoneEmailTypes(): void {
        this.staticService
            .getPhoneNumberTypes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.phonenumberTypes = Response;
            });
        this.staticService
            .getEmailTypes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.emailTypes = Response;
            });
    }
    /**
     * Updates contacts and notification preferences
     * @param contact input contact info
     */
    checkPrimaryContact(contact: PrimaryContact & { isPhone: boolean }, edit?: boolean): void {
        // If the new phone number is selected as primary,
        // and if there is an existing primary number,
        // set the latter as non-primary.
        if (contact.isPhone === true) {
            if (contact.primary === true) {
                this.primaryPhone = contact;
                // Upon editing phoneType the id needs to be set to undefined
                if (edit) {
                    this.handlePhoneAndEmailTypeEdit("phone", true, contact);
                }
                if (this.phoneData.length > 0) {
                    this.phoneData = this.utilService.copy(this.phoneData);
                    const truePhoneElement = this.phoneData.filter((x) => x.primary === true);
                    if (truePhoneElement.length) {
                        truePhoneElement[0]["primary"] = false;
                    }
                }
            } else if (contact.primary === false && edit) {
                this.handlePhoneAndEmailTypeEdit("phone", false, contact);
            }
        } else if (contact.isPhone === false) {
            // If the email is selected as primary,
            // and if there is an existing primary email,
            // set the latter as non-primary.
            if (contact.primary === true) {
                this.primaryEmail = contact;
                // Upon editing emailType the id needs to be set to undefined
                if (edit) {
                    this.handlePhoneAndEmailTypeEdit("email", true, contact);
                }
                if (this.emailData.length > 0) {
                    this.emailData = this.utilService.copy(this.emailData);
                    const trueEmailElement = this.emailData.filter((x) => x.primary === true);
                    if (trueEmailElement.length) {
                        trueEmailElement[0]["primary"] = false;
                    }
                }
            } else if (contact.primary === false && edit) {
                this.handlePhoneAndEmailTypeEdit("email", false, contact);
            }
        }
    }

    /**
     * Handles setting the ID to undefined when "Type" of contact is updated from Work <-> Home
     * Explicitly declared public access specifier to be accessible via spec file
     * @param contactType - Sets the contact type to phone/email
     * @param primary - Sets primary / secondary
     * @param contact - Contact info for phone / email
     */
    handlePhoneAndEmailTypeEdit(contactType: string, primary: boolean, contact?: PrimaryContact): void {
        if (contactType === "phone") {
            if (primary) {
                const primaryContactIndex = this.phoneData.findIndex((x) => x.primary === true);
                if (this.phoneData[primaryContactIndex].type !== contact.type) {
                    contact.id = undefined;
                }
            } else {
                this.phoneData.forEach((record) => {
                    if (record && record.type !== contact.type) {
                        contact.id = undefined;
                    }
                });
            }
        } else if (contactType === "email") {
            if (primary) {
                const primaryEmailIndex = this.emailData.findIndex((x) => x.primary === true);
                if (this.emailData[primaryEmailIndex].type !== contact.type) {
                    contact.id = undefined;
                }
            } else {
                this.emailData.forEach((record) => {
                    if (record && record.type !== contact.type) {
                        contact.id = undefined;
                    }
                });
            }
        }
    }

    /**
     * This method will update the communication preference based on radio button selected.
     * The preference will either be EMAIL or PHONE.
     * @param value preference value
     */
    updateCommunicationPreference(value: string): void {
        this.selectedCommunicationPreference = value;
        this.memberContactFormDirty$.next(true);
        this.formValueChange();
    }
    /**
     * This method will update the contact method or time of contact.
     */
    updateContactMethodOrTimeOfContact(): void {
        this.memberContactFormDirty$.next(true);
        this.formValueChange();
    }
    /**
     * This function is used to save contact info data as well as update the contact info data.
     * @param valid is of type boolean used to check if all fields are valid on submit button
     * @param isTabChange is submit called from tab change
     * @returns Observable of type boolean to check submission is successful or not
     */
    // eslint-disable-next-line complexity
    onSubmit(valid: boolean, isTabChange?: boolean): Observable<boolean> {
        this.saveInProgress = true;
        const contactInfoFormData: ContactFormModel = this.memberContactForm.getRawValue();
        this.errorMessageArray = [];
        this.showErrorMessage = false;
        if (valid) {
            const getemailHomeData = [];
            const getemailWorkData = [];
            const getphoneHomeData = [];
            const getphoneWorkData = [];
            this.errorMessage = null;
            // get phone details for contact type HOME and WORK
            for (const getPhone of this.phoneData) {
                const phoneWorkHomeData = {
                    phoneNumber: this.normalizeFormat(getPhone.phoneNumber),
                    type: getPhone.type,
                    verified: getPhone.verified,
                    isMobile: getPhone.isMobile,
                    primary: getPhone.primary,
                };
                if (getPhone.id) {
                    phoneWorkHomeData["id"] = getPhone.id;
                }
                if (getPhone.type === ContactType.WORK) {
                    phoneWorkHomeData["extension"] = getPhone.extension;
                    getphoneWorkData.push(phoneWorkHomeData);
                } else {
                    getphoneHomeData.push(phoneWorkHomeData);
                }
            }
            // get email details based on contact type HOME and WORK.
            for (const getEmail of this.emailData) {
                const emailHomeWorkData = {
                    email: getEmail.email,
                    type: getEmail.type,
                    verified: getEmail.verified,
                    primary: getEmail.primary,
                };
                if (getEmail.id) {
                    emailHomeWorkData["id"] = getEmail.id;
                }
                if (getEmail.type === ContactType.WORK) {
                    getemailWorkData.push(emailHomeWorkData);
                } else {
                    getemailHomeData.push(emailHomeWorkData);
                }
            }

            this.getMemberContactHomeData = {};
            this.getMemberContactWorkData = {};
            if (this.getMemberContactsData.length > 0 && this.getMemberContactsData[0].address) {
                this.getMemberContactHomeData["address"] = this.getMemberContactsData[0].address;
                this.getMemberContactWorkData["address"] =
                    this.getMemberContactsData[1] && this.getMemberContactsData[1].address ? this.getMemberContactsData[1].address : null;
            }

            this.getMemberContactHomeData["phoneNumbers"] = getphoneHomeData;
            this.getMemberContactHomeData["emailAddresses"] = getemailHomeData;
            if (contactInfoFormData.contactPreference) {
                this.getMemberContactHomeData["immediateContactPreference"] = contactInfoFormData.contactPreference;
                if (contactInfoFormData.contactPreference === CommunicationPreference.PHONE) {
                    this.getMemberContactHomeData["contactTimeOfDay"] = contactInfoFormData.contactTimeOfDay;
                }
            } else {
                this.getMemberContactHomeData["immediateContactPreference"] = null;
                this.getMemberContactHomeData["contactTimeOfDay"] = null;
            }

            // save member contact for contact type HOME.
            this.saveMemberContactHomeObservable$ = this.memberService.saveMemberContact(
                this.memberId,
                ContactType.HOME,
                this.getMemberContactHomeData,
                this.MpGroup,
            );

            this.getMemberContactWorkData["phoneNumbers"] = getphoneWorkData;
            this.getMemberContactWorkData["emailAddresses"] = getemailWorkData;
            if (contactInfoFormData.contactPreference) {
                this.getMemberContactWorkData["immediateContactPreference"] = contactInfoFormData.contactPreference;
                if (contactInfoFormData.contactPreference === CommunicationPreference.PHONE) {
                    this.getMemberContactWorkData["contactTimeOfDay"] = contactInfoFormData.contactTimeOfDay;
                }
            } else {
                this.getMemberContactWorkData["immediateContactPreference"] = null;
                this.getMemberContactWorkData["contactTimeOfDay"] = null;
            }

            // save member contact for cotnact type WORK.
            this.saveMemberContactWorkObservable$ = this.memberService.saveMemberContact(
                this.memberId,
                ContactType.WORK,
                this.getMemberContactWorkData,
                this.MpGroup,
            );

            let correspondenceLocationType: string;
            const state = { ...this.state.memberInfo };
            // Since API does not require ssn
            delete state.ssn;
            const profile = { ...state.profile };
            if (contactInfoFormData.deliveryPreference === CorrespondenceType.ELECTRONIC) {
                correspondenceLocationType = ContactType.HOME;
            } else {
                correspondenceLocationType = contactInfoFormData.typeOfContact;
            }
            profile.correspondenceType = contactInfoFormData.deliveryPreference;
            profile.correspondenceLocation = correspondenceLocationType;
            if (this.notificationPreferenceEnabled) {
                profile.communicationPreference = contactInfoFormData.notificationPreference;
            }
            state.profile = { ...profile };
            state.workAddress = { ...this.getMemberContactWorkData };
            state.birthDate = this.dateFormatter(state.birthDate);
            this.errorMessageArray = [];
            this.openUpdateAlert(state, isTabChange);
        } else {
            this.saveInProgress = false;
            this.validateAllFormFields(this.memberContactForm);
            this.returnFlagSubject$.next(false);
        }
        return this.returnFlagSubject$;
    }

    /**
     * set data map if primary email or phone changes
     */
    setContactDataChanges(): void {
        this.updatedContactData = [];
        // get the primary email populated initially
        const existingPrimaryEmail = [
            ...this.getMemberContactsData[0]?.emailAddresses,
            ...(this.getMemberContactsData[1] ? this.getMemberContactsData[1]?.emailAddresses : []),
        ].find((email) => email.primary);
        // get the primary phone number populated initially
        const existingPrimaryPhoneNumber = [
            ...this.getMemberContactsData[0]?.phoneNumbers,
            ...(this.getMemberContactsData[1] ? this.getMemberContactsData[1]?.phoneNumbers : []),
        ].find((phone) => phone.primary);
        const updatedPrimaryEmail = this.emailData?.find((email) => email.primary);
        const updatedPrimaryPhoneNumber = this.phoneData?.find((phone) => phone.primary);
        if (existingPrimaryEmail?.email !== updatedPrimaryEmail?.email) {
            this.updatedContactData.push(`${this.languageStrings.emailAddress} : ${updatedPrimaryEmail.email}`);
        }
        if (existingPrimaryPhoneNumber?.phoneNumber !== updatedPrimaryPhoneNumber?.phoneNumber) {
            this.updatedContactData.push(`${this.languageStrings.phoneNumber} : ${updatedPrimaryPhoneNumber.phoneNumber}`);
        }
    }

    /**
     * fetch the save member contact observable to check if work or home info is saved
     * @param memberState current member data
     * @returns Observable of saveMemberContact api
     */
    getSaveMemberContactObservable(memberState: MemberProfile): Observable<void> {
        return this.saveMemberContact(
            memberState,
            this.updateWorkContact ||
                (!this.getMemberContactsData[0].email && this.emailData.some((email) => email.type === EMAIL_WORK && email.primary))
                ? this.saveMemberContactWorkObservable$
                : this.saveMemberContactHomeObservable$,
        );
    }

    /**
     * Open changes confirm modal based on cif number
     * @param memberState current member data
     */
    openUpdateAlert(memberState: MemberProfile, isTabChange?: boolean): void {
        this.saveInProgress = false;
        this.memberService
            .getMember(this.state.activeMemberId, true, this.state.mpGroupId.toString())
            .pipe(
                tap((memberData) => {
                    if (memberData.body?.customerInformationFileNumber && this.isStandaloneDemographicEnabled) {
                        this.setContactDataChanges();
                    }
                }),
                switchMap(() => {
                    if (this.updatedContactData.length && !isTabChange && this.isStandaloneDemographicEnabled) {
                        return this.empoweredModalService
                            .openDialog(ProfileChangesConfirmPromptComponent, {
                                data: {
                                    data: this.updatedContactData,
                                    isAgentAssisted: false,
                                },
                            })
                            .afterClosed();
                    }
                    return of(true);
                }),
                filter((isSaved) => !!isSaved),
                switchMap(() => {
                    this.saveInProgress = true;
                    return this.getSaveMemberContactObservable(memberState);
                }),
                tap(() => {
                    // allow navigation if member data is successfully saved on intercept tab change
                    if (isTabChange) {
                        this.allowNavigation.next(true);
                        this.allowNavigation.complete();
                    }
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                () => {
                    this.isLoading = false;
                    this.updateWorkContact = false;
                },
                (error) => {
                    this.isLoading = false;
                    this.saveInProgress = false;
                    this.handleError(error);
                },
            );
    }

    /**
     * This method is used to make API call for save member contact information.
     * Make call to getMember API to get updated member details.
     * Make call to updateMember API to update member details with updated state value with username.
     * Dispatching the store with updated state value.
     * @param state state as member details from store
     * @param saveContactObservable save member contact api call based on phone number type
     * @returns an observable of void
     */
    saveMemberContact(state: MemberProfile, saveContactObservable$: Observable<void>): Observable<void> {
        return saveContactObservable$.pipe(
            delay(SECOND_IN_MILLISECONDS),
            switchMap(() =>
                this.updateWorkContact ||
                (!this.getMemberContactsData[0].email && this.emailData.some((email) => email.type === EMAIL_WORK && email.primary))
                    ? this.saveMemberContactHomeObservable$
                    : this.saveMemberContactWorkObservable$,
            ),
            switchMap(() => this.memberService.getMember(this.memberId, true, this.MpGroup)),
            switchMap((memberDetails) => {
                const memberDetailsRes = memberDetails?.body;
                if (memberDetailsRes) {
                    if (memberDetailsRes.username) {
                        state.username = memberDetailsRes.username;
                    }
                    state.registrationStatus = memberDetailsRes.registrationStatus;
                    state.verificationInformation = memberDetailsRes.verificationInformation;
                }
                return this.memberService.updateMember(state, this.MpGroup, this.memberId.toString());
            }),
            switchMap(() => {
                // below logic checks if member has registration status
                if (
                    (!state?.registrationStatus ||
                        !(
                            state.registrationStatus === RegistrationStatus.CIAM_BASIC ||
                            state.registrationStatus === RegistrationStatus.CIAM_FULL
                        )) &&
                    state.profile.correspondenceType === CorrespondenceType.ELECTRONIC &&
                    this.selectedCorrespondenceType !== state.profile.correspondenceType &&
                    this.isActiveEnrollment &&
                    !this.isAgentSelfEnrolled &&
                    this.isApprovedEnrollment
                ) {
                    this.isLoading = true;
                    return this.enrollmentsService
                        .registerCustomer(ActivityPageCode.MEMBER_PROFILE_COMPONENT, this.memberId, +this.MpGroup)
                        .pipe(catchError(() => of(null)));
                }
                return of(null);
            }),
            tap(() => {
                this.store.dispatch(
                    new AddMemberInfo({
                        memberInfo: state,
                        activeMemberId: this.memberId,
                        mpGroupId: this.MpGroup,
                    }),
                );
                this.memberContactForm.markAsPristine();
                this.memberContactFormDirty$.next(false);
                this.phoneData = [];
                this.emailData = [];
                this.getMemberContactDetail(this.memberId, this.MpGroup, true);
                this.getStateManagement();
                if (!this.showErrorMessage) {
                    this.isSaved = true;
                    this.isFormValueChange = false;
                }
                this.returnFlagSubject$.next(true);
                this.saveInProgress = false;
            }),
        );
    }

    /**
     * This method is used to handle error for Member contact API.
     * @param error error object of type interface ERROR
     * @returns void
     */
    handleError(error: Error): void {
        this.showErrorAlertMessage(error);
        this.returnFlagSubject$.next(false);
        this.isLoading = false;
    }

    /**
     * This method checks if member has cif number
     * @returns void
     */
    checkCifNumber(): void {
        this.memberService
            .getMember(this.memberId, true, this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((profileData) => {
                this.hasCifNumber = !!profileData.body?.customerInformationFileNumber;
            });
    }

    /**
     * This method opens confirmation alert
     * @returns void
     */
    openAlert(): void {
        if (this.memberContactForm.dirty) {
            this.checkAlert = false;
            if (this.state.memberInfo?.customerInformationFileNumber && this.isStandaloneDemographicEnabled) {
                this.setContactDataChanges();
            }
            const dialogData: ConfirmationDialogData = {
                title: "",
                content: this.langService
                    .fetchSecondaryLanguageValue("secondary.portal.members.contact.tabChangeMsg")
                    .replace(
                        "#name",
                        `${this.state.activeMemberId ? this.state.memberInfo.name.firstName : ""} ${
                            this.state.activeMemberId ? this.state.memberInfo.name.lastName : ""
                        }`,
                    ),
                primaryButton: {
                    // TODO : get message from language directive. Hardcoded as of now
                    buttonTitle: ActionType.EDIT,
                    buttonAction: this.OnConfirmDialogAction.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: this.languageStrings.dontSave,
                    buttonAction: this.OnConfirmDialogAction.bind(this, false),
                },
                profileChangesData: this.updatedContactData,
                isStandaloneDemographicEnabled: this.isStandaloneDemographicEnabled,
            };

            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: "667px",
                data: dialogData,
            });
        }
    }
    /**
     * Method on confirmation dialog while adding/editing contact details
     * @param isEdit to check add/edit contact
     */
    OnConfirmDialogAction(isEdit: boolean): void {
        this.checkAlert = true;
        this.navigationFlag = true;
        if (isEdit) {
            this.onSubmit(this.memberContactForm.valid, true).pipe(takeUntil(this.unsubscribe$)).subscribe();
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }
    ngOnDestroy(): void {
        if (this.allowNavigation) {
            this.allowNavigation.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * This method is used to show error messages when the API call fails.
     * @param err error object of type ERROR
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length) {
            for (const detail of error[this.DETAILS]) {
                if (detail.field === PHONE_NUMBERS_CHECK || detail.field === EMAIL_ADDRESS_CHECK) {
                    const alreadyExistingError = this.errorMessageArray.filter((errorMessage) => errorMessage === detail.message);
                    if (!alreadyExistingError.length) {
                        this.errorMessageArray.push(detail.message);
                    }
                } else if (detail.code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                    const message = this.langService.fetchPrimaryLanguageValue(detail.message);
                    this.errorMessageArray.push(message);
                } else {
                    this.errorMessageArray.push(
                        this.langService.fetchSecondaryLanguageValue(
                            "secondary.portal.members.api." + error.status + "." + error.code + "." + detail.field,
                        ),
                    );
                }
            }
        } else if (error.status === AppSettings.API_RESP_409 && error[this.DETAILS].length) {
            for (const detail of error[this.DETAILS]) {
                const alreadyExistingError = this.errorMessageArray.find((errorMessage) => errorMessage === detail.message);
                if (!alreadyExistingError) {
                    this.errorMessageArray.push(detail.message);
                }
            }
        } else {
            this.errorMessageArray.push(this.langService.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code));
        }
        this.showErrorMessage = true;
    }
    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.contact.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
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

    dateFormatter(date: any): any {
        return this.datePipe.transform(date, AppSettings.DATE_FORMAT);
    }
    /**
     * Ths method will handle the form disable if user doesn't have permission.
     * @returns void
     */
    checkFormDisable(): void {
        combineLatest([
            this.sharedService.checkAgentSelfEnrolled(),
            this.utilService
                .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.state.mpGroupId.toString())
                .pipe(filter(([isRestricted, accountData]) => isRestricted && accountData.thirdPartyPlatformsEnabled)),
        ])
            .pipe(
                filter(([isAgentSelfEnrolled]) => !isAgentSelfEnrolled),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(([isAgentSelfEnrolled]) => {
                this.memberContactForm.disable();
                this.disableFormFields = true;
            });
    }
    normalizeFormat(num: string): string {
        if (num && num.indexOf("-") !== -1) {
            return num.replace(/-/g, "");
        }
        return num;
    }

    /**
     * This method will set isAflacReadOnly boolean flag based on response of canAccessTPIRestrictedModuleInHQAccount.
     * manageReadOnlyFields()  method will handle read-only access to fields
     * If portal is producer then we will get array of boolean flag and assign response to global variable in component
     * @param portal string producer/member.
     * @returns void
     */
    checkTPIRestrictions(portal: string): void {
        this.tpiRestrictionsService
            .canEditMemberProfile(
                Permission.AFLAC_HQ_MEMBER_PROFILE_EDIT_CONFIG,
                Permission.AFLAC_HQ_PRODUCER_PROFILE_EDIT_PERMISSION,
                Permission.AFLAC_HQ_PRODUCER_PROFILE_PARTIAL_EDIT_PERMISSION,
            )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([memberCanEdit, producerCanEdit, producerCanPartiallyEdit]) => {
                if (portal === Portals.MEMBER.toLowerCase()) {
                    this.isAflacReadOnly = !memberCanEdit;
                } else if (portal === Portals.PRODUCER.toLowerCase()) {
                    this.isAflacReadOnly = !producerCanEdit && !producerCanPartiallyEdit;
                    this.isPartialEdit = producerCanPartiallyEdit;
                }
                this.manageReadOnlyFields();
            });
    }

    /**
     * This method is to set field as read-only by modifying readOnlyFieldElementSetting Object.
     * In case of isAflacReadOnly we need to handle deliveryPreference field to having editable in member portal.
     * @returns void
     */
    manageReadOnlyFields(): void {
        const readOnlyFieldObj = this.utilService.copy(this.readOnlyFieldElementSetting);
        Object.keys(this.memberContactForm.controls).forEach((key) => {
            readOnlyFieldObj[key] = !CONTACT_PREFERENCES.includes(key);
            this.readOnlyFieldElementSetting = readOnlyFieldObj;
        });
    }
    /**
     * This function is for setting form value change flag as true.
     */
    formValueChange(): void {
        this.isFormValueChange = true;
    }

    /**
     * This is used to initialize the communication preference control.
     *
     * @returns default communication preference option
     */
    getDefaultCommunicationPreference(): CommunicationPreference {
        if (this.getMemberData.profile.communicationPreference === CommunicationPreference.EMAIL) {
            return this.primaryEmail ? CommunicationPreference.EMAIL : undefined;
        }
        if (this.getMemberData.profile.communicationPreference === CommunicationPreference.PHONE) {
            return this.primaryPhone?.isMobile ? CommunicationPreference.PHONE : undefined;
        }
        return undefined;
    }

    /**
     * This method is used to set notification preference to undefined when none of the phone is primary and mobile.
     * @param phoneData List of all available phone numbers
     */
    updateTextNotificationPreference(phoneData: Phone[]): void {
        const primaryAndMobileContact = phoneData.find((phone) => phone.isMobile && phone.primary);
        if (primaryAndMobileContact) {
            return;
        }
        this.memberContactForm.patchValue({
            notificationPreference: CommunicationPreference.UNDEFINED,
        });
    }
}
