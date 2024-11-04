import { Component, OnInit } from "@angular/core";
import { SafeHtml, DomSanitizer } from "@angular/platform-browser";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-tpi-footer-consent-statement",
    templateUrl: "./tpi-footer-consent-statement.component.html",
    styleUrls: ["./tpi-footer-consent-statement.component.scss"],
})
export class TpiFooterConsentStatementComponent implements OnInit {
    termsConditionContent: SafeHtml;

    constructor(private readonly language: LanguageService, private readonly domSanitizer: DomSanitizer) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * @returns void
     */
    ngOnInit(): void {
        this.termsConditionContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.language.fetchPrimaryLanguageValue("primary.portal.login.consent.content")
        );
    }
}
