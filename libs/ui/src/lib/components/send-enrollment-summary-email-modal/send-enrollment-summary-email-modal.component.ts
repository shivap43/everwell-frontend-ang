import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {
    Contact,
    ContactOptions,
    SendEnrollmentSummaryEmailModalAction,
    SendEnrollmentSummaryEmailModalData,
    SendEnrollmentSummaryEmailModalResponseData,
} from "./send-enrollment-summary-email-modal.model";
import { Country, MemberContactListDisplay } from "@empowered/constants";
import { SendEnrollmentSummaryEmailModalService } from "./send-enrollment-summary-email-modal.service";
import { take, takeUntil } from "rxjs/operators";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { Store } from "@ngxs/store";
import { EnrollmentState } from "@empowered/ngxs-store";
import { PhoneFormatConverterPipe } from "../../pipes/phone-format-converter.pipe";

enum LanguageKey {
    ENROLLMENT_SUMMARY_TITLE = "primary.portal.enrollment.summary.title",
    ENROLLMENT_SUMMARY_HELP_TEXT = "primary.portal.enrollment.summary.help.text",
    ENROLLMENT_SUMMARY_SELECTION_REQUIRED = "primary.portal.enrollment.summary.selection.required",
    ENROLLMENT_SUMMARY_TEXT_TO = "primary.portal.enrollment.summary.text.to",
    ENROLLMENT_SUMMARY_TEXT_TO_MOBILE_NOT_ON_FILE = "primary.portal.enrollment.summary.text.to.mobile.not.on.file",
    ENROLLMENT_SUMMARY_MOBILE_HELP_TEXT = "primary.portal.enrollment.summary.mobile.help.text",
    ENROLLMENT_SUMMARY_MOBILE_REQUIRED_FIELD = "primary.portal.enrollment.summary.mobile.required.field",
    ENROLLMENT_SUMMARY_EMAIL_TO = "primary.portal.enrollment.summary.email.to",
    ENROLLMENT_SUMMARY_SEND_TO_EMAIL_NOT_ON_FILE = "primary.portal.enrollment.summary.send.to.email.not.on.file",
    ENROLLMENT_SUMMARY_EMAIL_HELP_TEXT = "primary.portal.enrollment.summary.email.help.text",
    ENROLLMENT_SUMMARY_EMAIL_REQUIRED_FIELD = "primary.portal.enrollment.summary.email.required.field",
    ENROLLMENT_SUMMARY_CLOSE_MODAL = "primary.portal.enrollment.summary.close.modal",
    ENROLLMENT_SUMMARY_SKIP_ENROLLMENT_SUMMARY = "primary.portal.enrollment.summary.skip.enrollment.summary",
    ENROLLMENT_SUMMARY_SEND_ENROLLMENT_SUMMARY = "primary.portal.enrollment.summary.send.enrollment.summary",
    ENROLLMENT_SUMMARY_SKIP_ARIA_LABEL = "primary.portal.enrollment.summary.skip.aria.label",
    ENROLLMENT_SUMMARY_SEND_ARIA_LABEL = "primary.portal.enrollment.summary.send.aria.label",
    INVALID_EMAIL = "primary.portal.callCenter.invalidEmail",
    INVALID_PHONE_NUMBER = "primary.portal.policyChangeRequest.transactions.invalidPhoneNumber",
}

@Component({
    selector: "empowered-send-enrollment-summary-email-modal",
    templateUrl: "./send-enrollment-summary-email-modal.component.html",
    styleUrls: ["./send-enrollment-summary-email-modal.component.scss"],
    providers: [PhoneFormatConverterPipe],
})
export class SendEnrollmentSummaryEmailModalComponent implements OnDestroy {
    form: FormGroup;
    readonly LanguageKey = LanguageKey;
    readonly languageStrings: Record<LanguageKey, string>;
    showEmail = false;
    showPhone = false;
    mpGroup;
    memberId;
    result: Contact[];
    readonly unsubscribe$ = new Subject<void>();
    country = Country.COUNTRY_US;

    constructor(
        @Inject(MAT_DIALOG_DATA) readonly data: SendEnrollmentSummaryEmailModalData,
        private readonly service: SendEnrollmentSummaryEmailModalService<SendEnrollmentSummaryEmailModalComponent>,
        readonly changeDetectorRef: ChangeDetectorRef,
        private readonly matDialogRef: MatDialogRef<SendEnrollmentSummaryEmailModalComponent, SendEnrollmentSummaryEmailModalResponseData>,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly fb: FormBuilder,
    ) {
        const regex = this.store.selectSnapshot((state) => state.core.regex);
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        this.getEmailAndPhoneDetails();
        this.form = new FormGroup({
            selected: new FormControl(null, [Validators.required]),
            email: new FormControl(null, [Validators.pattern(regex.EMAIL)]),
            phone: new FormControl(null, [Validators.pattern(regex.PHONE)]),
        });

        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            LanguageKey.ENROLLMENT_SUMMARY_TITLE,
            LanguageKey.ENROLLMENT_SUMMARY_HELP_TEXT,
            LanguageKey.ENROLLMENT_SUMMARY_SELECTION_REQUIRED,
            LanguageKey.ENROLLMENT_SUMMARY_TEXT_TO,
            LanguageKey.ENROLLMENT_SUMMARY_TEXT_TO_MOBILE_NOT_ON_FILE,
            LanguageKey.ENROLLMENT_SUMMARY_MOBILE_HELP_TEXT,
            LanguageKey.ENROLLMENT_SUMMARY_MOBILE_REQUIRED_FIELD,
            LanguageKey.ENROLLMENT_SUMMARY_EMAIL_TO,
            LanguageKey.ENROLLMENT_SUMMARY_SEND_TO_EMAIL_NOT_ON_FILE,
            LanguageKey.ENROLLMENT_SUMMARY_EMAIL_HELP_TEXT,
            LanguageKey.ENROLLMENT_SUMMARY_EMAIL_REQUIRED_FIELD,
            LanguageKey.ENROLLMENT_SUMMARY_CLOSE_MODAL,
            LanguageKey.ENROLLMENT_SUMMARY_SKIP_ENROLLMENT_SUMMARY,
            LanguageKey.ENROLLMENT_SUMMARY_SEND_ENROLLMENT_SUMMARY,
            LanguageKey.INVALID_EMAIL,
            LanguageKey.INVALID_PHONE_NUMBER,
        ]);
    }

    /**
     * @description Handles when the user selects an email in the radio group
     * @param {MemberContactListDisplay} contact
     */
    onEmailSelection(contact: MemberContactListDisplay): void {
        this.resetForms();
        this.showEmail = false;
        this.showPhone = false;
        this.service.phone = null;
        this.service.email = contact.contact;
        this.form.setControl("selected", this.fb.control(contact.contact));
        this.form.controls["email"].setErrors(null);
        this.form.controls["phone"].setErrors(null);
    }

    /**
     * @description Handles email input event.
     * @return {void}
     */
    onEmailNotOnFile(): void {
        this.resetForms();
        this.showEmail = true;
        this.showPhone = false;
        this.form.setControl("selected", this.fb.group({}));
    }

    /**
     * @description Handles when the user selects an phone in the radio group
     * @param {MemberContactListDisplay} contact
     */
    onPhoneSelection(contact: MemberContactListDisplay): void {
        this.resetForms();
        this.showEmail = false;
        this.showPhone = false;
        this.service.email = null;
        this.service.phone = contact.formatted;
        this.form.setControl("selected", this.fb.control(contact.formatted));
        this.form.controls["email"].setErrors(null);
        this.form.controls["phone"].setErrors(null);
    }

    /**
     * @description Shows the phone input
     * @return {void}
     */
    onPhoneNotOnFile(): void {
        this.resetForms();
        this.showPhone = true;
        this.showEmail = false;
        this.form.setControl("selected", this.fb.group({}));
    }

    /**
     * @description Handles the user's input as they type the email address.
     * @param {Event} event - The input event object.
     * @return {void}
     */
    onEmailInput(event: Event): void {
        const { value } = event.target as HTMLInputElement;
        this.service.phone = null;
        this.service.email = value;
        this.form.setControl("selected", this.fb.control(value));
    }

    /**
     * @description Handles the user's input as they type the email address.
     * @param {Event} event - The input event object.
     * @return {void}
     */
    onPhoneInput(event: Event): void {
        const { value } = event.target as HTMLInputElement;
        this.service.email = null;
        this.service.phone = value;
        this.form.setControl("selected", this.fb.control(value));
    }

    resetForms() {
        this.form.controls.email.reset();
        this.form.controls.phone.reset();
    }

    /**
     * @description Fires when the form is submitted
     * @return {void}
     */
    onSubmit(): void {
        if (this.showEmail && this.form.get("email").invalid) {
            this.form.get("email").markAsTouched();
        }

        if (this.showPhone && this.form.get("phone").invalid) {
            this.form.get("phone").markAsTouched();
        }

        if (!this.form.valid) {
            return this.markAllFieldsAsTouched();
        }

        if (this.form.get("selected").value || this.form.get("email").value || this.form.get("phone").value) {
            this.send();
        }
    }

    /**
     * @description Calls the service to skip doing anything
     * @return {void}
     */
    skip(): void {
        this.matDialogRef.close({ action: SendEnrollmentSummaryEmailModalAction.SKIP });
    }

    /**
     * @description Calls the service to send the email and then to close the modal
     * @return {void}
     */
    send(): void {
        const requestData = this.service.email ? { email: this.service.email } : { phoneNumber: this.service.phone };
        this.service
            .send(this.mpGroup, this.memberId, requestData)
            .pipe(take(1))
            .subscribe(() => this.matDialogRef.close({ action: SendEnrollmentSummaryEmailModalAction.SEND }));
    }

    /**
     * @description Calls the service method and fetches the contact details of the user
     */
    getEmailAndPhoneDetails() {
        this.service
            .getEmailAndPhoneDetails(this.mpGroup, this.memberId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.result = data;
                this.populateContactList();
            });
    }

    /**
     * @description Extracts the value in the result object and sets email id and phone number details in the contactList
     */
    populateContactList() {
        this.result.forEach((data) => {
            data.emailAddresses.forEach((email) => {
                this.data.contactList.push({
                    contact: email.email,
                    disableField: false,
                    type: ContactOptions.EMAIL,
                    primary: email.primary,
                    formatted: email.email,
                });
            });
            data.phoneNumbers.forEach((phone) => {
                this.data.contactList.push({
                    contact: phone.phoneNumber.toString(),
                    disableField: false,
                    type: ContactOptions.PHONE,
                    primary: phone.primary,
                    formatted: phone.phoneNumber.toString(),
                });
            });
        });
    }

    /**
     * Angular Lifecycle method, called when component is destroyed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * @description Marks all fields as touched
     * @return {void}
     */
    private markAllFieldsAsTouched(): void {
        Object.values(this.form.controls).forEach((control) => {
            control.markAsTouched();
        });
    }
}
