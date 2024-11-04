import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-cart-lock-dialog",
    templateUrl: "./cart-lock-dialog.component.html",
    styleUrls: ["./cart-lock-dialog.component.scss"],
})
export class CartLockDialogComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.gotIt"]);

    constructor(
        private readonly cartDialogRef: MatDialogRef<CartLockDialogComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly language: LanguageService,
    ) {}

    closeModal(): void {
        this.cartDialogRef.close();
    }
}
