import { Component, Inject, Optional } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PortalsService } from "../../../portals.service";
import { ActionType } from "../../../shared/models/container-data-model";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store } from "@ngxs/store";

@Component({
    selector: "empowered-remove-region",
    templateUrl: "./remove-region.component.html",
    styleUrls: ["./remove-region.component.scss"],
})
export class RemoveRegionComponent {
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings: Record<string, string> = this.langService.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
    ]);

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: { regionName: any; regionType: any },
        private readonly dialogRef: MatDialogRef<RemoveRegionComponent>,
        private readonly portalsService: PortalsService,
        private readonly store: Store,
        private readonly langService: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    removeRegion(): void {
        this.portalsService.setAction({
            action: ActionType.region_remove,
            data: { regionTypeId: this.data.regionType.id, regionId: this.data.regionName.id, panel: this.dialogRef },
        });
    }
}
