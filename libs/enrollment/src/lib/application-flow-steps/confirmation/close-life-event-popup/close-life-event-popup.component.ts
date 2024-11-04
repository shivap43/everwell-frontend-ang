import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-close-life-event-popup",
    templateUrl: "./close-life-event-popup.component.html",
    styleUrls: ["./close-life-event-popup.component.scss"],
})
export class CloseLifeEventPopupComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shop.confirmation.dualPlanYear.lifeEventEnrollmentPeriod",
        "primary.portal.shop.confirmation.dualPlanYear.closeLifeEventContent",
        "primary.portal.shop.confirmation.dualPlanYear.closePeriodExit",
    ]);

    constructor(private readonly language: LanguageService) {}
}
