import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-company-provided-products-dialog",
    templateUrl: "./company-provided-products-dialog.component.html",
    styleUrls: ["./company-provided-products-dialog.component.scss"],
})
export class CompanyProvidedProductsDialogComponent {
    languageString: Record<string, string>;

    constructor(
        private readonly dialogRef: MatDialogRef<CompanyProvidedProductsDialogComponent>,
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            products: string[];
            firstName: string;
        }
    ) {
        this.fetchlanguageValues();
    }

    save(): void {
        this.dialogRef.close("save");
    }
    fetchlanguageValues(): void {
        this.languageString = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.shoppingExperience.companyProvidedProductsDialog.title",
            "primary.portal.shoppingExperience.companyProvidedProductsDialog.description",
            "primary.portal.shoppingExperience.companyProvidedProductsDialog.gotit",
        ]);
    }
}
