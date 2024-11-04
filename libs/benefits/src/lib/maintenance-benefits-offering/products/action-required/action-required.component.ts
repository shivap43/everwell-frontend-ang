import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-action-required",
    templateUrl: "./action-required.component.html",
    styleUrls: ["./action-required.component.scss"],
})
export class ActionRequiredComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.back",
        "primary.portal.common.gotIt",
        "primary.portal.maintenanceBenefitsOffering.actionRequired.title",
        "primary.portal.maintenanceBenefitsOffering.actionRequired.subtitle1",
        "primary.portal.maintenanceBenefitsOffering.actionRequired.subtitle2",
        "primary.portal.maintenanceBenefitsOffering.actionRequired.approvalLink",
        "primary.portal.common.close",
    ]);

    constructor(private readonly language: LanguageService) {}
}
