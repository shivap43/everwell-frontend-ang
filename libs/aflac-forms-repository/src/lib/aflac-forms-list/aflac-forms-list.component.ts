import { Component, OnInit, ViewChild, Input, OnChanges, AfterViewInit } from "@angular/core";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { AppSettings } from "@empowered/constants";
import { FormControl } from "@angular/forms";
import { Subscription } from "rxjs";
import { FormsRepository } from "@empowered/api";
import { EmpoweredPaginatorComponent } from "@empowered/ui";

@Component({
    selector: "empowered-aflac-forms-list",
    templateUrl: "./aflac-forms-list.component.html",
    styleUrls: ["./aflac-forms-list.component.scss"],
})
export class AflacFormsListComponent implements OnInit, OnChanges, AfterViewInit {
    @Input() formsList: FormsRepository[];
    @ViewChild(MatSort, { static: true }) sort: MatSort;
    @ViewChild(EmpoweredPaginatorComponent, { static: true }) matPaginator: EmpoweredPaginatorComponent;
    pageNumberControl: FormControl = new FormControl(1);
    displayedColumns: string[] = ["name", "channelName", "formNumber", "action"];
    dataSource = new MatTableDataSource<FormsRepository>();
    pageSizeOption: number[];
    pageEventSubscription: Subscription;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.formRepository.formName",
        "primary.portal.formRepository.action",
        "primary.portal.formRepository.accessForm",
        "primary.portal.subproducerList.showing",
        "primary.portal.subproducerList.results",
        "primary.portal.accountEnrollments.sentUnsentBusiness.columnCommissionSplit",
        "primary.portal.formRepository.formNumber",
        "primary.portal.commission.producer.showingItems",
        "primary.portal.common.page",
        "primary.portal.common.of",
        "primary.portal.formRepository.channel",
    ]);
    constructor(private readonly language: LanguageService) {
        this.pageSizeOption = AppSettings.pageSizeOptions;
    }
    /**
     * In this ngOnInit life cycle hook we will set the data for table and paginator subscribtion will be binded to page number control
     */
    ngOnInit(): void {
        this.dataSource.data = this.formsList;
    }
    /**
     * This is a life cycle hook called after view init used to initialize sort to data source
     */
    ngAfterViewInit(): void {
        this.dataSource.sort = this.sort;
    }
    /**
     * In this ngOnChanges life cycle hook we will update the data of data table with formsList input
     */
    ngOnChanges(): void {
        this.dataSource.data = this.formsList;
        this.dataSource.paginator = this.matPaginator;
        if (this.dataSource.sort) {
            this.dataSource.sort.sort({
                id: "name",
                start: "asc",
                disableClear: true,
            });
        }
    }
    /**
     * this function will open the url passed in the param in new tab
     * @param url to be opened in the new tab
     */
    goToLink(url: string): void {
        window.open(url, "_blank");
    }
}
