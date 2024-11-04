import { Validators } from "@angular/forms";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, Inject, Optional } from "@angular/core";
import { AdminStatus } from "@empowered/api";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-status-modal",
    templateUrl: "./status-modal.component.html",
    styleUrls: ["./status-modal.component.scss"],
})
export class StatusModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    statuses: AdminStatus[];
    statusForm: FormGroup = this.builder.group({
        statusFormControl: ["", Validators.required],
    });

    constructor(
        private readonly matDialogRef: MatDialogRef<StatusModalComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: AdminStatus[],
        private readonly builder: FormBuilder
    ) {
        this.statuses = data;
    }
}
