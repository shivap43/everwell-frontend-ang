/* eslint-disable no-underscore-dangle */

import {
    Directive,
    ViewContainerRef,
    ComponentFactoryResolver,
    ElementRef,
    HostListener,
    forwardRef,
    ChangeDetectorRef,
    SimpleChanges,
    Input,
    KeyValueDiffer,
    KeyValueDiffers,
    Output,
    EventEmitter,
    Renderer2,
    OnInit,
    OnChanges,
    OnDestroy,
} from "@angular/core";
import { DaterangepickerComponent } from "./daterangepicker.component";
import { NG_VALUE_ACCESSOR, FormControl } from "@angular/forms";
import { LocaleConfig } from "./daterangepicker.config";
import { LocaleService } from "./locale.service";
import { DatePipe } from "@angular/common";
import { takeUntil } from "rxjs/operators";
import { Subject } from "rxjs";
import { AppSettings } from "@empowered/constants";
import { DateService } from "@empowered/date";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "button[ngxDaterangepickerMd]",

    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DaterangepickerDirective),
            multi: true,
        },
    ],
})
export class DaterangepickerDirective implements OnInit, OnChanges, OnDestroy {
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public picker: DaterangepickerComponent;
    private _onChange = Function.prototype;
    private _onTouched = Function.prototype;
    private _validatorChange = Function.prototype;
    private _value: any;
    private localeDiffer: KeyValueDiffer<string, any>;
    @Input()
    startDateRef: ElementRef;
    @Input()
    endDateRef: ElementRef;
    @Input()
    startDateControl: FormControl;
    @Input()
    endDateControl: FormControl;
    @Input()
    minDate: Date;
    @Input()
    maxDate: Date;
    @Input()
    autoApply: boolean;
    @Input()
    alwaysShowCalendars: boolean;
    @Input()
    showCustomRangeLabel: boolean;
    @Input()
    linkedCalendars: boolean;
    @Input()
    dateLimit: number = null;
    @Input()
    singleDatePicker: boolean;
    @Input()
    showWeekNumbers: boolean;
    @Input()
    showISOWeekNumbers: boolean;
    @Input()
    showDropdowns: boolean;
    @Input()
    isInvalidDate: () => void;
    @Input()
    isCustomDate: () => void;
    @Input()
    showClearButton: boolean;
    @Input()
    customRangeDirection: boolean;
    @Input()
    ranges: any;
    @Input()
    opens: string;
    @Input()
    drops: string;
    firstMonthDayClass: string;
    @Input()
    lastMonthDayClass: string;
    @Input()
    emptyWeekRowClass: string;
    @Input()
    firstDayOfNextMonthClass: string;
    @Input()
    lastDayOfPreviousMonthClass: string;
    @Input()
    keepCalendarOpeningWithRange: boolean;
    @Input()
    showRangeLabelOnInput: boolean;
    @Input()
    showCancel = false;
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
    @Input() closeOnAutoApply = true;
    _locale: LocaleConfig = {};
    @Input() set locale(value: any) {
        this._locale = { ...this._localeService.config, ...value };
    }
    get locale(): any {
        return this._locale;
    }
    @Input()
    private _endKey = "endDate";
    private _startKey = "startDate";
    @Input() set startKey(value: any) {
        if (value !== null) {
            this._startKey = value;
        } else {
            this._startKey = "startDate";
        }
    }
    @Input() set endKey(value: any) {
        if (value !== null) {
            this._endKey = value;
        } else {
            this._endKey = "endDate";
        }
    }
    notForChangesProperty: Array<string> = ["locale", "endKey", "startKey"];

    get value(): any {
        return this._value || null;
    }
    set value(val: any) {
        this._value = val;
        this._onChange(val);
        this._changeDetectorRef.markForCheck();
    }
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-native
    @Output("change") Change: EventEmitter<unknown> = new EventEmitter();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-native
    @Output("rangeClicked") rangeClicked: EventEmitter<unknown> = new EventEmitter();
    // eslint-disable-next-line @angular-eslint/no-output-rename, @angular-eslint/no-output-native
    @Output("datesUpdated") datesUpdated: EventEmitter<unknown> = new EventEmitter();
    @Output() startDateChanged: EventEmitter<unknown> = new EventEmitter();
    @Output() endDateChanged: EventEmitter<unknown> = new EventEmitter();
    private unsubscribe$ = new Subject<void>();
    opened = false;

    APP_SIDENAV_WIDTH = 250;

    constructor(
        public viewContainerRef: ViewContainerRef,
        public _changeDetectorRef: ChangeDetectorRef,
        private _componentFactoryResolver: ComponentFactoryResolver,
        private _el: ElementRef,
        private _renderer: Renderer2,
        private differs: KeyValueDiffers,
        private _localeService: LocaleService,
        private elementRef: ElementRef,
        private datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {
        this.drops = "down";
        this.opens = "auto";
        const componentFactory = this._componentFactoryResolver.resolveComponentFactory(DaterangepickerComponent);
        viewContainerRef.clear();
        const componentRef = viewContainerRef.createComponent(componentFactory);
        this.picker = componentRef.instance as DaterangepickerComponent;
        this.picker.inline = false; // set inline to false for all directive usage
    }
    @HostListener("click") onClick(): void {
        if (this.opened) {
            this.opened = false;
            this.hide();
        } else {
            this.opened = true;
            this.open();
        }
    }
    /* eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle */
    ngOnInit(): void {
        this.picker.startDateChanged
            .asObservable()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((itemChanged: any) => {
                this.startDateChanged.emit(itemChanged);
            });
        this.picker.endDateChanged
            .asObservable()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((itemChanged: any) => {
                this.endDateChanged.emit(itemChanged);
            });
        this.picker.rangeClicked
            .asObservable()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((range: any) => {
                this.rangeClicked.emit(range);
            });
        this.picker.datesUpdated
            .asObservable()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((range: any) => {
                this.datesUpdated.emit(range);
            });
        this.picker.choosedDate
            .asObservable()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((change: any) => {
                if (change) {
                    const value = {};
                    value[this._startKey] = change.startDate;
                    value[this._endKey] = change.endDate;
                    this.value = value;
                    this.startDateControl.patchValue(
                        this.datePipe.transform(this.dateService.toDate(value[this._startKey]), AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    );
                    this.endDateControl.patchValue(
                        this.datePipe.transform(this.dateService.toDate(value[this._endKey]), AppSettings.DATE_FORMAT_MM_DD_YYYY),
                    );
                    if (typeof change.chosenLabel === "string") {
                        this._el.nativeElement.value = change.chosenLabel;
                    }
                }
            });
        this.startDateControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            if (value && this.dateService.toDate(value)) {
                this.picker.setStartDate(this.dateService.toDate(value));
                this.picker.updateView();
                this.picker.startDateIsInvalid = !this.startDateControl.valid;
            }
        });
        this.endDateControl.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            if (value && this.dateService.toDate(value)) {
                this.picker.setEndDate(this.dateService.toDate(value));
                this.picker.updateView();
                this.picker.endDateIsInvalid = !this.startDateControl.valid;
            }
        });
        this.picker.firstMonthDayClass = this.firstMonthDayClass;
        this.picker.lastMonthDayClass = this.lastMonthDayClass;
        this.picker.emptyWeekRowClass = this.emptyWeekRowClass;
        this.picker.firstDayOfNextMonthClass = this.firstDayOfNextMonthClass;
        this.picker.lastDayOfPreviousMonthClass = this.lastDayOfPreviousMonthClass;
        this.picker.drops = this.drops;
        this.picker.opens = this.opens;
        this.localeDiffer = this.differs.find(this.locale).create();
        this.picker.closeOnAutoApply = this.closeOnAutoApply;
        if (this.endDateControl.value) {
            this.picker.setEndDate(this.dateService.toDate(this.endDateControl.value));
        }
        if (this.startDateControl.value) {
            this.picker.setStartDate(this.dateService.toDate(this.startDateControl.value));
            this.picker.startDateIsInvalid = !this.startDateControl.valid;
        }
    }

    /* eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle */
    ngOnChanges(changes: SimpleChanges): void {
        for (const change in changes) {
            // eslint-disable-next-line sonarjs/no-collapsible-if, no-prototype-builtins
            if (changes.hasOwnProperty(change)) {
                if (this.notForChangesProperty.indexOf(change) === -1) {
                    this.picker[change] = changes[change].currentValue;
                }
            }
        }
    }

    /* eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle */
    ngDoCheck(): void {
        if (this.localeDiffer) {
            const changes = this.localeDiffer.diff(this.locale);
            if (changes) {
                this.picker.updateLocale(this.locale);
            }
        }
    }

    onBlur(): void {
        this._onTouched();
    }

    open(event?: any): void {
        setTimeout(() => {
            this.setPosition();
        });
        this.picker.show(event);
    }

    hide(e?: any): void {
        this.picker.hide(e);
    }
    toggle(e?: any): void {
        if (this.picker.isShown) {
            this.hide(e);
        } else {
            this.open(e);
        }
    }

    clear(): void {
        this.picker.clear();
    }

    writeValue(value: any): void {
        this.setValue(value);
    }
    registerOnChange(fn: any): void {
        this._onChange = fn;
    }
    registerOnTouched(fn: any): void {
        this._onTouched = fn;
    }
    private setValue(val: any): void {
        if (val) {
            this.value = val;
            if (val[this._startKey]) {
                this.picker.setStartDate(val[this._startKey]);
            }
            if (val[this._endKey]) {
                this.picker.setEndDate(val[this._endKey]);
            }
            this.picker.calculateChosenLabel();
            if (this.picker.chosenLabel) {
                this._el.nativeElement.value = this.picker.chosenLabel;
            }
        } else {
            this.picker.clear();
        }
    }
    /**
     * Set position of the calendar
     */
    setPosition(): void {
        let style;
        let containerTop;
        const container = this.picker.pickerContainer.nativeElement;
        const element = this._el.nativeElement;
        if (this.drops && this.drops === "up") {
            containerTop = element.offsetTop - container.clientHeight + "px";
        } else {
            containerTop = "auto";
        }

        // Ensure that the datepicker doenst get overlapped by the side-nav
        const elemOffsetParent = element.offsetParent;
        const elemOffsetParentRect = elemOffsetParent.getBoundingClientRect();

        if (
            elemOffsetParentRect.left - this.APP_SIDENAV_WIDTH <
            Math.abs(element.offsetLeft - container.clientWidth + element.clientWidth)
        ) {
            this.opens = "center";
        }

        if (this.opens === "left") {
            style = {
                top: containerTop,
                marginTop: 40 + "px",
                left: element.offsetLeft - container.clientWidth + element.clientWidth + "px",
                right: "auto",
            };
        } else if (this.opens === "center") {
            style = {
                top: containerTop,
                left: element.offsetLeft + element.clientWidth / 2 - container.clientWidth / 2 + "px",
                marginTop: 40 + "px",
                right: "auto",
            };
        } else if (this.opens === "right") {
            style = {
                top: containerTop + "px",
                marginTop: 40 + "px",
                left: element.offsetLeft + "px",
                right: "auto",
            };
        } else {
            const position = element.offsetLeft + element.clientWidth / 2 - container.clientWidth / 2;
            if (position < 0) {
                style = {
                    top: containerTop,
                    left: element.offsetLeft + "px",
                    right: "auto",
                };
            } else {
                style = {
                    top: containerTop,
                    left: position + "px",
                    right: "auto",
                };
            }
        }
        if (style) {
            this._renderer.setStyle(container, "top", style.top);
            this._renderer.setStyle(container, "left", style.left);
            this._renderer.setStyle(container, "right", style.right);
            this._renderer.setStyle(container, "margin-top", style.marginTop || 0);
        }
    }
    inputChanged(e: any): void {
        if (e.target.tagName.toLowerCase() !== "input") {
            return;
        }
        if (!e.target.value.length) {
            return;
        }
        const dateString = e.target.value.split(this.picker.locale.separator);
        let start = null,
            end = null;
        if (dateString.length === 2) {
            start = this.dateService.parseDate(dateString[0], this.picker.locale.format);
            end = this.dateService.parseDate(dateString[1], this.picker.locale.format);
        }
        if (this.singleDatePicker || start === null || end === null) {
            start = this.dateService.parseDate(e.target.value, this.picker.locale.format);
            end = start;
        }
        if (!this.dateService.isValid(start) || !this.dateService.isValid(end)) {
            return;
        }
        this.picker.setStartDate(start);
        this.picker.setEndDate(end);
        this.picker.updateView();
    }
    /**
     * For click outside of the calendar's container
     * @param event event object
     */
    @HostListener("document:click", ["$event"])
    outsideClick(event: any): void {
        if (!event.target) {
            return;
        }

        if (event.target.classList.contains("ngx-daterangepicker-action")) {
            return;
        }

        if (!this.elementRef.nativeElement.contains(event.target)) {
            this.opened = false;
            this.hide();
        }
    }
    /* eslint-disable-next-line @angular-eslint/no-conflicting-lifecycle */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
