import { Component, OnInit, ViewChild, AfterContentInit, Input, Output, EventEmitter } from "@angular/core";
import { AppSettings } from "@empowered/constants";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { FormControl } from "@angular/forms";
import { Subject, Subscription } from "rxjs";
import { MatTableDataSource } from "@angular/material/table";
import { PendedBusinessByLevel, PendedBusinessLevel } from "@empowered/api";
import { CompanyCode } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { PbrCommonService } from "../../pbr-common.service";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-producer-apps",
    templateUrl: "./producer-apps.component.html",
    styleUrls: ["./producer-apps.component.scss"],
})
export class ProducerAppsComponent implements OnInit, AfterContentInit {
    displayedColumns = ["writingNumber", "associateName", "totalAPPendedNewBusiness", "totalAPPendedConversion", "newBusinessIssuedToday"];
    languageStrings: Record<string, string>;
    dataSource = new MatTableDataSource<PendedBusinessByLevel>();
    pageSizeOptions: any;
    compareZero = 0;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @Input() level: string;
    @Input() data: PendedBusinessByLevel[];
    @Output() writingNumberClick: EventEmitter<PendedBusinessByLevel> = new EventEmitter<PendedBusinessByLevel>();
    pageNumberControl: FormControl = new FormControl(1);
    private readonly unsubscribe$ = new Subject<void>();
    defaultPageNumber = "1";
    pageNumber = 1;
    isSpinnerLoading: boolean;
    activeCol: string;
    selectedCompanyCode: CompanyCode;
    SearchLevel = PendedBusinessLevel;

    constructor(private readonly langService: LanguageService, private readonly pbrCommonService: PbrCommonService) {
        this.pageSizeOptions = AppSettings.pageSizeOptions;
        this.fetchLanguageData();
    }

    ngOnInit(): void {
        this.dataSource.data = this.data;
        this.pageSizeOptions = this.pbrCommonService.updatePageSizeOptions(AppSettings.pageSizeOptions, this.dataSource);
        this.dataSource.filterPredicate = this.pbrCommonService.filterPredicate;
    }
    ngAfterContentInit(): void {
        this.dataSource.paginator = this.paginator;
        // eslint-disable-next-line no-underscore-dangle
        this.paginator._changePageSize(AppSettings.pageSizeOptions[0]);
        if (this.sort && this.paginator && this.dataSource) {
            this.dataSource.sort = this.sort;
            this.dataSource.paginator = this.paginator;
            this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
            this.dataSource.sortingDataAccessor = (item, property) => {
                if (property === "associateName") {
                    const names = item.associateName.split(" ");
                    return `${names[1]}, ${names[0]}`;
                }
                return item[property];
            };
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
            "primary.portal.pendedBusiness.producerApps.header",
            "primary.portal.pendedBusiness.producerApps.writing",
            "primary.portal.common.page",
            "primary.portal.pendedBusiness.producerApps.totalAp",
            "primary.portal.pendedBusiness.producerApps.pendedConversion",
            "primary.portal.pendedBusiness.producerApps.newBusiness",
            "primary.portal.pendedBusiness.companyCode",
            "primary.portal.pendedBusiness.allPendedApps.noResults",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.pendedBusiness.producer.dsc",
            "primary.portal.pendedBusiness.producer.rsc",
            "primary.portal.reportList.paginator.of",
            "primary.portal.pendedBusiness.producerApps.producerName",
            "primary.portal.pendedBusiness.producerApps.dscName",
            "primary.portal.pendedBusiness.producerApps.rscName",
        ]);
    }
    onCompanyCodeSelectionChange(companyCode: CompanyCode): void {
        this.selectedCompanyCode = companyCode;
        this.dataSource.filter = companyCode;
    }
    getTitle(): string | undefined {
        switch (this.level) {
            case PendedBusinessLevel.PRODUCER:
                return this.languageStrings["primary.portal.pendedBusiness.producerApps.header"];
            case PendedBusinessLevel.DSC:
                return this.languageStrings["primary.portal.pendedBusiness.producer.dsc"];
            case PendedBusinessLevel.RSC:
                return this.languageStrings["primary.portal.pendedBusiness.producer.rsc"];
        }
        return undefined;
    }
    onWritingNumberClick(obj: PendedBusinessByLevel): void {
        this.writingNumberClick.emit(obj);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
