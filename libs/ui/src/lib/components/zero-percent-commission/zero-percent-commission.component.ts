import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
@Component({
    selector: "empowered-zero-percent-commission",
    templateUrl: "./zero-percent-commission.component.html",
    styleUrls: ["./zero-percent-commission.component.scss"],
})
export class ZeroPercentCommissionComponent {
    constructor(private readonly matDialogRef: MatDialogRef<ZeroPercentCommissionComponent>) {}
    /**
     * This method will be called on click of confirm split button
     */
    saveCommission(): void {
        this.matDialogRef.close(true);
    }
    /**
     * This method will be called on click of update split button
     */
    cancelCommission(): void {
        this.matDialogRef.close(false);
    }
}
