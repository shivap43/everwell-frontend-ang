import { LanguageService } from "@empowered/language";
import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "empowered-remove-dependent",
    templateUrl: "./remove-dependent.component.html",
    styleUrls: ["./remove-dependent.component.scss"],
})
export class RemoveDependentComponent {
    remove = this.language.fetchPrimaryLanguageValue("primary.portal.common.remove");

    constructor(@Inject(MAT_DIALOG_DATA) readonly memberInfo: { name: string }, private readonly language: LanguageService) {}
}
