import { PbrCommonService } from "./../pbr-common.service";
import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { PendedBusinessService, PendedBusinessByType, PendedBusinessType, AppTypeIndicator } from "@empowered/api";
import { CompanyCode, ProducerDetails, AppSettings } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { Observable, of, Subject, Subscription } from "rxjs";
import { catchError, takeUntil, switchMap, tap } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { PendedApplicationsModalComponent } from "../pended-applications-modal/pended-applications-modal.component";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const stringConstant = {
    PENDED: "PENDED",
    RESOLVED: "RESOLVED",
};
@Component({
    selector: "empowered-newly-transmitted-apps",
    templateUrl: "./newly-transmitted-apps.component.html",
    styleUrls: ["./newly-transmitted-apps.component.scss"],
})
export class NewlyTransmittedAppsComponent implements OnInit, OnDestroy {
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
    selectedCompanyCode: CompanyCode;
    isSpinnerLoading: boolean;
    applicationTooltip;
    AppTypeIndicatorEnum = AppTypeIndicator;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly langService: LanguageService,
        private readonly pbrCommonService: PbrCommonService,
        private readonly dialog: MatDialog,
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
                        .getPendedBusinessByType(PendedBusinessType.NEWLY_TRANSMITTED, producer && producer.id)
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
            "primary.portal.pendedBusiness.newlyTransmittedApps.header",
            "primary.portal.common.page",
            "primary.portal.pendedBusiness.newlyTransmittedApps.header2",
            "primary.portal.pendedBusiness.newlyTransmittedApps.tm",
            "primary.portal.pendedBusiness.newlyTransmittedApps.pendDate",
            "primary.portal.pendedBusiness.newlyTransmittedApps.group",
            "primary.portal.pendedBusiness.newlyTransmittedApps.state",
            "primary.portal.pendedBusiness.newlyTransmittedApps.applicantName",
            "primary.portal.pendedBusiness.newlyTransmittedApps.application",
            "primary.portal.pendedBusiness.newlyTransmittedApps.billform",
            "primary.portal.pendedBusiness.newlyTransmittedApps.destinationDesc",
            "primary.portal.pendedBusiness.newlyTransmittedApps.lobCode",
            "primary.portal.pendedBusiness.newlyTransmittedApps.coProducers",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
            "primary.portal.reportList.paginator.of",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.pendedBusiness.allPendedApps.applicationTooltip",
            "primary.portal.pendedBusiness.allPendedApps.invoiced",
        ]);
        this.applicationTooltip = this.languageStrings["primary.portal.pendedBusiness.allPendedApps.applicationTooltip"];
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
                businessType: PendedBusinessType.NEWLY_TRANSMITTED,
            },
        });
    }

    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
