import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { EnrollmentService, CoverageChangingFields } from "@empowered/api";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Subscription } from "rxjs";

interface DialogData {
    enrollData?: any;
    memberId?: number;
    changedFields?: any[];
    mpGroup?: number;
    updateCoverageRequest?: any;
}
@Component({
    selector: "empowered-coverage-changing",
    templateUrl: "./coverage-changing.component.html",
    styleUrls: ["./coverage-changing.component.scss"],
})
export class CoverageChangingComponent implements OnInit, OnDestroy {
    coverageChangingReasons: any[] = [];
    coverageChangeForm: FormGroup;
    previousReason = "";
    isOptional = true;
    showSpinner: boolean;
    subscriptions: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.editCoverage.whycoverageChanging",
        "primary.portal.editCoverage.select",
        "primary.portal.editCoverage.description",
        "primary.portal.common.optional",
        "primary.portal.editCoverage.cancel",
        "primary.portal.editCoverage.save",
        "primary.portal.editCoverage.required",
        "primary.portal.editCoverage.selectionRequired",
        "primary.portal.common.close",
        "primary.portal.classes.description",
    ]);
    ERROR = "error";

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<CoverageChangingComponent>,
        private readonly enrollmentService: EnrollmentService,
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
    ) {
        this.getCoverageChangingReasons();
    }

    ngOnInit(): void {
        this.coverageChangeForm = this.fb.group(
            {
                changeReasons: ["", Validators.required],
                description: [""],
            },
            { updateOn: "blur" },
        );
    }

    get formControl(): any {
        return this.coverageChangeForm.controls;
    }

    checkSelectedOption(reason: string): void {
        if (reason === CoverageChangingFields.other) {
            this.isOptional = false;
            this.formControl["description"].setValidators(Validators.required);
            this.formControl["description"].updateValueAndValidity();
        } else {
            this.isOptional = true;
            this.formControl["description"].clearValidators();
            this.formControl["description"].updateValueAndValidity();
        }
    }

    getCoverageChangingReasons(): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.enrollmentService.getCoverageChangeReasons(this.data.mpGroup).subscribe(
                (reasons) => {
                    this.showSpinner = false;
                    if (reasons && reasons.length > 0) {
                        const reasonIndex = reasons.findIndex((y) => y === CoverageChangingFields.byRequest);
                        if (reasonIndex > -1) {
                            reasons.splice(reasonIndex, 1);
                            this.coverageChangingReasons = reasons;
                        }
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            ),
        );
    }
    /**
     * Method to update the coverage
     */
    setUpdateCoverageRequest(): void {
        this.checkSelectedOption(this.coverageChangeForm.value.changeReasons);
        this.validateAllFormFields(this.coverageChangeForm);
        if (this.coverageChangeForm.valid) {
            this.data.updateCoverageRequest["description"] = this.coverageChangeForm.value["description"];
            this.data.updateCoverageRequest["reason"] = this.coverageChangeForm.value.changeReasons;
            this.subscriptions.push(
                this.enrollmentService
                    .updateCoverageWithObserve(
                        this.data.mpGroup,
                        this.data.memberId,
                        this.data.enrollData.id,
                        this.data.updateCoverageRequest,
                    )
                    .subscribe(
                        (data) => {
                            if (data.status === AppSettings.API_RESP_204) {
                                this.matDialogRef.close(data);
                            }
                        },
                        (error) => {
                            const err = error[this.ERROR];
                            this.matDialogRef.close(err);
                        },
                    ),
            );
        }
    }
    /**
     * Method to close pop up
     */
    closeChangePopup(): void {
        this.matDialogRef.close();
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

    convertToCamelCase(str: string): string {
        return str[0].toUpperCase() + str.substr(1).toLowerCase();
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }
}
