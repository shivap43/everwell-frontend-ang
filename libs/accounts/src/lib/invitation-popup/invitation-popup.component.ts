import { Subscription } from "rxjs";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ProducerService, ACTION } from "@empowered/api";
import { ROLE } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-invitation-popup",
    templateUrl: "./invitation-popup.component.html",
    styleUrls: ["./invitation-popup.component.scss"],
})
export class InvitationPopupComponent implements OnInit, OnDestroy {
    message: string;
    title: string;
    accountId: string;
    roleTypes: any;
    SUCCESS = "SUCCESS";
    respondToInviteSubcription: Subscription;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.reject",
        "primary.portal.common.accept",
        "primary.portal.commission.producer.role.primaryProducer",
        "primary.portal.commission.producer.role.writingProducer",
        "primary.portal.commission.producer.role.enroller",
        "primary.portal.commission.producer.invitation.welcomeMessage",
        "primary.portal.commission.producer.invitation.title",
    ]);
    constructor(
        private readonly dialogRef: MatDialogRef<InvitationPopupComponent>,
        @Inject(MAT_DIALOG_DATA) private readonly data: any,
        private readonly producerService: ProducerService,
        private readonly language: LanguageService,
    ) {}

    ngOnInit(): void {
        this.getRoleType();
        if (this.data.accountDetails) {
            let invitingProducerName;
            if (this.data.accountDetails.invitingProducer) {
                const producer = this.data.accountDetails.invitingProducer.producer;
                if (producer) {
                    invitingProducerName = producer.name.firstName + " " + producer.name.lastName;
                }
            }
            let accountName;
            if (this.data.accountDetails.account) {
                accountName = this.data.accountDetails.account.name;
                this.accountId = this.data.accountDetails.account.id;
            }
            const role = this.data.accountDetails.proposedRole;
            this.message = this.languageStrings["primary.portal.commission.producer.invitation.welcomeMessage"].replace(
                "##message##",
                this.data.accountDetails.message,
            );
            const title = this.languageStrings["primary.portal.commission.producer.invitation.title"];
            this.title = title
                .replace("##producerName##", invitingProducerName)
                .replace("##accountName##", accountName)
                .replace("##role##", this.getRoleDisplayText(role));
        }
    }
    isVowel(char: string): boolean {
        return ["a", "e", "i", "o", "u"].indexOf(char.toLowerCase()) !== -1;
    }

    closePopup(): void {
        this.dialogRef.close();
    }
    getRoleDisplayText(roleText: string): string | undefined {
        const role = this.roleTypes.find((x) => x.id === roleText);
        if (role && role.name) {
            const text = this.isVowel(role.name.charAt(0)) ? "an" : "a";
            return `${text} ${role.name}`;
        }
        return undefined;
    }

    invitationAction(flag: boolean): void {
        const action = flag ? ACTION.ACCEPT : ACTION.REJECT;
        this.respondToInviteSubcription = this.producerService
            .respondToInvitation(this.data.loggedInProducerId, this.accountId, `"${action}"`)
            .subscribe(
                (Response) => {
                    this.dialogRef.close(this.SUCCESS);
                },
                (Error) => {},
            );
    }

    getRoleType(): void {
        this.roleTypes = [
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
    }
    ngOnDestroy(): void {
        if (this.respondToInviteSubcription) {
            this.respondToInviteSubcription.unsubscribe();
        }
    }
}
