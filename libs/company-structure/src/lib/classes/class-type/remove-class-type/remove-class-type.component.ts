import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Component, OnInit, Inject, Optional } from "@angular/core";
import { ClassTypeDisplay } from "@empowered/api";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store } from "@ngxs/store";
import { PortalsService } from "./../../../portals.service";
import { ActionType } from "../../../shared/models/container-data-model";

@Component({
    selector: "empowered-remove-class-type",
    templateUrl: "./remove-class-type.component.html",
    styleUrls: ["./remove-class-type.component.scss"],
})
export class RemoveClassTypeComponent implements OnInit {
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    disableSubmit = false;
    languageStrings: Record<string, string>;
    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: ClassTypeDisplay,
        private readonly dialogRef: MatDialogRef<RemoveClassTypeComponent>,
        private readonly portalsService: PortalsService,
        private readonly store: Store,
        private readonly language: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    ngOnInit(): void {
        this.fetchLanguage();
    }

    removeClassType(): void {
        // FIXME - Using this until spinner is fixed to disallow clicking button more than once.
        this.disableSubmit = true;
        this.portalsService.selectedClassType = this.data;
        this.portalsService.setAction({
            action: ActionType.class_type_remove,
            data: { classTypeId: this.data.id, panel: this.dialogRef },
        });
    }
    closeDialog(): void {
        this.dialogRef.close();
    }
    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.common.remove", "primary.portal.common.cancel"]);
    }
}
