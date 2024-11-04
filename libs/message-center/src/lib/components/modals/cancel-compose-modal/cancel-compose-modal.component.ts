import { Component } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { AssignAdminModalComponent } from "../assign-admin-modal/assign-admin-modal.component";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
  selector: "empowered-cancel-compose-modal",
  templateUrl: "./cancel-compose-modal.component.html",
  styleUrls: ["./cancel-compose-modal.component.scss"]
})
export class CancelComposeModalComponent {
  MessageCenterLanguage = MessageCenterLanguage;

  constructor(private readonly matDialogRef: MatDialogRef<AssignAdminModalComponent>) { }

}
