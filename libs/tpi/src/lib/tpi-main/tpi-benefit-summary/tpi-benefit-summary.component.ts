import { Component, HostBinding } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-tpi-benefit-summary",
    templateUrl: "./tpi-benefit-summary.component.html",
    styleUrls: ["./tpi-benefit-summary.component.scss"],
})
export class TpiBenefitSummaryComponent {
    @HostBinding("class") classes = "tpi-content-wrapper";
    COVERAGE_SUMMARY_HEADING = "primary.portal.tpiEnrollment.coverageSummary";
    languageStrings = this.language.fetchPrimaryLanguageValues([this.COVERAGE_SUMMARY_HEADING]);

    constructor(private readonly language: LanguageService) {}
}
