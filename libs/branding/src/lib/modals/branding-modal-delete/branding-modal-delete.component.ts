import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-branding-modal-delete",
    templateUrl: "./branding-modal-delete.component.html",
    styleUrls: ["./branding-modal-delete.component.scss"],
})
export class BrandingModalDeleteComponent {
    ariaLabel: string = this.language.fetchPrimaryLanguageValue("primary.portal.branding.aria.remove_button");
    constructor(private readonly language: LanguageService) {}
}
