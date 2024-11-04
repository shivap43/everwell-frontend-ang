import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-coverage-date-approval",
    templateUrl: "./coverage-date-approval.component.html",
    styleUrls: ["./coverage-date-approval.component.scss"],
})
export class CoverageDateApprovalComponent {
    languageStringsArray: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.benefitsOffering.coverageDate.confirmMarketingApproval.title",
        "primary.portal.benefitsOffering.coverageDate.confirmMarketingApproval.content",
        "primary.portal.benefitsOffering.coverageDate.confirmMarketingApproval.approvalReceived",
    ]);

    constructor(private readonly language: LanguageService) {}
}
