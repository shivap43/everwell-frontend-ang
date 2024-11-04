import { Component, OnInit } from "@angular/core";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { LanguageService } from "@empowered/language";
import { FormGroup } from "@angular/forms";

@Component({
    selector: "empowered-consent-statement",
    templateUrl: "./consent-statement.component.html",
    styleUrls: ["./consent-statement.component.scss"],
})
export class ConsentStatementComponent implements OnInit {
    // content for consent
    consentContent: SafeHtml;
    // consent form group;
    consentForm: FormGroup;
    // it holds all localized text for component
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.vf2f.consent.content",
        "primary.portal.vf2f.consent.header",
        "primary.portal.vf2f.consent.continue",
        "primary.portal.vf2f.consent.statement",
        "primary.portal.vf2f.consent.review",
        "primary.portal.vf2f.consent.acknowledgement",
        "primary.portal.vf2f.missingAcknowledgement",
    ]);

    /**
     * constructor of component
     * @param _bottomSheetRef - instance of MatBottomSheetRef of angular package.
     * @param language - Reference of Language service [used to get localized value]
     * @param domSanitizer - dom sanitizer of angular package [used to bypass security]
     * @param fb - form builder ref of angular package
     */
    constructor(
        private readonly _bottomSheetRef: MatBottomSheetRef<ConsentStatementComponent>,
        private readonly language: LanguageService,
        private readonly domSanitizer: DomSanitizer
    ) {}

    /**
     * Angular life cycle hook. it will be called at the time of initialization of component.
     * @returns void
     */
    ngOnInit(): void {
        this.consentContent = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.vf2f.consent.content"]
        );
    }

    /**
     * close the dialog box
     * @returns void
     */
    closeDialog(): void {
        this._bottomSheetRef.dismiss(true);
    }
}
