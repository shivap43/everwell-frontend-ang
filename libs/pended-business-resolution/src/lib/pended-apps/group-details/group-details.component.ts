import { Component, OnInit, ViewChild, AfterContentInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { PendedBusinessByType, AppTypeIndicator, PendedBusinessType } from "@empowered/api";
import { CompanyCode } from "@empowered/constants";
import { FormControl } from "@angular/forms";
import { Subscription, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { AppSettings } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { PbrCommonService } from "../../pbr-common.service";
import { PendedApplicationsModalComponent } from "../../pended-applications-modal/pended-applications-modal.component";
import { DateService } from "@empowered/date";

const stringConstant = {
    PENDED: "PENDED",
};

@Component({
    selector: "empowered-group-details",
    templateUrl: "./group-details.component.html",
    styleUrls: ["./group-details.component.scss"],
})
export class GroupDetailsComponent implements OnInit, AfterContentInit, OnDestroy {
    languageStrings: Record<string, string>;
    displayedColumns = [
        "transmittalNumber",
        "pendDate",
        "applicantLastName",
        "applicationNumber",
        "destinationDescription",
        "lobCode",
        "coproducers",
    ];
    pageSizeOptions: any;
    dataSource = new MatTableDataSource<PendedBusinessByType>();
    compareZero = 0;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @Input() accountNumber: string;
    @Input() data: PendedBusinessByType[];
    @Input() accountName: string;
    @Output() applicationNumberClick: EventEmitter<string> = new EventEmitter<string>();
    selectedCompanyCode: CompanyCode;
    pageNumberControl: FormControl = new FormControl(1);
    pageEventSubscription: Subscription;
    defaultPageNumber = "1";
    pageNumber = 1;
    activeCol: string;
    isSpinnerLoading: boolean;
    companyCodeCtrl: FormControl;
    private unsub$: Subject<void> = new Subject<void>();
    companyCodes: { name: string; value: string }[];
    applicationTooltip;
    AppTypeIndicatorEnum = AppTypeIndicator;

    constructor(
        private readonly langService: LanguageService,
        private readonly pbrCommonService: PbrCommonService,
        private readonly dialog: MatDialog,
        private readonly dateService: DateService,
    ) {
        this.pageSizeOptions = [10];
        this.fetchLanguageData();
    }

    ngOnInit(): void {
        this.dataSource.data = this.data;
        this.pageSizeOptions = this.pbrCommonService.updatePageSizeOptions(AppSettings.pageSizeOptions, this.dataSource);
    }

    ngAfterContentInit(): void {
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
            this.pageEventSubscription = this.paginator.page.pipe(takeUntil(this.unsub$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
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
    sortData(event: any): void {
        this.activeCol = event.active;
    }
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.common.page",
            "primary.portal.administrators.all",
            "primary.portal.pbr.overview.table.columns.us",
            "primary.portal.pbr.overview.table.columns.ny",
            "primary.portal.pendedBusiness.companyCode",
            "primary.portal.common.select",
            "primary.portal.pendedBusiness.allPendedApps.account",
            "primary.portal.shoppingExperience.backTo",
            "primary.portal.pendedBusiness.allPendedApps.tm",
            "primary.portal.pendedBusiness.allPendedApps.pendDate",
            "primary.portal.pendedBusiness.allPendedApps.applicantName",
            "primary.portal.pendedBusiness.allPendedApps.application",
            "primary.portal.pendedBusiness.allPendedApps.destinationDesc",
            "primary.portal.pendedBusiness.allPendedApps.lobCode",
            "primary.portal.pendedBusiness.allPendedApps.coProducers",
            "primary.portal.pendedBusiness.accountApps.header",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
            "primary.portal.reportList.paginator.of",
            "primary.portal.pendedBusiness.allPendedApps.invoiced",
            "primary.portal.pendedBusiness.allPendedApps.applicationTooltip",
        ]);
        this.applicationTooltip = this.languageStrings["primary.portal.pendedBusiness.allPendedApps.applicationTooltip"];
    }
    onApplicationNumberClicked(applicationElement: PendedBusinessByType): void {
        const applicationNumber = applicationElement.applicationNumber;
        this.applicationNumberClick.emit(applicationNumber);
        this.openPendedAppDetailModal(applicationElement);
    }
    onCompanyCodeSelectionChange(companyCode: CompanyCode): void {
        this.selectedCompanyCode = companyCode;
        this.dataSource.filter = companyCode;
    }

    /**
     * Open pended business application details modal
     * @param applicationElement PendedBusiness object
     */
    openPendedAppDetailModal(applicationElement: PendedBusinessByType): void {
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
    showWarningHexagon(penDate: Date): boolean {
        return this.pbrCommonService.showWarningHexagon(penDate);
    }
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
