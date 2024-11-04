import { PbrCommonService } from "./../../pbr-common.service";
import { Component, OnInit, ViewChild, AfterContentInit, OnDestroy, Input, Output, EventEmitter } from "@angular/core";
import { AppSettings } from "@empowered/constants";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl } from "@angular/forms";
import { MatTableDataSource } from "@angular/material/table";
import { PendedBusinessAccount } from "@empowered/api";
import { CompanyCode } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { Subject, Subscription } from "rxjs";

@Component({
    selector: "empowered-account-apps",
    templateUrl: "./account-apps.component.html",
    styleUrls: ["./account-apps.component.scss"],
})
export class AccountAppsComponent implements OnInit, AfterContentInit, OnDestroy {
    languageStrings: Record<string, string>;
    displayedColumns = ["accountNumber", "accountName", "accountStatus", "billingMode", "phoneNumber", "state", "annualPremiumPended"];
    pageSizeOptions: any;
    dataSource = new MatTableDataSource<PendedBusinessAccount>();
    compareZero = 0;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    pageNumberControl: FormControl = new FormControl(1);
    @Input() data: PendedBusinessAccount[] = [];
    @Input() headerTitle: PendedBusinessAccount[] = [];
    @Output() accountNumberClick: EventEmitter<PendedBusinessAccount> = new EventEmitter<PendedBusinessAccount>();
    pageEventSubscription: Subscription;
    defaultPageNumber = "1";
    pageNumber = 1;
    activeCol: string;
    isSpinnerLoading: boolean;
    private unsub$: Subject<void> = new Subject<void>();
    selectedCompanyCode: CompanyCode;
    country = AppSettings.COUNTRY_US;

    constructor(private readonly langService: LanguageService, private readonly pbrCommonService: PbrCommonService) {
        this.pageSizeOptions = [10];
        this.fetchLanguageData();
    }

    ngOnInit(): void {
        this.dataSource.data = this.data;
        this.pageSizeOptions = this.pbrCommonService.updatePageSizeOptions(AppSettings.pageSizeOptions, this.dataSource);
    }

    ngAfterContentInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.filterPredicate = this.pbrCommonService.filterPredicate;
        // TODO : REMOVE PRIVATE METHOD
        // eslint-disable-next-line no-underscore-dangle
        this.paginator._changePageSize(AppSettings.pageSizeOptions[0]);
        if (this.sort && this.paginator && this.dataSource) {
            this.dataSource.sort = this.sort;
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
            "primary.portal.pendedBusiness.accountApps.header",
            "primary.portal.pendedBusiness.accountApps.account",
            "primary.portal.pendedBusiness.accountApps.accountName",
            "primary.portal.pendedBusiness.accountApps.accountStatus",
            "primary.portal.pendedBusiness.accountApps.billMode",
            "primary.portal.pendedBusiness.accountApps.phone",
            "primary.portal.pendedBusiness.accountApps.state",
            "primary.portal.pendedBusiness.accountApps.apPended",
            "primary.portal.common.page",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.reportList.paginator.of",
        ]);
    }
    onAccountNumberClick(account: PendedBusinessAccount): void {
        this.accountNumberClick.emit(account);
    }
    onCompanyCodeSelectionChange(companyCode: CompanyCode): void {
        this.selectedCompanyCode = companyCode;
        this.dataSource.filter = companyCode;
    }
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
