import { Component, Inject, Optional } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PortalsService } from "./../../../portals.service";
import { ActionType } from "../../../shared/models/container-data-model";
import { LanguageModel } from "@empowered/api";
import { Store } from "@ngxs/store";
import { LanguageService, LanguageState } from "@empowered/language";

@Component({
    selector: "empowered-remove-region-type",
    templateUrl: "./remove-region-type.component.html",
    styleUrls: ["./remove-region-type.component.scss"],
})
export class RemoveRegionTypeComponent {
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
    ]);

    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly dialogRef: MatDialogRef<RemoveRegionTypeComponent>,
        private readonly portalsService: PortalsService,
        private readonly store: Store,
        private readonly language: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    removeRegionType(): void {
        this.portalsService.selectedRegionType = this.data;
        this.portalsService.setAction({
            action: ActionType.region_type_remove,
            data: { regionTypeId: this.data.id, panel: this.dialogRef },
        });
    }

    replaceUnderscore(method: string): string {
        method = method.replace(/_/g, "-");
        return method;
    }
}
