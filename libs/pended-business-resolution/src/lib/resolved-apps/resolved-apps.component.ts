import { PbrCommonService } from "./../pbr-common.service";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { AppSettings } from "@empowered/constants";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { PendedBusinessService, PendedBusinessByType, PendedBusinessType, AppTypeIndicator } from "@empowered/api";
import { CompanyCode, ProducerDetails } from "@empowered/constants";
import { MatDialog } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { PendedApplicationsModalComponent } from "../pended-applications-modal/pended-applications-modal.component";
import { Observable, of, Subject, Subscription } from "rxjs";
import { take, finalize, catchError, takeUntil, switchMap, tap } from "rxjs/operators";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const stringConstant = {
    RESOLVED: "RESOLVED",
};

@Component({
    selector: "empowered-resolved-apps",
    templateUrl: "./resolved-apps.component.html",
    styleUrls: ["./resolved-apps.component.scss"],
})
export class ResolvedAppsComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    displayedColumns = [
        "transmittalNumber",
        "processedDate",
        "accountNumber",
        "state",
        "applicantLastName",
        "applicationNumber",
        "status",
        "deskCode",
        "coproducers",
    ];
    dataSource = new MatTableDataSource<PendedBusinessByType>();
    pageSizeOptions: number[] = AppSettings.pageSizeOptions;
    compareZero = 0;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    pageNumberControl: FormControl = new FormControl(1);
    pageEventSubscription: Subscription;
    defaultPageNumber = "1";
    pageNumber = 1;
    activeCol: string;
    companyCodeCtrl: FormControl;
    companyCodes: { name: string; value: string }[];
    selectedCompanyCode: CompanyCode;
    isSpinnerLoading: boolean;
    AppTypeIndicatorEnum = AppTypeIndicator;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly langService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly pbrCommonService: PbrCommonService,
        private readonly dateService: DateService,
    ) {
        this.pageSizeOptions = [10];
        this.fetchLanguageData();
    }

    ngOnInit(): void {
        this.producer$
            .pipe(
                tap(() => (this.isSpinnerLoading = true)),
                switchMap((producer) =>
                    this.pendedBusinessService
                        .getPendedBusinessByType(PendedBusinessType.RESOLVED, producer && producer.id)
                        .pipe(catchError((error) => of([]))),
                ),

                takeUntil(this.unsub$),
            )
            .subscribe((data) => {
                this.isSpinnerLoading = false;
                this.dataSource.data = data;
                this.initTable();
            });
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
    sortData(event: any): void {
        this.activeCol = event.active;
    }
    showWarningHexagon(penDate: Date): boolean {
        return this.pbrCommonService.showWarningHexagon(penDate);
    }

    /**
     * Open pended business application details modal
     * @param applicationElement PendedBusiness object
     */
    openResolvedAppDetailModal(applicationElement: PendedBusinessByType): void {
        this.dialog.open(PendedApplicationsModalComponent, {
            width: "700px",
            data: {
                applicationType: stringConstant.RESOLVED,
                applicationInfo: applicationElement,
                companyCode: applicationElement.state === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US,
                businessType: PendedBusinessType.RESOLVED,
            },
        });
    }

    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.pendedBusiness.resolvedApps.header",
            "primary.portal.common.page",
            "primary.portal.pendedBusiness.resolvedApps.header2",
            "primary.portal.pendedBusiness.resolvedApps.tm",
            "primary.portal.pendedBusiness.resolvedApps.processedDate",
            "primary.portal.pendedBusiness.resolvedApps.account",
            "primary.portal.pendedBusiness.resolvedApps.state",
            "primary.portal.pendedBusiness.resolvedApps.applicantName",
            "primary.portal.pendedBusiness.resolvedApps.application",
            "primary.portal.pendedBusiness.resolvedApps.status",
            "primary.portal.pendedBusiness.resolvedApps.deskCode",
            "primary.portal.pendedBusiness.resolvedApps.coProducers",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
            "primary.portal.reportList.paginator.of",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.pendedBusiness.resolved.zeroState",
            "primary.portal.pendedBusiness.allPendedApps.invoiced",
        ]);
    }
    onCompanyCodeSelectionChange(companyCode: CompanyCode): void {
        this.selectedCompanyCode = companyCode;
        this.dataSource.filter = companyCode;
    }
    callApi(endPoint: Observable<any>): Observable<any> {
        this.isSpinnerLoading = true;
        return endPoint.pipe(
            take(1),
            finalize(() => (this.isSpinnerLoading = false)),
            catchError((error) => of([])),
        );
    }
    initTable(): void {
        this.pageSizeOptions = this.pbrCommonService.updatePageSizeOptions(AppSettings.pageSizeOptions, this.dataSource);
        this.dataSource.filterPredicate = this.pbrCommonService.filterPredicate;
        this.dataSource.paginator = this.paginator;
        // eslint-disable-next-line no-underscore-dangle
        this.paginator._changePageSize(AppSettings.pageSizeOptions[0]);
        if (this.sort && this.paginator && this.dataSource) {
            this.dataSource.sort = this.sort;
            this.dataSource.sortingDataAccessor = (item, property) => {
                switch (property) {
                    case "applicantLastName":
                        return `${item.applicantLastName}, ${item.applicantFirstName}`;
                    case "processedDate":
                        return this.dateService.toDate(item.processedDate);
                    default:
                        return item[property];
                }
            };
            this.dataSource.paginator = this.paginator;
            this.paginator.page.pipe(takeUntil(this.unsub$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
        }
    }
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
