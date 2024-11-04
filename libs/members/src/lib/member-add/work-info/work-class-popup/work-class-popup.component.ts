import { LanguageService } from "@empowered/language";
import { DatePipe } from "@angular/common";
import { Component, Inject, OnInit, OnDestroy, HostListener } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ClassNames, Configuration, MemberClassType, MemberService, HideReadOnlyElementSetting, ClassType } from "@empowered/api";
import { Select } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";

import { NgxMaskPipe } from "ngx-mask";
import { ClientErrorResponseCode, AppSettings } from "@empowered/constants";
import { Member, MemberInfoState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

export interface DialogData {
    title: string;
    classNames: ClassNames[];
    classTypeId: number;
    editRowData: MemberClassType;
    state: Member;
    allClasses: ClassType[];
}

@Component({
    selector: "empowered-work-class-popup",
    templateUrl: "./work-class-popup.component.html",
    styleUrls: ["./work-class-popup.component.scss"],
    providers: [DatePipe],
})
export class WorkClassPopupComponent implements OnInit, OnDestroy {
    state: Member;
    memberId: number;
    mpGroupId: string;
    storeSubscriber: Subscription;
    createClassSubscriber: Subscription;
    getClassNamesSubscriber: Subscription;
    @Select(MemberInfoState) memberState$: Observable<Member>;
    configurations: Configuration[];

    classPopUpForm: FormGroup;
    selectedType: string;
    classBody: MemberClassType;
    classType: number;
    dataToWorkForm: any;
    classPopUpControls: any;
    differenceInDaysWhenEndDateIsLessThenStartDate: string;
    endDateLessThenStartDate = false;
    REQUIRED = "required";
    HIDDEN = "hidden";
    READONLY = "readonly";

    hideFieldElementSetting: HideReadOnlyElementSetting = {
        id: true,
        effectiveStarting: true,
        expiresAfter: true,
    };

    readOnlyFieldElementSetting: HideReadOnlyElementSetting = {
        id: false,
        effectiveStarting: false,
        expiresAfter: false,
    };

    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    showErrorMessage: boolean;
    errorMessageArray = [];
    errorMessage: string;
    languageStrings = {
        select: this.langService.fetchPrimaryLanguageValue("primary.portal.common.select"),
        ariaClose: this.langService.fetchPrimaryLanguageValue("primary.portal.common.close"),
        startDateLabel: this.langService.fetchPrimaryLanguageValue("primary.portal.members.workLabel.startDate"),
        endDateLabel: this.langService.fetchPrimaryLanguageValue("primary.portal.members.workLabel.endDate"),
        optional: this.langService.fetchPrimaryLanguageValue("primary.portal.common.optional"),
        ifApplicable: this.langService.fetchPrimaryLanguageValue("primary.portal.common.ifApplicable"),
        cancel: this.langService.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
        addClass: this.langService.fetchPrimaryLanguageValue("primary.portal.common.add"),
    };
    notificationOngoingOverlap: boolean;
    newDateToBeUpdated: string;
    oldClassThatWillGetUpdated: string;
    updatedMessage: string;
    requiredFields = [];
    isDateInvalid = false;
    datesAreSame = false;
    datesAreSameErrorMessage: string;

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly dialogRef: MatDialogRef<WorkClassPopupComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        private readonly memberService: MemberService,
        private readonly datePipe: DatePipe,
        private readonly langService: LanguageService,
        private readonly maskPipe: NgxMaskPipe,
        private readonly dateService: DateService,
    ) {}

    ngOnInit(): void {
        this.notificationOngoingOverlap = false;
        this.newDateToBeUpdated = "";
        this.initializeWorkForm();
        this.getStateManagement();
        this.subcribeToFormChanges();
        this.isDateInvalid = true;
    }

    getStateManagement(): void {
        this.configurations = this.data.state.configurations;
        this.memberId = this.data.state.activeMemberId;
        this.mpGroupId = this.data.state.mpGroupId;
        if (this.configurations && this.data.state.configurations.payload && this.classPopUpForm) {
            this.settingValidations(this.classPopUpForm);
        }
    }

    initializeWorkForm(): void {
        if (this.data.editRowData === undefined) {
            this.classPopUpForm = this.formBuilder.group({
                classData: this.formBuilder.group(
                    {
                        id: [null],
                        effectiveStarting: [""],
                        expiresAfter: [""],
                    },
                    { updateOn: "blur" },
                ),
            });
        } else {
            this.classPopUpForm = this.formBuilder.group({
                classData: this.formBuilder.group(
                    {
                        id: [this.data.editRowData.id],
                        effectiveStarting: [this.data.editRowData.validity.effectiveStarting],
                        expiresAfter: [this.data.editRowData.validity.expiresAfter],
                    },
                    { updateOn: "blur" },
                ),
            });
            this.classPopUpForm.setErrors({ invalid: false });
            this.selectedType = this.data.editRowData.id.toString();
        }
        this.classPopUpControls = this.classPopUpForm.controls;
        this.settingValidations(this.classPopUpForm);
    }

    subcribeToFormChanges(): void {
        const workFormValueChanges$ = this.classPopUpForm.valueChanges;
    }

    settingValidations(formGroup: FormGroup): void {
        this.data.state.configurations.payload.work.forEach((element) => {
            Object.keys(formGroup.controls).forEach((field) => {
                const control = formGroup.get(field);
                for (const subField in control["controls"]) {
                    if (subField && element.name.split(".").pop() === subField && element.value === this.REQUIRED) {
                        this.getValidationValueForKey(subField, this.REQUIRED);
                        if (control["controls"][subField].validator) {
                            control["controls"][subField].setValidators([Validators.required, control["controls"][subField].validator]);
                        } else {
                            control["controls"][subField].setValidators([Validators.required]);
                        }
                        control["controls"][subField].updateValueAndValidity();
                    }
                }
            });
        });
        this.getReadOnlyHiddenValidation(this.classPopUpForm);
    }

    getReadOnlyHiddenValidation(classPopUpForm: FormGroup): void {
        Object.keys(classPopUpForm.controls).forEach((key) => {
            if (classPopUpForm.controls[key] instanceof FormGroup) {
                this.getReadOnlyHiddenValidation(classPopUpForm.controls[key] as FormGroup);
            } else if (this.getValidationValueForKey(key, this.HIDDEN)) {
                this.hideFieldElementSetting[key] = !this.getValidationValueForKey(key, this.HIDDEN);
            } else if (this.getValidationValueForKey(key, this.READONLY)) {
                this.readOnlyFieldElementSetting[key] = this.getValidationValueForKey(key, this.READONLY);
            }
        });
    }

    getValidationValueForKey(key: any, validationString: string): boolean {
        let flag = false;
        this.data.state.configurations.payload.work.forEach((element) => {
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

    validateMessage(formGroupName: string, fieldName: string): boolean | undefined {
        if (this.classPopUpControls) {
            const fieldNameControl = this.classPopUpControls[formGroupName].get(fieldName);
            return fieldNameControl.touched && fieldNameControl.errors && fieldNameControl.errors.required;
        }
        return undefined;
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

    /* Added as mat-datepicker does not validate the dates when user clicks
    outside the box, this is require to call validation explicitly */
    @HostListener("click")
    checkEndDateChange(): any {
        if (this.classPopUpForm.value.classData.expiresAfter) {
            this.validateEndDateChange("change", { value: this.classPopUpForm.value.classData.expiresAfter });
        }
    }

    validateEndDateChange(type: string, event: any): void {
        this.datesAreSame = false;
        if (this.classPopUpForm.value.classData.effectiveStarting && this.classPopUpForm.value.classData.expiresAfter) {
            const endDate = this.dateService.toDate(this.datePipe.transform(event.value, AppSettings.DATE_FORMAT));
            const startDate = this.dateService.toDate(this.classPopUpForm.value.classData.effectiveStarting);
            this.differenceInDaysWhenEndDateIsLessThenStartDate = "";
            this.endDateLessThenStartDate = false;
            this.datesAreSame = false;
            this.classPopUpForm.controls.classData.get("expiresAfter").setErrors(null);
            if (endDate < startDate) {
                this.differenceInDaysWhenEndDateIsLessThenStartDate = (
                    Math.floor((startDate.getTime() - endDate.getTime()) / 86400000) + 1
                ).toFixed(0);
                this.endDateLessThenStartDate = true;
                this.classPopUpForm.controls.classData.get("expiresAfter").setErrors({ incorrect: true });
            } else if (
                startDate.getMonth() === endDate.getMonth() &&
                startDate.getDay() === endDate.getDay() &&
                startDate.getFullYear() === endDate.getFullYear()
            ) {
                this.datesAreSame = true;
                this.classPopUpForm.controls.classData.get("expiresAfter").setErrors({ incorrect: true });
                this.classPopUpForm.controls.classData.get("effectiveStarting").setErrors({ incorrect: true });
            } else {
                this.endDateLessThenStartDate = false;
                this.classPopUpForm.controls.classData.get("expiresAfter").setErrors(null);
                this.classPopUpForm.controls.classData.get("effectiveStarting").setErrors(null);
                this.validateOverlappingClasses();
            }
        }
    }

    get formControls(): unknown {
        return this.classPopUpForm.controls;
    }

    onAddClass(title: string, classFormData: any, valid: any): void {
        this.checkEndDateChange();
        const data = this.dateFormatter(classFormData);
        this.classBody = {
            id: parseFloat(data.classData.id),
            validity: {
                effectiveStarting: data.classData.effectiveStarting,
                expiresAfter: data.classData.expiresAfter,
            },
        };
        this.updateClass(this.classBody, this.memberId, parseFloat(this.data.classTypeId.toString()));
        for (const type of this.data.classNames) {
            if (this.classBody.id === type.id) {
                this.classBody.name = type.name;
                this.classBody.manage = false;
            }
        }
        this.dataToWorkForm = { classData: this.classBody, classType: this.data.classTypeId };
    }

    dateFormatter(classFormData: any): any {
        classFormData.classData.effectiveStarting = this.datePipe.transform(
            classFormData.classData.effectiveStarting,
            AppSettings.DATE_FORMAT,
        );
        classFormData.classData.expiresAfter = this.datePipe.transform(classFormData.classData.expiresAfter, AppSettings.DATE_FORMAT);
        return classFormData;
    }

    updateClass(body: MemberClassType, memberId: number, classTypeId: number): void {
        if (this.classPopUpForm.valid) {
            this.createClassSubscriber = this.memberService.updateMemberClass(memberId, classTypeId, body, this.mpGroupId).subscribe(
                (Response) => {
                    if (Response.status === AppSettings.API_RESP_204) {
                        if (this.data.editRowData === undefined) {
                            this.dialogRef.close({ data: this.dataToWorkForm, for: "Add" });
                        } else {
                            this.dialogRef.close({ data: this.dataToWorkForm, for: "Edit" });
                        }
                        this.createClassSubscriber.unsubscribe();
                    }
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
        } else {
            this.settingValidations(this.classPopUpForm);
        }
    }

    onCancelClick(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        if (this.createClassSubscriber) {
            this.createClassSubscriber.unsubscribe();
        }
        if (this.getClassNamesSubscriber) {
            this.getClassNamesSubscriber.unsubscribe();
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
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.langService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }

    validateOverlappingClasses(): void {
        for (const classType of this.data.allClasses) {
            if (classType.id === this.data.classTypeId && classType.classDetails) {
                for (const detail of classType.classDetails.value) {
                    if (
                        !detail.validity.expiresAfter &&
                        detail.name !== this.classPopUpForm.value.classData.name &&
                        this.dateService.toDate(this.classPopUpForm.value.classData.effectiveStarting) >
                            this.dateService.toDate(detail.validity.effectiveStarting)
                    ) {
                        const date = this.dateService.toDate(this.classPopUpForm.value.classData.effectiveStarting);
                        this.notificationOngoingOverlap = true;
                        this.oldClassThatWillGetUpdated = detail.name;
                        this.newDateToBeUpdated = this.datePipe.transform(date.setDate(date.getDate() - 1), AppSettings.DATE_FORMAT);
                        const dataToPass = {
                            "##DATE##": this.newDateToBeUpdated,
                            "##CLASS##": this.oldClassThatWillGetUpdated,
                        };
                        const tagFromLanguage = this.langService.fetchSecondaryLanguageValue(
                            "secondary.portal.members.workValidationMsg.dateOverlapClass",
                        );
                        this.updatedMessage = this.memberService.getUpdatedLanguageValue(tagFromLanguage, dataToPass);
                        return;
                    }
                }
            }
        }
    }

    isRequiredField(control: string): boolean {
        let isRequired = false;
        const required = this.requiredFields.find((e) => e.name === `portal.member.form.work.${control}`);
        if (required) {
            isRequired = true;
        }
        return isRequired;
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }

    validateDate(control: string, form: string, event: any, iteration?: string): string | undefined {
        if (
            (this.classPopUpForm.controls.classData.get(control).value === null ||
                this.classPopUpForm.controls.classData.get(control).value === "") &&
            event !== ""
        ) {
            return this.langService.fetchSecondaryLanguageValue("secondary.portal.common.invalidDateFormat");
        }
        if (!this.classPopUpForm.controls.classData.get(control).value && control !== "expiresAfter") {
            this.classPopUpForm.controls.classData.get(control).setErrors({ required: true });
            return this.langService.fetchSecondaryLanguageValue("secondary.portal.members.requiredField");
        }
        return undefined;
    }
}
