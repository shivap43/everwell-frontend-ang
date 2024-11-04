import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-remove-customer",
    templateUrl: "./remove-customer.component.html",
    styleUrls: ["./remove-customer.component.scss"],
})
export class RemoveCustomerComponent {
    remove = this.language.fetchPrimaryLanguageValue("primary.portal.common.remove");

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly customerInfo: { name: string },
        private readonly language: LanguageService
    ) {}
}
