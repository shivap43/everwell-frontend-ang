import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { PortalType } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";

interface ProfileChangesDialogData {
    data: string;
    isAgentAssisted: boolean;
}

@Component({
    selector: "empowered-profile-changes-confirm-prompt",
    templateUrl: "./profile-changes-confirm-prompt.component.html",
    styleUrls: ["./profile-changes-confirm-prompt.component.scss"],
})
export class ProfileChangesConfirmPromptComponent {
    portal: string;
    isMMP = false;
    constructor(
        private readonly dialogRef: MatDialogRef<ProfileChangesConfirmPromptComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: ProfileChangesDialogData,
        private readonly store: Store,
    ) {
        this.portal = this.store.selectSnapshot(SharedState.portal);

        // For Self Service in TPP flow and member portal in Everwell Proper flow, the confirmation message is same
        // and for Agent Assisted in TPP flow, producer and Admin portal in Everwell proper flow, the message is same
        // Hence added this check to display different message in different scenarios.
        this.isMMP = !this.data.isAgentAssisted && (!this.portal || this.portal === PortalType.MEMBER);
    }

    onSubmit(): void {
        this.dialogRef.close(true);
    }
}
