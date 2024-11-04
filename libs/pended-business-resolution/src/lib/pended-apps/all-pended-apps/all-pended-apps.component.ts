import { PbrCommonService } from "./../../pbr-common.service";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { AppSettings } from "@empowered/constants";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { PendedBusinessByType, PendedBusinessService, PendedBusinessType, AppTypeIndicator } from "@empowered/api";
import { CompanyCode, ProducerDetails } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Subject, Observable, of } from "rxjs";
import { takeUntil, catchError, switchMap, tap } from "rxjs/operators";
import { PendedApplicationsModalComponent } from "../../pended-applications-modal/pended-applications-modal.component";
import { MatDialog } from "@angular/material/dialog";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
const stringConstant = {
    PENDED: "PENDED",
};
@Component({
    selector: "empowered-all-pended-apps",
    templateUrl: "./all-pended-apps.component.html",
    styleUrls: ["./all-pended-apps.component.scss"],
})
export class AllPendedAppsComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string>;
    displayedColumns = [
        "transmittalNumber",
        "pendDate",
        "accountNumber",
        "state",
        "applicantLastName",
        "applicationNumber",
        "billForm",
        "destinationDescription",
        "lobCode",
        "coproducers",
    ];
    AppTypeIndicatorEnum = AppTypeIndicator;
    selected = "All";
    selectedCompanyCode: CompanyCode;
    dataSource = new MatTableDataSource<PendedBusinessByType>();
    pageSizeOptions: number[] = AppSettings.pageSizeOptions;
    compareZero = 0;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    pageNumberControl: FormControl = new FormControl(1);
    defaultPageNumber = "1";
    pageNumber = 1;
    activeCol: string;
    applicationTooltip;
    isSpinnerLoading = true;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly langService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly pbrCommonService: PbrCommonService,
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly dateService: DateService,
    ) {
        this.fetchLanguageData();
    }

    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.producer$
            .pipe(
                tap(() => (this.isSpinnerLoading = true)),
                switchMap((producer) =>
                    this.pendedBusinessService
                        .getPendedBusinessByType(PendedBusinessType.ALL, producer && producer.id)
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
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.pendedBusiness.allPendedApps.header",
            "primary.portal.pendedBusiness.allPendedApps.tm",
            "primary.portal.pendedBusiness.allPendedApps.pendDate",
            "primary.portal.pendedBusiness.allPendedApps.account",
            "primary.portal.pendedBusiness.allPendedApps.state",
            "primary.portal.pendedBusiness.allPendedApps.applicantName",
            "primary.portal.pendedBusiness.allPendedApps.application",
            "primary.portal.pendedBusiness.allPendedApps.billForm",
            "primary.portal.pendedBusiness.allPendedApps.destinationDesc",
            "primary.portal.pendedBusiness.allPendedApps.lobCode",
            "primary.portal.pendedBusiness.allPendedApps.coProducers",
            "primary.portal.pendedBusiness.allPendedApps.page",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
            "primary.portal.pendedBusiness.allPendedApps.applicationTooltip",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.reportList.paginator.of",
            "primary.portal.pendedBusiness.allPendedApps.invoiced",
        ]);
        this.applicationTooltip = this.languageStrings["primary.portal.pendedBusiness.allPendedApps.applicationTooltip"];
    }

    /**
     * Open pended business application details modal
     * @param applicationElement PendedBusiness object
     */
    openResolvedAppDetailModal(applicationElement: PendedBusinessByType): void {
        this.dialog.open(PendedApplicationsModalComponent, {
            width: "700px",
            data: {
                applicationType: stringConstant.PENDED,
                applicationInfo: applicationElement,
                companyCode: applicationElement.state === CompanyCode.NY ? CompanyCode.NY : CompanyCode.US,
                businessType: PendedBusinessType.ALL,
            },
        });
    }
    onCompanyCodeSelectionChange(companyCode: CompanyCode): void {
        this.selectedCompanyCode = companyCode;
        this.dataSource.filter = companyCode;
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
                    case "pendDate":
                        return this.dateService.toDate(item.pendDate);
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
