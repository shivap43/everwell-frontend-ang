import { Component, ViewChild, AfterViewInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Location } from "@angular/common";
import { ConfigName, InstalledOS } from "@empowered/constants";
import { MatTabGroup } from "@angular/material/tabs";
import { combineLatest, Subject } from "rxjs";
import { takeUntil, tap } from "rxjs/operators";
import { AppTakerService } from "@empowered/api";
import { SharedService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";
/**
 * Download unplugged component used to provide software and documentation
 * @param unpluggedLink is of type string use to provide software and documentation link
 */

const OS_WINDOWS = "Windows";
const OS_MACOS = "Mac";
const STEP_1 = 0;
const STEP_2 = 1;
const OS_DETECTION = window.navigator.appVersion;
@Component({
    selector: "empowered-download-unplugged",
    templateUrl: "./download-unplugged.component.html",
    styleUrls: ["./download-unplugged.component.scss"],
})
export class DownloadUnpluggedComponent implements AfterViewInit, OnDestroy {
    @ViewChild("operatingSystemTab") matTab: MatTabGroup;
    private readonly unsubscribe$ = new Subject<void>();
    detectedOS: string = OS_WINDOWS;
    showMacDownload = true;
    selectedIndex: number = STEP_1;
    installedOS = InstalledOS;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.requestSupport.pageHeader",
        "primary.portal.common.back",
        "primary.portal.downloadUnplugged.softwareDocumentation",
        "primary.portal.downloadUnplugged.everwellUnplugged",
        "primary.portal.downloadUnplugged.downloadEverwell",
        "primary.portal.downloadUnplugged.downloadUnpluggedForMac",
        "primary.portal.downloadUnplugged.downloadUnpluggedForWindows",
        "primary.portal.operatingSystem.windows",
        "primary.portal.operatingSystem.macOS",
        "primary.portal.downloadUnplugged.everwellUnpluggedMac",
        "primary.portal.downloadUnpluggedMac.downloadEverwell",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly location: Location,
        private readonly sharedService: SharedService,
        private readonly staticUtilService: StaticUtilService,
        private readonly appTakerService: AppTakerService,
    ) {}

    ngAfterViewInit(): void {
        this.showMacDownload = this.sharedService.macTabConfig;
        this.getConfigurationSpecifications();
    }

    /**
     * downloads unplugged build based on the installed OS
     * @param installedOS installed OS
     */
    downloadUnplugged(installedOS: InstalledOS): void {
        this.appTakerService
            .getUnpluggedDownloadURL(installedOS)
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((downloadUrl) => {
                    const downloadAnchor = document.createElement("a");
                    downloadAnchor.href = downloadUrl;
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                }),
            )
            .subscribe();
    }
    /**
     * This function gets the config values from the service.
     */
    getConfigurationSpecifications(): void {
        combineLatest([
            this.staticUtilService.cacheConfigEnabled(ConfigName.GENERAL_UNPLUGGED_INSTALLATION_WINDOWS_MAC_DOWNLOAD),
            this.staticUtilService.cacheConfigEnabled(ConfigName.GENERAL_UNPLUGGED_TRAINING_RESOURCE_DOWNLOAD),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([macTab, trainingResourceConfig]) => {
                this.showMacDownload = macTab;
                this.sharedService.setConfig(trainingResourceConfig, this.showMacDownload);
                this.getOperatingSystem();
            });
    }

    /**
     * This function detects the operating System of the User
     */
    getOperatingSystem(): void {
        if (this.showMacDownload) {
            if (OS_DETECTION.indexOf(OS_WINDOWS) >= 0) {
                this.detectedOS = OS_WINDOWS;
                this.selectedIndex = STEP_1;
            } else if (OS_DETECTION.indexOf(OS_MACOS) >= 0) {
                this.detectedOS = OS_MACOS;
                this.selectedIndex = STEP_2;
            } else {
                this.selectedIndex = STEP_1;
            }
        }
    }

    backClick(): void {
        this.location.back();
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
