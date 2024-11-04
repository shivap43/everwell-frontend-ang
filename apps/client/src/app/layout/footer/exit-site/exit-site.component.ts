import { Component, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "empowered-exit-site",
    templateUrl: "./exit-site.component.html",
    styleUrls: ["./exit-site.component.scss"],
})
export class ExitSiteComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accessibilityStatement.exitStatement",
        "primary.portal.shoppingExperience.leaveSiteTitle",
        "primary.portal.common.cancel",
        "primary.primary.portal.accessibilityStatement.continueToAflac",
    ]);

    constructor(
        private readonly language: LanguageService,
        @Inject(MAT_DIALOG_DATA) public memberInfo: { link: string }
    ) {}

    /**
     * This functions navigates the user outside Everwell to Aflac.com when the button is clicked.
     */
    navigateExit(): void {
        window.open(this.memberInfo.link, "_blank");
    }
}
