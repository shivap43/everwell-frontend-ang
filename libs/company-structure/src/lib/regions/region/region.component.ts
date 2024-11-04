import { Component, ViewChild, Input, ChangeDetectionStrategy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatExpansionPanel } from "@angular/material/expansion";
import { RegionNames, Region } from "@empowered/api";
import { RegionTypeDisplay } from "@empowered/api";
import { PortalsService } from "../../portals.service";
import { EditRegionComponent } from "./edit-region/edit-region.component";
import { RemoveRegionComponent } from "./remove-region/remove-region.component";
import { ActionType } from "../../shared/models/container-data-model";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Permission } from "@empowered/constants";

@Component({
    selector: "empowered-region",
    templateUrl: "./region.component.html",
    styleUrls: ["./region.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegionComponent {
    @ViewChild(MatExpansionPanel, { static: true }) panel: MatExpansionPanel;
    @Input() regionName: RegionNames;
    @Input() regionType: RegionTypeDisplay;
    @Input() totalNumberOfMembers: number;
    @Input() addRegion: boolean;
    @Input() regionsList: Region[];
    @Input() regionTypes: RegionTypeDisplay[];
    @Input() isPrivacyOnForEnroller: boolean;
    panelOpenState: boolean;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    removeClassErrors = {
        errHasEmployees: this.language.fetchPrimaryLanguageValue("primary.portal.region.removeToolTip"),
    };
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.remove",
        "primary.portal.common.cancel",
        "primary.portal.common.edit",
        "primary.portal.regions.addRegion",
    ]);
    permissionEnum = Permission;

    constructor(
        private readonly portalsService: PortalsService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly language: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    editRegion(): void {
        this.panel.disabled = false;
        this.portalsService.selectedRegion = this.regionName;
        this.portalsService.selectedRegionType = this.regionType;
        this.portalsService.attachPortal(EditRegionComponent, {
            actionType: ActionType.region_update,
            regionName: this.regionName,
            regionType: this.regionType,
            panel: this.panel,
            regionsList: this.regionsList,
        });
    }
    addRegions(): void {
        this.panel.disabled = false;
        this.portalsService.selectedRegion = null;
        this.portalsService.selectedRegionType = this.regionType;
        this.portalsService.attachPortal(EditRegionComponent, {
            actionType: ActionType.region_create,
            regionType: this.regionType,
            panel: this.panel,
            regionsList: this.regionsList,
        });
    }
    openRemoveRegionDialog(): void {
        this.dialog.open(RemoveRegionComponent, {
            width: "600px",
            height: "auto",
            data: { regionName: this.regionName, regionType: this.regionType },
        });
    }
    triggerPanelToggle(isOpen: boolean): void {
        const wholeSection = document.querySelector(".class-whole-section");
        const expPanels = document.querySelectorAll(".mat-expansion-panel");

        expPanels.forEach((each) => {
            if (isOpen) {
                wholeSection?.classList.add("class-whole-white");
                each.classList.add("panel-white-out");
                Array.prototype.forEach.call(each.getElementsByTagName("mat-expansion-panel-header"), (el) => {
                    el.setAttribute("tabindex", "-1");
                });
            } else {
                wholeSection?.classList.add("class-whole-white");
                each.classList.remove("panel-white-out");
                Array.prototype.forEach.call(each.getElementsByTagName("mat-expansion-panel-header"), (el) =>
                    el.removeAttribute("tabindex"),
                );
            }
        });
        this.panelOpenState = isOpen;
    }
    cancelRegion(): void {
        this.portalsService.detachPortal();
    }
    getRemoveClassError(): string {
        if (this.regionName && this.regionName.numberOfMembers > 0) {
            return this.removeClassErrors.errHasEmployees;
        }
        return null;
    }
}
