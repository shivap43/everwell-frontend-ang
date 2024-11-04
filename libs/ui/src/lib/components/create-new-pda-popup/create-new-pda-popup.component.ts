import { Component, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { FormControl, Validators } from "@angular/forms";
import { CompanyCode } from "@empowered/constants";

@Component({
    selector: "empowered-create-new-pda-popup",
    templateUrl: "./create-new-pda-popup.component.html",
    styleUrls: ["./create-new-pda-popup.component.scss"],
})
export class CreateNewPdaPopupComponent implements OnInit {
    companyCode = CompanyCode;
    selectedOption: FormControl;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.next",
        "primary.portal.common.selectionRequired",
        "primary.portal.pda.form.addPdaHeader",
        "primary.portal.pda.form.addPdaDescription",
        "primary.portal.pda.form.addPdaOptionUs",
        "primary.portal.pda.form.addPdaOptionPuertoRico",
    ]);

    constructor(private readonly language: LanguageService, private readonly dialogRef: MatDialogRef<CreateNewPdaPopupComponent>) {}

    /**
     * Method to initialize form control
     */
    ngOnInit(): void {
        this.selectedOption = new FormControl(this.companyCode.US, Validators.required);
    }

    /**
     * Method to validate form control and close popup
     */
    onNext(): void {
        if (this.selectedOption.valid) {
            this.dialogRef.close(this.selectedOption.value);
        } else {
            this.selectedOption.setErrors({ require: true });
        }
    }
}
