import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { LanguageService } from "@empowered/language";
import { Component, OnInit } from "@angular/core";

@Component({
    selector: "empowered-terms-conditions",
    templateUrl: "./terms-conditions.component.html",
    styleUrls: ["./terms-conditions.component.scss"],
})
export class TermsConditionsComponent implements OnInit {
    termsConditionContent: SafeHtml;

    constructor(private readonly language: LanguageService, private readonly domSanitizer: DomSanitizer) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * @returns void
     */
    ngOnInit(): void {
        this.termsConditionContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.language.fetchPrimaryLanguageValue("primary.portal.termsConditions.content")
        );
    }
}
