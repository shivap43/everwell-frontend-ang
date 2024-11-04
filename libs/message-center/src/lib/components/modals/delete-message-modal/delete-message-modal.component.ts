import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-delete-message-modal",
    templateUrl: "./delete-message-modal.component.html",
    styleUrls: ["./delete-message-modal.component.scss"],
})
export class DeleteMessageModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    constructor(
        private readonly matDialogRef: MatDialogRef<DeleteMessageModalComponent>
    ) {}
}
