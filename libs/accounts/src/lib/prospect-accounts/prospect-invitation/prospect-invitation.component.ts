import { Component, OnInit, Inject } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ACTION } from "@empowered/api";
import { ROLE } from "@empowered/constants";
import { UtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-prospect-invitation",
    templateUrl: "./prospect-invitation.component.html",
    styleUrls: ["./prospect-invitation.component.scss"],
})
export class ProspectInvitationComponent implements OnInit {
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.common.reject",
        "primary.portal.common.accept",
        "primary.portal.common.a",
        "primary.portal.common.an",
        "primary.portal.commission.producer.role.primaryProducer",
        "primary.portal.commission.producer.invitation.title",
        "primary.portal.commission.producer.role.writingProducer",
        "primary.portal.commission.producer.role.enroller",
        "primary.portal.commission.producer.invitation.welcomeMessage",
    ]);
    roleTypes = [
        {
            name: this.languageStrings["primary.portal.commission.producer.role.primaryProducer"],
            id: ROLE.PRIMARY_PRODUCER,
        },
        {
            name: this.languageStrings["primary.portal.commission.producer.role.writingProducer"],
            id: ROLE.WRITING_PRODUCER,
        },
        {
            name: this.languageStrings["primary.portal.commission.producer.role.enroller"],
            id: ROLE.ENROLLER,
        },
    ];
    roleText = "";
    invitingProducerName = "";

    constructor(
        private readonly dialogRef: MatDialogRef<ProspectInvitationComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly languageService: LanguageService,
        private readonly utilService: UtilService,
    ) {}
    /**
     * set the header and content messages of the popup
     */
    ngOnInit(): void {
        if (this.data.invitation.invitingProducer) {
            const producer = this.data.invitation.invitingProducer.producer;
            if (producer) {
                this.invitingProducerName = `${producer.name.firstName} ${producer.name.lastName}`;
            }
        }
        this.roleText = this.getRoleDisplayText(this.data.invitation.proposedRole);
    }
    /**
     * set the role with required article based on first character of role
     * @param roleText proposed role for the invitee
     * @returns proposed role with appropriate article
     */
    getRoleDisplayText(roleText: string): string | undefined {
        const role = this.roleTypes.find((x) => x.id === roleText);
        if (role && role.name) {
            const text = this.utilService.isVowel(role.name.charAt(0))
                ? this.languageStrings["primary.portal.common.an"]
                : this.languageStrings["primary.portal.common.a"];
            return `${text} ${role.name}`;
        }
        return undefined;
    }
    /**
     * accept or reject the invitation based on the param
     * @param accepted status of the invitation
     */
    acceptOrReject(accepted: boolean): void {
        this.dialogRef.close({ action: accepted ? ACTION.ACCEPT : ACTION.REJECT });
    }
}
