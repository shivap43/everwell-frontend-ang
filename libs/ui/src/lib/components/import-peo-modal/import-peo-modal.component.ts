import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";

@Component({
    selector: "empowered-import-peo-modal",
    templateUrl: "./import-peo-modal.component.html",
    styleUrls: ["./import-peo-modal.component.scss"],
})
export class ImportPeoModalComponent {
    constructor(private readonly dialogRef: MatDialogRef<ImportPeoModalComponent>) {}

    /**
     * on click of got it button, close the modal
     */
    closeModal(): void {
        this.dialogRef.close();
    }
}
