import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { combineLatest, Subject } from "rxjs";
import { ConfigName } from "@empowered/constants";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { SharedService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";

/**
 * Training Resources component is used to provide users process guide to user who have permission to access
 * @param userAccessGuideUrl is observable of type string used to get user access guide url
 */

export interface TrainingResource {
    resource: string;
    description: string;
    updatedDate: string;
    link: string;
}

@Component({
    selector: "empowered-training-resources",
    templateUrl: "./training-resources.component.html",
    styleUrls: ["./training-resources.component.scss"],
})
export class TrainingResourcesComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$ = new Subject<void>();
    trainingResourceConfig = true;
    dataSource = new MatTableDataSource<TrainingResource>();
    resourceList: TrainingResource[];
    columnsToDisplay: string[];
    activeCol: string;

    @ViewChild(MatSort) sort: MatSort;
    userAccessGuideUrl: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.support.userProcessGuide.info",
        "primary.portal.support.userProcessGuide.header",
        "primary.portal.unplugged.processDescription",
        "primary.portal.unplugged.processGuide",
    ]);

    constructor(
        private readonly staticUtilService: StaticUtilService,
        private readonly language: LanguageService,
        private readonly sharedService: SharedService,
    ) {}

    ngOnInit(): void {
        this.trainingResourceConfig = this.sharedService.trainingConfig;
        this.columnsToDisplay = ["resource", "description", "updatedDate", "link"];
        this.resourceList = [
            {
                resource: this.languageStrings["primary.portal.support.userProcessGuide.header"],
                description: this.languageStrings["primary.portal.support.userProcessGuide.info"],
                updatedDate: "",
                link: "",
            },
            {
                resource: this.languageStrings["primary.portal.unplugged.processGuide"],
                description: this.languageStrings["primary.portal.unplugged.processDescription"],
                updatedDate: "",
                link: "",
            },
        ];
        this.dataSource.data = this.resourceList;
        this.getConfigurationSpecifications();
    }

    /**
     * This functions gets all the config values, and converts few responses to relatable string values.
     */
    getConfigurationSpecifications(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.GENERAL_UNPLUGGED_TRAINING_RESOURCE_DOWNLOAD),
            this.staticUtilService.cacheConfigValue(ConfigName.GENERAL_UNPLUGGED_GUIDE_UNPLUGGED_LINK),
            this.staticUtilService.cacheConfigValue(ConfigName.GENERAL_FEATURE_USER_PROCESS_GUIDE),
            this.staticUtilService.cacheConfigEnabled(ConfigName.GENERAL_UNPLUGGED_INSTALLATION_WINDOWS_MAC_DOWNLOAD),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([config, unpluggedLink, trainingLink, macTab]) => {
                this.trainingResourceConfig = config;
                /**
                 * Taking the string map responses from config and manipulating them to get the desired  string values.
                 */
                const trainingConfigValue = trainingLink.split(",");
                const unpluggedConfigValue = unpluggedLink.split(",");
                this.userAccessGuideUrl = trainingConfigValue[0].substring(trainingConfigValue[0].indexOf("=") + 1);
                this.resourceList[0].link = this.userAccessGuideUrl;
                this.resourceList[0].updatedDate = trainingConfigValue[1].substring(trainingConfigValue[1].indexOf("=") + 1);
                this.resourceList[1].link = unpluggedConfigValue[0].substring(unpluggedConfigValue[0].indexOf("=") + 1);
                this.resourceList[1].updatedDate = unpluggedConfigValue[1].substring(unpluggedConfigValue[1].indexOf("=") + 1);
                this.sharedService.setConfig(this.trainingResourceConfig, macTab);
            });
    }

    /**
     * This functions sorts the table data.
     */
    sortData(event: MatSort): void {
        this.activeCol = event.active;
        this.dataSource.sort = this.sort;
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
