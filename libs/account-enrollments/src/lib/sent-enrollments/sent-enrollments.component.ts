import { Component, ViewChild, OnDestroy } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { FormControl } from "@angular/forms";
import { SharedService } from "@empowered/common-services";
import { DataFilter } from "@empowered/ui";
import { Subscription, forkJoin, Subject, of, Observable } from "rxjs";
import { DatePipe } from "@angular/common";
import {
    AflacService,
    AccountService,
    SENT_UNSENT_LIST_COLUMNS,
    BUSINESS_ENROLLMENT_TYPE,
    BusinessEnrollments,
    Situs,
    BUSINESS_ENROLLMENT_FEED_STATUS,
    FilterObject,
    CommissionSplit,
} from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { EnrollmentsFiltersComponent } from "../enrollments-filters/enrollments-filters.component";
import { takeUntil, switchMap, filter, tap, catchError } from "rxjs/operators";
import { UserService } from "@empowered/user";
import {
    ClientErrorResponseCode,
    DateFormats,
    CompanyCode,
    SITCode,
    WritingNumber,
    AppSettings,
    AccountProducer,
    ProducerCredential,
} from "@empowered/constants";
import { BusinessState } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-sent-enrollments",
    templateUrl: "./sent-enrollments.component.html",
    styleUrls: ["./sent-enrollments.component.scss"],
    providers: [DataFilter],
})
export class SentEnrollmentsComponent implements OnDestroy {
    dataSource: MatTableDataSource<BusinessEnrollments>;
    data: BusinessEnrollments[];
    displayedColumns: string[];
    commissionSplitList: CommissionSplit[];
    sentEnrollments: number;
    sentAP: number;
    mpGroup: string;
    sendUnsendColumns = SENT_UNSENT_LIST_COLUMNS;
    writingNumbers: WritingNumber[];
    pageSizeOption: number[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountEnrollments.sentBusiness.title",
        "primary.portal.accountEnrollments.sentUnsentBusiness.columnNote",
        "primary.portal.accountEnrollments.sentUnsentBusiness.columnCommissionSplit",
        "primary.portal.members.membersList.page",
        "primary.portal.accountEnrollments.sentBusiness.sentEnrollments",
        "primary.portal.accountEnrollments.sentBusiness.sentAP",
        "primary.portal.accountEnrollments.sentBusiness.noResultFound",
        "primary.portal.accountEnrollments.sentUnsentBusiness.columnProducer",
        "primary.portal.accountEnrollments.sentUnsentBusiness.columnEnrollment",
        "primary.portal.accountEnrollments.sentUnsentBusiness.annually",
        "primary.portal.accountEnrollments.sentUnsentBusiness.columnSendDate",
        "primary.portal.accountEnrollments.sentBusiness.processing",
        "primary.portal.accountEnrollments.sentUnsentBusiness.selfEnroll",
    ]);
    // Need form control here as we are using single form control here
    pageNumberControl: FormControl = new FormControl(1);
    NoDataOnFilterErrorMessage = "";
    producersList: AccountProducer[];
    sitCodes: SITCode[];
    isSpinnerLoading = false;
    showErrorMessage = false;
    errorMessage = "";
    situs: Situs;
    companyCode: CompanyCode;
    subscriptionList: Subscription[] = [];
    filterString: string;

    @ViewChild(MatSort) sort: MatSort;
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(EnrollmentsFiltersComponent) filterComponant: EnrollmentsFiltersComponent;
    SENDDATE = "sendDate";
    ENROLLMENT = "enrollment";
    selfEnrollmentFlag = false;
    private unsubscribe$: Subject<void> = new Subject<void>();
    readonly DECIMAL_2 = 2;
    constructor(
        private aflacService: AflacService,
        private accountService: AccountService,
        private language: LanguageService,
        private datepipe: DatePipe,
        private store: Store,
        private domSanitizer: DomSanitizer,
        private readonly sharedService: SharedService,
        private readonly user: UserService,
    ) {
        this.pageSizeOption = AppSettings.pageSizeOptions;
        this.sharedService
            .checkAgentSelfEnrolled()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.selfEnrollmentFlag = response;
            });
    }

    /**
     * function to initialize component data
     */
    initialize(): void {
        if (this.selfEnrollmentFlag) {
            this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
                if ((credential as ProducerCredential).groupId) {
                    this.mpGroup = (credential as ProducerCredential).groupId.toString();
                }
            });
        } else {
            this.mpGroup = this.store.selectSnapshot(BusinessState.mpGroupId);
        }
        this.getAccountInfo(this.mpGroup);
    }

    /**
     * to get Account related business details
     * @param mpGroup Account group
     */
    getAccountInfo(mpGroup: string): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.subscriptionList.push(
            this.accountService.getAccount(mpGroup).subscribe(
                (Response) => {
                    if (Response) {
                        this.situs = Response.situs;
                        this.getEnrollmentData();
                    }
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
    }
    /**
     * Method to get the enrollment data
     * @returns : void
     */
    getEnrollmentData(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.companyCode = this.situs.state.abbreviation === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US;
        this.subscriptionList.push(
            forkJoin([
                this.aflacService.getSitCodes(this.companyCode, false, true, this.mpGroup),
                this.aflacService.getCommissionSplits(this.mpGroup),
            ])
                .pipe(
                    switchMap(([writingNumbers, commSplitsList]) => {
                        this.writingNumbers = writingNumbers;
                        this.commissionSplitList = commSplitsList;
                        return this.selfEnrollmentFlag ? of(null) : this.accountService.getAccountProducers(this.mpGroup);
                    }),
                    tap((accountProducers) => {
                        this.isSpinnerLoading = false;
                        this.producersList = accountProducers;
                        const allSitCodes: SITCode[] = [];
                        this.writingNumbers.forEach((writingNumber) => {
                            allSitCodes.push(...writingNumber.sitCodes);
                        });
                        this.sitCodes = allSitCodes;
                        if (this.filterComponant) {
                            this.filterComponant.setFilterValues();
                        }
                    }),
                    filter(() => this.selfEnrollmentFlag),
                    switchMap(() => this.getBusinessEnrollments(null)),
                    catchError((error) => {
                        this.isSpinnerLoading = false;
                        this.showErrorAlertMessage(error);
                        return of(null);
                    }),
                )
                .subscribe(),
        );
    }
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }

    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err["error"];
        if (error.status === ClientErrorResponseCode.RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.enrollments.api.${error.status}.${error.code}.${error["details"][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    /**
     * This method is to set Data source
     * @param data contains an enrollment object
     */
    setDataSource(data: BusinessEnrollments[]): void {
        this.dataSource = new MatTableDataSource(
            (this.data = data.map((row) => {
                const producerName = row.producer ? `${row.producer.fullName.lastName}, ${row.producer.fullName.firstName}` : "";
                return {
                    producerName: [producerName],
                    enrollmentDate: this.datepipe.transform(row.createDate, DateFormats.MONTH_DAY_YEAR),
                    memberName: row.member.name,
                    productName: row.productName,
                    annualPremium: +row.annualPremium.toFixed(this.DECIMAL_2),
                    enrollmentComment: this.getNotesTooltip(
                        row.enrollmentComment,
                        producerName,
                        this.datepipe.transform(row.sentDate, DateFormats.DATE_TIME_AM_PM),
                    ),
                    commissionSplitId: row.commissionSplitId,
                    commissionSplit:
                        row.commissionSplit && row.commissionSplit.archived
                            ? row.commissionSplit
                            : this.getCommissionSplitDetails(row.commissionSplitId),
                    commissionTooltip: this.getCommissionTooltip(row.commissionSplitId, row.commissionSplit),
                    sentDate: this.datepipe.transform(row.sentDate, DateFormats.DATE_TIME_AM_PM),
                    feedStatus:
                        row.feedStatus === BUSINESS_ENROLLMENT_FEED_STATUS.PROCESSING ||
                        row.feedStatus === BUSINESS_ENROLLMENT_FEED_STATUS.AWAITING_TRANSMISSION
                            ? this.languageStrings["primary.portal.accountEnrollments.sentBusiness.processing"]
                            : undefined,
                } as BusinessEnrollments;
            })),
        );
        this.afterDataSourceSet();
    }
    /**
     * Logic to be run after setting data source
     * sets displayed columns, pagination etc.
     */
    afterDataSourceSet(): void {
        this.sortAnalyserHelper();
        this.displayedColumns = [
            SENT_UNSENT_LIST_COLUMNS.PRODUCER,
            SENT_UNSENT_LIST_COLUMNS.ENROLLMENT,
            SENT_UNSENT_LIST_COLUMNS.NOTE,
            SENT_UNSENT_LIST_COLUMNS.COMMISSION_SPLIT,
            SENT_UNSENT_LIST_COLUMNS.SEND_DATE,
        ];
        this.getValuesOfEnrollmentAP();
        this.dataSource.paginator = this.paginator;
        if (this.paginator) {
            this.subscriptionList.push(
                this.paginator.page.subscribe((page: PageEvent) => {
                    this.pageNumberControl.setValue(page.pageIndex + 1);
                }),
            );
        }
    }

    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > 0 && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }
    /**
     * gets commission split based on id
     * @param id commission split id
     * @returns commission split
     */
    getCommissionSplitDetails(id: number): CommissionSplit {
        return this.commissionSplitList.find((x) => x.id === id);
    }
    /**
     * gets tool tip based on commission split id
     * @param id commission split id
     * @param commission commission split
     * @returns tool tip safe html
     */
    getCommissionTooltip(id: number, commission: CommissionSplit): SafeHtml {
        if (!(commission && commission.archived)) {
            commission = this.commissionSplitList.find((x) => x.id === id);
        }
        let tooltipHtml: SafeHtml;
        let tooltip = "<div class='commissions-split-tooltip-content'>";
        if (commission && commission.assignments) {
            commission.assignments.forEach((assignment) => {
                tooltip = `${tooltip}<span>${assignment.percent}% ${assignment.producer.name}`;

                if (this.writingNumbers.length) {
                    const writingNumber: WritingNumber = this.getWritingNumberBySitCode(assignment.sitCodeId);
                    let sitCode: SITCode;
                    if (commission && commission.archived) {
                        sitCode = writingNumber?.sitCodes.find((sitCodeData) => sitCodeData.id === assignment.sitCodeId);
                    } else {
                        sitCode = this.sitCodes.find((sitCodeData) => sitCodeData.id === assignment.sitCodeId);
                    }
                    tooltip = `${tooltip} ${sitCode ? sitCode.code : ""} ${writingNumber ? writingNumber.number : ""}</span>`;
                }
            });
            tooltip = `${tooltip}</div>`;
            tooltipHtml = this.domSanitizer.bypassSecurityTrustHtml(tooltip);
        }
        return tooltipHtml;
    }
    getNotesTooltip(notes: string, producerName: string, date: string): SafeHtml | string {
        if (notes) {
            return this.domSanitizer.bypassSecurityTrustHtml(
                "<div>" + notes + "</div></br>" + "<div>" + producerName + "</div><div>" + date + "</div>",
            );
        }
        return "";
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

    /**
     * Method used to get the filtered enrollment list
     * @param data -filters applied object
     * @return Observable of bussinessEnrollments[]
     */
    getBusinessEnrollments(data: FilterObject): Observable<BusinessEnrollments[]> {
        if (data) {
            this.filterString = data.filter ? data.filter : "";
        }
        const businessEnrollments$ = this.aflacService.getBusinessEnrollments(
            BUSINESS_ENROLLMENT_TYPE.SENT,
            this.mpGroup,
            data && data.selectedFilter ? this.filterString : undefined,
        );
        this.isSpinnerLoading = true;
        return businessEnrollments$.pipe(
            tap((dataValue) => {
                this.isSpinnerLoading = false;

                this.setDataSource(dataValue);
                if (data && data.selectedFilter) {
                    this.NoDataOnFilterErrorMessage = `${this.language.fetchPrimaryLanguageValue(
                        "primary.portal.accountEnrollments.sentBusiness.noFilterResult",
                    )} ${data.selectedFilter}`;
                }
                this.getValuesOfEnrollmentAP();
            }),
        );
    }

    /**
     * Method to subscribe getBussinessEnrollment and get filtered enrollment list
     * @param data - filters applied object
     * @return void
     */
    afterFilterApply(data: FilterObject): void {
        this.getBusinessEnrollments(data)
            .pipe(
                takeUntil(this.unsubscribe$),
                catchError(() => {
                    this.isSpinnerLoading = false;
                    return of(null);
                }),
            )
            .subscribe();
    }

    getValuesOfEnrollmentAP(): void {
        this.sentAP = +this.dataSource.data
            .reduce((sum, item) => sum + +parseFloat(item.annualPremium.toString()), 0)
            .toFixed(this.DECIMAL_2);
        this.sentEnrollments = this.dataSource.data.length;
    }

    /**
     * gets writing number based on sit code id
     * @param sitCodeId sit code id
     * @param isArchived indicates whether archived or not
     * @returns writing number
     */
    getWritingNumberBySitCode(sitCodeId: number): WritingNumber {
        let writingNumber: WritingNumber;
        if (this.writingNumbers) {
            writingNumber = this.writingNumbers.find((item) => item.sitCodes.some((x) => x.id === sitCodeId));
        }
        return writingNumber;
    }

    /** helper to retain sorting logic */
    sortAnalyserHelper(): void {
        if (this.dataSource) {
            this.dataSource.sortingDataAccessor = (item, property) => {
                if (property === this.ENROLLMENT) {
                    return new Date(item["enrollmentDate"]);
                }
                if (property === this.SENDDATE) {
                    return new Date(item["sentDate"]);
                }
                return item[property];
            };
            this.dataSource.sort = this.sort;
        }
    }

    /**
     * Life cycle hook used to unsubscribe all the subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptionList.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
