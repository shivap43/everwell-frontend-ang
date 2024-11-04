import { LanguageService } from "@empowered/language";
import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormGroup, Validators, FormBuilder } from "@angular/forms";
import { HideReadOnlyElementSetting } from "@empowered/api";
import { Subscription, Observable, combineLatest } from "rxjs";
import { StaticService } from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { tap } from "rxjs/operators";
import { UserService } from "@empowered/user";
import { ClientErrorResponseCode, ContactType, Phone } from "@empowered/constants";
import { PhoneFormatConverterPipe } from "@empowered/ui";
import { SharedService } from "@empowered/common-services";
import { AccountInfoState, SharedState, StaticUtilService } from "@empowered/ngxs-store";

const EMAIL = "email";
const PHONE = "phoneNumber";
const MEMBER = "member";
const ACCOUNT_NUMBER_CONFIG = "aflac.producer.selfEnrollment.accountNumbers";
const DIRECT = "direct";

export interface DialogData {
    title: string;
    inputlabel: string;
    fieldType: string[];
    isPhone: boolean;
    inputName: string;
    vaidatorMaxLength: number;
    rowData: any;
    contactButton: string;
    rowindex: number;
    deletePopupFlag: boolean;
    contactLength: number;
    mpGroup: string;
    action: string;
    chekboxLabel: string;
    contactData: any[];
    emailLabel?: boolean;
}

@Component({
    selector: "empowered-contact-info-popup",
    templateUrl: "./contact-info-popup.component.html",
    styleUrls: ["./contact-info-popup.component.scss"],
})
export class ContactInfoPopupComponent implements OnInit {
    contactInfoPopupForm: FormGroup;
    deleteData = [];
    isPhone: boolean;
    objPhoneEmail: Phone;
    textcheckbox: string;
    validationConfigurations = [];
    deleteMessage: string;
    emailprimaryFlag: boolean;
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";
    duplicate = false;
    vaidatorExtMaxLength = 5;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        type: true,
        extension: true,
        primary: true,
    };

    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        type: false,
        extension: false,
        primary: false,
    };

    errorMessage: string;
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    showErrorMessage: boolean;
    errorMessageArray = [];
    languageStrings = {
        select: this.langService.fetchPrimaryLanguageValue("primary.portal.common.select"),
        ariaClose: this.langService.fetchPrimaryLanguageValue("primary.portal.common.close"),
        extension: this.langService.fetchPrimaryLanguageValue("primary.portal.members.contactLabel.extention"),
    };
    memberContactControls: any;
    requiredFields = [];
    primaryContact: string;
    validationRegex: any;
    private subscriptions: Subscription[] = [];
    @Select(SharedState.regex) regex$: Observable<any>;
    isAgentSelfEnrolled: boolean;
    isEmailPhoneSelfEnrolledFlag: boolean;
    accountNumber: number;
    isDirect = false;
    selfEnrollmentAccountNumbers: string[];
    selfEnrollmentAccount = false;
    portal: string;
    hasPrimaryContact: boolean;

    constructor(
        private readonly dialogRef: MatDialogRef<ContactInfoPopupComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly langService: LanguageService,
        private readonly sharedService: SharedService,
        private readonly store: Store,
        private readonly staticUtilService: StaticUtilService,
        private readonly router: Router,
        private readonly userService: UserService,
    ) {
        this.subscriptions.push(
            this.regex$.subscribe((regexData) => {
                if (regexData) {
                    this.validationRegex = regexData;
                }
            }),
        );
        this.subscriptions.push(this.userService.portal$.pipe(tap((portal) => (this.portal = portal))).subscribe());
        this.initializeContactPopupForm(this.data.isPhone, this.data.deletePopupFlag);
        this.getPhoneEmailValue("");
        if (this.data.contactButton === this.data.action) {
            this.populateValuesFromData(this.data.deletePopupFlag);
        }
        if (this.data.deletePopupFlag) {
            if (this.data.isPhone) {
                this.deleteMessage = this.langService
                    .fetchSecondaryLanguageValue("secondary.portal.members.contact.deleteContactMsg")
                    .replace("#contact", new PhoneFormatConverterPipe().transform(this.data.rowData.phoneNumber));
            } else {
                this.deleteMessage = this.langService
                    .fetchSecondaryLanguageValue("secondary.portal.members.contact.deleteContactMsg")
                    .replace("#contact", this.data.rowData.email);
            }
        }
        this.emailprimaryFlag = false;
    }

    /**
     * To identify primary contact
     * @param contactData Contact details of user
     */
    identifyPrimaryContact(contactData: any[]): void {
        const primaryDataObj = contactData.filter((contact) => contact.primary === true);
        if (primaryDataObj.length) {
            this.hasPrimaryContact = true;
            this.primaryContact = this.data && this.data.isPhone ? primaryDataObj[0].phoneNumber : primaryDataObj[0].email;
        } else {
            this.hasPrimaryContact = false;
        }
    }
    get popupformControls(): Record<string, unknown> {
        return this.contactInfoPopupForm.controls;
    }
    onCancelClick(): void {
        this.dialogRef.close();
    }
    getPhoneEmailValue(event: any): void {
        if (this.data.contactLength) {
            this.identifyPrimaryContact(this.data.contactData);
        }
        const langStringPrimary = this.langService.fetchSecondaryLanguageValue("secondary.portal.members.contact.usePrimary");
        const langStringReplace = this.langService.fetchSecondaryLanguageValue("secondary.portal.members.contact.replaces");
        if (this.data.contactLength === 0 || this.data.rowData.primary) {
            this.textcheckbox = langStringPrimary.replace("#checkboxLabel", this.data.chekboxLabel);
        } else if (this.data.rowData.phoneNumber && event === "") {
            this.textcheckbox = this.hasPrimaryContact
                ? langStringReplace.replace("#checkvalue", this.primaryContact)
                : langStringPrimary.replace("#checkboxLabel", this.data.chekboxLabel);
        } else if (this.data.rowData.email && event === "") {
            this.textcheckbox = this.hasPrimaryContact
                ? langStringReplace.replace("#checkvalue", this.primaryContact)
                : langStringPrimary.replace("#checkboxLabel", this.data.chekboxLabel);
        } else if (event) {
            this.textcheckbox = langStringReplace.replace("#checkvalue", event);
        } else {
            this.textcheckbox = this.hasPrimaryContact
                ? langStringReplace.replace("#checkvalue", this.primaryContact)
                : (this.textcheckbox = langStringPrimary.replace("#checkboxLabel", this.data.chekboxLabel));
        }
    }

    /*
        Component life cycle hook
        OnInit
        Setting the following modal properties:
        1. checkAgentSelfEnrolled(): To check if the agent is self enrolled or not
    */
    ngOnInit(): void {
        if (!this.data.deletePopupFlag) {
            this.getConfigurations();
        }
        if (this.router.url.indexOf(DIRECT) >= 0) {
            this.isDirect = true;
        }
        if (!this.isDirect && this.portal !== MEMBER) {
            this.accountNumber = this.store.selectSnapshot(AccountInfoState).accountInfo.accountNumber
                ? this.store.selectSnapshot(AccountInfoState).accountInfo.accountNumber
                : "";
        }
        this.subscriptions.push(
            combineLatest([
                this.sharedService.checkAgentSelfEnrolled(),
                this.staticUtilService.cacheConfigValue(ACCOUNT_NUMBER_CONFIG),
            ]).subscribe(([response, accountNumber]) => {
                this.isAgentSelfEnrolled = response;
                this.selfEnrollmentAccountNumbers = accountNumber.split(",");
                if (this.accountNumber && this.selfEnrollmentAccountNumbers.includes(this.accountNumber.toString())) {
                    this.selfEnrollmentAccount = true;
                }
                if (this.isAgentSelfEnrolled || this.selfEnrollmentAccount) {
                    this.isEmailPhoneSelfEnrolledFlag = true;
                    if (!this.data.isPhone && this.data.rowData.email && this.data.rowData.primary) {
                        this.contactInfoPopupForm.controls[EMAIL].disable();
                    } else if (this.data.isPhone && this.data.rowData.phoneNumber && this.data.rowData.primary) {
                        this.contactInfoPopupForm.controls[PHONE].disable();
                    }
                }
            }),
        );
    }

    /**
     * This function is used to initialize ContactInfo form.
     * @param isPhone this boolean value is used to differentiate whether it is a phone or email.
     * @param deletePopupFlag this boolean value is used to check we are not deleting contact .
     */
    initializeContactPopupForm(isPhone: boolean, deletePopupFlag: boolean): void {
        if (!deletePopupFlag) {
            if (isPhone) {
                this.contactInfoPopupForm = this.fb.group(
                    {
                        extension: ["", [Validators.pattern(new RegExp(this.validationRegex.PHONE_EXT))]],
                        phoneNumber: ["", [Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))]],
                        type: [""],
                        isMobile: [this.data.rowData.isMobile || false, { updateOn: "change" }],
                        primary: [this.data.contactLength > 0 ? false : true, { updateOn: "change" }],
                    },
                    { updateOn: "blur" },
                );
            } else {
                this.contactInfoPopupForm = this.fb.group(
                    {
                        email: ["", [Validators.pattern(this.validationRegex.EMAIL), Validators.maxLength(60)]],
                        type: [""],
                        primary: [this.data.contactLength > 0 ? false : true, { updateOn: "change" }],
                    },
                    { updateOn: "blur" },
                );
            }
            this.memberContactControls = this.contactInfoPopupForm.controls;
        }
    }

    getConfigurations(): void {
        const mpgroup = parseInt(this.data.mpGroup, 10);
        this.subscriptions.push(
            this.staticService.getConfigurations("portal.member.form.contactInfoPopupForm.*", mpgroup).subscribe((r) => {
                this.validationConfigurations = r;
                this.settingValidations(this.contactInfoPopupForm);
            }),
        );
    }
    validateMessage(formGroupName: string, fieldName: string): boolean | undefined {
        if (this.memberContactControls) {
            const fieldNameControl = this.contactInfoPopupForm.get(fieldName);
            return fieldNameControl.touched && fieldNameControl.errors && fieldNameControl.errors.required;
        }
        return undefined;
    }
    settingValidations(regiForm: any): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key]);
            } else if (this.getValidationForKey(key)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            }
        });
        this.getReadOnlyHiddenValidation(this.contactInfoPopupForm);
    }

    getReadOnlyHiddenValidation(contactInfoPopupForm: FormGroup): void {
        Object.keys(contactInfoPopupForm.controls).forEach((key) => {
            if (contactInfoPopupForm.controls[key] instanceof FormGroup) {
                this.getReadOnlyHiddenValidation(contactInfoPopupForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = !this.getValidationValueForKey(key, this.HIDDEN);
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = this.getValidationValueForKey(key, this.READONLY);
            }
        });
    }

    getValidationValueForKey(key: any, validationString: string): boolean {
        let flag = false;
        this.validationConfigurations.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === validationString.toLowerCase()
            ) {
                flag = true;
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

    populateValuesFromData = (deletePopupFlag: boolean) => {
        if (!deletePopupFlag) {
            const getRowData = this.data.rowData;
            if (this.data.isPhone === true) {
                this.contactInfoPopupForm.patchValue({
                    type: getRowData.type,
                    phoneNumber: getRowData.phoneNumber,
                    extension: getRowData.extension,
                    primary: getRowData.primary,
                });
            } else {
                this.contactInfoPopupForm.patchValue({
                    type: getRowData.type,
                    email: getRowData.email,
                    primary: getRowData.primary,
                });
            }
        }
    };
    onDelete(isPhone: boolean, deletePopupFlag: boolean, rowindex: number): void {
        this.deleteData["isPhone"] = isPhone;
        this.deleteData["rowindex"] = rowindex;
        this.deleteData["deletePopupFlag"] = deletePopupFlag;
        this.dialogRef.close(this.deleteData);
    }

    /**
     * Function invokes on submit to update the contact details
     * @return void
     */
    onSubmit(): void {
        this.isDuplicate();
        if (this.contactInfoPopupForm.valid && !this.duplicate) {
            this.objPhoneEmail = this.contactInfoPopupForm.value;
            this.objPhoneEmail["verified"] = false;
            this.objPhoneEmail["isPhone"] = this.data.isPhone;
            this.objPhoneEmail["formType"] = this.data.contactButton;
            this.objPhoneEmail["rowindex"] = this.data.rowindex;
            this.objPhoneEmail["updateWorkContact"] =
                this.data.rowData &&
                this.data.rowData.type === ContactType.WORK &&
                this.contactInfoPopupForm.controls.type.value !== ContactType.WORK;
            if (this.data.contactButton === "Save" && this.data.rowData && this.data.rowData.id && this.data.rowData !== "") {
                this.objPhoneEmail["id"] = this.data.rowData.id;
            }
            this.dialogRef.close(this.objPhoneEmail);
        } else if (this.contactInfoPopupForm.valid && this.duplicate) {
            this.contactInfoPopupForm.get(this.data.inputName).setErrors({ duplicate: true });
            if (this.isAgentSelfEnrolled) {
                this.dialogRef.close();
            }
        } else {
            this.validateAllFormFields(this.contactInfoPopupForm);
        }
    }
    onreplacePrimary(isPhone: boolean, event: any): void {
        if (!isPhone) {
            if (!this.contactInfoPopupForm.get("primary").value) {
                this.emailprimaryFlag = true;
            } else {
                this.emailprimaryFlag = false;
            }
        }
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(
                `secondary.portal.commission.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.contactInfoPopupForm.${control}`);
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
    /**
     * Function is called from onSubmit and this is used to find if data entered by the user is duplicate or not
     * @returns void
     */
    isDuplicate(): void {
        let duplicateData;
        const allHyphens = /-/g;
        if (this.data.inputName === "phoneNumber") {
            const enteredNumber = this.contactInfoPopupForm.value.phoneNumber.replace(allHyphens, "");
            duplicateData = this.data.contactData.filter(
                (contact) =>
                    enteredNumber === contact.phoneNumber.replace(allHyphens, "") &&
                    enteredNumber !== (this.data.rowData.phoneNumber && this.data.rowData.phoneNumber.replace(allHyphens, "")),
            );
        } else {
            duplicateData = this.data.contactData.filter(
                (contact) =>
                    this.contactInfoPopupForm.controls.email.value === contact.email &&
                    this.contactInfoPopupForm.controls.email.value !== this.data.rowData.email,
            );
        }
        if (this.data.contactButton === this.data.action) {
            this.duplicate = duplicateData.length >= 1;
        } else {
            this.duplicate = duplicateData.length > 0;
        }
    }
    ngOnDestroy = () => {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    };
}
