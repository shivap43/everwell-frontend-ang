import { Component, Inject, OnInit } from "@angular/core";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MemberContactListDisplay, SendPdaDialogAction, SendPdaDialogData } from "@empowered/constants";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-send-applicant-pda",
    templateUrl: "./send-applicant-pda.component.html",
    styleUrls: ["./send-applicant-pda.component.scss"],
})
export class SendApplicantPdaComponent implements OnInit {
    readonly SendPdaDialogAction = SendPdaDialogAction;

    contactForm: FormGroup;
    hasMemberContact: boolean;
    email = "email";
    phoneNumber = "phoneNumber";

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.customerSignatureRequired",
        "primary.portal.applicationFlow.emailNotHave",
        "primary.portal.pda.notify",
        "primary.portal.applicationFlow.contactInfo",
        "primary.portal.headset.email",
        "primary.portal.headset.text",
        "primary.portal.applicationFlow.skipSendLater",
        "primary.portal.applicationFlow.addContactInfo",
        "primary.portal.headset.sendto.applicant",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        @Inject(MAT_DIALOG_DATA) readonly data: SendPdaDialogData,
        private readonly language: LanguageService,
        private readonly matDialogRef: MatDialogRef<SendApplicantPdaComponent>,
    ) {}

    /**
     * Angular life cycle hook
     * set form details
     */
    ngOnInit(): void {
        this.contactForm = this.fb.group({
            contacts: this.data.contactList[0],
        });

        this.hasMemberContact = this.data.contactList.some((contact: MemberContactListDisplay) => contact.type);
    }

    /**
     * @description Closes the  SendApplicantPda dialog
     * @param {string} option the option of button in pop-up
     */
    closeDialog(option: SendPdaDialogAction): void {
        this.matDialogRef.close({ action: option, selectedValue: this.contactForm.controls.contacts.value });
    }
}
