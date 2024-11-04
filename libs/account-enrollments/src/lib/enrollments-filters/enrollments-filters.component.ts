import { Component, OnInit, ViewChild, Input, EventEmitter, Output, OnDestroy } from "@angular/core";
import { MatSelect } from "@angular/material/select";
import { FormGroup, FormBuilder } from "@angular/forms";
import { AflacService, AccountService, CommissionSplit, ENROLLMENT_FILTER_CONSTANTS, BUSINESS_ENROLLMENT_TYPE } from "@empowered/api";
import { DatePipe } from "@angular/common";
import { forkJoin, Subject, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { NgxMaskPipe } from "ngx-mask";
import { DateFormats, ConfigName, AppSettings } from "@empowered/constants";
import { takeUntil, tap } from "rxjs/operators";
import { BusinessState, StaticUtilService, UtilService } from "@empowered/ngxs-store";

export interface ProducerFilterDropdown {
    name: string;
    id: number;
}

@Component({
    selector: "empowered-enrollments-filters",
    templateUrl: "./enrollments-filters.component.html",
    styleUrls: ["./enrollments-filters.component.scss"],
})
export class EnrollmentsFiltersComponent implements OnInit, OnDestroy {
    @Input() type: string;
    @Output() afterFilterApply: EventEmitter<any> = new EventEmitter<any>();

    @ViewChild("producerFilterDropdown") producerFilterDropdown: MatSelect;
    producerFilterDropdownData: ProducerFilterDropdown[];
    producerFilterConfirmValues: ProducerFilterDropdown[];
    producerFilterSelectedValue: ProducerFilterDropdown[];
    producerFilterDisplayText: string;

    @ViewChild("enrollDateFilterDropdown", { static: true }) enrollDateFilterDropdown: MatSelect;
    enrollDateFilterDropdownData: any[];
    enrollDateFilterConfirmValues: string;
    enrollDateFilterSelectedValue: string;
    enrollDateFilterDisplayText: string;
    enrollmentFilterSpecificDateValue: string;
    enrollmentFilterStartDateValue: string;
    enrollmentFilterEndDateValue: string;

    @ViewChild("splitAppliedFilterDropdown") splitAppliedFilterDropdown: MatSelect;
    splitAppliedFilterDropdownData: any[];
    splitAppliedFilterConfirmValues: any[];
    splitAppliedFilterSelectedValue: any[];
    splitAppliedFilterDisplayText: string;

    @ViewChild("sendDateFilterDropdown") sendDateFilterDropdown: MatSelect;
    sendDateFilterDropdownData: any[];
    sendDateFilterConfirmValues: string;
    sendDateFilterSelectedValue: string;
    sendDateFilterDisplayText: string;

    filterForm: FormGroup;
    filterOpen: boolean;
    isApply: boolean;
    isSent: boolean;
    today = new Date();
    showProducerFilter: boolean;
    showSplitAppliedFilter: boolean;
    producerList: any[];
    commissionSplits: CommissionSplit[];
    mpGroup: string;
    enrollmentFilterConstant = ENROLLMENT_FILTER_CONSTANTS;
    businessEnrollmentType = BUSINESS_ENROLLMENT_TYPE;
    isDirect: boolean;
    maxStartDate = null;
    minEndDate = null;
    subscriptionList: Subscription[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountEnrollments.filterEnrollment.filterTitle",
        "primary.portal.accountEnrollments.filterEnrollment.specificDate",
        "primary.portal.accountEnrollments.filterEnrollment.startDate",
        "primary.portal.accountEnrollments.filterEnrollment.endDate",
        "primary.portal.accountEnrollments.filterEnrollment.dateFormatHint",
        "primary.portal.accountEnrollments.filterEnrollment.buttonClear",
        "primary.portal.accountEnrollments.filterEnrollment.buttonApply",
        "primary.portal.accountEnrollments.filterEnrollment.filterProducerTitle",
        "primary.portal.accountEnrollments.filterEnrollment.filterEnrollDateTitle",
        "primary.portal.accountEnrollments.filterEnrollment.filterSplitAppliedTitle",
        "primary.portal.accountEnrollments.filterEnrollment.filterSendDateTitle",
        "primary.portal.accountEnrollments.filterEnrollment.specificDateText",
        "primary.portal.accountEnrollments.filterEnrollment.startOnlyDateRangeText",
        "primary.portal.accountEnrollments.filterEnrollment.endOnlyDateRangeText",
    ]);
    constructor(
        private fb: FormBuilder,
        private aflacService: AflacService,
        public datepipe: DatePipe,
        private accountService: AccountService,
        private language: LanguageService,
        private store: Store,
        private maskPipe: NgxMaskPipe,
        private utilService: UtilService,
        private readonly staticUtil: StaticUtilService,
    ) {}

    /**
     * Method used to initialize the filter form
     * to check any changes on load
     * to get filtered data
     * if sent enrollment, to set the default sent date filter using config
     */
    ngOnInit(): void {
        this.mpGroup = this.store.selectSnapshot(BusinessState.mpGroupId);
        this.isDirect = this.store.selectSnapshot(BusinessState.isDirect);

        this.filterOpen = false;
        this.isApply = false;
        this.filterForm = this.fb.group({
            producerFilter: [""],
            enrollDateFilter: [""],
            splitAppliedFilter: [""],
            sendDateFilter: [""],
            specificDate: [""],
            startDate: [""],
            endDate: [""],
        });
        this.detectValueChange();
        this.getFilterData();
        if (this.type === BUSINESS_ENROLLMENT_TYPE.SENT) {
            this.subscriptionList.push(
                this.staticUtil
                    .cacheConfigValue(ConfigName.DEFAULT_SENT_DATE_CONFIG)
                    .pipe(
                        tap((configValue) => {
                            if (configValue) {
                                this.sendDateFilterConfirmValues = this.sendDateFilterSelectedValue = this.getDefaultSentDateFilter(
                                    +configValue,
                                );
                                this.sendDateFilterDisplayText = `: ${this.getFilterSelectionText(
                                    ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER,
                                )}`;
                            }
                        }),
                    )
                    .subscribe(),
            );
        }
    }

    /**
     * Method used to set the default sent date filter.
     * @param value config value to be set as default
     * @returns sent date filter
     */
    getDefaultSentDateFilter(value: number): string | undefined {
        switch (value) {
            case ENROLLMENT_FILTER_CONSTANTS.THIRTY_DAYS:
                return ENROLLMENT_FILTER_CONSTANTS.LAST_30_DAYS;
            case ENROLLMENT_FILTER_CONSTANTS.SIXTY_DAYS:
                return ENROLLMENT_FILTER_CONSTANTS.LAST_60_DAYS;
            case ENROLLMENT_FILTER_CONSTANTS.NINETY_DAYS:
                return ENROLLMENT_FILTER_CONSTANTS.LAST_90_DAYS;
        }
        return undefined;
    }

    /**
     * Method used to set the default filters for sent business enrollments
     */
    setDefaultSentBusinessFilters(): void {
        this.producerFilterSelectedValue = [];
        this.producerFilterDisplayText = null;
        const userData = JSON.parse(sessionStorage.getItem("user"));
        const producerFilteredData = this.producerFilterDropdownData.find((producerData) => producerData.id === userData.producerId);
        if (producerFilteredData) {
            this.producerFilterSelectedValue.push(producerFilteredData);
            this.producerFilterConfirmValues = this.producerFilterSelectedValue;
            this.producerFilterDisplayText = `: ${this.getFilterSelectionText(ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER)}`;
            this.filterForm.get(ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER).setValue(this.producerFilterSelectedValue);
        }
    }
    /**
     * Method used to display the filters
     */
    getFilterData(): void {
        this.subscriptionList.push(
            forkJoin([
                this.aflacService.getCommissionSplits(this.mpGroup),
                this.accountService.getAccountProducers(this.mpGroup),
            ]).subscribe((Response) => {
                this.commissionSplits = Response[0];
                this.splitAppliedFilterDropdownData = this.commissionSplits.map((row) => ({
                    id: row.id,
                    name: row.name,
                }));
                this.showSplitAppliedFilter = this.splitAppliedFilterDropdownData.length > 1;
                this.producerList = Response[1];
                this.producerFilterDropdownData = this.producerList.map((row) => ({
                    name: `${row.producer.name.lastName}, ${row.producer.name.firstName}`,
                    id: row.producer.id,
                }));
                this.showProducerFilter = this.producerFilterDropdownData.length > 1;
                if (this.type === BUSINESS_ENROLLMENT_TYPE.SENT) {
                    this.setDefaultSentBusinessFilters();
                }
            }),
        );
        this.enrollDateFilterDropdownData = [
            {
                name: ENROLLMENT_FILTER_CONSTANTS.SPECIFIC_DATE,
                displayText: this.language.fetchPrimaryLanguageValue("primary.portal.accountEnrollments.filterEnrollment.specificDate"),
            },
            {
                name: ENROLLMENT_FILTER_CONSTANTS.DATE_RANGE,
                displayText: this.language.fetchPrimaryLanguageValue("primary.portal.accountEnrollments.filterEnrollment.dateRange"),
            },
        ];
        this.sendDateFilterDropdownData = [
            {
                name: ENROLLMENT_FILTER_CONSTANTS.LAST_30_DAYS,
                displayText: this.language.fetchPrimaryLanguageValue("primary.portal.accountEnrollments.filterEnrollment.last30Days"),
                maxValue: this.datepipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY),
                minValue: this.minusDays(30),
            },
            {
                name: ENROLLMENT_FILTER_CONSTANTS.LAST_60_DAYS,
                displayText: this.language.fetchPrimaryLanguageValue("primary.portal.accountEnrollments.filterEnrollment.last60Days"),
                maxValue: this.datepipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY),
                minValue: this.minusDays(60),
            },
            {
                name: ENROLLMENT_FILTER_CONSTANTS.LAST_90_DAYS,
                displayText: this.language.fetchPrimaryLanguageValue("primary.portal.accountEnrollments.filterEnrollment.last90Days"),
                maxValue: this.datepipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY),
                minValue: this.minusDays(90),
            },
        ];
    }

    /**
     * Method used to get the difference between current date and no of days passed
     * @param days - no of days to be reduced from the current date
     * @returns the date after subtracting the days passed from the current date
     */
    minusDays(days: number): string {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return this.datepipe.transform(date, DateFormats.YEAR_MONTH_DAY);
    }
    matSelectOpenHandler(isOpen: boolean): void {
        this.filterOpen = isOpen;
    }
    /**
     * Method used to get the selected filter displayed
     * @param filterType filter selected
     * @returns selected filter display Text
     */
    // eslint-disable-next-line complexity
    getFilterSelectionText(filterType: string): string {
        let text: string;
        switch (filterType) {
            case ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER:
                if (this.producerFilterSelectedValue && this.showProducerFilter) {
                    if (this.producerFilterSelectedValue.length < 3) {
                        text = this.producerFilterSelectedValue.map((producer) => producer.name).join(", ");
                    } else {
                        text = this.producerFilterSelectedValue.map((producer) => producer.name).length.toString();
                    }
                }
                break;

            case ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER:
                if (this.enrollDateFilterConfirmValues) {
                    if (this.enrollDateFilterConfirmValues === ENROLLMENT_FILTER_CONSTANTS.SPECIFIC_DATE) {
                        const specificDate = this.filterForm.controls["specificDate"].value;
                        if (specificDate && specificDate !== "") {
                            text = this.datepipe.transform(specificDate, DateFormats.MONTH_DAY_YEAR);
                        } else {
                            this.enrollDateFilterConfirmValues = this.enrollDateFilterSelectedValue = undefined;
                        }
                    } else if (this.enrollDateFilterConfirmValues === ENROLLMENT_FILTER_CONSTANTS.DATE_RANGE) {
                        const startDate = this.filterForm.controls["startDate"].value;
                        const endDate = this.filterForm.controls["endDate"].value;
                        if (startDate && startDate !== "" && endDate && endDate !== "") {
                            text = `${this.datepipe.transform(startDate, DateFormats.MONTH_DAY_YEAR)} - ${this.datepipe.transform(
                                endDate,
                                DateFormats.MONTH_DAY_YEAR,
                            )}`;
                        } else if (endDate && endDate !== "") {
                            text = `${
                                this.languageStrings["primary.portal.accountEnrollments.filterEnrollment.endOnlyDateRangeText"]
                            } ${this.datepipe.transform(endDate, DateFormats.MONTH_DAY_YEAR)}`;
                        } else if (startDate && startDate !== "") {
                            text = `${
                                this.languageStrings["primary.portal.accountEnrollments.filterEnrollment.startOnlyDateRangeText"]
                            } ${this.datepipe.transform(startDate, DateFormats.MONTH_DAY_YEAR)}`;
                        } else {
                            this.enrollDateFilterConfirmValues = this.enrollDateFilterSelectedValue = undefined;
                        }
                    }
                    this.filterForm.get(ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER).patchValue([this.enrollDateFilterSelectedValue]);
                }
                break;

            case ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER:
                if (this.splitAppliedFilterSelectedValue && this.showSplitAppliedFilter) {
                    if (this.splitAppliedFilterSelectedValue.length < 3) {
                        text = this.splitAppliedFilterSelectedValue.map((x) => x.name).join(", ");
                    } else {
                        text = this.splitAppliedFilterSelectedValue.map((x) => x.name).length.toString();
                    }
                }
                break;
            case ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER:
                if (this.sendDateFilterSelectedValue) {
                    this.filterForm.get(ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER).patchValue([this.sendDateFilterSelectedValue]);
                    text = this.sendDateFilterDropdownData.find((x) => x.name === this.sendDateFilterSelectedValue).displayText;
                }
                break;
        }
        return text;
    }

    detectValueChange(): void {
        this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER].valueChanges
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.producerFilterSelectedValue = value;
            });
        this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER].valueChanges
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((value) => {
                this.splitAppliedFilterSelectedValue = value;
            });
    }
    sendDateFilterValueChange(val: any): void {
        this.sendDateFilterSelectedValue = val;
    }
    enrollDateFilterValueChange(val: any): void {
        if (val) {
            this.enrollDateFilterSelectedValue = val;
        }
    }
    clearFilter(filterType: string): void {
        this.isApply = false;
        switch (filterType) {
            case ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER:
                if (this.showProducerFilter) {
                    this.producerFilterConfirmValues = [];
                    this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER].setValue([]);
                    this.producerFilterSelectedValue = [];
                    this.producerFilterDisplayText = null;
                    this.producerFilterDropdown.close();
                }
                break;
            case ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER:
                this.enrollDateFilterConfirmValues = "";
                this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER].setValue([]);
                this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.SPECIFIC_DATE_FILTER].patchValue(null);
                this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.START_DATE].patchValue(null);
                this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.END_DATE].patchValue(null);
                this.enrollmentFilterSpecificDateValue = null;
                this.enrollmentFilterStartDateValue = null;
                this.enrollmentFilterEndDateValue = null;
                this.maxStartDate = null;
                this.minEndDate = null;
                this.enrollDateFilterSelectedValue = undefined;
                this.enrollDateFilterDisplayText = null;
                this.enrollDateFilterDropdown.close();
                break;
            case ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER:
                if (this.showSplitAppliedFilter) {
                    this.splitAppliedFilterConfirmValues = [];
                    this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER].setValue([]);
                    this.splitAppliedFilterSelectedValue = [];
                    this.splitAppliedFilterDisplayText = null;
                    this.splitAppliedFilterDropdown.close();
                }
                break;
            case ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER:
                this.sendDateFilterConfirmValues = "";
                this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER].setValue([]);
                this.sendDateFilterSelectedValue = undefined;
                this.sendDateFilterDropdown.close();
                this.sendDateFilterDisplayText = null;
                this.sendDateFilterDropdown.writeValue("");

                break;
        }
        this.setFilterValues();
    }

    /**
     * Method used to be get the filter string
     * @param filterType Applied filter
     */
    applyFilter(filterType: string): void {
        this.isApply = true;
        switch (filterType) {
            case ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER:
                if (this.showProducerFilter) {
                    this.producerFilterConfirmValues = this.producerFilterSelectedValue;
                    this.producerFilterDropdown.close();
                    this.producerFilterDisplayText = " : " + this.getFilterSelectionText(ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER);
                }
                break;

            case ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER:
                this.enrollDateFilterConfirmValues = this.enrollDateFilterSelectedValue;
                if (this.enrollDateFilterSelectedValue === ENROLLMENT_FILTER_CONSTANTS.DATE_RANGE) {
                    this.enrollmentFilterStartDateValue = this.filterForm.controls["startDate"].value;
                    this.enrollmentFilterEndDateValue = this.filterForm.controls["endDate"].value;
                    this.enrollmentFilterSpecificDateValue = null;
                } else if (this.enrollDateFilterSelectedValue === ENROLLMENT_FILTER_CONSTANTS.SPECIFIC_DATE) {
                    this.enrollmentFilterStartDateValue = null;
                    this.enrollmentFilterEndDateValue = null;
                    this.enrollmentFilterSpecificDateValue = this.filterForm.controls["specificDate"].value;
                }

                this.enrollDateFilterDropdown.close();
                this.enrollDateFilterDisplayText = " : " + this.getFilterSelectionText(ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER);
                break;
            case ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER:
                if (this.showSplitAppliedFilter) {
                    this.splitAppliedFilterConfirmValues = this.splitAppliedFilterSelectedValue;
                    this.splitAppliedFilterDropdown.close();
                    this.splitAppliedFilterDisplayText =
                        " : " + this.getFilterSelectionText(ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER);
                }
                break;
            case ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER:
                this.sendDateFilterConfirmValues = this.sendDateFilterSelectedValue;
                this.sendDateFilterDropdown.close();
                this.sendDateFilterDisplayText = " : " + this.getFilterSelectionText(ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER);
                break;
        }
        this.setFilterValues();
    }

    /**
     * Method used to set the filter values
     */
    setFilterValues(): void {
        let filterString = "";
        const producerfilterName = this.language.fetchPrimaryLanguageValue(
            "primary.portal.accountEnrollments.filterEnrollment.filterProducerTitle",
        );
        const enrollDatefilterName = this.language.fetchPrimaryLanguageValue(
            "primary.portal.accountEnrollments.filterEnrollment.filterEnrollDateTitle",
        );
        const splitApliedfilterName = this.language.fetchPrimaryLanguageValue(
            "primary.portal.accountEnrollments.filterEnrollment.filterSplitAppliedTitle",
        );
        const endDatefilterName = this.language.fetchPrimaryLanguageValue(
            "primary.portal.accountEnrollments.filterEnrollment.filterSendDateTitle",
        );
        const selectedFilter = [];
        if (
            this.showProducerFilter &&
            this.producerFilterConfirmValues &&
            this.producerFilterConfirmValues.length &&
            this.producerFilterConfirmValues[0]
        ) {
            selectedFilter.push(producerfilterName);
            filterString =
                filterString !== ""
                    ? `${filterString}|producer.producerId:${this.producerFilterConfirmValues.map((x) => x.id)}`
                    : `producer.producerId:${this.producerFilterConfirmValues.map((producer) => producer.id)}`;
        }

        if (this.enrollDateFilterConfirmValues && this.enrollDateFilterConfirmValues === ENROLLMENT_FILTER_CONSTANTS.DATE_RANGE) {
            selectedFilter.push(enrollDatefilterName);
            const maxValue = this.datepipe.transform(this.filterForm.controls["endDate"].value, DateFormats.YEAR_MONTH_DAY);
            const minValue = this.datepipe.transform(this.filterForm.controls["startDate"].value, DateFormats.YEAR_MONTH_DAY);
            filterString =
                filterString !== "" ? `${filterString}|createDate:${minValue}/${maxValue}` : `createDate:${minValue}/${maxValue}`;
        } else if (this.enrollDateFilterConfirmValues && this.enrollDateFilterConfirmValues === ENROLLMENT_FILTER_CONSTANTS.SPECIFIC_DATE) {
            selectedFilter.push(enrollDatefilterName);
            const specificDate = this.datepipe.transform(this.filterForm.controls["specificDate"].value, DateFormats.YEAR_MONTH_DAY);
            filterString = filterString !== "" ? `${filterString}|createDate:${specificDate}/` : `createDate:${specificDate}/`;
        }

        if (this.showSplitAppliedFilter && this.splitAppliedFilterConfirmValues && this.splitAppliedFilterConfirmValues.length) {
            selectedFilter.push(splitApliedfilterName);
            filterString =
                filterString !== ""
                    ? `${filterString}|commissionSplitId:${this.splitAppliedFilterConfirmValues.map((x) => x.id)}`
                    : `commissionSplitId:${this.splitAppliedFilterConfirmValues.map((split) => split.id)}`;
        }

        const sendDateFilterValues = this.sendDateFilterConfirmValues
            ? this.sendDateFilterDropdownData.find((x) => x.name === this.sendDateFilterConfirmValues)
            : undefined;
        if (sendDateFilterValues) {
            const NEW_DATE = this.datepipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
            selectedFilter.push(endDatefilterName);
            filterString = filterString !== "" ? `${filterString}|sentDate:${this.getDateRange()}` : `sentDate:${this.getDateRange()}`;
        }

        const data = {
            filter: this.utilService.copy(filterString),
            selectedFilter: selectedFilter.join(", "),
        };

        this.afterFilterApply.emit(data);
    }

    /**
     * Method used to get the date range
     * @returns filter date range string
     */
    getDateRange(): string | undefined {
        const NEW_DATE = this.datepipe.transform(new Date(), DateFormats.YEAR_MONTH_DAY);
        switch (this.sendDateFilterConfirmValues) {
            case ENROLLMENT_FILTER_CONSTANTS.LAST_30_DAYS:
                return `${this.minusDays(ENROLLMENT_FILTER_CONSTANTS.THIRTY_DAYS)}/${NEW_DATE}`;
            case ENROLLMENT_FILTER_CONSTANTS.LAST_60_DAYS:
                return `${this.minusDays(ENROLLMENT_FILTER_CONSTANTS.SIXTY_DAYS)}/${NEW_DATE}`;
            case ENROLLMENT_FILTER_CONSTANTS.LAST_90_DAYS:
                return `${this.minusDays(ENROLLMENT_FILTER_CONSTANTS.NINETY_DAYS)}/${NEW_DATE}`;
        }
        return undefined;
    }
    clickOutside(filterType: string): void {
        if (!this.isApply) {
            switch (filterType) {
                case ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER:
                    if (this.showProducerFilter) {
                        this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.PRODUCT_FILTER].setValue(this.producerFilterConfirmValues);
                    }
                    break;
                case ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER:
                    if (this.enrollDateFilterConfirmValues) {
                        this.enrollDateFilterSelectedValue = this.enrollDateFilterConfirmValues;
                        this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.ENROLL_DATE_FILTER].setValue([
                            this.enrollDateFilterConfirmValues,
                        ]);
                        if (this.enrollDateFilterConfirmValues === ENROLLMENT_FILTER_CONSTANTS.DATE_RANGE) {
                            this.filterForm.controls["startDate"].setValue(this.enrollmentFilterStartDateValue);
                            this.filterForm.controls["endDate"].setValue(this.enrollmentFilterEndDateValue);
                            this.filterForm.controls["specificDate"].setValue(null);
                        } else if (this.enrollDateFilterConfirmValues === ENROLLMENT_FILTER_CONSTANTS.SPECIFIC_DATE) {
                            this.filterForm.controls["startDate"].setValue(null);
                            this.filterForm.controls["endDate"].setValue(null);
                            this.filterForm.controls["specificDate"].setValue(this.enrollmentFilterSpecificDateValue);
                        }
                    } else {
                        this.enrollDateFilterSelectedValue = null;
                    }

                    break;
                case ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER:
                    if (this.showSplitAppliedFilter) {
                        this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.SPLIT_APPLIED_FILTER].setValue(
                            this.splitAppliedFilterConfirmValues,
                        );
                    }
                    break;
                case ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER:
                    this.filterForm.controls[ENROLLMENT_FILTER_CONSTANTS.SEND_DATE_FILTER].setValue([this.sendDateFilterConfirmValues]);
                    break;
            }
        }
        this.isApply = false;
    }

    transform(event: any): void {
        event.target.value = this.maskPipe.transform(event.target.value, AppSettings.DATE_MASK_FORMAT);
    }
    validateEnrollDate(event: any, isStartDate: boolean): void {
        if (isStartDate) {
            this.minEndDate = this.filterForm.get(ENROLLMENT_FILTER_CONSTANTS.START_DATE).value;
        } else {
            this.maxStartDate = this.filterForm.get(ENROLLMENT_FILTER_CONSTANTS.END_DATE).value;
        }
    }

    /**
     * Life cycle hook used to unsubscribe the subscriptions.
     */
    ngOnDestroy(): void {
        this.subscriptionList.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
