import { Component, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "empowered-delete-prospect",
    templateUrl: "./delete-prospect.component.html",
    styleUrls: ["./delete-prospect.component.scss"],
})
export class DeleteProspectComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.deleteProspect.title",
        "primary.portal.deleteProspect.description",
        "primary.portal.common.remove",
    ]);
    constructor(
        private readonly language: LanguageService,
        readonly dialogRef: MatDialogRef<boolean>,
        @Inject(MAT_DIALOG_DATA) readonly data: string
    ) {}
}
