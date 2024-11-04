/* eslint-disable no-underscore-dangle */

import {
    Component,
    OnInit,
    ElementRef,
    ViewChild,
    EventEmitter,
    Output,
    Input,
    forwardRef,
    ViewEncapsulation,
    ChangeDetectorRef,
} from "@angular/core";
import { NG_VALUE_ACCESSOR } from "@angular/forms";
import { FormControl } from "@angular/forms";
import { LocaleConfig } from "./daterangepicker.config";
import { LocaleService } from "./locale.service";
import { AppSettings, DateFormats } from "@empowered/constants";
import { DateService } from "@empowered/date";

enum SideEnum {
    LEFT = "left",
    RIGHT = "right",
}
const MONTH_INCREMENT = 2;
@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "ngx-daterangepicker-material",
    styleUrls: ["./daterangepicker-override.component.scss"],
    templateUrl: "./daterangepicker.component.html",
    // eslint-disable-next-line @angular-eslint/no-host-metadata-property
    host: {
        "(click)": "handleInternalClick($event)",
    },
    // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DaterangepickerComponent),
            multi: true,
        },
    ],
})
export class DaterangepickerComponent implements OnInit {
    private _old: { start: any; end: any } = { start: null, end: null };
    chosenLabel: string;
    calendarVariables: { left: any; right: any } = { left: {}, right: {} };
    timepickerVariables: { left: any; right: any } = { left: {}, right: {} };
    daterangepicker: { start: FormControl; end: FormControl } = { start: new FormControl(), end: new FormControl() };
    applyBtn: { disabled: boolean } = { disabled: false };
    @Input()
    startDate = this.dateService.getStartOfDay();
    @Input()
    endDate = this.dateService.getEndOfDay();

    @Input()
    dateLimit: number = null;
    // used in template for compile time support of enum values.
    sideEnum = SideEnum;

    @Input()
    minDate: Date = null;
    @Input()
    maxDate: Date = null;
    @Input()
    autoApply = false;
    @Input()
    singleDatePicker = false;
    @Input()
    showDropdowns = false;
    @Input()
    showWeekNumbers = false;
    @Input()
    showISOWeekNumbers = false;
    @Input()
    linkedCalendars = false;
    @Input()
    autoUpdateInput = true;
    @Input()
    alwaysShowCalendars = false;
    @Input()
    maxSpan = false;
    @Input()
    lockStartDate = false;
    // timepicker variables
    @Input()
    timePicker = false;
    @Input()
    timePicker24Hour = false;
    @Input()
    timePickerIncrement = 1;
    @Input()
    timePickerSeconds = false;
    // end of timepicker variables
    @Input()
    showClearButton = false;
    @Input()
    firstMonthDayClass: string = null;
    @Input()
    lastMonthDayClass: string = null;
    @Input()
    emptyWeekRowClass: string = null;
    @Input()
    firstDayOfNextMonthClass: string = null;
    @Input()
    lastDayOfPreviousMonthClass: string = null;
    _locale: LocaleConfig = {};
    startDateIsInvalid: boolean;
    endDateIsInvalid: boolean;
    @Input() set locale(value: any) {
        this._locale = { ...this._localeService.config, ...value };
    }
    get locale(): any {
        return this._locale;
    }
    // custom ranges
    _ranges: any = {};

    @Input() set ranges(value: any) {
        this._ranges = value;
        this.renderRanges();
    }
    get ranges(): any {
        return this._ranges;
    }

    @Input()
    showCustomRangeLabel: boolean;
    @Input()
    showCancel = false;
    @Input()
    keepCalendarOpeningWithRange = false;
    @Input()
    showRangeLabelOnInput = false;
    @Input()
    customRangeDirection = false;
    chosenRange: string;
    rangesArray: Array<any> = [];

    // some state information
    isShown = false;
    inline = true;
    leftCalendar: any = {};
    rightCalendar: any = {};
    showCalInRanges = false;

    options: any = {}; // should get some opt from user
    @Input() drops: string;
    @Input() opens: string;
    @Input() closeOnAutoApply = true;
    @Output() choosedDate: EventEmitter<unknown>;
    @Output() rangeClicked: EventEmitter<unknown>;
    @Output() datesUpdated: EventEmitter<unknown>;
    @Output() startDateChanged: EventEmitter<unknown>;
    @Output() endDateChanged: EventEmitter<unknown>;
    @ViewChild("pickerContainer", { static: true }) pickerContainer: ElementRef;
    constructor(
        private el: ElementRef,
        private _ref: ChangeDetectorRef,
        private _localeService: LocaleService,
        private readonly dateService: DateService,
    ) {
        this.choosedDate = new EventEmitter();
        this.rangeClicked = new EventEmitter();
        this.datesUpdated = new EventEmitter();
        this.startDateChanged = new EventEmitter();
        this.endDateChanged = new EventEmitter();
    }

    ngOnInit(): void {
        this._buildLocale();
        const daysOfWeek = [...this.locale.daysOfWeek];
        if (this.locale.firstDay !== 0) {
            let iterator = this.locale.firstDay;

            while (iterator > 0) {
                daysOfWeek.push(daysOfWeek.shift());
                iterator--;
            }
        }
        this.locale.daysOfWeek = daysOfWeek;
        if (this.inline) {
            this._old.start = this.dateService.toDate(this.startDate);
            this._old.end = this.dateService.toDate(this.endDate);
        }

        if (this.startDate && this.timePicker) {
            this.setStartDate(this.startDate);
            this.renderTimePicker(SideEnum.LEFT);
        }

        if (this.endDate && this.timePicker) {
            this.setEndDate(this.endDate);
            this.renderTimePicker(SideEnum.RIGHT);
        }

        this.updateMonthsInView();
        this.renderCalendar(SideEnum.LEFT);
        this.renderCalendar(SideEnum.RIGHT);
        this.renderRanges();
    }
    // eslint-disable-next-line complexity
    renderRanges(): any {
        this.rangesArray = [];
        let start, end;
        if (typeof this.ranges === "object") {
            for (const range in this.ranges) {
                if (this.ranges[range]) {
                    if (typeof this.ranges[range][0] === "string") {
                        start = this.dateService.parseDate(this.ranges[range][0], this.locale.format);
                    } else {
                        start = this.dateService.toDate(this.ranges[range][0]);
                    }
                    if (typeof this.ranges[range][1] === "string") {
                        end = this.dateService.parseDate(this.ranges[range][1], this.locale.format);
                    } else {
                        end = this.dateService.toDate(this.ranges[range][1]);
                    }
                    // If this.maxSpanthe start or end date exceed those allowed by the minDate or maxSpan
                    // options, shorten the range to the allowable period.
                    if (this.minDate && this.dateService.isBefore(start, this.minDate)) {
                        start = this.dateService.toDate(this.minDate);
                    }
                    let maxDate = this.maxDate;
                    if (this.maxSpan && maxDate && this.dateService.checkIsAfter(this.dateService.toDate(start), maxDate)) {
                        maxDate = this.dateService.toDate(start);
                    }
                    if (maxDate && this.dateService.checkIsAfter(end, maxDate)) {
                        end = this.dateService.toDate(maxDate);
                    }
                    // If the end of the range is before the minimum or the start of the range is
                    // after the maximum, don't display this range option at all.
                    if (
                        (this.minDate && this.dateService.isBefore(end, this.minDate)) ||
                        (maxDate && this.dateService.checkIsAfter(start, maxDate))
                    ) {
                        continue;
                    }
                    // Support unicode chars in the range names.
                    const elem = document.createElement("textarea");
                    elem.innerHTML = range;
                    const rangeHtml = elem.value;
                    this.ranges[rangeHtml] = [start, end];
                }
            }
            for (const range in this.ranges) {
                if (this.ranges[range]) {
                    this.rangesArray.push(range);
                }
            }
            if (this.showCustomRangeLabel) {
                this.rangesArray.push(this.locale.customRangeLabel);
            }
            this.showCalInRanges = !this.rangesArray.length || this.alwaysShowCalendars;
            if (!this.timePicker) {
                this.startDate = this.dateService.getStartOfDay(this.startDate);
                this.endDate = this.dateService.getEndOfDay(this.endDate);
            }
        }
    }
    // eslint-disable-next-line complexity
    renderTimePicker(side: SideEnum): any {
        if (side === SideEnum.RIGHT && !this.endDate) {
            return;
        }
        let selected: Date;
        let minDate: Date;
        const maxDate = this.maxDate;
        if (side === SideEnum.LEFT) {
            selected = this.dateService.toDate(this.startDate);
            minDate = this.minDate;
        } else if (side === SideEnum.RIGHT) {
            selected = this.dateService.toDate(this.endDate);
            minDate = this.startDate;
        }
        const start = this.timePicker24Hour ? 0 : 1;
        const end = this.timePicker24Hour ? 23 : 12;
        this.timepickerVariables[side] = {
            hours: [],
            minutes: [],
            minutesLabel: [],
            seconds: [],
            secondsLabel: [],
            disabledHours: [],
            disabledMinutes: [],
            disabledSeconds: [],
            selectedHour: 0,
            selectedMinute: 0,
            selectedSecond: 0,
        };
        // generate hours
        for (let i = start; i <= end; i++) {
            // eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle,id-denylist,id-match
            let i_in_24 = i;
            if (!this.timePicker24Hour) {
                i_in_24 = selected.getHours() >= 12 ? (i === 12 ? 12 : i + 12) : i === 12 ? 0 : i;
            }

            const time = this.dateService.toDate(this.dateService.toDate(selected).setHours(i_in_24));
            let disabled = false;
            if (minDate && this.dateService.isBefore(time.setMinutes(59), minDate)) {
                disabled = true;
            }
            if (maxDate && this.dateService.checkIsAfter(time.setMinutes(0), maxDate)) {
                disabled = true;
            }

            this.timepickerVariables[side].hours.push(i);
            if (i_in_24 === selected.getHours() && !disabled) {
                this.timepickerVariables[side].selectedHour = i;
            } else if (disabled) {
                this.timepickerVariables[side].disabledHours.push(i);
            }
        }
        // generate minutes
        for (let i = 0; i < 60; i += this.timePickerIncrement) {
            const padded = i < 10 ? "0" + i : i;
            const time = this.dateService.toDate(selected.setMinutes(i));

            let disabled = false;
            if (minDate && this.dateService.isBefore(this.dateService.toDate(time).setSeconds(59), minDate)) {
                disabled = true;
            }
            if (maxDate && this.dateService.checkIsAfter(this.dateService.toDate(time).setSeconds(0), maxDate)) {
                disabled = true;
            }
            this.timepickerVariables[side].minutes.push(i);
            this.timepickerVariables[side].minutesLabel.push(padded);
            if (selected.getMinutes() === i && !disabled) {
                this.timepickerVariables[side].selectedMinute = i;
            } else if (disabled) {
                this.timepickerVariables[side].disabledMinutes.push(i);
            }
        }
        // generate seconds
        if (this.timePickerSeconds) {
            for (let i = 0; i < 60; i++) {
                const padded = i < 10 ? "0" + i : i;
                const time = this.dateService.toDate(this.dateService.toDate(selected).setSeconds(i));

                let disabled = false;
                if (minDate && this.dateService.isBefore(time, minDate)) {
                    disabled = true;
                }
                if (maxDate && this.dateService.checkIsAfter(time, maxDate)) {
                    disabled = true;
                }

                this.timepickerVariables[side].seconds.push(i);
                this.timepickerVariables[side].secondsLabel.push(padded);
                if (selected.getSeconds() === i && !disabled) {
                    this.timepickerVariables[side].selectedSecond = i;
                } else if (disabled) {
                    this.timepickerVariables[side].disabledSeconds.push(i);
                }
            }
        }
        // generate AM/PM
        if (!this.timePicker24Hour) {
            // eslint-disable-next-line @typescript-eslint/naming-convention,no-underscore-dangle,id-denylist,id-match
            const am_html = "";
            // eslint-disable-next-line @typescript-eslint/naming-convention, no-underscore-dangle, id-denylist, id-match
            const pm_html = "";

            if (
                minDate &&
                this.dateService.isBefore(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 12, 0, 0), minDate)
            ) {
                this.timepickerVariables[side].amDisabled = true;
            }

            if (
                maxDate &&
                this.dateService.checkIsAfter(new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), 0, 0, 0), maxDate)
            ) {
                this.timepickerVariables[side].pmDisabled = true;
            }
            if (selected.getHours() >= 12) {
                this.timepickerVariables[side].ampmModel = "PM";
            } else {
                this.timepickerVariables[side].ampmModel = "AM";
            }
        }
        this.timepickerVariables[side].selected = selected;
    }
    // eslint-disable-next-line complexity
    renderCalendar(side: SideEnum): any {
        // side enum
        const mainCalendar: any = side === SideEnum.LEFT ? this.leftCalendar : this.rightCalendar;
        const month = this.dateService.toDate(mainCalendar.month).getMonth();
        const year = this.dateService.toDate(mainCalendar.month).getFullYear();
        const hour = this.dateService.toDate(mainCalendar.month).getHours();
        const minute = this.dateService.toDate(mainCalendar.month).getMinutes();
        const second = this.dateService.toDate(mainCalendar.month).getSeconds();
        const daysInMonth = this.dateService.getDaysInMonth(new Date(year, month));
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month, daysInMonth);
        const lastMonth = this.dateService.subtractMonths(firstDay, 1).getMonth();
        const lastYear = this.dateService.subtractMonths(firstDay, 1).getFullYear();
        const daysInLastMonth = this.dateService.getDaysInMonth(new Date(lastYear, lastMonth));
        const dayOfWeek = firstDay.getDay();
        // initialize a 6 rows x 7 columns array for the calendar
        const calendar: any = [];
        calendar.firstDay = firstDay;
        calendar.lastDay = lastDay;

        for (let i = 0; i < 6; i++) {
            calendar[i] = [];
        }

        // populate the calendar with date objects
        let startDay = daysInLastMonth - dayOfWeek + this.locale.firstDay + 1;
        if (startDay > daysInLastMonth) {
            startDay -= 7;
        }

        if (dayOfWeek === this.locale.firstDay) {
            startDay = daysInLastMonth - 6;
        }

        let curDate = new Date(lastYear, lastMonth, startDay, 12, minute, second);

        for (let i = 0, col = 0, row = 0; i < 42; i++, col++, curDate = this.dateService.addHours(this.dateService.toDate(curDate), 24)) {
            if (i > 0 && col % 7 === 0) {
                col = 0;
                row++;
            }
            calendar[row][col] = new Date(curDate.getFullYear(), curDate.getMonth(), curDate.getDate(), hour, minute, second);
            curDate.setHours(12);

            if (
                this.minDate &&
                this.dateService.format(calendar[row][col], DateFormats.YEAR_MONTH_DAY) ===
                    this.dateService.format(this.minDate, DateFormats.YEAR_MONTH_DAY) &&
                this.dateService.isBefore(calendar[row][col], this.minDate) &&
                side === "left"
            ) {
                calendar[row][col] = this.dateService.toDate(this.minDate);
            }

            if (
                this.maxDate &&
                this.dateService.format(calendar[row][col], DateFormats.YEAR_MONTH_DAY) ===
                    this.dateService.format(this.maxDate, DateFormats.YEAR_MONTH_DAY) &&
                this.dateService.checkIsAfter(calendar[row][col], this.maxDate) &&
                side === "right"
            ) {
                calendar[row][col] = this.dateService.toDate(this.maxDate);
            }
        }

        // make the calendar object available to hoverDate/clickDate
        if (side === SideEnum.LEFT) {
            this.leftCalendar.calendar = calendar;
        } else {
            this.rightCalendar.calendar = calendar;
        }
        //
        // Display the calendar
        //
        const minDate = side === "left" ? this.minDate : this.startDate;
        let maxDate = this.maxDate;
        // adjust maxDate to reflect the dateLimit setting in order to
        // grey out end dates beyond the dateLimit
        if (this.endDate === null && this.dateLimit) {
            const maxLimit = this.dateService.getEndOfDay(this.dateService.addDays(this.startDate, this.dateLimit));
            if (!maxDate || this.dateService.isBefore(maxLimit, maxDate)) {
                maxDate = maxLimit;
            }
        }
        this.calendarVariables[side] = {
            month: month,
            year: year,
            hour: hour,
            minute: minute,
            second: second,
            daysInMonth: daysInMonth,
            firstDay: firstDay,
            lastDay: lastDay,
            lastMonth: lastMonth,
            lastYear: lastYear,
            daysInLastMonth: daysInLastMonth,
            dayOfWeek: dayOfWeek,
            // other vars
            calRows: Array.from(Array(6).keys()),
            calCols: Array.from(Array(7).keys()),
            classes: {},
            minDate: minDate,
            maxDate: maxDate,
            calendar: calendar,
        };
        if (this.showDropdowns) {
            const currentMonth = calendar[1][1].getMonth();
            const currentYear = calendar[1][1].getFullYear();
            const maxYear = (maxDate && maxDate.getFullYear()) || currentYear + 5;
            const minYear = (minDate && minDate.getFullYear()) || currentYear - 50;
            const inMinYear = currentYear === minYear;
            const inMaxYear = currentYear === maxYear;
            const years = [];
            for (let y = minYear; y <= maxYear; y++) {
                years.push(y);
            }
            this.calendarVariables[side].dropdowns = {
                currentMonth: currentMonth,
                currentYear: currentYear,
                maxYear: maxYear,
                minYear: minYear,
                inMinYear: inMinYear,
                inMaxYear: inMaxYear,
                monthArrays: Array.from(Array(12).keys()),
                yearArrays: years,
            };
        }

        this._buildCells(calendar, side);
    }
    setStartDate(startDate: Date): void {
        if (typeof startDate === "string") {
            this.startDate = this.dateService.parseDate(startDate, this.locale.format);
        }

        if (typeof startDate === "object") {
            this.startDate = this.dateService.toDate(startDate);
        }
        if (!this.timePicker) {
            this.startDate = this.dateService.getStartOfDay(this.startDate);
        }

        if (this.timePicker && this.timePickerIncrement) {
            this.dateService
                .toDate(this.startDate)
                .setMinutes(Math.round(this.startDate.getMinutes() / this.timePickerIncrement) * this.timePickerIncrement);
        }

        if (this.minDate && this.dateService.isBefore(this.startDate, this.minDate)) {
            this.startDate = this.dateService.toDate(this.minDate);
            if (this.timePicker && this.timePickerIncrement) {
                this.dateService
                    .toDate(this.startDate)
                    .setMinutes(Math.round(this.startDate.getMinutes() / this.timePickerIncrement) * this.timePickerIncrement);
            }
        }

        if (this.maxDate && this.dateService.checkIsAfter(this.startDate, this.maxDate)) {
            this.startDate = this.dateService.toDate(this.maxDate);
            if (this.timePicker && this.timePickerIncrement) {
                this.dateService
                    .toDate(this.startDate)
                    .setMinutes(Math.floor(this.startDate.getMinutes() / this.timePickerIncrement) * this.timePickerIncrement);
            }
        }

        if (!this.isShown) {
            this.updateElement();
        }
        this.startDateIsInvalid = false;
        if (!this.dateService.isValid(startDate)) {
            this.startDate = this.endDate = new Date();
            this.startDateIsInvalid = true;
        }
        this.startDateChanged.emit({ startDate: this.startDate });
        this.updateMonthsInView();
    }

    setEndDate(endDate: any): any {
        if (typeof endDate === "string") {
            this.endDate = this.dateService.parseDate(endDate, this.locale.format);
        }

        if (typeof endDate === "object") {
            this.endDate = this.dateService.toDate(endDate);
        }
        if (!this.timePicker) {
            this.endDate = this.dateService.subtractSeconds(this.dateService.getStartOfDay(this.dateService.addDays(this.endDate, 1)), 1);
        }

        if (this.timePicker && this.timePickerIncrement) {
            this.dateService
                .toDate(this.endDate || "")
                .setMinutes(Math.round(this.endDate.getMinutes() / this.timePickerIncrement) * this.timePickerIncrement);
        }

        if (this.dateService.isBefore(this.endDate, this.startDate)) {
            this.endDate = this.dateService.toDate(this.startDate);
        }

        if (this.maxDate && this.dateService.checkIsAfter(this.endDate, this.maxDate)) {
            this.endDate = this.dateService.toDate(this.maxDate);
        }

        if (this.dateLimit && this.dateService.isBefore(this.dateService.addDays(this.startDate, this.dateLimit), this.endDate)) {
            this.endDate = this.dateService.addDays(this.startDate, this.dateLimit);
        }

        if (!this.isShown) {
            // this.updateElement();
        }
        this.endDateIsInvalid = false;
        if (!this.dateService.isValid(this.dateService.toDate(endDate))) {
            this.startDate = this.endDate = new Date();
            this.endDateIsInvalid = true;
        }
        this.endDateChanged.emit({ endDate: this.endDate });
        this.updateMonthsInView();
    }
    @Input()
    isInvalidDate(date: any): any {
        return false;
    }
    @Input()
    isCustomDate(date: any): any {
        return false;
    }

    updateView(): any {
        if (this.timePicker) {
            this.renderTimePicker(SideEnum.LEFT);
            this.renderTimePicker(SideEnum.RIGHT);
        }
        this.updateMonthsInView();
        this.updateCalendars();
    }

    // eslint-disable-next-line complexity
    updateMonthsInView(): any {
        if (this.endDate) {
            // if both dates are visible already, do nothing
            if (
                !this.singleDatePicker &&
                this.leftCalendar.month &&
                this.rightCalendar.month &&
                ((this.startDate &&
                    this.leftCalendar &&
                    this.dateService.format(this.startDate, DateFormats.YEAR_LOWERCASE_MONTH) ===
                        this.dateService.format(this.leftCalendar.month, DateFormats.YEAR_LOWERCASE_MONTH)) ||
                    (this.startDate &&
                        this.rightCalendar &&
                        this.dateService.format(this.startDate, DateFormats.YEAR_LOWERCASE_MONTH) ===
                            this.dateService.format(this.rightCalendar.month, DateFormats.YEAR_LOWERCASE_MONTH))) &&
                (this.dateService.format(this.endDate, DateFormats.YEAR_LOWERCASE_MONTH) ===
                    this.dateService.format(this.leftCalendar.month, DateFormats.YEAR_LOWERCASE_MONTH) ||
                    this.dateService.format(this.endDate, DateFormats.YEAR_LOWERCASE_MONTH) ===
                        this.dateService.format(this.rightCalendar.month, DateFormats.YEAR_LOWERCASE_MONTH))
            ) {
                return;
            }
            if (this.startDate) {
                this.leftCalendar.month = this.dateService.toDate(this.dateService.toDate(this.startDate).setDate(2));
                this.rightCalendar.month = this.dateService.addMonths(
                    this.dateService.toDate(this.dateService.toDate(this.startDate).setDate(MONTH_INCREMENT)),
                    1,
                );
            }
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else {
            if (
                this.dateService.format(this.leftCalendar.month, "yyyy-MM") !== this.dateService.format(this.startDate, "yyyy-MM") &&
                this.dateService.format(this.rightCalendar.month, "yyyy-MM") !== this.dateService.format(this.startDate, "yyyy-MM")
            ) {
                this.leftCalendar.month = this.dateService.toDate(this.dateService.toDate(this.startDate).setDate(2));
                this.rightCalendar.month = this.dateService.addMonths(new Date(this.dateService.toDate(this.startDate).setDate(2)), 1);
            }
        }
        if (this.maxDate && this.linkedCalendars && !this.singleDatePicker && this.rightCalendar.month > this.maxDate) {
            this.rightCalendar.month = this.dateService.toDate(this.dateService.toDate(this.maxDate).setDate(2));
            this.leftCalendar.month = this.dateService.addMonths(
                this.dateService.toDate(this.dateService.toDate(this.maxDate).setDate(2)),
                1,
            );
        }
    }
    /**
     *  This is responsible for updating the calendars
     */
    updateCalendars(): any {
        this.renderCalendar(SideEnum.LEFT);
        this.renderCalendar(SideEnum.RIGHT);

        if (this.endDate === null) {
            return;
        }
        this.calculateChosenLabel();
    }
    updateElement(): any {
        if (!this.singleDatePicker && this.autoUpdateInput) {
            if (this.startDate && this.endDate) {
                // if we use ranges and should show range label on input
                if (
                    this.rangesArray.length &&
                    this.showRangeLabelOnInput === true &&
                    this.chosenRange &&
                    this.locale.customRangeLabel !== this.chosenRange
                ) {
                    this.chosenLabel = this.chosenRange;
                } else {
                    this.chosenLabel =
                        this.dateService.format(this.startDate, this.locale.format) +
                        this.locale.separator +
                        this.dateService.format(this.endDate, this.locale.format);
                }
            }
        } else if (this.autoUpdateInput) {
            this.chosenLabel = this.dateService.format(this.startDate, this.locale.format);
        }
    }

    remove(): void {
        this.isShown = false;
    }
    /**
     * this should calculate the label
     */
    calculateChosenLabel(): void {
        if (!this.locale || !this.locale.separator) {
            this._buildLocale();
        }
        let customRange = true;
        let i = 0;
        if (this.rangesArray.length > 0) {
            for (const range in this.ranges) {
                if (this.ranges[range]) {
                    if (this.timePicker) {
                        const format = this.timePickerSeconds ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd HH:mm";
                        // ignore times when comparing dates if time picker seconds is not enabled
                        if (
                            this.dateService.format(this.startDate, format) === this.dateService.format(this.ranges[range][0], format) &&
                            this.dateService.format(this.endDate, format) === this.dateService.format(this.ranges[range][1], format)
                        ) {
                            customRange = false;
                            this.chosenRange = this.rangesArray[i];
                            break;
                        }
                        // eslint-disable-next-line sonarjs/no-collapsible-if
                    } else {
                        // ignore times when comparing dates if time picker is not enabled
                        if (
                            this.dateService.format(this.startDate, DateFormats.YEAR_MONTH_DAY) ===
                                this.dateService.format(this.ranges[range][0], DateFormats.YEAR_MONTH_DAY) &&
                            this.dateService.format(this.endDate, DateFormats.YEAR_MONTH_DAY) ===
                                this.dateService.format(this.ranges[range][1], DateFormats.YEAR_MONTH_DAY)
                        ) {
                            customRange = false;
                            this.chosenRange = this.rangesArray[i];
                            break;
                        }
                    }
                    i++;
                }
            }
            if (customRange) {
                if (this.showCustomRangeLabel) {
                    this.chosenRange = this.locale.customRangeLabel;
                } else {
                    this.chosenRange = null;
                }
                // if custom label: show calendar
                this.showCalInRanges = true;
            }
        }

        this.updateElement();
    }

    clickApply(e?: any): any {
        if (!this.singleDatePicker && this.startDate && !this.endDate) {
            this.endDate = this.dateService.toDate(this.startDate);
            this.calculateChosenLabel();
        }
        if (this.isInvalidDate && this.startDate && this.endDate) {
            // get if there are invalid date between range
            let d = this.dateService.toDate(this.startDate);
            while (this.dateService.isBefore(d, this.endDate)) {
                if (this.isInvalidDate(d)) {
                    this.endDate = this.dateService.subtractDays(d, 1);
                    this.calculateChosenLabel();
                    break;
                }
                d = this.dateService.addDays(d, 1);
            }
        }
        if (this.chosenLabel) {
            this.choosedDate.emit({ chosenLabel: this.chosenLabel, startDate: this.startDate, endDate: this.endDate });
        }

        this.datesUpdated.emit({ startDate: this.startDate, endDate: this.endDate });
        if (e || (this.closeOnAutoApply && !e)) {
            this.hide();
        }
    }

    clickCancel(e: any): any {
        this.startDate = this._old.start;
        this.endDate = this._old.end;
        if (this.inline) {
            this.updateView();
        }
        this.hide();
    }
    /**
     * called when month is changed
     * @param monthEvent get value in event.target.value
     * @param side left or right
     */
    monthChanged(monthEvent: any, side: SideEnum): any {
        const year = this.calendarVariables[side].dropdowns.currentYear;
        const month = parseInt(monthEvent.target.value, 10);
        this.monthOrYearChanged(month, year, side);
    }
    /**
     * called when year is changed
     * @param yearEvent get value in event.target.value
     * @param side left or right
     */
    yearChanged(yearEvent: any, side: SideEnum): any {
        const month = this.calendarVariables[side].dropdowns.currentMonth;
        const year = parseInt(yearEvent.target.value, 10);
        this.monthOrYearChanged(month, year, side);
    }
    /**
     * called when time is changed
     * @param timeEvent  an event
     * @param side left or right
     */
    timeChanged(timeEvent: any, side: SideEnum): any {
        let hour = parseInt(this.timepickerVariables[side].selectedHour, 10);
        const minute = parseInt(this.timepickerVariables[side].selectedMinute, 10);
        const second = this.timePickerSeconds ? parseInt(this.timepickerVariables[side].selectedSecond, 10) : 0;

        if (!this.timePicker24Hour) {
            const ampm = this.timepickerVariables[side].ampmModel;
            if (ampm === "PM" && hour < 12) {
                hour += 12;
            }
            if (ampm === "AM" && hour === 12) {
                hour = 0;
            }
        }

        if (side === SideEnum.LEFT) {
            const start = this.dateService.toDate(this.startDate);
            start.setHours(hour);
            start.setMinutes(minute);
            start.setSeconds(second);
            this.setStartDate(start);
            if (this.singleDatePicker) {
                this.endDate = this.dateService.toDate(this.startDate);
            } else if (
                this.endDate &&
                this.dateService.format(this.endDate, DateFormats.YEAR_MONTH_DAY) ===
                    this.dateService.format(start, DateFormats.YEAR_MONTH_DAY) &&
                this.dateService.isBefore(this.endDate, start)
            ) {
                this.setEndDate(this.dateService.toDate(start));
            }
        } else if (this.endDate) {
            const end = this.dateService.toDate(this.endDate);
            end.setHours(hour);
            end.setMinutes(minute);
            end.setSeconds(second);
            this.setEndDate(end);
        }

        // update the calendars so all clickable dates reflect the new time component
        this.updateCalendars();

        // re-render the time pickers because changing one selection can affect what's enabled in another
        this.renderTimePicker(SideEnum.LEFT);
        this.renderTimePicker(SideEnum.RIGHT);

        if (this.autoApply) {
            this.clickApply();
        }
    }
    /**
     *  call when month or year changed
     * @param month month number 0 -11
     * @param year year eg: 1995
     * @param side left or right
     */
    monthOrYearChanged(month: number, year: number, side: SideEnum): any {
        const isLeft = side === SideEnum.LEFT;

        // eslint-disable-next-line sonarjs/no-collapsible-if
        if (
            !isLeft &&
            (year < this.startDate.getFullYear() || (year === this.startDate.getFullYear() && month < this.startDate.getMonth()))
        ) {
            month = this.startDate.getMonth();
            year = this.startDate.getFullYear();
        }

        if (
            this.minDate &&
            (year < this.minDate.getFullYear() || (year === this.minDate.getFullYear() && month < this.minDate.getMonth()))
        ) {
            month = this.minDate.getMonth();
            year = this.minDate.getFullYear();
        }

        if (
            this.maxDate &&
            (year > this.maxDate.getFullYear() || (year === this.maxDate.getFullYear() && month > this.maxDate.getMonth()))
        ) {
            month = this.maxDate.getMonth();
            year = this.maxDate.getFullYear();
        }
        this.calendarVariables[side].dropdowns.currentYear = year;
        this.calendarVariables[side].dropdowns.currentMonth = month;
        if (isLeft) {
            this.dateService.toDate(this.leftCalendar.month.setMonth(month)).setFullYear(year);
            if (this.linkedCalendars) {
                this.rightCalendar.month = this.dateService.addMonths(this.dateService.toDate(this.leftCalendar.month), 1);
            }
        } else {
            this.dateService.toDate(this.dateService.toDate(this.rightCalendar.month).setMonth(month)).setFullYear(year);
            if (this.linkedCalendars) {
                this.leftCalendar.month = this.dateService.subtractMonths(this.dateService.toDate(this.rightCalendar.month), 1);
            }
        }
        this.updateCalendars();
    }

    /**
     * Click on previous month
     * @param side left or right calendar
     */
    clickPrev(side: SideEnum): any {
        this.leftCalendar.month = this.dateService.subtractMonths(this.leftCalendar.month, 2);
        this.rightCalendar.month = this.dateService.subtractMonths(this.rightCalendar.month, 2);
        this.updateCalendars();
    }
    /**
     * Click on next month
     * @param side left or right calendar
     */
    clickNext(side: SideEnum): any {
        this.leftCalendar.month = this.dateService.addMonths(this.leftCalendar.month, MONTH_INCREMENT);
        this.rightCalendar.month = this.dateService.addMonths(this.rightCalendar.month, MONTH_INCREMENT);
        this.updateCalendars();
    }
    /**
     * When selecting a date
     * @param e event: get value by e.target.value
     * @param side left or right
     * @param row row position of the current date clicked
     * @param col col position of the current date clicked
     */
    // eslint-disable-next-line complexity
    clickDate(e: any, side: SideEnum, row: number, col: number): any {
        if (e.target.tagName === "TD") {
            if (!e.target.classList.contains("available")) {
                return;
            }
            // eslint-disable-next-line sonarjs/no-collapsible-if
        } else if (e.target.tagName === "SPAN") {
            if (!e.target.parentElement.classList.contains("available")) {
                return;
            }
        }
        if (this.rangesArray.length) {
            this.chosenRange = this.locale.customRangeLabel;
        }

        let date = side === SideEnum.LEFT ? this.leftCalendar.calendar[row][col] : this.rightCalendar.calendar[row][col];

        if (
            (this.endDate || (this.dateService.isBefore(date, this.startDate) && this.customRangeDirection === false)) &&
            this.lockStartDate === false
        ) {
            // picking start
            if (this.timePicker) {
                date = this._getDateWithTime(date, SideEnum.LEFT);
            }
            this.endDate = null;
            this.setStartDate(this.dateService.toDate(date));
        } else if (!this.endDate && this.dateService.isBefore(date, this.startDate) && this.customRangeDirection === false) {
            // special case: clicking the same date for start/end,
            // but the time of the end date is before the start date
            this.setEndDate(this.dateService.toDate(this.startDate));
        } else {
            // picking end
            if (this.timePicker) {
                date = this._getDateWithTime(date, SideEnum.RIGHT);
            }
            if (this.dateService.isBefore(date, this.startDate) && this.customRangeDirection === true) {
                this.setEndDate(this.startDate);
                this.setStartDate(this.dateService.toDate(date));
            } else {
                this.setEndDate(this.dateService.toDate(date));
            }

            if (this.autoApply) {
                this.calculateChosenLabel();
                this.clickApply();
            }
        }

        if (this.singleDatePicker) {
            this.setEndDate(this.startDate);
            this.updateElement();
            if (this.autoApply) {
                this.clickApply();
            }
        }

        this.updateView();

        if (this.autoApply && this.startDate && this.endDate) {
            this.clickApply();
        }

        // This is to cancel the blur event handler if the mouse was in one of the inputs
        e.stopPropagation();
    }
    /**
     *  Click on the custom range
     * @param e: Event
     * @param label
     */
    clickRange(e: any, label: any): any {
        this.chosenRange = label;
        if (label === this.locale.customRangeLabel) {
            this.isShown = true; // show calendars
            this.showCalInRanges = true;
        } else {
            const dates = this.ranges[label];
            this.startDate = this.dateService.toDate(dates[0]);
            this.endDate = this.dateService.toDate(dates[1]);
            if (this.showRangeLabelOnInput && label !== this.locale.customRangeLabel) {
                this.chosenLabel = label;
            } else {
                this.calculateChosenLabel();
            }
            this.showCalInRanges = !this.rangesArray.length || this.alwaysShowCalendars;

            if (!this.timePicker) {
                this.dateService.getStartOfDay(this.startDate);
                this.dateService.getEndOfDay(this.endDate);
            }

            if (!this.alwaysShowCalendars) {
                this.isShown = false; // hide calendars
            }
            this.rangeClicked.emit({ label: label, dates: dates });
            if (!this.keepCalendarOpeningWithRange) {
                this.clickApply();
            } else {
                if (!this.alwaysShowCalendars) {
                    return this.clickApply();
                }
                if (this.maxDate.getMonth() === this.dateService.toDate(dates[0]).getMonth()) {
                    this.rightCalendar.month.setMonth(dates[0].getMonth());
                    this.rightCalendar.month.setFullYear(dates[0].getFullYear());
                    this.leftCalendar.month.setMonth(dates[0].getMonth() - 1);
                    this.leftCalendar.month.setFullYear(dates[1].getFullYear());
                } else {
                    this.leftCalendar.month.month(this.dateService.toDate(dates[0]).getMonth());
                    this.leftCalendar.month.setFullYear(dates[0].getFullYear());
                    this.rightCalendar.month.month(this.dateService.toDate(dates[0]).getMonth() + 1);
                    this.rightCalendar.month.setFullYear(dates[1].getFullYear());
                }
                this.updateCalendars();
                if (this.timePicker) {
                    this.renderTimePicker(SideEnum.LEFT);
                    this.renderTimePicker(SideEnum.RIGHT);
                }
            }
        }
    }

    show(e?: any): any {
        if (this.isShown) {
            return;
        }
        this._old.start = this.dateService.toDate(this.startDate);
        this._old.end = this.dateService.toDate(this.endDate);
        this.isShown = true;
        this.updateView();
    }

    hide(e?: any): any {
        if (!this.isShown) {
            return;
        }
        // incomplete date selection, revert to last values
        if (!this.endDate) {
            if (this._old.start) {
                this.startDate = this.dateService.toDate(this._old.start);
            }
            if (this._old.end) {
                this.endDate = this.dateService.toDate(this._old.end);
            }
        }

        // if a new date range was selected, invoke the user callback function
        if (!this.dateService.isEqual(this.startDate, this._old.start) || !this.dateService.isEqual(this.endDate, this._old.end)) {
            // this.callback(this.startDate, this.endDate, this.chosenLabel);
        }

        // if picker is attached to a text input, update it
        this.updateElement();
        this.isShown = false;
        this._ref.detectChanges();
    }

    /**
     * handle click on all element in the component, useful for outside of click
     * @param e event
     */
    handleInternalClick(e: any): any {
        e.stopPropagation();
    }
    /**
     * update the locale options
     * @param locale
     */
    updateLocale(locale: any): any {
        for (const key in locale) {
            // eslint-disable-next-line no-prototype-builtins
            if (locale.hasOwnProperty(key)) {
                this.locale[key] = locale[key];
            }
        }
    }
    /**
     *  clear the daterange picker
     */
    clear(): any {
        this.startDate = this.dateService.getStartOfDay();
        this.endDate = this.dateService.getEndOfDay();
        this.choosedDate.emit({ chosenLabel: "", startDate: null, endDate: null });
        this.datesUpdated.emit({ startDate: null, endDate: null });
        this.hide();
    }

    /**
     * Find out if the selected range should be disabled if it doesn't
     * fit into minDate and maxDate limitations.
     */
    disableRange(range: any): any {
        if (range === this.locale.customRangeLabel) {
            return false;
        }
        const rangeMarkers = this.ranges[range];
        const areBothBefore = rangeMarkers.every((date) => {
            if (!this.minDate) {
                return false;
            }
            return this.dateService.isBefore(date, this.minDate);
        });

        const areBothAfter = rangeMarkers.every((date) => {
            if (!this.maxDate) {
                return false;
            }
            return this.dateService.checkIsAfter(date, this.maxDate);
        });
        return areBothBefore || areBothAfter;
    }
    /**
     *
     * @param date the date to add time
     * @param side left or right
     */
    private _getDateWithTime(date: any, side: SideEnum): Date {
        let hour = parseInt(this.timepickerVariables[side].selectedHour, 10);
        if (!this.timePicker24Hour) {
            const ampm = this.timepickerVariables[side].ampmModel;
            if (ampm === "PM" && hour < 12) {
                hour += 12;
            }
            if (ampm === "AM" && hour === 12) {
                hour = 0;
            }
        }
        const minute = parseInt(this.timepickerVariables[side].selectedMinute, 10);
        const second = this.timePickerSeconds ? parseInt(this.timepickerVariables[side].selectedSecond, 10) : 0;
        const resultDate = this.dateService.toDate(date);
        return new Date(resultDate.getFullYear(), resultDate.getMonth(), resultDate.getDate(), hour, minute, second);
    }
    /**
     *  build the locale config
     */
    private _buildLocale(): any {
        this.locale = { ...this._localeService.config, ...this.locale };
        if (!this.locale.format) {
            if (this.timePicker) {
                this.locale.format = "MMM d, yyyy h:mm a";
            } else {
                this.locale.format = "MM/dd/yyyy";
            }
        }
    }
    // eslint-disable-next-line complexity
    private _buildCells(calendar: any, side: SideEnum): any {
        for (let row = 0; row < 6; row++) {
            this.calendarVariables[side].classes[row] = {};
            const rowClasses = [];
            if (this.emptyWeekRowClass && !this.hasCurrentMonthDays(this.calendarVariables[side].month, calendar[row])) {
                rowClasses.push(this.emptyWeekRowClass);
            }
            for (let col = 0; col < 7; col++) {
                const classes = [];
                // highlight today's date
                if (this.dateService.toDate(calendar[row][col]).getDate() === new Date().getDate()) {
                    classes.push("today");
                }
                // highlight weekends
                if (this.dateService.toDate(calendar[row][col]).getDay() > 5) {
                    classes.push("weekend");
                }
                // grey out the dates in other months displayed at beginning and end of this calendar
                if (this.dateService.toDate(calendar[row][col]).getMonth() !== this.dateService.toDate(calendar[1][1]).getMonth()) {
                    classes.push("off");
                    classes.push("not-current-month");

                    // mark the last day of the previous month in this calendar
                    if (
                        this.lastDayOfPreviousMonthClass &&
                        (this.dateService.toDate(calendar[row][col]).getMonth() < this.dateService.toDate(calendar[1][1]).getMonth() ||
                            calendar[1][1].getMonth() === 0) &&
                        this.dateService.toDate(calendar[row][col]).getDate() === this.calendarVariables[side].daysInLastMonth
                    ) {
                        classes.push(this.lastDayOfPreviousMonthClass);
                    }

                    // mark the first day of the next month in this calendar
                    if (
                        this.firstDayOfNextMonthClass &&
                        (calendar[row][col].getMonth() > calendar[1][1].getMonth() || calendar[row][col].getMonth() === 0) &&
                        this.dateService.toDate(calendar[row][col]).getDate() === 1
                    ) {
                        classes.push(this.firstDayOfNextMonthClass);
                    }
                }
                // mark the first day of the current month with a custom class
                if (
                    this.firstMonthDayClass &&
                    this.dateService.toDate(calendar[row][col]).getMonth() === this.dateService.toDate(calendar[1][1]).getMonth() &&
                    this.dateService.toDate(calendar[row][col]).getDate() === this.dateService.toDate(calendar.firstDay).getDate()
                ) {
                    classes.push(this.firstMonthDayClass);
                }
                // mark the last day of the current month with a custom class
                if (
                    this.lastMonthDayClass &&
                    this.dateService.toDate(calendar[row][col]).getMonth() === this.dateService.toDate(calendar[1][1]).getMonth() &&
                    this.dateService.toDate(calendar[row][col]).getDate() === this.dateService.toDate(calendar.lastDay).getDate()
                ) {
                    classes.push(this.lastMonthDayClass);
                }
                // don't allow selection of dates before the minimum date
                if (this.minDate && this.dateService.isBefore(calendar[row][col], this.minDate)) {
                    classes.push("off", "disabled");
                }
                // don't allow selection of dates after the maximum date
                if (
                    this.calendarVariables[side].maxDate &&
                    this.dateService.checkIsAfter(calendar[row][col], this.calendarVariables[side].maxDate)
                ) {
                    classes.push("off", "disabled");
                }
                // don't allow selection of date if a custom function decides it's invalid
                if (this.isInvalidDate(calendar[row][col])) {
                    classes.push("off", "disabled");
                }
                // highlight the currently selected start date
                if (
                    (side === SideEnum.LEFT && this.leftCalendar.month.getMonth() === calendar[row][col].getMonth()) ||
                    (side === SideEnum.RIGHT && this.rightCalendar.month.getMonth() === calendar[row][col].getMonth())
                ) {
                    if (
                        this.startDate &&
                        this.dateService.format(calendar[row][col], DateFormats.YEAR_MONTH_DAY) ===
                            this.dateService.format(this.startDate, DateFormats.YEAR_MONTH_DAY)
                    ) {
                        classes.push("active", "start-date");
                    }
                    // highlight the currently selected end date
                    if (
                        this.endDate != null &&
                        this.dateService.format(calendar[row][col], DateFormats.YEAR_MONTH_DAY) ===
                            this.dateService.format(this.endDate, DateFormats.YEAR_MONTH_DAY)
                    ) {
                        classes.push("active", "end-date");
                    }
                }

                // highlight dates in-between the selected dates
                if (
                    !this.startDateIsInvalid &&
                    !this.endDateIsInvalid &&
                    this.endDate != null &&
                    calendar[row][col] > this.startDate &&
                    calendar[row][col] < this.endDate
                ) {
                    classes.push("in-range");
                }
                // apply custom classes for this date
                const isCustom = this.isCustomDate(calendar[row][col]);
                if (isCustom !== false) {
                    if (typeof isCustom === "string") {
                        classes.push(isCustom);
                    } else {
                        Array.prototype.push.apply(classes, isCustom);
                    }
                }
                // store classes var
                let cname = "",
                    disabled = false;
                // eslint-disable-next-line @typescript-eslint/prefer-for-of
                for (let i = 0; i < classes.length; i++) {
                    cname += classes[i] + " ";
                    if (classes[i] === "disabled") {
                        disabled = true;
                    }
                }
                if (!disabled) {
                    cname += "available";
                }
                this.calendarVariables[side].classes[row][col] = cname.replace(/^\s+|\s+$/g, "");
            }
            this.calendarVariables[side].classes[row].classList = rowClasses.join(" ");
        }
    }

    checkDates(dateLeft: string, dateRight: string, isAfter: boolean): boolean {
        return isAfter ? this.dateService.checkIsAfter(dateLeft, dateRight) : this.dateService.isBefore(dateLeft, dateRight);
    }

    getFormattedDate(date: string | number | Date, format: string): string {
        return this.dateService.format(date, format);
    }

    getWeek(date: Date, isISO: boolean): number {
        return this.dateService.getWeekNumber(this.dateService.toDate(date), isISO);
    }

    /**
     * Find out if the current calendar row has current month days
     * (as opposed to consisting of only previous/next month days)
     */
    hasCurrentMonthDays(currentMonth: any, row: any): any {
        for (let day = 0; day < 7; day++) {
            if (this.dateService.toDate(row[day]).getMonth() === currentMonth) {
                return true;
            }
        }
        return false;
    }
}
