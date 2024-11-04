import { Component, Inject, OnDestroy, OnInit, Optional } from "@angular/core";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { AflacAlwaysService, MemberService, PendingReasonForPdaCompletion, ShoppingCartDisplayService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";
import { Subject, combineLatest } from "rxjs";
import { tap, takeUntil, take } from "rxjs/operators";
import { EnrollAflacAlwaysModalData } from "../../enroll-aflac-always-modal.data";
import { MemberContact } from "@empowered/constants";

interface MemberContactListDisplay {
    contact: string;
    disableField: boolean;
    type: string;
    primary: boolean;
}

@Component({
    selector: "empowered-signature-modal",
    templateUrl: "./signature-modal.component.html",
    styleUrls: ["./signature-modal.component.scss"],
})
export class SignatureModalComponent implements OnInit, OnDestroy {
    hasMemberContact = false;
    memberFirstName = "";
    isHeadset = false;
    emailContacts = [];
    textContacts = [];
    contactList = [];
    email = "email";
    phoneNumber = "phoneNumber";
    formGroup: FormGroup;
    contactForm: FormGroup;
    mpGroup: number;
    memberId: number;
    loadSpinner: boolean;
    ERROR = "error";
    showError: boolean;
    errorMessage: string;
    selectedValue: string;
    routeAfterLogin = "producer/payroll";
    private readonly unsubscribe$ = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.customerSignatureRequired",
        "primary.portal.applicationFlow.emailNotHave",
        "primary.portal.applicationFlow.youCanNotify",
        "primary.portal.applicationFlow.contactInfo",
        "primary.portal.applicationFlow.acknowledgement",
        "primary.portal.applicationFlow.skipSendLater",
        "primary.portal.applicationFlow.sendCustomer",
        "primary.portal.applicationFlow.addContactInfo",
        "primary.portal.headset.email",
        "primary.portal.headset.text",
        "primary.portal.headset.noemailaddress",
        "primary.portal.headset.nomobile",
        "primary.portal.common.close",
    ]);
    secondaryLanguageString: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.common.errorSendingRequestSignature",
        "secondary.portal.applicationFlow.errorMessage",
    ]);

    constructor(
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly memberService: MemberService,
        @Optional() @Inject(MAT_DIALOG_DATA) readonly data: EnrollAflacAlwaysModalData,
        private readonly dialogRef: MatDialogRef<SignatureModalComponent>,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly aflacAlwaysService: AflacAlwaysService,
    ) {}

    ngOnInit(): void {
        this.mpGroup = this.data?.mpGroupId;
        this.memberId = this.data?.memberId;
        this.getMemberInfo(this.memberId, this.mpGroup);
    }

    /**
     * Fetches member information to display member attributes
     * @param memberId: member id
     * @param mpGroup: group id
     */
    getMemberInfo(memberId: number, mpGroup: number): void {
        this.loadSpinner = true;
        combineLatest([
            this.memberService.getMemberContacts(memberId, mpGroup?.toString()),
            this.memberService.getMember(memberId, false, mpGroup?.toString()),
        ])
            .pipe(
                take(1),
                tap(([contactInfo, member]) => {
                    this.memberFirstName = member?.body?.name?.firstName;
                    this.retrieveAndShowContactInfo(contactInfo);
                }),
            )
            .subscribe();
    }

    /**
     * This method is used to display member contacts after submitting
     * the applications during headset enrollment flow
     * This method is used to set the list of member contacts to be displayed and
     * will pre-select the primary contact, if any
     * @param contactInfo: MemberContact List
     */
    retrieveAndShowContactInfo(contactInfo: MemberContact[]): void {
        contactInfo.forEach((contact) => {
            if (contact.emailAddresses && contact.emailAddresses.length) {
                contact.emailAddresses.forEach((emailAddress) => {
                    this.emailContacts.push({ email: emailAddress.email, primary: emailAddress.primary });
                });
            }
            if (contact.phoneNumbers && contact.phoneNumbers.length) {
                contact.phoneNumbers.forEach((phoneNumber) => {
                    this.textContacts.push(phoneNumber.phoneNumber);
                });
            }
        });

        this.contactForm = this.fb.group({});
        this.contactList = [];
        if (this.emailContacts.length) {
            this.emailContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact.email,
                    disableField: false,
                    type: this.email,
                    primary: contact.primary,
                });
            });
            const primaryEmail: MemberContactListDisplay[] = this.contactList.filter((eachContact) => eachContact.primary);
            this.selectedValue = primaryEmail.length ? primaryEmail[0] : this.contactList[0];
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.noemailaddress"],
                disableField: true,
            });
        }
        if (this.textContacts.length) {
            this.textContacts.forEach((contact) => {
                this.contactList.push({
                    contact: contact,
                    disableField: false,
                    type: this.phoneNumber,
                    formatted: this.utilService.formatPhoneNumber(contact),
                });
            });
            if (!this.selectedValue) {
                this.selectedValue = this.contactList[1];
            }
        } else {
            this.contactList.push({
                contact: this.languageStrings["primary.portal.headset.nomobile"],
                disableField: true,
            });
        }
        const savedContact = this.contactList.filter((contact) => contact.type).pop();
        if (savedContact) {
            this.hasMemberContact = true;
        }
        this.contactForm.addControl("contacts", this.addControlGroup(false, this.selectedValue));
        this.loadSpinner = false;
    }

    //  Add multiple form controls in required forms
    addControlGroup(required: boolean, value: string | boolean): FormControl {
        return required ? this.fb.control(value, Validators.required) : this.fb.control(value);
    }

    /**
     * skip signature request to customer and sends signature
     */
    skipAndSend(): void {
        this.dialogRef.close();
    }

    /**
     * sends signature request to customer and sends signature
     */
    sendToCustomer(): void {
        this.loadSpinner = true;
        this.sendRequestToSign();
    }

    /**
     * Add contact info if missing
     */
    addContactInfo(): void {
        const url = `${this.routeAfterLogin}/${this.mpGroup}/member/${this.memberId}/memberadd/`;
        this.router.navigate([url]);
        this.dialogRef.close();
    }

    /**
     * sends signature request to customer
     */
    sendRequestToSign(): void {
        const requestData =
            this.contactForm.value.contacts.type === this.email
                ? { email: this.contactForm.value.contacts.contact }
                : { phoneNumber: this.contactForm.value.contacts.contact };

        this.aflacAlwaysService
            .requestAflacAlwaysSignature(this.mpGroup, this.memberId, requestData)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.loadSpinner = false;
                    this.dialogRef.close();
                },
                () => {
                    this.loadSpinner = false;
                    this.showError = true;
                    this.errorMessage = this.secondaryLanguageString["secondary.portal.common.errorSendingRequestSignature"];
                },
            );
    }

    /**
     * Angular Lifecycle method, called when component is destroyed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
