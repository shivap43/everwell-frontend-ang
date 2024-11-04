import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-delete-comment-modal",
    templateUrl: "./delete-comment-modal.component.html",
    styleUrls: ["./delete-comment-modal.component.scss"],
})
export class DeleteCommentModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    constructor(
        private readonly matDialogRef: MatDialogRef<DeleteCommentModalComponent>
    ) {}
}
