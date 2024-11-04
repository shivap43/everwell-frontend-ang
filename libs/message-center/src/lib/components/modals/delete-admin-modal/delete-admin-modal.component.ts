import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-delete-admin-modal",
    templateUrl: "./delete-admin-modal.component.html",
    styleUrls: ["./delete-admin-modal.component.scss"],
})
export class DeleteAdminModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    constructor(
        private readonly matDialogRef: MatDialogRef<DeleteAdminModalComponent>
    ) {}
}
