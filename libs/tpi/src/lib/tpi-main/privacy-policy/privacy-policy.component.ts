import { Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-privacy-policy",
    templateUrl: "./privacy-policy.component.html",
    styleUrls: ["./privacy-policy.component.scss"],
})
export class PrivacyPolicyComponent implements OnInit {
    privacyPolicyContent: SafeHtml;

    constructor(private readonly language: LanguageService, private readonly domSanitizer: DomSanitizer) {}

    /**
     * Implements Angular OnInit Life Cycle hook
     * @returns void
     */
    ngOnInit(): void {
        this.privacyPolicyContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.language.fetchPrimaryLanguageValue("primary.portal.privacyPolicy.content")
        );
    }
}
