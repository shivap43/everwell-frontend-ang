import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { CarrierId } from "@empowered/constants";
import { PlanOfferingRedirect } from "@empowered/api";

@Component({
    selector: "empowered-redirect-confirmation-modal",
    templateUrl: "./redirect-confirmation-modal.component.html",
    styleUrls: ["./redirect-confirmation-modal.component.scss"],
})
export class RedirectConfirmationModalComponent {
    carrierId?: number | null;

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    readonly aflacPassCarrierId = CarrierId.AFLAC_PASS;
    readonly medicalCarrierId = CarrierId.GO_HEALTH;

    constructor(
        private readonly dialogRef: MatDialogRef<RedirectConfirmationModalComponent>,
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA) private readonly data: PlanOfferingRedirect,
    ) {
        this.carrierId = data.carrierId;
    }

    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.gohealth.title",
            "primary.portal.gohealth.redirectDescription",
            "primary.portal.common.cancel",
            "primary.portal.common.continue",
            "primary.portal.common.close",
            "primary.portal.gohealth.redirectDescriptionIfEverwell",
            "primary.portal.gohealth.redirectDescriptionIfAflacPassEverwell",
        ]);
    }

    /**
     * Redirect to external link for redirect plan
     */
    redirectToExternalLink(): void {
        const redirectLink = this.data.link;
        window.open(redirectLink);
        this.dialogRef.close();
    }

    /**
     * Close dialog popup window
     */
    closePopup(): void {
        this.dialogRef.close();
    }
}
