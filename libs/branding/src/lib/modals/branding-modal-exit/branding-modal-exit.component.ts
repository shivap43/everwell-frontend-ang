import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-branding-modal-exit",
    templateUrl: "./branding-modal-exit.component.html",
    styleUrls: ["./branding-modal-exit.component.scss"],
})
export class BrandingModalExitComponent {
    ariaLabel: string = this.language.fetchPrimaryLanguageValue("primary.portal.branding.aria.exit_button");

    constructor(private readonly language: LanguageService) {}
}
