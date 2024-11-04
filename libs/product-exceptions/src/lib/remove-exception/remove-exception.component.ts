import { Component, OnInit, Optional, Inject, OnDestroy } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { FormBuilder, FormGroup } from "@angular/forms";
import { ExceptionsService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { DateFormats, DateInfo, Exceptions } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { DateService } from "@empowered/date";

export interface DialogData {
    id: number;
    mpGroup: number;
    isVasException: boolean;
}

@Component({
    selector: "empowered-remove-exception",
    templateUrl: "./remove-exception.component.html",
    styleUrls: ["./remove-exception.component.scss"],
})
export class RemoveExceptionComponent implements OnInit, OnDestroy {
    exceptionData: Exceptions;
    showSpinner = true;
    endDateForm: FormGroup;
    languageStrings: Record<string, string>;
    dateMax = this.dateService.addYears(new Date(), DateInfo.END_DATE_OFFSET_YEARS);
    tomorrow = this.dateService.addDays(new Date(), 1);
    dateFormat = DateFormats.MONTH_DAY_YEAR;
    secondaryLanguages = {};
    isFutureDate = true;
    isCoverageDateVAS = false;
    isDisabled = false;
    noPlanYear = false;
    private readonly unsub$: Subject<void> = new Subject<void>();
    isVasException = false;

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        @Optional() private readonly matDialogRef: MatDialogRef<RemoveExceptionComponent>,
        private readonly exceptionService: ExceptionsService,
        private readonly fb: FormBuilder,
        private readonly langService: LanguageService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Life cycle hook to initialize the component,
     * set the value for isVasException variable,
     * calls getException() function,
     * Get language strings
     **/
    ngOnInit(): void {
        this.isVasException = this.data.isVasException;
        this.fetchLanguageData();
        this.getException();
    }
    /**
     * get exception
     */
    getException(): void {
        this.exceptionService
            .getException(this.data.mpGroup.toString(), this.data.id)
            .pipe(takeUntil(this.unsub$))
            .subscribe((data) => {
                this.showSpinner = false;
                this.exceptionData = data;
                this.isFutureDate = this.checkIsFutureDate(this.exceptionData.validity.effectiveStarting);
                if (this.exceptionData.planYear) {
                    this.isCoverageDateVAS = this.checkIsFutureDate(this.exceptionData.planYear.coveragePeriod.effectiveStarting);
                    if (this.isVasException && !this.isCoverageDateVAS && this.exceptionData.enrolledCount > 0) {
                        this.isDisabled = true;
                    }
                } else {
                    this.noPlanYear = true;
                }
                this.endDateForm = this.fb.group(
                    {
                        date: [this.dateService.toDate(this.exceptionData.validity.expiresAfter.toString())],
                    },
                    { updateOn: "blur" },
                );
            });
    }
    closeView(): void {
        this.matDialogRef.close();
    }
    /**
     * remove exception for plan
     */
    removePlan(): void {
        this.showSpinner = true;
        this.exceptionService
            .deleteException(this.data.mpGroup.toString(), this.data.id)
            .pipe(takeUntil(this.unsub$))
            .subscribe((data) => {
                this.showSpinner = false;
                this.matDialogRef.close({ data: data });
            });
    }
    /**
     * fetch languages
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.productExceptions.removeException.header",
            "primary.portal.productExceptions.removeException.priorEnrollmentsRetained",
            "primary.portal.productExceptions.removeException.exceptionRemoved",
            "primary.portal.common.cancel",
            "primary.portal.common.remove",
            "primary.portal.productExceptions.removeException.availability",
            "primary.portal.productExceptions.removeException.noEnroll",
            "primary.portal.productExceptions.removeException.priorEnrollments",
            "primary.portal.productExceptions.removeException.hasEnroll",
            "primary.portal.productExceptions.removeException.priorEnrollmentCancel",
        ]);
    }
    /**
     * check whether a date is in the future
     * @param date the date that this check will apply on
     * @return whether the date is in the future
     */
    checkIsFutureDate(date: Date | string): boolean {
        return this.dateService.toDate(date.toString()) > new Date();
    }
    /**
     * unsubscribe subscriptions
     */
    ngOnDestroy(): void {
        this.unsub$.next();
        this.unsub$.complete();
    }
}
