import { CreateReportComponent } from "./../create-report/create-report.component";
import { MatTableDataSource } from "@angular/material/table";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort, Sort } from "@angular/material/sort";
import { StaticService, AccountService, DocumentApiService } from "@empowered/api";
import { DocumentsService } from "@empowered/documents";
import { Component, OnInit, ViewChild, AfterContentInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { MPGroupAccountService } from "@empowered/common-services";
import { FormControl } from "@angular/forms";
import { Subscription, timer, Observable } from "rxjs";
import { switchMap, tap, map, take } from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";
import { PortalType, AppSettings, SortOrder, ProducerCredential, Document } from "@empowered/constants";
import { UserService } from "@empowered/user";
import { AccountListState, GetDocuments, ResetRequestStatus } from "@empowered/ngxs-store";
@Component({
    selector: "empowered-reports-list",
    templateUrl: "./reports-list.component.html",
    styleUrls: ["./reports-list.component.scss"],
})
export class ReportsListComponent implements OnInit, AfterContentInit, OnDestroy {
    displayedColumns = ["reportType", "description", "uploadDate", "status", "uploadAdmin", "manage"];

    datasource = new MatTableDataSource<Document>();
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;

    pageNumberControl: FormControl = new FormControl(1);
    compareZero = 0;
    pageSizeOption: number[];
    activeCol = "uploadDate";
    isZeroState = true;
    defaultRefreshIntervalInMs = 120000;
    isDirect = false;
    private readonly DIRECT = "direct";

    reportList: Document[] = [];

    subscriptions: Subscription[] = [];

    isDirectGroup$: Observable<boolean> = this.accountService.getAccount(this.route.snapshot.params.mpGroup).pipe(
        map((account) => {
            this.isDirect = account.partnerAccountType === "DIRECT";
            if (this.isDirect) {
                this.displayedColumns = this.displayedColumns.filter((column) => column !== "uploadAdmin");
            }
            this.document.loadDocuments(this.isDirect);
            return this.isDirect;
        }),
    );

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.reportsList.header",
        "primary.portal.reportList.download",
        "primary.portal.reportList.remove",
        "primary.portal.common.enterPageNumber",
        "primary.portal.reportList.noEmployeeMessage",
        "primary.portal.reportList.noProductsMessage",
        "primary.portal.reportList.noEmployeeAndProductsMessage",
        "primary.portal.gotoEmployees.button",
        "primary.portal.gotoBenefits.button",
        "primary.portal.common.menu",
    ]);
    employeeCount: number;
    productsCount: number;
    noEmployees = false;
    noproducts = false;
    isSutherlandCallCenter = false;
    readonly SUTHERLAND_CALL_CENTER = 1;
    readonly CALL_CENTER_ID: "callCenterId";

    isAdminPortal$: Observable<boolean> = this.user.portal$.pipe(map((portal) => portal.toUpperCase() === PortalType.ADMIN));
    constructor(
        private readonly language: LanguageService,
        public document: DocumentsService,
        public documentsApi: DocumentApiService,
        private readonly staticService: StaticService,
        private readonly accountService: AccountService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        public createReport: CreateReportComponent,
        private readonly user: UserService,
    ) {
        this.pageSizeOption = AppSettings.pageSizeOptions;
    }

    /**
     * get the reports list and display zero-state if there's no report
     */
    ngOnInit(): void {
        this.store.dispatch(new ResetRequestStatus());
        this.subscriptions.push(
            this.user.credential$.subscribe((memberInfo: ProducerCredential) => {
                this.isSutherlandCallCenter = memberInfo.callCenterId === this.SUTHERLAND_CALL_CENTER;
            }),
        );
        this.subscriptions.push(
            this.staticService
                .getConfigurations("portal.account.reports.list.refreshInterval")
                .pipe(
                    switchMap((configs) => timer(0, configs.length ? parseInt(configs[0].value, 10) : this.defaultRefreshIntervalInMs)),
                    tap((result) => {
                        this.store.dispatch(new GetDocuments(this.isDirect));
                    }),
                )
                .subscribe(),
        );
        this.subscriptions.push(
            this.document
                .getData()
                .pipe(
                    tap((documents) => {
                        if (this.document.getRequestStatus() !== "REQUESTING") {
                            const reports = documents.filter((document) => document.type === "REPORT");
                            this.datasource.data = reports;
                            if (reports.length > 0) {
                                this.isZeroState = false;
                            } else {
                                this.isZeroState = true;
                                this.employeeCount = this.store.selectSnapshot(AccountListState).selectedGroup
                                    ? this.store.selectSnapshot(AccountListState).selectedGroup.employeeCount
                                    : null;
                                this.productsCount = this.store.selectSnapshot(AccountListState).selectedGroup
                                    ? this.store.selectSnapshot(AccountListState).selectedGroup.productsCount
                                    : null;
                                this.noEmployees = this.employeeCount === 0;
                                this.noproducts = this.productsCount === 0;
                            }
                        }
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * setting up sort and paginator for mat-table
     */
    ngAfterContentInit(): void {
        this.datasource.sort = this.sort;
        this.datasource.sortingDataAccessor = (data, sortHeaderId) => {
            if (typeof data[sortHeaderId] === "string") {
                return SortOrder.TWO + data[sortHeaderId].toLocaleLowerCase();
            }
            return data[sortHeaderId];
        };
        this.datasource.paginator = this.paginator;
        this.subscriptions.push(
            this.paginator.page.subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            }),
        );
    }

    /**
     * only the upload admin column needs this custom sort at the moment, since
     * we're sorting on the display string and not what's returned from the API
     */
    sortData(sort: Sort): number | undefined {
        this.activeCol = sort.active;
        if (!sort.active || sort.direction === "") {
            return undefined;
        }
        if (sort.active === "uploadAdmin") {
            this.datasource.data.sort((a, b) => {
                const isAsc = sort.direction === "asc";
                return this.compare(a.uploadAdmin.name.firstName, b.uploadAdmin.name.firstName, isAsc);
            });
        }
        return undefined;
    }

    /**
     * compare for the sortData method above
     */
    compare(a: string, b: string, isAsc: boolean): number {
        return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
    }

    /**
     * determining what happens when page number is changed in the paginator
     */
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > this.compareZero && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }

    /**
     * determining what page size options to display given the number of items displaying in the table
     */
    updatePageSizeOptions(globalPageSizeOptions: number[]): number[] {
        const dataLength = this.datasource.data.length;
        const pageSizeOptionsLength = globalPageSizeOptions.length;

        for (let i = this.compareZero; i < pageSizeOptionsLength; i++) {
            const nextIndex = i + 1;
            if (dataLength < globalPageSizeOptions[0]) {
                return [];
            }
            if (dataLength >= globalPageSizeOptions[i] && dataLength < globalPageSizeOptions[nextIndex]) {
                return globalPageSizeOptions.slice(0, nextIndex);
            }
        }
        return globalPageSizeOptions;
    }

    /**
     * calling download report from facade (which in turn calls the API)
     */
    downloadReport(report: Document): void {
        this.subscriptions.push(this.document.downloadDocument(report).pipe(take(1)).subscribe());
    }

    /**
     * remove report
     * @param reportId indicates which report to remove
     */
    removeReport(reportId: number): void {
        this.subscriptions.push(this.document.removeDocument(reportId, this.isDirect).pipe(take(1)).subscribe());
    }

    /**
     * destroying subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
