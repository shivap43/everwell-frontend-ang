import { Component, OnInit, Input, Output, EventEmitter } from "@angular/core";
import { FormControl } from "@angular/forms";
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from "@angular/material/core";
import { MatDatepicker, MatDatepickerInputEvent } from "@angular/material/datepicker";
import { LanguageService } from "@empowered/language";
import { AppSettings, DateFormat } from "@empowered/constants";
import { DATEPICKER_MONTH_YEAR_FORMAT, DateFnsDateAdapter, DateService } from "@empowered/date";

export const MY_FORMATS = {
    parse: {
        dateInput: AppSettings.DATE_FORMAT_MM_YYYY,
    },
    display: {
        dateInput: AppSettings.DATE_FORMAT_MM_YYYY,
        monthYearLabel: AppSettings.MONTH_YEAR_FORMAT,
        dateA11yLabel: AppSettings.DATE_A11_LABEL,
        monthYearA11yLabel: AppSettings.MONTH_YEAR_FORMAT,
    },
};
@Component({
    selector: "empowered-date-picker-month-year",
    templateUrl: "./date-picker-month-year.component.html",
    styleUrls: ["./date-picker-month-year.component.scss"],
    providers: [
        { provide: DateAdapter, useClass: DateFnsDateAdapter, deps: [MAT_DATE_LOCALE] },
        { provide: MAT_DATE_FORMATS, useValue: DATEPICKER_MONTH_YEAR_FORMAT },
    ],
})
export class DatePickerMonthYearComponent implements OnInit {
    date = new FormControl(null);
    @Input() displayDate: Date;
    @Input() minDate: any;
    @Output() getDate: EventEmitter<any> = new EventEmitter();
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.common.monthandyear",
        "primary.portal.policyChangeRequest.transactions.changeBeneficiary.transferToDirect.expDate.dateFormat",
    ]);

    constructor(private readonly langService: LanguageService, private readonly dateService: DateService) {}

    ngOnInit(): void {
        if (this.displayDate) {
            this.date.setValue(this.dateService.format(this.displayDate, DateFormat.MONTH_YEAR_LOWERCASE));
        }
    }

    chosenYearHandler(normalizedYear: Date): void {
        this.date.setValue(new Date());
        const ctrlValue = this.date.value;
        ctrlValue.setFullYear(normalizedYear.getFullYear());
        this.date.setValue(ctrlValue);
    }

    /**
     * Function triggers on change of date value
     * Emits the getDate event
     * @param dateValue mat datepicker input event
     */
    dateValueChange(dateValue: MatDatepickerInputEvent<Date>): void {
        if (dateValue.value) {
            this.date.setValue(new Date());
            const ctrlValue = this.date.value;
            ctrlValue.setMonth(dateValue.value.getMonth());
            ctrlValue.setFullYear(dateValue.value.getFullYear());
            this.date.setValue(ctrlValue);
            this.getDate.emit(this.date);
        }
    }

    chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>): void {
        const ctrlValue = this.date.value;
        ctrlValue.setMonth(normalizedMonth.getMonth());
        this.date.setValue(ctrlValue);
        this.getDate.emit(this.date);
        datepicker.close();
    }
}
