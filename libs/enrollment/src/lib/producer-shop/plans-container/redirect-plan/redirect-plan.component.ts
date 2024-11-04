import { Component, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { PlanOfferingRedirect } from "@empowered/api";
import { CarrierId, PlanOffering } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { select } from "@ngrx/store";
import { map } from "rxjs/operators";
import { RedirectConfirmationModalComponent } from "./redirect-confirmation-modal/redirect-confirmation-modal.component";

@Component({
    selector: "empowered-redirect-plan",
    templateUrl: "./redirect-plan.component.html",
    styleUrls: ["./redirect-plan.component.scss"],
})
export class RedirectPlanComponent {
    @Input() planOffering!: PlanOffering;

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    // Gets selected Plan Offering With cart and enrollment data
    readonly selectedPlanOfferingWithCartAndEnrollment$ = this.ngrxStore.onAsyncValue(
        select(PlanOfferingsSelectors.getSelectedPlanOfferingData),
    );

    // set redirect button label based on carrier
    readonly setRedirectButtonLabel$ = this.selectedPlanOfferingWithCartAndEnrollment$.pipe(
        map((selectedPlanOfferingData) =>
            selectedPlanOfferingData?.planOffering.plan.product.carrierIds.includes(CarrierId.AFLAC_PASS)
                ? this.languageStrings["primary.portal.shoppingExperience.visitsite"]
                : this.languageStrings["primary.portal.quoteShop.dependency.getReferral"],
        ),
    );

    constructor(
        private readonly languageService: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly dialog: MatDialog,
    ) {}

    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.planDetails",
            "primary.portal.shoppingExperience.visitsite",
            "primary.portal.quoteShop.dependency.getReferral",
        ]);
    }

    /**
     * Navigate to redirect model
     */
    redirect(selectedPlanOffering: PlanOffering): void {
        this.dialog.open(RedirectConfirmationModalComponent, {
            hasBackdrop: true,
            data: {
                carrierId: selectedPlanOffering.plan?.product?.carrierIds?.[0],
                link: selectedPlanOffering.link,
                linkText: selectedPlanOffering.linkText,
            } as PlanOfferingRedirect,
            width: "600px",
        });
    }
}
