import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-delete-category-modal",
    templateUrl: "./delete-category-modal.component.html",
    styleUrls: ["./delete-category-modal.component.scss"],
})
export class DeleteCategoryModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    constructor(
        private readonly matDialogRef: MatDialogRef<DeleteCategoryModalComponent>
    ) {}
}
