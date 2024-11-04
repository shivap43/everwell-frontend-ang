import { Component, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { SafeResourceUrl } from "@angular/platform-browser";

@Component({
    selector: "empowered-application-pdf-dialog",
    templateUrl: "./application-pdf-dialog.component.html",
    styleUrls: ["./application-pdf-dialog.component.scss"],
})
export class ApplicationPdfDialogComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.confirmation.applicationForInsurance",
        "primary.portal.common.print",
        "primary.portal.common.finish",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ApplicationPdfDialogComponent>,
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            signedFileURL: string;
            safeUrl: SafeResourceUrl;
            planName: string;
        }
    ) {}

    print(): void {
        window.open(this.data.signedFileURL, "_blank");
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
}
