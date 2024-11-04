import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import { StaticService, HideReadOnlyElementSetting } from "@empowered/api";
import { Subscription, Observable } from "rxjs";
import { Store, Select } from "@ngxs/store";
import { ReplaceTagPipe } from "@empowered/language";
import { LanguageService } from "@empowered/language";
import { DependentContactInterface } from "@empowered/constants";
import { DependentListState, SharedState } from "@empowered/ngxs-store";

export interface DialogData {
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
    @Select(SharedState.regex) regex$: Observable<any>;
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
            let contact = "";
            if (this.data && this.data.editData) {
                contact = this.data.editData.phoneNumber ? this.data.editData.phoneNumber : this.data.editData.email;
            }
            if (this.primaryContact) {
                this.textCheckbox = this.replacePipe.transform("primary.portal.members.dependent.contact.replacePrimaryText", {
                    "#contact": this.primaryContact,
                });
            } else {
                this.textCheckbox = this.replacePipe.transform("primary.portal.members.dependent.contact.primaryContactText", {
                    "#contact": this.data && this.data.inputLabel && this.data.inputLabel.toLowerCase(),
                });
            }
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

    get popupFormControls(): any {
        return this.contactInfoPopupForm.controls;
    }

    createFormControls = () => {
        if (this.data.isPhone) {
            this.contactInfoPopupForm = this.fb.group(
                {
                    type: this.fb.control(""),
                    phoneNumber: this.fb.control("", Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE))),
                    extension: this.fb.control(""),
                    primary: this.fb.control(this.data.contactLength > 0 ? false : true),
                    isMobile: [false],
                },
                { updateOn: "blur" },
            );
        } else {
            this.contactInfoPopupForm = this.fb.group(
                {
                    type: this.fb.control(""),
                    email: this.fb.control("", Validators.pattern(this.validationRegex.EMAIL)),
                    primary: this.fb.control(this.data.contactLength > 0 ? false : true),
                },
                { updateOn: "blur" },
            );
        }
    };

    settingValidations(regiForm: any): void {
        Object.keys(regiForm.controls).forEach((key) => {
            if (regiForm.controls[key] instanceof FormGroup) {
                this.settingValidations(regiForm.controls[key]);
            } else if (this.getValidationForKey(key)) {
                regiForm.controls[key].setValidators(Validators.compose([Validators.required, regiForm.controls[key].validator]));
                regiForm.controls[key].updateValueAndValidity();
            }
        });
    }

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

    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.contactInfoPopupForm.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }

    getConfigurations(): void {
        this.getConfigurationSubscriber = this.staticService
            .getConfigurations("portal.member.form.contactInfoPopupForm.*", this.MP_GROUP)
            .subscribe((r) => {
                this.validationConfigurations = r;
                this.settingValidations(this.contactInfoPopupForm);
                this.isLoading = false;
            });
    }
    populateValuesFromData = () => {
        if (this.data.isPhone === true) {
            this.contactInfoPopupForm.patchValue({
                type: this.data.editData.type,
                phoneNumber: this.data.editData.phoneNumber,
                extension: this.data.editData.extension,
                primary: this.primaryContact ? this.data.editData.primary : true,
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

    onCancelClick(): void {
        this.dialogRef.close();
    }

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
    removeContactInfo(isPhone: boolean, rowIndex: number, action: string): void {
        this.dialogRef.close({ isPhone: isPhone, rowIndex: rowIndex, action: action });
    }
    ngOnDestroy = () => {
        if (this.getConfigurationSubscriber) {
            this.getConfigurationSubscriber.unsubscribe();
        }
        if (this.regexSubscription) {
            this.regexSubscription.unsubscribe();
        }
    };
}
