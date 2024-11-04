import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators, AbstractControl } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { StaticService, HideReadOnlyElementSetting } from "@empowered/api";
import { Subscription, Observable } from "rxjs";
import { Store, Select } from "@ngxs/store";
import { ReplaceTagPipe, LanguageService } from "@empowered/language";
import { DependentContactInterface } from "@empowered/constants";
import { DependentListState, SharedState, RegexDataType } from "@empowered/ngxs-store";
interface FormGroupControl {
    [key: string]: AbstractControl;
}
interface DialogData {
    title: string;
    inputLabel: string;
    fieldType: string[];
    isPhone: boolean;
    inputName: string;
    contacttype: string;
    validatorMaxLength: number;
    editData: DependentContactInterface;
    action: string;
    rowIndex: number;
    contactLength: number;
    contactData: DependentContactInterface[];
}

const ActionType = {
    EDIT: "Edit",
    ADD: "Add",
    DELETE: "Delete",
};

@Component({
    selector: "empowered-contact-info-popup",
    templateUrl: "./contact-info-popup.component.html",
    styleUrls: ["./contact-info-popup.component.scss"],
})
export class ContactInfoPopupComponent implements OnInit {
    contactInfoPopupForm: FormGroup;
    contactType: FormControl;
    phoneNumber: FormControl;
    emailAddress: FormControl;
    extension: FormControl;
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    validationRegex;
    memberID: number;
    memberId: number;
    dependentId: string;
    phoneData: DependentContactInterface;
    emailData: DependentContactInterface;
    validationConfigurations = [];
    getConfigurationSubscriber: Subscription;
    textCheckbox: string;
    MP_GROUP: number;
    removeContactMsg: string;
    isLoading: boolean;
    hideFieldElementSetting: HideReadOnlyElementSetting = {
        dependentContactType: true,
        dependentPhoneNumber: true,
        dependentUseAsPrimary: true,
        dependentEmailAddress: true,
    };
    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        dependentContactType: false,
        dependentPhoneNumber: false,
        dependentUseAsPrimary: false,
        dependentEmailAddress: false,
    };
    languageStrings = {
        select: this.language.fetchPrimaryLanguageValue("primary.portal.common.placeholderSelect"),
        phoneNumber: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contact.phoneNumber"),
        emailAddress: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contact.emailAddress"),
        extension: this.language.fetchPrimaryLanguageValue("primary.portal.members.dependent.contact.extension"),
        cancel: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
        add: this.language.fetchPrimaryLanguageValue("primary.portal.common.add"),
        save: this.language.fetchPrimaryLanguageValue("primary.portal.common.save"),
        remove: this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
    };
    requiredFields = [];
    primaryContact: string;
    regexSubscription: Subscription;

    constructor(
        private readonly dialogRef: MatDialogRef<ContactInfoPopupComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly fb: FormBuilder,
        private readonly staticService: StaticService,
        private readonly store: Store,
        private readonly replacePipe: ReplaceTagPipe,
        private readonly language: LanguageService,
    ) {
        this.regexSubscription = this.regex$.subscribe((regexData) => {
            if (regexData) {
                this.validationRegex = regexData;
            }
        });
        this.MP_GROUP = this.store.selectSnapshot(DependentListState.groupId);
        this.isLoading = true;
        this.createFormControls();
        if (this.data.contactLength === 0 || (this.data.editData && this.data.editData.primary)) {
            this.textCheckbox = this.replacePipe.transform("primary.portal.members.dependent.contact.primaryContactText", {
                "#contact": this.data && this.data.inputLabel && this.data.inputLabel.toLowerCase(),
            });
        } else if (this.data.action === ActionType.ADD && this.data.contactLength) {
            this.identifyPrimaryContact(this.data.contactData);
            this.textCheckbox = this.replacePipe.transform("primary.portal.members.dependent.contact.replacePrimaryText", {
                "#contact": this.primaryContact,
            });
        } else {
            this.identifyPrimaryContact(this.data.contactData);
            this.textCheckbox = this.replacePipe.transform("primary.portal.members.dependent.contact.replacePrimaryText", {
                "#contact": this.primaryContact,
            });
        }

        if (this.data.action === ActionType.EDIT) {
            this.populateValuesFromData();
        }

        if (this.data.action === ActionType.DELETE && this.data.isPhone) {
            this.removeContactMsg = this.replacePipe.transform("primary.portal.members.dependent.contact.removeContactText", {
                "#contact": this.data && this.data.editData.phoneNumber,
            });
        } else {
            this.removeContactMsg = this.replacePipe.transform("primary.portal.members.dependent.contact.removeContactText", {
                "#contact": this.data.editData && this.data.editData.email,
            });
        }
    }

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        this.getConfigurations();
    }

    /**
     * To identify primary contact
     * @param contactData Contact details of user
     */
    identifyPrimaryContact(contactData: DependentContactInterface[]): void {
        const primaryDataObj = contactData.filter((contact) => contact.primary === true);
        if (primaryDataObj.length) {
            this.primaryContact = this.data && this.data.isPhone ? primaryDataObj[0].phoneNumber : primaryDataObj[0].email;
        }
    }

    get popupFormControls(): FormGroupControl {
        return this.contactInfoPopupForm.controls;
    }

    /**
     * Create form controls
     */
    createFormControls = () => {
        let contactPresent;
        if (this.data.contactLength > 0) {
            contactPresent = false;
        } else {
            contactPresent = true;
        }
        if (this.data.isPhone) {
            this.contactInfoPopupForm = this.fb.group(
                {
                    type: this.fb.control(""),
                    phoneNumber: this.fb.control("", Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))),
                    extension: this.fb.control(""),
                    primary: this.fb.control(contactPresent),
                    isMobile: [false],
                },
                { updateOn: "blur" },
            );
        } else {
            this.contactInfoPopupForm = this.fb.group(
                {
                    type: this.fb.control(""),
                    email: this.fb.control("", Validators.pattern(this.validationRegex.EMAIL)),
                    primary: this.fb.control(contactPresent),
                },
                { updateOn: "blur" },
            );
        }
    };

    /**
     * Setting up validations for form controls
     * @param regiForm Form group
     */
    settingValidations(regiForm: FormGroup): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key] as FormGroup);
            } else if (this.getValidationForKey(key)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            }
        });
    }

    /**
     * To add validation configurations to form control
     * @param key Form Control name
     */
    getValidationForKey(key: string): boolean {
        let flag = false;
        this.validationConfigurations.forEach((element) => {
            if (
                element.name.substring(element.name.lastIndexOf(".") + 1, element.name.length).toLowerCase() === key.toLowerCase() &&
                element.value.toLowerCase() === "required"
            ) {
                flag = true;
                this.requiredFields.push(element);
            }
        });
        return flag;
    }

    /**
     * To check if the form controls are mandatory to answer
     * @param control Form control name
     */
    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.contactInfoPopupForm.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }

    /**
     * To fetch configurations
     */
    getConfigurations(): void {
        this.getConfigurationSubscriber = this.staticService
            .getConfigurations("portal.member.form.contactInfoPopupForm.*", this.MP_GROUP)
            .subscribe((r) => {
                this.validationConfigurations = r;
                this.settingValidations(this.contactInfoPopupForm);
                this.isLoading = false;
            });
    }

    /**
     * To populate data in form controls
     */
    populateValuesFromData = () => {
        if (this.data.isPhone === true) {
            this.contactInfoPopupForm.patchValue({
                type: this.data.editData.type,
                phoneNumber: this.data.editData.phoneNumber,
                extension: this.data.editData.extension,
                primary: this.data.editData.primary,
                isMobile: this.data.editData.isMobile,
            });
        } else {
            this.contactInfoPopupForm.patchValue({
                type: this.data.editData.type,
                email: this.data.editData.email,
                primary: this.data.editData.primary,
            });
        }
    };

    /**
     * This method will be called on the click of Cancel
     */
    onCancelClick(): void {
        this.dialogRef.close();
    }

    /**
     * This function will be called on click of Save button
     */
    onSubmit = () => {
        if (this.contactInfoPopupForm.valid) {
            if ((this.data.action === ActionType.ADD || this.data.action === ActionType.EDIT) && this.data.isPhone) {
                this.phoneData = this.contactInfoPopupForm.value;
                this.phoneData.isPhone = true;
                this.phoneData.action = this.data.action;
                if (this.data.action === ActionType.EDIT) {
                    this.phoneData.rowIndex = this.data.rowIndex;
                    this.phoneData.id = this.data.editData.id;
                }
                this.phoneData.verified = false;
                this.dialogRef.close(this.phoneData);
            } else if ((this.data.action === ActionType.ADD || this.data.action === ActionType.EDIT) && !this.data.isPhone) {
                this.emailData = this.contactInfoPopupForm.value;
                this.emailData.isPhone = false;
                this.emailData.action = this.data.action;
                if (this.data.action === ActionType.EDIT) {
                    this.emailData.rowIndex = this.data.rowIndex;
                    this.emailData.id = this.data.editData.id;
                }
                this.emailData.verified = false;
                this.dialogRef.close(this.emailData);
            }
        }
    };

    /**
     * To remove contact info
     * @param isPhone Contact mode is Phone
     * @param rowIndex Index of row
     * @param action Action to be taken
     */
    removeContactInfo(isPhone: boolean, rowIndex: number, action: string): void {
        this.dialogRef.close({ isPhone: isPhone, rowIndex: rowIndex, action: action });
    }

    /**
     * ng life cycle hook
     * This method will execute before component is destroyed
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy = () => {
        if (this.getConfigurationSubscriber) {
            this.getConfigurationSubscriber.unsubscribe();
        }
        if (this.regexSubscription) {
            this.regexSubscription.unsubscribe();
        }
    };
}
