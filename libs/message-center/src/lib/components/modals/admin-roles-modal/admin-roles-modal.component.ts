import { MatDialogRef } from "@angular/material/dialog";
import { Component } from "@angular/core";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-admin-roles-modal",
    templateUrl: "./admin-roles-modal.component.html",
    styleUrls: ["./admin-roles-modal.component.scss"],
})
export class AdminRolesModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    constructor(private readonly matDialogRef: MatDialogRef<AdminRolesModalComponent>) {}
}
