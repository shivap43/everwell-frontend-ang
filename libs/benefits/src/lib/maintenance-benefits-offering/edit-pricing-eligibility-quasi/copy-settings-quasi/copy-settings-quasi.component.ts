import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { ProductsPlansQuasiService } from "../../products-plans-quasi/services/products-plans-quasi.service";

@Component({
    selector: "empowered-copy-settings-quasi",
    templateUrl: "./copy-settings-quasi.component.html",
    styleUrls: ["./copy-settings-quasi.component.scss"],
})
export class CopySettingsQuasiComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.copySettings.title",
        "primary.portal.maintenanceBenefitsOffering.copySettings.optionYes",
        "primary.portal.maintenanceBenefitsOffering.copySettings.optionNo",
        "primary.portal.maintenanceBenefitsOffering.copySettings.eligibility",
        "primary.portal.maintenanceBenefitsOffering.copySettings.employerContribution",
        "primary.portal.maintenanceBenefitsOffering.copySettings.pricesOrRates",
        "primary.portal.maintenanceBenefitsOffering.copySettings.packageCodes",
        "primary.portal.common.back",
        "primary.portal.common.cancel",
        "primary.portal.common.next",
    ]);
    constructor(private readonly language: LanguageService, private readonly quasiService: ProductsPlansQuasiService) {}

    ngOnInit(): void {
        this.quasiService.stepClicked$.next(2);
    }
    onNext(): void {
        this.quasiService.defaultStepPositionChanged$.next(3);
    }
    onBack(): void {
        this.quasiService.defaultStepPositionChanged$.next(1);
    }
}
