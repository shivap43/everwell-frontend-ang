import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Router, ActivatedRoute } from "@angular/router";
import { Credential } from "@empowered/constants";

@Component({
    selector: "empowered-reset-password-success",
    templateUrl: "./reset-password-success.component.html",
    styleUrls: ["./reset-password-success.component.scss"],
})
export class ResetPasswordSuccessComponent implements OnInit {
    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.returnToLogin",
        "primary.portal.forgotPassword.changePasswordSuccessTitle",
    ]);

    /** *
     * constructor for services initialization
     */
    constructor(private readonly language: LanguageService, private readonly router: Router, private readonly route: ActivatedRoute) {}

    /** *
     * ngOnInit angular life cycle for Init
     */
    ngOnInit(): void {
        const userInfo: Credential = JSON.parse(sessionStorage.getItem("userInfo"));
        if (!userInfo) {
            this.router.navigate(["../../login"], {
                relativeTo: this.route,
            });
        }
    }
}
