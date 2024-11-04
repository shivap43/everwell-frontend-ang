import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "empowered-leave-confirmation-dialog",
    templateUrl: "./leave-confirmation-dialog.component.html",
    styleUrls: ["./leave-confirmation-dialog.component.scss"],
})
export class LeaveConfirmationDialogComponent implements OnInit {
    title: string;
    content: string;
    platformPlaceholder = "<PlatformName>";
    platformName = "Everwell";

    // Fetching required language strings
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.leaveSiteTitle",
        "primary.portal.shoppingExperience.leaveSiteWarning",
        "primary.portal.common.cancel",
    ]);

    constructor(
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA) readonly data: { buttonTitle: string }
    ) {}

    /*
        Component Lifecycle hook
        OnInit
        Setting the following modal properties:
        1. Title -> fetched from language
        2. Content -> fetched from language. <Planform> placeholder replaced by the "Everwell"
    */
    ngOnInit(): void {
        this.title = this.languageStrings["primary.portal.shoppingExperience.leaveSiteTitle"];
        this.content = this.languageStrings["primary.portal.shoppingExperience.leaveSiteWarning"].replace(
            this.platformPlaceholder,
            this.platformName
        );
    }
}
