import { LanguageService } from "@empowered/language";
import { Component, Inject, OnInit } from "@angular/core";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
    selector: "empowered-old-eaa-enrollment-modal",
    templateUrl: "./old-eaa-enrollment-modal.component.html",
    styleUrls: ["./old-eaa-enrollment-modal.component.scss"],
})
export class OldEAAEnrollmentModalComponent implements OnInit {
    readonly SEND_OLDER_HEADER = "primary.portal.accountEnrollments.sentUnsentBusiness.sendOlder";
    readonly SEND_OLDER_SUBHEADER = "primary.portal.accountEnrollments.sentUnsentBusiness.sendOlder.pendingEnrollments";
    readonly SEND_OLDER_SUBHEADER_SINGULAR =
        "primary.portal.accountEnrollments.sentUnsentBusiness.sendOlder.pendingEnrollment";
    readonly SEND_OLDER_CONFIRM = "primary.portal.accountEnrollments.sentUnsentBusiness.sendOlder.confirm";
    readonly SEND_OLDER_REJECT = "primary.portal.accountEnrollments.sentUnsentBusiness.sendOlder.reject";
    readonly CONFIRM_BUTTON = "primary.portal.common.confirm";
    readonly SEND_ACTION = "SEND";
    readonly REJECT_ACTION = "REJECT";

    sendOlderEnrollmentsForm: FormGroup;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        this.SEND_OLDER_HEADER,
        this.SEND_OLDER_SUBHEADER,
        this.SEND_OLDER_SUBHEADER_SINGULAR,
        this.SEND_OLDER_CONFIRM,
        this.SEND_OLDER_REJECT,
        this.CONFIRM_BUTTON,
    ]);
    headerContent: string;

    constructor(
        @Inject(MAT_DIALOG_DATA) public oldUnsentEnrollmentCount: number,
        private readonly fb: FormBuilder,
        private readonly dialogRef: MatDialogRef<OldEAAEnrollmentModalComponent>,
        private readonly language: LanguageService
    ) {}

    /**
     * setting header content by combining static language with count and replace language depending on plurality
     */
    ngOnInit(): void {
        this.headerContent = `${this.oldUnsentEnrollmentCount} ${
            this.oldUnsentEnrollmentCount === 1
                ? this.languageStrings[this.SEND_OLDER_SUBHEADER_SINGULAR]
                : this.languageStrings[this.SEND_OLDER_SUBHEADER]
        }`;
        if (this.oldUnsentEnrollmentCount === 1) {
            const PLURAL_S = "s";
            const QUESTION_MARK = "?";
            this.languageStrings[this.SEND_OLDER_HEADER] = this.languageStrings[this.SEND_OLDER_HEADER].replace(
                PLURAL_S + QUESTION_MARK,
                QUESTION_MARK
            );
            this.languageStrings[this.SEND_OLDER_CONFIRM] = this.languageStrings[this.SEND_OLDER_CONFIRM].replace(
                PLURAL_S,
                ""
            );
            this.languageStrings[this.SEND_OLDER_REJECT] = this.languageStrings[this.SEND_OLDER_REJECT].replace(
                PLURAL_S,
                ""
            );
        }
        this.sendOlderEnrollmentsForm = this.fb.group({
            sendReject: this.fb.control(this.SEND_ACTION, Validators.required),
        });
    }

    /**
     * sending or rejecting older enrollments
     * @param submittedForm the submitted form containing the radio button selection
     */
    onSubmit(submittedForm: FormGroup): void {
        this.dialogRef.close(submittedForm.controls["sendReject"].value);
    }
}
