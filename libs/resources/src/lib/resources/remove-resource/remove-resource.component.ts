import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { BenefitResourceListComponent } from "../benefit-resource-list/benefit-resource-list.component";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-remove-resource",
    templateUrl: "./remove-resource.component.html",
    styleUrls: ["./remove-resource.component.scss"],
})
export class RemoveResourceComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
        "primary.portal.resources.removeResource",
    ]);

    constructor(
        @Inject(MAT_DIALOG_DATA)
        readonly data: any,
        private readonly dialogRef: MatDialogRef<BenefitResourceListComponent>,
        private readonly language: LanguageService
    ) {}

    ngOnInit(): void {}

    onCancelClick(): void {
        this.dialogRef.close();
    }
    onRemoveClick(): void {
        this.dialogRef.close(this.data.resource);
    }
}
