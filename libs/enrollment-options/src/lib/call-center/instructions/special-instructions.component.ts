import { Component, OnInit, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";

interface DialogData {
    specialInstructions: string;
    specialInstructionsByName: string;
    specialInstructionsModifiedDate: string;
}

@Component({
    selector: "empowered-special-instructions",
    templateUrl: "./special-instructions.component.html",
    styleUrls: ["./special-instructions.component.scss"],
})
export class SpecialInstructionsComponent implements OnInit {
    specialInstructions: string;
    specialInstructionsByName: string;
    specialInstructionsModifiedDate: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.dashboard.accountInstructions",
        "primary.portal.dashboard.byOwner",
        "primary.portal.dashboard.hyphen",
    ]);

    constructor(
        private readonly dialogRef: MatDialogRef<SpecialInstructionsComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: DialogData,
        private readonly language: LanguageService,
    ) {}

    /**
     * Initialize special instructions, ownerName and lastModified data.
     */
    ngOnInit(): void {
        this.specialInstructions = this.data.specialInstructions;
        this.specialInstructionsByName = this.data.specialInstructionsByName;
        this.specialInstructionsModifiedDate = this.data.specialInstructionsModifiedDate;
    }

    /**
     * Closes the dialog box
     */
    onCancel(): void {
        this.dialogRef.close({ action: "close" });
    }
}
