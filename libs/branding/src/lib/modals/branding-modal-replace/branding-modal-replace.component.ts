import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-branding-modal-replace",
    templateUrl: "./branding-modal-replace.component.html",
    styleUrls: ["./branding-modal-replace.component.scss"],
})
export class BrandingModalReplaceComponent {
    ariaLabel: string = this.language.fetchPrimaryLanguageValue("primary.portal.branding.aria.replace_button");

    constructor(private readonly language: LanguageService) {}
}
