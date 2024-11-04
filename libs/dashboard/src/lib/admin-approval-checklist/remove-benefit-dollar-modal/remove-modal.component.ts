import { Component, Inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "empowered-remove-benefit-dollar-modal",
    templateUrl: "./remove-modal.component.html",
    styleUrls: ["./remove-modal.component.scss"],
})
export class RemoveBenefitDollarModalComponent {
    constructor(
        private readonly dialogRef: MatDialogRef<RemoveBenefitDollarModalComponent>,
        @Inject(MAT_DIALOG_DATA) public name: string
    ) {}
}
