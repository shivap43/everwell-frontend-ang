import { Component, OnInit, Input, SimpleChanges, OnChanges } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { ContactInfoPopupComponent } from "../contact-info-popup/contact-info-popup.component";
import { StaticService, MemberService, MemberDependentContact, HideReadOnlyElementSetting } from "@empowered/api";
import {
    PhoneFormatConverterPipe,
    ProfileChangesConfirmPromptComponent,
    ConfirmationDialogData,
    ConfirmationDialogComponent,
} from "@empowered/ui";
import { BehaviorSubject, Observable, Subscription, Subject, of, iif } from "rxjs";
import { ActivatedRoute } from "@angular/router";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import {
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    ConfigName,
    DependentContactInterface,
    AppSettings,
    ContactManageOptions,
    DependentContactPreferences,
    EmailContactTypes,
    PhoneContactTypes,
    PhoneContact,
    EmailContact,
    TimeOfDay,
} from "@empowered/constants";
import { filter, switchMap, tap, takeUntil } from "rxjs/operators";
import { DependentListState, SetActiveDependentId, UtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-dependent-contact-info",
    templateUrl: "./dependent-contact-info.component.html",
    styleUrls: ["./dependent-contact-info.component.scss"],
    providers: [PhoneFormatConverterPipe],
})
export class DependentContactInfoComponent implements OnInit, OnChanges {
    serviceFirstName: string;
    serviceLastName: string;
    displayedPhoneColumns: string[] = ["phoneNumber", "extension", "phoneType", "mobile", "verified", "isPrimary", "manage"];
    displayedEmailColumns: string[] = ["emailAddress", "emailType", "verified", "isPrimary", "manage"];
    phonenumberTypes: string[] = [PhoneContactTypes.HOME, PhoneContactTypes.OTHER];
    emailTypes: string[] = [EmailContactTypes.PERSONAL, EmailContactTypes.OTHER];
    contactPreferenceForm: FormGroup;
    communicationPreference = [DependentContactPreferences.PHONE, DependentContactPreferences.EMAIL];
    contactTimeOfDay = [TimeOfDay.MORNING, TimeOfDay.AFTERNOON, TimeOfDay.EVENING];
    manageOptions = [ContactManageOptions.EDIT, ContactManageOptions.VERIFY, ContactManageOptions.REMOVE];
    memberId: number;
    MpGroup: number;
    dependentId: number;
    dependentContactPhoneNumbers: { next: (arg0: DependentContactInterface[]) => void };
    dependentContactEmails: { next: (arg0: DependentContactInterface[]) => void };
    dependentTimeOfDay: any;
    dependentContact: MemberDependentContact;
    phoneData: DependentContactInterface[] = [];
    emailData: DependentContactInterface[] = [];
    isEdit = false;
    validationConfigurations = [];
    isSaved: boolean;
    isLoading: boolean;
    checkAlert: boolean;
    navigationFlag: boolean;
    allowNavigation: Subject<boolean>;
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";
    errorMessage: string;
    ERROR = "error";
    @Input() isContactTab: boolean;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        dependentContactPreference: true,
        dependentTypeOfContact: true,
    };
    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        dependentContactPreference: false,
        dependentTypeOfContact: false,
    };
    languageStrings = {
        select: this.language.fetchPrimaryLanguageValue("primary.portal.common.placeholderSelect"),
        phoneTooltip: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.phoneTooltip"),
        emailTooltip: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.emailTooltip"),
        ariaSave: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.ariaSave"),
        ariaSaved: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.ariaSaved"),
        ariaShowMenu: this.language.fetchPrimaryLanguageValue("primary.portal.common.ariaShowMenu"),
        phone: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.phone"),
        email: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.email"),
        phoneNumber: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contact.phoneNumber"),
        emailAddress: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contact.emailAddress"),
        mainHeading: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.title"),
        addPhone: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.addPhone"),
        addEmail: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.addEmail"),
        contactPreferences: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contactInfo.contactPreferences"),
    };
    requiredFields = [];
    country = AppSettings.COUNTRY_US;
    langStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.undoChanges",
        "primary.portal.common.doNotSave",
    ]);
    savedPrimaryEmailData: EmailContact;
    savedPrimaryPhoneData: PhoneContact;
    hasCifNumber = false;
    private readonly unsubscribe$: Subject<void> = new Subject();
    isStandaloneDemographicEnabled: boolean;

    constructor(
        private readonly dialog: MatDialog,
        private readonly staticService: StaticService,
        private readonly formBuilder: FormBuilder,
        private readonly memberService: MemberService,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly sharedService: SharedService,
    ) {
        this.isSaved = false;
        this.checkAlert = true;
    }

    ngOnInit(): void {
        this.MpGroup = this.store.selectSnapshot(DependentListState.groupId);
        this.memberId = this.store.selectSnapshot(DependentListState.memberId);
        this.dependentId = this.store.selectSnapshot(DependentListState.activeDependentId);
        this.isLoading = true;
        this.createFormControl();
        this.getConfigurations();
        this.memberService.currentFirstName.pipe(takeUntil(this.unsubscribe$)).subscribe((result) => {
            this.serviceFirstName = result;
        });
        this.memberService.currentLastName.pipe(takeUntil(this.unsubscribe$)).subscribe((result) => {
            this.serviceLastName = result;
        });
        this.setDependentCifStatus();
    }
    ngOnChanges(changes: SimpleChanges): void {
        this.isLoading = true;
        if (changes.isContactTab.currentValue) {
            this.getDependentContacts$();
        }
    }

    /**
     * check if dependent has customerInformationFileNumber
     */
    setDependentCifStatus(): void {
        this.memberService
            .getMemberDependent(this.memberId, +this.dependentId, true, this.MpGroup)
            .pipe(
                tap((dependentProfile) => {
                    this.hasCifNumber = !!dependentProfile?.customerInformationFileNumber;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    createFormControl = () => {
        this.contactPreferenceForm = this.formBuilder.group({
            contactMethod: this.formBuilder.control(""),
            timeOfDay: this.formBuilder.control(""),
        });
    };

    settingValidations(regiForm: any): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key]);
            } else if (this.getValidationValueForKey(key, this.REQUIRED)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = !this.getValidationValueForKey(key, this.HIDDEN);
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = this.getValidationValueForKey(key, this.READONLY);
            }
        });
    }

    /**
     * This method is used to show error messages when the API call fails.
     * @param err error object of type ERROR
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[this.ERROR];
        if (
            error.status === ClientErrorResponseCode.RESP_400 &&
            error.details.length &&
            error.details[0].code === ClientErrorResponseDetailCodeType.VALID_EMAIL
        ) {
            this.errorMessage = this.language.fetchPrimaryLanguageValue(error.details[0].message);
        }
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
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.contactPreferenceForm.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }

    getConfigurations(): void {
        this.staticService
            .getConfigurations("portal.member.form.contactPreferenceForm.*", this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (r) => {
                    this.validationConfigurations = r;
                    this.settingValidations(this.contactPreferenceForm);
                    this.isLoading = false;
                },
                (err) => {
                    this.isLoading = false;
                },
            );

        // Config to check if Standalone Demographic Change is enabled
        this.sharedService
            .getStandardDemographicChangesConfig()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled));
    }

    get contactFormControls(): any {
        return this.contactPreferenceForm.controls;
    }

    revertForm(): void {
        this.contactPreferenceForm.reset();
        this.phoneData = [];
        this.emailData = [];
        this.getDependentContacts$();
        this.contactPreferenceForm.markAsPristine();
    }

    private getDependentContacts$ = (afterSave?: boolean) => {
        this.route.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.dependentId = +params["dependentId"];
            if (!this.dependentId) {
                this.dependentId = this.store.selectSnapshot(DependentListState.activeDependentId);
            }
            this.store.dispatch(new SetActiveDependentId(this.dependentId));
        });
        this.MpGroup = this.store.selectSnapshot(DependentListState.groupId);
        this.memberId = this.store.selectSnapshot(DependentListState.memberId);
        if (this.dependentId) {
            this.memberService
                .getMemberDependentContact(this.memberId, this.dependentId.toString(), this.MpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (contact) => {
                        this.dependentContact = contact;
                        this.dependentContactPhoneNumbers = contact.phoneNumbers;
                        this.dependentContactEmails = contact.emailAddresses;
                        this.dependentTimeOfDay = contact.contactTimeOfDay;
                        this.contactPreferenceForm.patchValue({
                            timeOfDay: this.dependentContact["contactTimeOfDay"],
                        });
                        this.contactPreferenceForm.patchValue({
                            contactMethod: this.dependentContact["immediateContactPreference"],
                        });
                        this.bindDataToPhoneTableAndControls$(this.dependentContact);
                        this.bindDataToEmailTableAndControl$(this.dependentContact);
                        this.isLoading = false;
                        this.contactPreferenceForm.markAsPristine();
                        this.savedPrimaryEmailData = contact.emailAddresses.find((email) => email.primary) || { email: "" };
                        this.savedPrimaryPhoneData = contact.phoneNumbers.find((phone) => phone.primary) || { phoneNumber: "" };
                        if (afterSave) {
                            this.isSaved = true;
                        }
                    },
                    (err) => {
                        this.isLoading = false;
                    },
                );
        }
    };

    /**
     * This function sets all the demographic changes made
     * @returns changes values of email or phone number
     */
    getContactDataChanges(): string[] {
        const updatedContactData = [];
        const updatedPrimaryEmail = this.dependentContact.emailAddresses.find((email) => email.primary) || { email: "" };
        const updatedPrimaryPhone = this.dependentContact.phoneNumbers.find((phone) => phone.primary) || { phoneNumber: "" };
        if (updatedPrimaryEmail.email !== this.savedPrimaryEmailData.email) {
            updatedContactData.push(`${this.languageStrings.emailAddress} : ${updatedPrimaryEmail.email}`);
        }
        if (updatedPrimaryPhone.phoneNumber !== this.savedPrimaryPhoneData.phoneNumber) {
            updatedContactData.push(`${this.languageStrings.phoneNumber} : ${updatedPrimaryPhone.phoneNumber}`);
        }
        return updatedContactData;
    }

    private bindDataToPhoneTableAndControls$ = (contact: MemberDependentContact) => {
        if (contact && contact.phoneNumbers.length > 0) {
            for (const phone of contact.phoneNumbers) {
                phone.phoneNumber = this.normalizeFormat(phone.phoneNumber);
                this.phoneData.push(phone);
            }
        }
        this.dependentContactPhoneNumbers = new BehaviorSubject([]);
        this.dependentContactPhoneNumbers.next(this.phoneData);
        this.dependentContact["phoneNumbers"] = this.dependentContactPhoneNumbers["_value"];
    };

    private bindDataToEmailTableAndControl$ = (contact: MemberDependentContact) => {
        if (contact && contact.emailAddresses.length > 0) {
            for (const email of contact.emailAddresses) {
                this.emailData.push(email);
            }
        }
        this.dependentContactEmails = new BehaviorSubject([]);
        this.dependentContactEmails.next(this.emailData);
        this.dependentContact["emailAddresses"] = this.dependentContactEmails["_value"];
    };

    /**
     * Used to open the dialog for editing the dependent contact information
     * @param dialogFor is of type string used to define type of dialog
     * @param action is of type string used to display action name on dialog
     * @param rowData is of type DependentContactInterface used to define if there is any rowData to display and it is an optional parameter
     * @param index is of type number used to define index number
     *
     */
    openDialog(dialogFor: string, action: string, rowData?: DependentContactInterface, index?: number): void {
        this.errorMessage = "";
        const dialogRef = this.dialog.open(ContactInfoPopupComponent, {
            width: "600px",
            data: {
                title:
                    dialogFor === "Phone"
                        ? `${action} ${this.languageStrings.phoneNumber.toLowerCase()}`
                        : `${action} ${this.languageStrings.emailAddress.toLowerCase()}`,
                inputLabel: dialogFor === "Phone" ? this.languageStrings.phone : this.languageStrings.email,
                fieldType: dialogFor === "Phone" ? this.phonenumberTypes : this.emailTypes,
                isPhone: dialogFor === "Phone" ? true : false,
                inputName: dialogFor === "Phone" ? "phonenumber" : "emailaddress",
                contacttype: dialogFor === "Phone" ? "phonetype" : "emailtype",
                validatorMaxLength: dialogFor === "Phone" ? AppSettings.PHONE_NUM_MAX_LENGTH : AppSettings.NULL,
                editData: action === "Edit" || action === "Delete" ? rowData : {},
                action: action,
                rowIndex: index,
                contactLength: dialogFor === "Phone" ? this.phoneData.length : this.emailData.length,
                contactData: dialogFor === "Phone" ? this.phoneData : this.emailData,
            },
        });
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((contact) => {
                this.isSaved = false;
                if (contact && contact.action === "Add") {
                    if (contact && contact.isPhone === true) {
                        this.checkPrimaryContact(contact);
                        this.phoneData.push(contact);
                        this.dependentContactPhoneNumbers.next(this.phoneData);
                    } else if (contact && contact.isPhone === false) {
                        this.checkPrimaryContact(contact);
                        this.emailData.push(contact);
                        this.dependentContactEmails.next(this.emailData);
                    }
                } else if (contact && contact.action === "Edit") {
                    this.isEdit = true;
                    if (contact && contact.isPhone === true) {
                        this.checkPrimaryContact(contact);
                        this.phoneData[contact.rowIndex] = contact;
                        this.dependentContactPhoneNumbers.next(this.phoneData);
                    } else if (contact && contact.isPhone === false) {
                        this.checkPrimaryContact(contact);
                        this.emailData[contact.rowIndex] = contact;
                        this.dependentContactEmails.next(this.emailData);
                    }
                } else if (contact && contact.action === "Delete") {
                    if (contact && contact.isPhone) {
                        this.phoneData.splice(contact.rowIndex, 1);
                        this.dependentContactPhoneNumbers.next(this.phoneData);
                    } else if (contact && contact.isPhone === false) {
                        this.emailData.splice(contact.rowIndex, 1);
                        this.dependentContactEmails.next(this.emailData);
                    }
                }
                this.isSaved = false;
                this.contactPreferenceForm.markAsDirty();
            });
    }

    checkPrimaryContact = (contact: DependentContactInterface) => {
        if (this.phoneData.length > 0 && Boolean(contact.isPhone) && Boolean(contact.primary)) {
            const truePhoneElement = this.phoneData.filter((x) => x.primary === true);
            const falsePhoneElement = this.phoneData.filter((x) => x.primary === false);
            if (truePhoneElement.length) {
                truePhoneElement[0]["primary"] = false;
            } else {
                falsePhoneElement[contact.rowIndex]["primary"] = true;
            }
        } else if (this.emailData.length > 0 && Boolean(!contact.isPhone) && Boolean(contact.primary)) {
            const trueEmailElement = this.emailData.filter((x) => x.primary === true);
            const falseEmailElement = this.emailData.filter((x) => x.primary === false);
            if (trueEmailElement.length) {
                trueEmailElement[0]["primary"] = false;
            } else {
                falseEmailElement[contact.rowIndex]["primary"] = true;
            }
        }
    };
    /**
     * Used to save the dependent contact information
     * @param tabChange checks if function is called when user switches tab
     * @returns observable of type boolean is used to track whether dependent contact information is saved or not
     */
    saveDependentContact(tabChange = false): Observable<boolean> {
        const returnFlag = new Subject<boolean>();
        if (this.contactPreferenceForm.valid) {
            this.isLoading = true;
            this.dependentContact.immediateContactPreference = this.contactFormControls.contactMethod.value;
            this.dependentContact.contactTimeOfDay = this.contactFormControls.timeOfDay.value;
            of(this.hasCifNumber)
                .pipe(
                    switchMap((response) => {
                        if (!response || tabChange) {
                            return of([]);
                        }
                        return of(this.getContactDataChanges());
                    }),
                    switchMap((updatedContactData) => {
                        this.isLoading = false;
                        if (!updatedContactData.length) {
                            return of(true);
                        }
                        return this.isStandaloneDemographicEnabled
                            ? this.empoweredModalService
                                .openDialog(ProfileChangesConfirmPromptComponent, {
                                    data: {
                                        data: updatedContactData,
                                        isAgentAssisted: false,
                                    },
                                })
                                .afterClosed()
                            : of(true);
                    }),
                    filter((isSaved) => !!isSaved),
                    switchMap(() =>
                        this.memberService.saveMemberDependentContact(
                            this.dependentContact,
                            this.memberId,
                            this.dependentId.toString(),
                            this.MpGroup,
                        ),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (response) => {
                        this.phoneData = [];
                        this.emailData = [];
                        this.getDependentContacts$(true);
                        this.isSaved = true;
                        this.isLoading = false;
                        returnFlag.next(true);
                    },
                    (err) => {
                        this.isLoading = false;
                        this.showErrorAlertMessage(err);
                        returnFlag.next(false);
                    },
                );
        }
        return returnFlag.asObservable();
    }

    normalizeFormat(num: string): string {
        if (num && num.indexOf("-") !== -1) {
            return num.replace(/-/g, "");
        }
        return num;
    }

    openAlert(): void {
        if (this.contactPreferenceForm.dirty) {
            this.checkAlert = false;

            const dialogData: ConfirmationDialogData = {
                title: "",
                content: this.language
                    .fetchSecondaryLanguageValue("secondary.portal.members.contact.tabChangeMsg")
                    .replace("#name", `${this.dependentId ? this.serviceFirstName : ""} ${this.dependentId ? this.serviceLastName : ""}'s`),
                primaryButton: {
                    buttonTitle: this.languageStrings.ariaSave,
                    buttonAction: this.OnConfirmDialogAction.bind(this, true),
                },
                secondaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.doNotSave"],
                    buttonAction: this.OnConfirmDialogAction.bind(this, false),
                },
                profileChangesData: this.hasCifNumber ? this.getContactDataChanges() : [],
                isStandaloneDemographicEnabled: this.isStandaloneDemographicEnabled,
            };

            const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
                width: "667px",
                data: dialogData,
            });
        }
    }
    OnConfirmDialogAction(isEdit: boolean): void {
        this.checkAlert = true;
        this.navigationFlag = true;
        if (isEdit) {
            this.saveDependentContact(true)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.navigationFlag = res;
                    this.allowNavigation.next(this.navigationFlag);
                    this.allowNavigation.complete();
                });
        } else {
            this.allowNavigation.next(this.navigationFlag);
            this.allowNavigation.complete();
        }
    }

    ngOnDestroy = () => {
        if (this.allowNavigation) {
            this.allowNavigation.unsubscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    };
}
