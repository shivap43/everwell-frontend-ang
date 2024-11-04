import { AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NotificationService, AdminService, EmailSMSAudit, MessageType } from "@empowered/api";
import { ActivatedRoute } from "@angular/router";
import { Component, OnInit, ViewChild, OnDestroy, Input, AfterViewInit } from "@angular/core";
import { Observable, combineLatest, Subject, merge, iif, of } from "rxjs";
import { FormBuilder, FormControl } from "@angular/forms";
import { map, startWith, filter, switchMap, takeUntil, tap, catchError, withLatestFrom } from "rxjs/operators";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";

import { Store } from "@ngxs/store";
import { EmpoweredPaginatorComponent, PillFilterGroupComponent, FilterModel, ActiveFilter, GET_DATE_FILTER_LABEL } from "@empowered/ui";
import { SharedState, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

enum Column {
    TYPE = "type",
    RECIPIENT = "recipient",
    DATE = "date",
    SUBJECT = "subject",
}
interface EmailSmsTableRow {
    type: { value: MessageType; label: string };
    recipient: { value: string; label: string };
    date: Date;
    subject: string;
    message?: string;
}
enum DateFilterType {
    SPECIFIC,
    START,
    END,
}
interface FilterState {
    searchTerm: string;
    pillFilters: ActiveFilter[];
}
const MIN_LENGTH_SEARCH_INPUT = 3;
const UNIT_DATE_COMPARISON = "day";

@Component({
    selector: "empowered-email-tracking",
    templateUrl: "./email-tracking.component.html",
    styleUrls: ["./email-tracking.component.scss"],
})
export class EmailTrackingComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(PillFilterGroupComponent, { static: true }) pillFilters: PillFilterGroupComponent;
    @ViewChild(EmpoweredPaginatorComponent, { static: true }) matPaginator: EmpoweredPaginatorComponent;
    @ViewChild(MatSort, { static: true }) matSort: MatSort;
    @ViewChild(Input) input: Input;
    searchInput: FormControl;
    languageStrings: Record<string, string>;
    displayedColumns: string[];
    noResultsFoundText: string;
    memberId: string;
    error: string;
    typeOptions: { value: string; label: string }[];
    recipientOptions: { value: string; label: string }[];
    activeCol: string;
    columns = Column;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    isLoading = true;
    dataSource: MatTableDataSource<EmailSmsTableRow> = new MatTableDataSource<EmailSmsTableRow>();
    private readonly triggerSearch$: Subject<string> = new Subject<string>();
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    private readonly emailsTextsSubject$: Subject<EmailSmsTableRow[]> = new Subject<EmailSmsTableRow[]>();
    emailsTexts$: Observable<EmailSmsTableRow[]> = this.emailsTextsSubject$.asObservable();
    filterValueChanges$: Observable<[string, ActiveFilter[]]>;
    filterModels$: Observable<FilterModel[]> = this.emailsTexts$.pipe(
        map(
            (emails) =>
                [
                    {
                        id: Column.TYPE,
                        title: this.languageStrings["primary.portal.emailTracking.table.column.type"],
                        multi: {
                            isChip: false,
                            options: emails
                                .map((email) => ({
                                    ...email.type,
                                    label: this.languageStrings[
                                        `primary.portal.emailTracking.table.filters.type.${email.type.value.toLowerCase()}`
                                    ],
                                }))
                                .reduce((acc, curr) => (acc.map((a) => a.value).includes(curr.value) ? acc : [...acc, curr]), []),
                        },
                    },
                    ...(this.memberId
                        ? []
                        : [
                            {
                                id: Column.RECIPIENT,
                                title: this.languageStrings["primary.portal.emailTracking.table.column.recipient"],
                                multi: {
                                    isChip: false,
                                    options: emails
                                        .map((email) => email.recipient)
                                        .reduce((acc, curr) => (acc.map((a) => a.value).includes(curr.value) ? acc : [...acc, curr]), []),
                                },
                            },
                        ]),
                    {
                        id: Column.DATE,
                        title: this.languageStrings["primary.portal.emailTracking.table.column.date"],
                        date: undefined,
                    },
                ] as FilterModel[],
        ),
    );

    constructor(
        private readonly formBuilder: FormBuilder,
        private readonly language: LanguageService,
        private readonly notifications: NotificationService,
        private readonly admins: AdminService,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
        private readonly util: UtilService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Initializes language and data source
     * @returns nothing
     */
    ngOnInit(): void {
        this.languageStrings = this.getLanguage();
        this.searchInput = this.formBuilder.control("");
        this.getEmailSmsData()
            .pipe(withLatestFrom(this.store.select(SharedState.regex)), takeUntil(this.unsubscribe$))
            .subscribe(([emailSmsAudit, regex]) => {
                this.dataSource.data = emailSmsAudit;
                this.emailsTextsSubject$.next(emailSmsAudit);
                this.isLoading = false;
                this.dataSource.paginator = this.matPaginator;
                this.dataSource.sort = this.matSort;
                this.matSort.sort({ id: Column.DATE, start: "desc", disableClear: false });
                this.dataSource.sortingDataAccessor = (data: EmailSmsTableRow, sortHeaderId: string) =>
                    [Column.TYPE, Column.RECIPIENT].includes(sortHeaderId as Column)
                        ? data[sortHeaderId].value.toLowerCase()
                        : data[sortHeaderId];
                this.dataSource.filterPredicate = (data: EmailSmsTableRow, filterString: string) => {
                    const { searchTerm, pillFilters }: FilterState = JSON.parse(filterString);
                    return this.searchFilterPredicate(data, searchTerm) && this.pillFilterPredicate(data, pillFilters);
                };
            });
    }

    /**
     * Sets up listeners for filters and search
     */
    ngAfterViewInit(): void {
        combineLatest(
            merge(
                this.triggerSearch$.asObservable(),
                this.searchInput.valueChanges.pipe(
                    filter((value) => value.length >= MIN_LENGTH_SEARCH_INPUT || value.length === 0),
                    startWith(""),
                ),
            ),
            this.pillFilters.filterChange,
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([searchTerm, pillFilters]) => {
                this.dataSource.filter = JSON.stringify({ searchTerm, pillFilters });
                if (this.dataSource.filteredData.length === 0) {
                    this.noResultsFoundText = this.getNoResultsFoundText([searchTerm, pillFilters as ActiveFilter[]]);
                }
            });
    }
    /**
     * Checks if the email was sent on the date selected
     * or if the sent date falls in the selected date range
     * @param data data object used to check against the filter
     * @param dateFilter selected date or date range
     * @returns whether the filter matches against the data
     */
    dateFilterPredicate(data: EmailSmsTableRow, dateFilter: string[]): boolean {
        let resultSoFar = true;
        const date = data.date;
        date.setHours(0, 0, 0, 0);
        if (dateFilter) {
            if (dateFilter[DateFilterType.SPECIFIC]) {
                resultSoFar = resultSoFar && this.dateService.isEqual(date, this.dateService.toDate(dateFilter[DateFilterType.SPECIFIC]));
            }
            if (dateFilter[DateFilterType.START]) {
                resultSoFar =
                    resultSoFar && this.dateService.getIsAfterOrIsEqual(date, this.dateService.toDate(dateFilter[DateFilterType.START]));
            }
            if (dateFilter[DateFilterType.END]) {
                resultSoFar =
                    resultSoFar && this.dateService.isBeforeOrIsEqual(date, this.dateService.toDate(dateFilter[DateFilterType.END]));
            }
        }
        return resultSoFar;
    }

    /**
     * Checks if a data object matches a search term (string),
     * specifically, if it's subject or recipient contain the term
     * @param data data object used to check against the filter
     * @param searchFilter term entered in the search input
     * @returns whether the filter matches against the data
     */
    searchFilterPredicate(data: EmailSmsTableRow, searchFilter: string): boolean {
        return [data.subject || "", (data.recipient && data.recipient.value) || ""]
            .map((value) => value.trim().toLowerCase())
            .join("")
            .includes(searchFilter.trim().toLowerCase());
    }

    /**
     * Checks if a data object passes the active pill filters (like recipient and message type)
     * @param data data object used to check against the filter
     * @param pillFilters list of active pill filters
     * @returns whether the filter matches against the data
     */
    pillFilterPredicate(data: EmailSmsTableRow, pillFilters: ActiveFilter[]): boolean {
        return pillFilters.reduce(
            (accumulator, pillFilter) =>
                accumulator &&
                (pillFilter.filterId === "date"
                    ? this.dateFilterPredicate(data, pillFilter.values)
                    : pillFilter.values.includes(data[pillFilter.filterId].value)),
            true,
        );
    }

    /**
     * Returns message for when no result is found with the filters selected
     * @param [searchFilter, pillFilters] list of the current state of all filters
     * @returns the message to be displayed when no results are found
     */
    getNoResultsFoundText([, pillFilters]: [string, ActiveFilter[]]): string {
        if (pillFilters) {
            if (!pillFilters || pillFilters.length === 0) {
                return "";
            }
            if (pillFilters.length === 1) {
                const languageKey = `primary.portal.emailTracking.table.column.${[pillFilters[0].filterId]}`;
                let value = "";
                if (pillFilters[0].filterId === "date") {
                    value = GET_DATE_FILTER_LABEL(
                        {
                            specific: pillFilters[0].values[DateFilterType.SPECIFIC],
                            range: {
                                start: pillFilters[0].values[DateFilterType.START],
                                end: pillFilters[0].values[DateFilterType.END],
                            },
                        },
                        this.languageStrings,
                    );
                } else {
                    value = pillFilters[0].values.length > 1 ? pillFilters[0].values.length : pillFilters.values[0];
                }
                return `${this.languageStrings[languageKey]}: ${value}`;
            }
            return this.language.fetchPrimaryLanguageValue("primary.portal.accounts.accountList.selectedFilters");
        }
        return "";
    }

    /**
     * Fires an event when enter is pressed after a value is entered
     * in the search input, so that the filter can be triggered
     * @param searchTerm the string entered in the input
     * @returns nothing
     */
    triggerSearch(searchTerm: string): void {
        this.triggerSearch$.next(searchTerm);
    }

    /**
     * Gets languages required in the component
     * @returns Record of language strings
     */
    getLanguage(): Record<string, string> {
        return this.language.fetchPrimaryLanguageValues([
            "primary.portal.emailTracking.emailTextAudit",
            "primary.portal.emailTracking.table.column.type",
            "primary.portal.emailTracking.table.column.type.email",
            "primary.portal.emailTracking.table.column.type.sms",
            "primary.portal.emailTracking.table.column.recipient",
            "primary.portal.emailTracking.table.column.date",
            "primary.portal.emailTracking.table.column.subject",
            "primary.portal.emailTracking.table.searchHint.employee",
            "primary.portal.emailTracking.table.searchHint.admin",
            "primary.portal.emailTracking.heading",
            "primary.portal.emailTracking.subHeading",
            "primary.portal.emailTracking.subHeading.zeroState",
            "primary.portal.emailTracking.table.filters.type.email",
            "primary.portal.emailTracking.table.filters.type.sms",
            "primary.portal.resources.resultNotFound",
            "primary.portal.document.showingItems",
            "primary.portal.document.showingItem",
            "primary.portal.common.search",
            "primary.portal.common.filters",
            "primary.portal.globalComponent.filter.date.onOrBefore",
            "primary.portal.globalComponent.filter.date.onOrAfter",
        ]);
    }

    /**
     * Gets emails/texts sent to admins or employees of an account
     * @returns observable of data transformed into a format that can be represented in the table
     */
    getEmailSmsData(): Observable<EmailSmsTableRow[]> {
        return this.route.parent.parent.paramMap.pipe(
            takeUntil(this.unsubscribe$),
            map((paramMap) => paramMap.get("memberId")),
            tap((memberId) => {
                this.memberId = memberId;
                this.displayedColumns = [Column.TYPE, ...(memberId ? [] : [Column.RECIPIENT]), Column.DATE, Column.SUBJECT];
            }),
            switchMap((memberId) => this.notifications.getEmailSmsAudit(memberId ? +memberId : undefined)),
            catchError((error) => {
                this.error = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
                return of([] as EmailSMSAudit[]);
            }),
            map((emailSmsList) =>
                emailSmsList.sort(this.sortCompareFunction).map((emailSms) => ({
                    type: {
                        value: emailSms.type,
                        label: this.languageStrings[`primary.portal.emailTracking.table.column.type.${emailSms.type.toLowerCase()}`],
                    },
                    date: this.dateService.toDate(emailSms.dateSent),
                    subject: emailSms.subject || emailSms.smsMessage,
                    recipient: emailSms.adminId ? { value: emailSms.adminId.toString(), label: emailSms.adminId.toString() } : undefined,
                })),
            ),
            switchMap((emailSmsList) =>
                iif(
                    () => !!this.memberId,
                    of(emailSmsList),
                    this.admins.getAccountAdmins().pipe(
                        map((accountAdmins) =>
                            emailSmsList.map((emailSms) => {
                                const recipient = accountAdmins.find((admin) => admin.id === +emailSms.recipient.value);
                                return {
                                    ...emailSms,
                                    recipient: {
                                        value: `${recipient.name.lastName}, ${recipient.name.firstName}`,
                                        label: `${recipient.name.lastName}, ${recipient.name.firstName}`,
                                    },
                                };
                            }),
                        ),
                    ),
                ),
            ),
        );
    }

    /**
     * Util function to sort EmailSMSAudit objects, most recent emails/texts first (descending order of date)
     * @param emailOne first EmailSMSAudit object
     * @param emailTwo second EmailSMSAudit object
     * @returns -1 if first argument is less than second argument, zero if they're equal and a positive value otherwise.
     */
    sortCompareFunction(emailOne: EmailSMSAudit, emailTwo: EmailSMSAudit): number {
        const emailOneDateSent = new Date(emailOne.dateSent);
        const emailTwoDateSent = new Date(emailTwo.dateSent);
        let result = 0;
        if (emailOneDateSent < emailTwoDateSent) {
            result = 1;
        }
        if (emailOneDateSent > emailTwoDateSent) {
            result = -1;
        }
        return result;
    }

    /**
     * Cleans up subscriptions
     * @returns nothing
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
