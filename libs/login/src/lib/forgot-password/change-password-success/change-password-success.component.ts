import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-change-password-success",
    templateUrl: "./change-password-success.component.html",
    styleUrls: ["./change-password-success.component.scss"],
})
export class ChangePasswordSuccessComponent {
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.returnToLogin",
        "primary.portal.forgotPassword.changePasswordSuccessTitle",
    ]);

    constructor(private readonly language: LanguageService) {}
}
