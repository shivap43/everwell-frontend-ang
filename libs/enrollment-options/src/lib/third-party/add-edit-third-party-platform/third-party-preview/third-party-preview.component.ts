import { Component, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { ThirdPartyPlatformPreview } from "@empowered/api";
import { DateFormats } from "@empowered/constants";

@Component({
    selector: "empowered-third-party-preview",
    templateUrl: "./third-party-preview.component.html",
    styleUrls: ["./third-party-preview.component.scss"],
})
export class ThirdPartyPreviewComponent {
    languageStrings: Record<string, string>;
    DATE_FORMAT_MM_DD_YYYY = DateFormats.MONTH_DAY_YEAR;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param language is instance of Language service
     * @param thirdPartyPreview is injected data
     * @param dialogRef is dialog reference of this component
     */
    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly thirdPartyPreview: ThirdPartyPlatformPreview,
        private readonly dialogRef: MatDialogRef<ThirdPartyPreviewComponent>
    ) {
        this.fetchPrimaryLanguageStrings();
    }

    /**
     * This method is used to fetch all primary language strings from language service
     */
    fetchPrimaryLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.common.back",
            "primary.portal.common.save",
            "primary.portal.benefitOffering.enrollmentOptions.thirdPartyPreview.updatesOffering",
            "primary.portal.benefitOffering.enrollmentOptions.thirdPartyPreview.removed",
            "primary.portal.benefitOffering.enrollmentOptions.thirdPartyPreview.selfService",
            "primary.portal.benefitOffering.enrollmentOptions.thirdPartyPreview.multipleEnrollment",
            "primary.portal.benefitOffering.enrollmentOptions.thirdPartyPreview.enrollmentStartDate",
        ]);
    }

    /**
     * This method will execute on click of back which closes the dialog reference
     */
    onBack(): void {
        this.dialogRef.close(false);
    }

    /**
     * This method will execute on click of save which closes the dialog reference
     */
    onSave(): void {
        this.dialogRef.close(true);
    }
}
