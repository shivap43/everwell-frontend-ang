import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-save-and-close-pop-up",
    templateUrl: "./save-and-close-pop-up.component.html",
    styleUrls: ["./save-and-close-pop-up.component.scss"],
})
export class SaveAndClosePopUpComponent {
    languageStrings: Record<string, string>;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param langService is instance of LanguageService
     * @param dialogRef is matDialogRef of SaveAndClosePopUpComponent
     */
    constructor(
        private readonly langService: LanguageService,
        private readonly dialogRef: MatDialogRef<SaveAndClosePopUpComponent>
    ) {
        this.fetchLanguageData();
    }

    /**
     * This method will execute on click of save and close
     */
    onSubmit(): void {
        this.dialogRef.close(true);
    }
    /**
     * This method is used to fetch language strings from language service
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.saveAndClose.title",
            "primary.portal.saveAndClose.description",
            "primary.portal.common.saveAndClose",
        ]);
    }
}
