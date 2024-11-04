import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MemberAddDialogData } from "../member-add-modal/member-add-modal.model";
import { MemberService } from "@empowered/api";

import { Subject, Subscription } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { DatePipe } from "@angular/common";
import { ClientErrorResponseCode, DateFormats, AppSettings } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { takeUntil } from "rxjs/operators";
@Component({
    selector: "empowered-rehire-employee",
    templateUrl: "./rehire-employee.component.html",
    styleUrls: ["./rehire-employee.component.scss"],
})
export class RehireEmployeeComponent implements OnInit, OnDestroy {
    rehireForm: FormGroup;
    errorMessage: string;
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    displayValidDate: any;
    displayError = "";
    languageStrings: Record<string, string>;
    SUCCESS = "success";
    validFutureDate;
    terminationDate;
    private readonly unsubscribe$ = new Subject<void>();

    constructor(
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<RehireEmployeeComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: MemberAddDialogData,
        private readonly memberService: MemberService,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly maskPipe: NgxMaskPipe,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {
        this.intilizeForm();
        this.terminationDate = this.dateService.toDate(this.data.content.terminationDate);
    }

    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.intilizeForm();
        this.displayValidDate = "";
        this.getLanguageStrings();
        this.terminationDate = this.dateService.toDate(this.data.content.terminationDate);
        this.fetchMax();
    }

    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.member.rehire.rehiredateerror",
            "primary.portal.common.dateHint",
            "primary.portal.member.rehire.rehiredate",
            "primary.portal.common.close",
        ]);
    }
    intilizeForm(): void {
        this.rehireForm = this.fb.group({
            date: ["", Validators.required],
        });
        this.rehireForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.errorMessage = null;
        });
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    secondaryButtonClick(): void {
        this.dialogRef.close();
    }
    closePopup(): void {
        this.dialogRef.close();
    }
    primaryButtonClick(): void {
        if (this.rehireForm.valid) {
            this.memberService
                .rehireMember(
                    this.data.content.memberId,
                    this.data.content.mpGroupId,
                    `"${this.datePipe.transform(this.rehireForm.get("date").value, AppSettings.DATE_FORMAT)}"`,
                )
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.dialogRef.close({
                            terminationDate: this.datePipe.transform(this.rehireForm.get("date").value, AppSettings.DATE_FORMAT_MM_DD_YYYY),
                        });
                    },
                    (error) => {
                        if (error) {
                            this.showErrorAlertMessage(error);
                        } else {
                            this.errorMessage = null;
                        }
                    },
                );
        } else {
            this.validateAllFormFields(this.rehireForm);
        }
    }
    validateAllFormFields(formGroup: FormGroup): void {
        Object.keys(formGroup.controls).forEach((field) => {
            const control = formGroup.get(field);
            control.markAsTouched({ onlySelf: true });
        });
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
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    /**
     * The function is used to check the validity of the date
     * @params valid is a boolean value
     * @params value is the user input date
     * @returns true based on the validity of the date
     */
    dateChange(valid: boolean, value: any): boolean | undefined {
        const oneDay = 24 * 60 * 60 * 1000;
        const currentDate = new Date().getTime();
        const inputDate = this.dateService.toDate(value).getTime();
        if (this.dateService.toDate(value).setHours(0, 0, 0, 0) < this.dateService.toDate(this.terminationDate).setHours(0, 0, 0, 0)) {
            this.displayValidDate = this.dateService.format(
                this.dateService.toDate(this.data.content.terminationDate || ""),
                DateFormats.MONTH_DAY_YEAR,
            );
            this.rehireForm.get("date").setErrors({ invalid: true });
            this.displayError = this.languageStrings["primary.portal.member.rehire.rehiredateerror"].replace(
                "##TerminationDate##",
                this.displayValidDate,
            );
            return true;
        }
        return undefined;
    }
    fetchMax(): void {
        this.validFutureDate = new Date();
        this.validFutureDate.setDate(new Date().getDate() + 90);
    }
    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
}
