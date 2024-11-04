import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
@Component({
    selector: "empowered-salary-update-confirmation",
    templateUrl: "./salary-update-confirmation.component.html",
    styleUrls: ["./salary-update-confirmation.component.scss"],
})
export class SalaryUpdateConfirmationComponent {
    constructor(private readonly matDialogRef: MatDialogRef<SalaryUpdateConfirmationComponent>) {}
    /**
     * This method will be called on click of got it button
     */
    onSubmit() {
        this.matDialogRef.close(true);
    }
}
