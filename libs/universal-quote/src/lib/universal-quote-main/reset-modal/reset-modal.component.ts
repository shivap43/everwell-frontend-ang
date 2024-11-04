import { UniversalService } from "./../universal.service";
import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { SetQuoteLevelSetting, QuoteSettingsSchema } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-reset-modal",
    templateUrl: "./reset-modal.component.html",
    styleUrls: ["./reset-modal.component.scss"],
})
export class ResetModalComponent implements OnInit {
    displayedColumns: string[] = [];
    languageStrings: Record<string, string>;

    constructor(
        private readonly dialog: MatDialogRef<ResetModalComponent>,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly universalService: UniversalService,
    ) {}

    // ng life cycle hook
    ngOnInit(): void {
        this.getLanguageString();
    }

    // Function to fetch the language string from DB
    getLanguageString(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.quickQuote.resetnote",
            "primary.portal.common.reset",
            "primary.portal.common.close",
        ]);
    }
    // Function to reset the quote level settings
    resetSetting(): void {
        const payload: QuoteSettingsSchema = {};
        this.store.dispatch(new SetQuoteLevelSetting(payload, true));
        this.universalService.resetButtonTapped$?.next(true);
        this.dialog.close({ action: "reset" });
    }
    // Function to close the dialog
    closeForm(): void {
        this.dialog.close({ action: "cancel" });
    }
}
