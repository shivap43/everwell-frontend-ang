import { Component, OnInit, Input, ViewChild, ChangeDetectionStrategy } from "@angular/core";
import { RegionTypeDisplay } from "@empowered/api";
import { MatDialog } from "@angular/material/dialog";
import { MatExpansionPanel } from "@angular/material/expansion";
import { PortalsService } from "../../portals.service";
import { EditRegionTypeComponent } from "./edit-region-type/edit-region-type.component";
import { RemoveRegionTypeComponent } from "./remove-region-type/remove-region-type.component";
import { ActionType } from "../../shared/models/container-data-model";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store } from "@ngxs/store";
import { Permission } from "@empowered/constants";

@Component({
    selector: "empowered-region-type",
    templateUrl: "./region-type.component.html",
    styleUrls: ["./region-type.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegionTypeComponent implements OnInit {
    @Input() regionType: RegionTypeDisplay;
    @Input() addRegionType: boolean;
    @Input() regionTypes: RegionTypeDisplay[];
    @Input() isPrivacyOnForEnroller: boolean;
    @ViewChild(MatExpansionPanel, { static: true }) panel: MatExpansionPanel;
    panelOpenState = false;
    zeroState: boolean;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.regions.addRegionType",
        "primary.portal.regions.newRegionType",
        "primary.portal.regionType.removeToolTip",
        "primary.portal.common.remove",
        "primary.portal.common.edit",
    ]);
    permissionEnum = Permission;

    constructor(
        readonly portalsService: PortalsService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly language: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    ngOnInit(): void {
        this.zeroState = this.portalsService.zeroStateForRegions;
    }

    editRegionType(): void {
        this.panel.disabled = false;
        this.portalsService.selectedRegionType = this.regionType;
        this.portalsService.attachPortal(EditRegionTypeComponent, {
            actionType: ActionType.region_type_update,
            regionType: this.regionType,
            panel: this.panel,
            regionTypesList: this.regionTypes,
        });
    }
    openRemoveRegionTypeDialog(): void {
        this.dialog.open(RemoveRegionTypeComponent, { data: this.regionType, width: "600px", height: "auto" });
    }
    addRegionTypes(): void {
        this.panel.disabled = false;
        this.portalsService.selectedRegionType = undefined;
        this.portalsService.attachPortal(EditRegionTypeComponent, {
            actionType: ActionType.region_type_create,
            panel: this.panel,
            regionTypesList: this.regionTypes,
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
}
