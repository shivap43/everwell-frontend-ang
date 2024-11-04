import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatTabChangeEvent } from "@angular/material/tabs";
import { PendedBusinessOverview, PendedBusinessService, PendedPremium, ResolvedPremium, CompanyCodeDescription } from "@empowered/api";
import { CompanyCode, WritingNumber, ProducerDetails, Admin } from "@empowered/constants";
import { Observable, of, Subject, combineLatest } from "rxjs";
import { finalize, take, catchError, takeUntil, skipWhile } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { CurrencyPipe } from "@angular/common";
import { Select } from "@ngxs/store";
import { PendedBusinessState } from "@empowered/ngxs-store";

interface PBROverviewTableRow {
    pendedApp: string;
    us: number;
    ny: number;
    total: number;
}
interface TableColumnDef {
    def: string;
    label: string;
    cell: (row: PBROverviewTableRow) => string;
}
@Component({
    selector: "empowered-pbr-overview",
    templateUrl: "./pbr-overview.component.html",
    styleUrls: ["./pbr-overview.component.scss"],
})
export class PBROverviewComponent implements OnInit, OnDestroy {
    companyCode: CompanyCode;
    languageStrings: Record<string, string>;
    tabs: { name: string }[];
    pendedAppsOrderedKeys: any;
    resolvedAppsOrderedKeys: any;
    columnspendedApps: TableColumnDef[];
    columnsresolvedApps: TableColumnDef[];
    pendedAppsDisplayedColumns: string[];
    resolvedAppsDisplayedColumns: string[];
    resolvedAppsTransformed: PBROverviewTableRow[] = [];
    annualizedPremium: PBROverviewTableRow[] = [];
    conversionAnnualizedPremium: PBROverviewTableRow[] = [];
    pendedAppsTableSplitIndex = 2;
    selectedTabIndex = 0;
    isSpinnerLoading = false;
    zeroState: boolean;
    private readonly unsub$: Subject<void> = new Subject<void>();
    @Select(PendedBusinessState.getAdmin) admin$: Observable<Admin>;
    @Select(PendedBusinessState.getProducer) producer$: Observable<ProducerDetails>;

    constructor(
        private readonly pendedBusinessService: PendedBusinessService,
        private readonly language: LanguageService,
        private readonly currency: CurrencyPipe,
    ) {}

    ngOnInit(): void {
        combineLatest([this.admin$, this.producer$])
            .pipe(
                takeUntil(this.unsub$),
                skipWhile(([admin, producer]) => !admin && !producer),
            )
            .subscribe(([admin, producer]) => {
                // If no producer has been searched for get data for the logged-in admin.
                const user: Admin | ProducerDetails = producer || admin;
                this.companyCode = this.getAdminWritingNumber(user);
                this.fetchLanguage();
                this.initializeTableData(producer || null); // No optionalProducerId should be sent if producer is null.
            });
    }
    onSelectedTabChange(eventData: MatTabChangeEvent): void {
        this.selectedTabIndex = eventData.index;
    }
    // Transform data into this form so that it is compatible with the table.
    transformPendedApps(source: Observable<PendedBusinessOverview>): void {
        this.isSpinnerLoading = true;
        source
            .pipe(
                take(1),
                finalize(() => {
                    this.isSpinnerLoading = false;
                }),
                catchError(() => of({})),
            )
            .subscribe((overview) => {
                if (Object.keys(overview).length === 0 /* empty object*/) {
                    this.zeroState = true;
                } else {
                    this.zeroState = false;
                    this.conversionAnnualizedPremium = [];
                    this.annualizedPremium = [];
                    this.resolvedAppsTransformed = [];
                    this.getTableRows(overview as PendedBusinessOverview);
                }
            });
    }
    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.pbr.overview.pendedApps.pendedNewBusiness",
            "primary.portal.pbr.overview.pendedApps.issuedToday",
            "primary.portal.pbr.overview.pendedApps.newlyTransmitted",
            "primary.portal.pbr.overview.pendedApps.pendedConversions",
            "primary.portal.pbr.overview.pendedApps.delayBillConversions",
            "primary.portal.pbr.overview.resolvedApps.issuedToday",
            "primary.portal.pbr.overview.resolvedApps.issuedyesterday",
            "primary.portal.pbr.overview.resolvedApps.withdrawn",
            "primary.portal.pbr.overview.resolvedApps.closed",
            "primary.portal.pbr.overview.resolvedApps.declined",
            "primary.portal.pbr.overview.resolvedApps.postponed",
            "primary.portal.pbr.overview.resolvedApps.notTaken",
            "primary.portal.pbr.overview.table.columns.us",
            "primary.portal.pbr.overview.table.columns.ny",
            "primary.portal.pbr.overview.table.columns.total",
            "primary.portal.pbr.overview.pendedApps",
            "primary.portal.pbr.overview.annualizedPremium",
            "primary.portal.pbr.overview.conversionAnnualizedPremium",
            "primary.portal.pbr.overview.resolvedApps",
            "primary.portal.pbr.overview.pendedBusiness",
            "primary.portal.pendedBusiness.uploadApplication",
            "primary.portal.pendedBusiness.zeroState",
            "primary.portal.pendedBusiness.resolved.zeroState",
        ]);
    }
    getAdminWritingNumber(producerDetails: Admin | ProducerDetails): CompanyCode {
        const writingNumbers = producerDetails.writingNumbers;
        return this.findWritingNumberFromCompanyCode(writingNumbers, CompanyCode.US)
            ? this.findWritingNumberFromCompanyCode(writingNumbers, CompanyCode.NY)
                ? CompanyCode.ALL
                : CompanyCode.US
            : this.findWritingNumberFromCompanyCode(writingNumbers, CompanyCode.NY)
                ? CompanyCode.NY
                : CompanyCode.ALL;
    }
    findWritingNumberFromCompanyCode(writingNumbers: WritingNumber[], companyCode: CompanyCode): boolean {
        return Boolean(
            Array.prototype.concat
                .apply(
                    [],
                    writingNumbers.map((writingNumber) => writingNumber.sitCodes),
                )
                .find((sitCode) => sitCode.companyCode === companyCode),
        );
    }
    initializeTableData(producer: Admin | ProducerDetails): void {
        const getCellValue: (row: PBROverviewTableRow, companyCode: string) => string = (row, companyCode) =>
            row[companyCode] || row[companyCode] === 0 ? this.currency.transform(row[companyCode].toString()) : "";
        this.tabs = [
            {
                name: this.languageStrings["primary.portal.pbr.overview.pendedApps"],
            },
            {
                name: this.languageStrings["primary.portal.pbr.overview.resolvedApps"],
            },
        ];
        this.pendedAppsOrderedKeys = {
            pendedNewBusiness: this.languageStrings["primary.portal.pbr.overview.pendedApps.pendedNewBusiness"],
            issuedToday: this.languageStrings["primary.portal.pbr.overview.pendedApps.issuedToday"],
            newlyTransmitted: this.languageStrings["primary.portal.pbr.overview.pendedApps.newlyTransmitted"],
            pendedConversions: this.languageStrings["primary.portal.pbr.overview.pendedApps.pendedConversions"],
            delayBillConversions: this.languageStrings["primary.portal.pbr.overview.pendedApps.delayBillConversions"],
        };
        this.resolvedAppsOrderedKeys = {
            issuedToday: this.languageStrings["primary.portal.pbr.overview.resolvedApps.issuedToday"],
            issuedYesterday: this.languageStrings["primary.portal.pbr.overview.resolvedApps.issuedyesterday"],
            withdrawn: this.languageStrings["primary.portal.pbr.overview.resolvedApps.withdrawn"],
            closed: this.languageStrings["primary.portal.pbr.overview.resolvedApps.closed"],
            declined: this.languageStrings["primary.portal.pbr.overview.resolvedApps.declined"],
            postponed: this.languageStrings["primary.portal.pbr.overview.resolvedApps.postponed"],
            notTaken: this.languageStrings["primary.portal.pbr.overview.resolvedApps.notTaken"],
        };
        this.columnspendedApps = this.filterColumnsOnCompanyCode([
            {
                def: "pendedApp",
                label: this.languageStrings["primary.portal.pbr.overview.pendedApps"],
                cell: (row: PBROverviewTableRow) => this.pendedAppsOrderedKeys[row.pendedApp],
            },
            {
                def: "us",
                label: this.languageStrings["primary.portal.pbr.overview.table.columns.us"],
                cell: (row: PBROverviewTableRow) => getCellValue(row, "us"),
            },
            {
                def: "ny",
                label: this.languageStrings["primary.portal.pbr.overview.table.columns.ny"],
                cell: (row: PBROverviewTableRow) => getCellValue(row, "ny"),
            },
            {
                def: "total",
                label: this.languageStrings["primary.portal.pbr.overview.table.columns.total"],
                cell: (row: PBROverviewTableRow) => getCellValue(row, "total"),
            },
        ]);
        this.columnsresolvedApps = this.filterColumnsOnCompanyCode([
            {
                def: "pendedApp",
                label: this.languageStrings["primary.portal.pbr.overview.resolvedApps"],
                cell: (row: PBROverviewTableRow) => this.resolvedAppsOrderedKeys[row.pendedApp],
            },
            {
                def: "us",
                label: this.languageStrings["primary.portal.pbr.overview.table.columns.us"],
                cell: (row: PBROverviewTableRow) => getCellValue(row, "us"),
            },
            {
                def: "ny",
                label: this.languageStrings["primary.portal.pbr.overview.table.columns.ny"],
                cell: (row: PBROverviewTableRow) => getCellValue(row, "ny"),
            },
            {
                def: "total",
                label: this.languageStrings["primary.portal.pbr.overview.table.columns.total"],
                cell: (row: PBROverviewTableRow) => getCellValue(row, "total"),
            },
        ]);
        this.pendedAppsDisplayedColumns = this.columnspendedApps.map((column) => column.def);
        this.resolvedAppsDisplayedColumns = this.columnsresolvedApps.map((column) => column.def);
        this.transformPendedApps(this.pendedBusinessService.getPendedBusinessOverview(producer && producer.id));
    }
    filterColumnsOnCompanyCode(columns: TableColumnDef[]): TableColumnDef[] {
        return columns.filter(
            (col) =>
                (this.companyCode === CompanyCode.ALL ? col : this.companyCode && this.companyCode.toLowerCase() === col.def) ||
                col.def === "pendedApp",
        );
    }
    /**
     * Extracts info from PendedBusinessOverview and populates all three tables with data in the table format
     * @param overview PendedBusinessOverview object
     */
    getTableRows(overview: PendedBusinessOverview): void {
        const premiumKeys: string[] = Object.keys(overview);
        premiumKeys.forEach((premiumKey, premiumKeyIndex) => {
            const rowPropertyHeadingMap = premiumKeyIndex === 0 ? this.pendedAppsOrderedKeys : this.resolvedAppsOrderedKeys;
            Object.keys(rowPropertyHeadingMap).forEach((rowProperty, rowPropertyIndex) => {
                const getPremiumCellValue = (company) => {
                    const premium = (overview[premiumKey] as Array<PendedPremium | ResolvedPremium>).find(
                        (premiumObj) => premiumObj.company === company,
                    );
                    return premium ? +premium[rowProperty] : 0;
                };
                const us = getPremiumCellValue(CompanyCodeDescription.US);
                const ny = getPremiumCellValue(CompanyCodeDescription.NY);
                const premiumObject = {
                    pendedApp: rowProperty,

                    us,
                    ny,
                    total: us + ny,
                };
                if (premiumKeyIndex === 0) {
                    if (rowPropertyIndex > this.pendedAppsTableSplitIndex) {
                        this.conversionAnnualizedPremium.push(premiumObject);
                    } else {
                        this.annualizedPremium.push(premiumObject);
                    }
                } else {
                    this.resolvedAppsTransformed.push(premiumObject);
                }
            });
        });
    }
    ngOnDestroy(): void {
        this.unsub$.next();
    }
}
