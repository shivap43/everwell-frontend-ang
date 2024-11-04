import { Component, Input, ViewChild, Output, EventEmitter, ElementRef, OnChanges, OnDestroy } from "@angular/core";
import { AppSettings, ContiguousDates, DateFormats } from "@empowered/constants";
import { FormControl } from "@angular/forms";
import { DatePipe } from "@angular/common";
import { DaterangepickerDirective } from "../../components/daterangepicker/daterangepicker.directive";
import { NgxMaskPipe } from "ngx-mask";
import { LanguageService } from "@empowered/language";
import { BenefitsOfferingService } from "@empowered/api";
import { DateService } from "@empowered/date";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

const threeMonthsInDays = 180;

@Component({
    selector: "empowered-date-range-picker",
    templateUrl: "./date-range-picker.component.html",
    styleUrls: ["./date-range-picker.component.scss"],
})
export class DateRangePickerComponent implements OnChanges, OnDestroy {
    @Input() startDateControl: FormControl;
    @Input() endDateControl: FormControl;
    @Input() labelKey: string;
    @Input() maxDate: any;
    @Input() minDate: any;
    @Input() isCoverageDates?: boolean;
    @Input() isEndDateError?: boolean;
    @Input() isDatePickerDisabled?: boolean;
    @ViewChild(DaterangepickerDirective, { static: true })
    dateRangePicker: DaterangepickerDirective;
    @ViewChild("startDate", { static: true }) startDateInput: ElementRef;
    @ViewChild("endDate", { static: true }) endDateInput: ElementRef;
    startKey;
    endKey;
    selected;
    shouldBeFirstDateOfMonth: boolean;
    shouldBe90DaysFromToday: boolean;
    shouldBe180DaysFromToday: boolean;
    initialMMDD = "12/31/";
    isCoverageDatesContiguous: ContiguousDates;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.requiredField",
        "primary.portal.common.invalidDateFormat",
        "primary.portal.common.dateHint",
        "primary.portal.coverage.cannotBePast",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.benefitsOffering.coveragedates.invalidDate",
        "secondary.portal.benefitsOffering.coveragedates.contiguous",
        "secondary.portal.benefitsOffering.coveragedates.invalidenddate",
        "secondary.portal.benefitsOffering.coveragedates.invalidStartDate",
        "secondary.portal.benefitsOffering.coveragedates.firstDateOfMonth",
        "secondary.portal.benefitsOffering.coveragedates.threeMonths",
        "secondary.portal.benefitsOffering.coveragedates.sixMonths",
        "secondary.portal.benefitsOffering.coveragedates.endDate.overlapping",
        "secondary.portal.benefitsOffering.coveragedates.startDate.overlapping",
    ]);
    private readonly unsubscribe$ = new Subject<void>();
    @Output() datesUpdated: EventEmitter<unknown> = new EventEmitter();

    constructor(
        private readonly datePipe: DatePipe,
        private readonly maskPipe: NgxMaskPipe,
        private readonly language: LanguageService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly dateService: DateService,
    ) {}

    ngOnChanges(): void {
        if (this.isEndDateError) {
            this.endDateControl.setErrors({ invalid: true });
        }
    }

    validateStartDateEndDate(): void {
        const startDate = this.dateService.toDate(this.startDateControl.value);
        const endDate = this.dateService.toDate(this.endDateControl.value);
        if (
            this.startDateControl.value &&
            !(this.startDateControl.errors && this.startDateControl.errors.length > 0) &&
            this.endDateControl.value &&
            !(this.endDateControl.errors && this.endDateControl.errors.length > 0) &&
            startDate > endDate
        ) {
            this.startDateControl.setErrors({ invalidStartDate: true });
        } else if (this.startDateControl.hasError("invalidStartDate") && startDate < endDate) {
            this.startDateControl.setErrors({});
        }
        this.endDateControl.updateValueAndValidity();
    }

    validateNumber(event: any): boolean {
        return event.charCode === 8 || event.charCode === 0 ? null : event.charCode >= 47 && event.charCode <= 57;
    }
    maskDate(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    onBlur(dateControl: FormControl): void {
        this.validateStartDateEndDate();
        if (dateControl.value) {
            if (Date.parse(dateControl.value)) {
                dateControl.setValue(
                    this.datePipe.transform(this.dateService.toDate(dateControl.value), AppSettings.DATE_FORMAT_MM_DD_YYYY),
                );
            } else {
                dateControl.setErrors({ invalid: true });
            }
        }
        this.validateEnrollmentAndCoverageDates();
    }
    updateValueValidity(): void {
        this.startDateControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            const otherErrors =
                !this.startDateControl.hasError("contiguous") &&
                !this.startDateControl.hasError("invalidStartDate") &&
                !this.startDateControl.hasError("required") &&
                !this.startDateControl.hasError("requirements") &&
                !this.startDateControl.hasError("invalid");

            this.shouldBeFirstDateOfMonth =
                this.startDateControl.hasError("shouldBeFirstDateOfMonth") &&
                !this.startDateControl.hasError("shouldBe90DaysFromToday") &&
                otherErrors;

            this.shouldBe90DaysFromToday =
                this.startDateControl.hasError("shouldBe90DaysFromToday") &&
                !this.startDateControl.hasError("shouldBeFirstDateOfMonth") &&
                otherErrors;
            this.shouldBe180DaysFromToday =
                this.startDateControl.hasError("shouldBe180DaysFromToday") &&
                !this.startDateControl.hasError("shouldBeFirstDateOfMonth") &&
                otherErrors;
            if (this.isCoverageDates) {
                this.endDateControl.setValue(
                    this.initialMMDD + this.dateService.parseDate(this.endDateControl.value, DateFormats.DATE_TIME_AM_PM).getFullYear(),
                );
            }
            this.datesUpdated.emit();
        });
        this.startDateControl.markAsTouched();
        this.startDateControl.updateValueAndValidity();
        this.endDateControl.markAsTouched();
        this.endDateControl.updateValueAndValidity();
        this.validateEnrollmentAndCoverageDates();
    }
    /**
     * The below method is used to check enrollment start, enrollment date with coverage start date
     *
     * The below method will get value of contiguous/overlapping coverage dates. If value is there, then it sets errors
     * based on conditions
     */
    validateEnrollmentAndCoverageDates(): void {
        const days = "days";
        this.isCoverageDatesContiguous = this.benefitsOfferingService.getCoverageContiguousDates();
        if (this.isCoverageDatesContiguous && this.isCoverageDatesContiguous.value && this.isCoverageDatesContiguous.date) {
            const enrollmentStartDate: Date = this.dateService.toDate(this.startDateControl.value);
            const enrollmentEndDate: Date = this.dateService.toDate(this.endDateControl.value);
            const coverageStartDate: Date = this.dateService.toDate(this.isCoverageDatesContiguous.date);
            if (
                this.dateService.isBeforeOrIsEqual(coverageStartDate, enrollmentStartDate) ||
                this.dateService.getDifferenceInDays(coverageStartDate, enrollmentStartDate) >= threeMonthsInDays
            ) {
                this.startDateControl.setErrors({ contiguous: true });
            }
            if (enrollmentEndDate >= coverageStartDate) {
                this.endDateControl.setErrors({ contiguous: true });
            }
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
