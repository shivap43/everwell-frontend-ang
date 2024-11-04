import { Component, Inject, OnDestroy, OnInit } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { EmailTypes, EnrollmentService, MemberService } from "@empowered/api";
import { ProfileChangesConfirmPromptComponent } from "@empowered/ui";
import { Store } from "@ngxs/store";
import {
    ClientErrorResponseCode,
    ClientErrorResponseType,
    ConfigName,
    MemberData,
    ActivityPageCode,
    RegistrationStatus,
    ContactType,
    CorrespondenceType,
    EmailContact,
    UserContactParameters,
    MemberContact,
} from "@empowered/constants";
import { Observable, of, Subscription } from "rxjs";
import { filter, switchMap, tap } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { StaticUtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

const EMAIL_ADDRESS_CHECK = "emailAddresses";
const EMAIL_FORM_CONTROL = "emailInput";

@Component({
    selector: "empowered-edelivery-prompt",
    templateUrl: "./edelivery-prompt.component.html",
    styleUrls: ["./edelivery-prompt.component.scss"],
})
export class EDeliveryPromptComponent implements OnInit, OnDestroy {
    // boolean to control the display of step 1 of e-delivery prompt
    step1 = true;
    // boolean to control the display of step 2 of e-delivery prompt when the user does not have an existing email
    step2NoEmail = false;
    // boolean to control the display of step 2 of e-delivery prompt when the user has an existing email
    step2WithEmail = false;
    // boolean to control the display of step 2 of e-delivery prompt (when the user wants to edit his existing email)
    step3 = false;
    // boolean to control the display of the final step of e-delivery prompt
    step4 = false;
    memberId: number;
    mpGroup: number;
    memberEmail: string;
    emailForm: FormGroup;
    getMemberContactData: MemberContact[];
    primaryEmailAddresses: (EmailContact & UserContactParameters)[] = [];
    subscriptions: Subscription[] = [];
    getMemberContactHomeData: MemberContact;
    getMemberContactWorkData: MemberContact;
    ERROR = "error";
    DETAILS = "details";
    isLoading = false;
    languageStrings = {
        emailAddress: this.languageService.fetchPrimaryLanguageValue("primary.portal.members.contactLabel.emailAddress"),
    };
    isStandaloneDemographicEnabled: boolean;

    constructor(
        public dialogRef: MatDialogRef<boolean>,
        @Inject(MAT_DIALOG_DATA) readonly memberData: MemberData,
        private readonly store: Store,
        private fb: FormBuilder,
        private memberService: MemberService,
        private readonly sharedService: SharedService,
        private readonly enrollmentService: EnrollmentService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly languageService: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    /**
     * method called on component initialization
     * fetching mpGroup, memberId, memberData from store
     * calling functions to fetch member's address, work contact and home contact details
     */
    ngOnInit(): void {
        const regex = this.store.selectSnapshot((state) => state.core.regex);
        this.mpGroup = this.memberData.account.id;
        this.memberId = this.memberData.info.id;
        this.emailForm = this.fb.group({
            emailInput: ["", [Validators.required, Validators.pattern(regex.EMAIL)]],
        });
        this.getAddresses();
        this.getWorkData();
        this.getHomeData();
        this.getConfigurations();
    }
    /**
     * Used to get configuration from backend
     */
    getConfigurations(): void {
        // Config to check if Standalone Demographic Change is enabled
        this.subscriptions.push(
            this.sharedService
                .getStandardDemographicChangesConfig()
                .subscribe((isStandaloneDemographicEnabled) => (this.isStandaloneDemographicEnabled = isStandaloneDemographicEnabled)),
        );
    }
    /**
     * getMemberContacts api call to fetch primary email address of member
     */
    getAddresses(): void {
        this.subscriptions.push(
            this.memberService
                .getMemberContacts(this.memberId, this.mpGroup.toString())
                .pipe(filter((response) => Boolean(response.length)))
                .subscribe((response) => {
                    response.forEach((contact) => {
                        this.primaryEmailAddresses.push(...contact.emailAddresses.filter((eachEmail) => eachEmail.primary));
                    });
                }),
        );
    }
    /**
     * getMemberContact api call to fetch member's work contact details
     */
    getWorkData(): void {
        this.subscriptions.push(
            this.memberService.getMemberContact(this.memberId, ContactType.WORK, this.mpGroup.toString()).subscribe((response) => {
                this.getMemberContactWorkData = response.body;
            }),
        );
    }
    /**
     * getMemberContact api call to fetch member's home contact details
     */
    getHomeData(): void {
        this.subscriptions.push(
            this.memberService.getMemberContact(this.memberId, ContactType.HOME, this.mpGroup.toString()).subscribe((response) => {
                this.getMemberContactHomeData = response.body;
            }),
        );
    }
    /**
     * method called on clicking the "switch to e-delivery" button on the first step of e-delivery prompt
     * based to memberEmail availability we decide the next step to be displayed
     */
    onSwitch(): void {
        this.memberEmail = this.primaryEmailAddresses.length ? this.primaryEmailAddresses[0].email : "";
        if (this.memberEmail) {
            this.emailForm.controls[EMAIL_FORM_CONTROL].patchValue(this.memberEmail);
            this.step2WithEmail = true;
        } else {
            this.step2NoEmail = true;
        }
        this.step1 = false;
    }
    /**
     * method to close the dialog on clicking "Got-it" in the last step
     */
    completePreferenceChange(): void {
        this.sharedService.changeCurrentMemberEDeliveryAccess(true);
        this.dialogRef.close();
    }
    /**
     * method called when user clicks on edit option to edit his existing email stored on file
     */
    onEdit(): void {
        this.step3 = true;
        this.emailForm.controls[EMAIL_FORM_CONTROL].patchValue(this.memberEmail);
        this.step2WithEmail = false;
    }
    /**
     * method called to update email as well as change delivery preference of user on click of "update & finish" button
     * It will display ProfileChangesConfirmPromptComponent if the employee has CIF number and changed email
     * then updates the data on confirm, else updates the data without displaying the confirmation modal
     * @return void
     */
    updateEmailAndDeliveryChange(): void {
        if (!this.emailForm.invalid) {
            if (
                this.memberData.info?.customerInformationFileNumber &&
                this.memberEmail !== this.emailForm.controls[EMAIL_FORM_CONTROL].value &&
                this.isStandaloneDemographicEnabled
            ) {
                this.displayConfirmationModalAndUpdate();
            } else {
                this.finishEmailUpdate();
            }
        }
    }
    /**
     * method checks if the employee has CIF number and calls displayConfirmationModalAndUpdate() method
     * to display "ProfileChangesConfirmPromptComponent" confirmation modal
     * else updates the data without displaying the confirmation modal
     * @returns void
     */
    updateEmailData(): void {
        if (this.emailForm.invalid) {
            if (!this.emailForm.controls[EMAIL_FORM_CONTROL].value) {
                this.emailForm.controls.emailInput.markAsTouched();
            }
        } else {
            if (this.memberData.info?.customerInformationFileNumber && this.isStandaloneDemographicEnabled) {
                this.displayConfirmationModalAndUpdate();
            } else {
                this.finishEmailUpdate();
            }
        }
    }
    /**
     * method to display "ProfileChangesConfirmPromptComponent" confirmation modal
     * and to call method to update data based on the confirmation
     * @returns void
     */
    displayConfirmationModalAndUpdate(): void {
        this.subscriptions.push(
            this.empoweredModalService
                .openDialog(ProfileChangesConfirmPromptComponent, {
                    data: {
                        data: [`${this.languageStrings.emailAddress} : ${this.emailForm.controls[EMAIL_FORM_CONTROL].value}`],
                        isAgentAssisted: false,
                    },
                })
                .afterClosed()
                .pipe(
                    filter((isSaved) => !!isSaved),
                    switchMap(() => this.emailUpdate()),
                )
                .subscribe(
                    () => {
                        this.deliveryPreferenceUpdate();
                        this.step2NoEmail = false;
                        this.step3 = false;
                        this.step4 = true;
                    },
                    (error) => this.handleError(error),
                ),
        );
    }
    /**
     * method called to add new email as well as change delivery preference of user on click of "finish"
     * button or "confirm" button in the "ProfileChangesConfirmPromptComponent" modal
     * @returns void
     */
    finishEmailUpdate(): void {
        this.subscriptions.push(
            this.emailUpdate().subscribe(
                () => {
                    this.deliveryPreferenceUpdate();
                    this.step2NoEmail = false;
                    this.step3 = false;
                    this.step4 = true;
                },
                (error) => this.handleError(error),
            ),
        );
    }
    /**
     * method called to change delivery preference of user on click of "confirm & finish" button
     */
    updateDeliveryPreference(): void {
        this.deliveryPreferenceUpdate();
        this.step2WithEmail = false;
        this.step4 = true;
    }
    /**
     * method to move back to the previous screen on click of the "back" button
     */
    back(): void {
        if (this.step3) {
            this.step3 = false;
            this.step2WithEmail = true;
        } else if (this.step2WithEmail) {
            this.step2WithEmail = false;
            this.step1 = true;
        } else if (this.step2NoEmail) {
            this.emailForm.controls[EMAIL_FORM_CONTROL].patchValue("");
            this.step2NoEmail = false;
            this.step1 = true;
        }
    }
    /**
     * method to add or update email of user
     * saveMemberContact api is called to store the latest changes on file
     */
    emailUpdate(): Observable<void> {
        if (this.primaryEmailAddresses.length) {
            if (this.primaryEmailAddresses[0].type === ContactType.WORK) {
                this.getMemberContactWorkData.emailAddresses.forEach((email) => {
                    if (email.primary) {
                        email.email = this.emailForm.controls[EMAIL_FORM_CONTROL].value;
                    }
                });
                return this.memberService.saveMemberContact(
                    this.memberId,
                    ContactType.WORK,
                    this.getMemberContactWorkData,
                    this.mpGroup?.toString(),
                );
            }
            this.getMemberContactHomeData.emailAddresses.forEach((email) => {
                if (email.primary) {
                    email.email = this.emailForm.controls[EMAIL_FORM_CONTROL].value;
                }
            });
            return this.memberService.saveMemberContact(
                this.memberId,
                ContactType.HOME,
                this.getMemberContactHomeData,
                this.mpGroup?.toString(),
            );
        }
        {
            const emailData = {
                email: this.emailForm.controls[EMAIL_FORM_CONTROL].value,
                type: EmailTypes.PERSONAL,
                primary: true,
                verified: false,
            };
            if (this.getMemberContactHomeData.emailAddresses.length) {
                this.getMemberContactHomeData.emailAddresses
                    .filter((email) => email.primary)
                    .forEach((result) => (result.email = this.emailForm.controls[EMAIL_FORM_CONTROL].value));
            } else {
                this.getMemberContactHomeData.emailAddresses.push(emailData);
            }
            return this.memberService.saveMemberContact(
                this.memberId,
                ContactType.HOME,
                this.getMemberContactHomeData,
                this.mpGroup.toString(),
            );
        }
    }

    /**
     * This method is used to handle error for Member contact API.
     * @param err error object of type interface ERROR
     * @returns void
     */
    handleError(err: Error): void {
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length) {
            for (const detail of error[this.DETAILS]) {
                if (detail.field === EMAIL_ADDRESS_CHECK && detail.code === ClientErrorResponseType.DUPLICATE) {
                    this.emailForm.controls[EMAIL_FORM_CONTROL].setErrors({ duplicate: true });
                }
            }
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.code === ClientErrorResponseType.DUPLICATE) {
            this.emailForm.controls[EMAIL_FORM_CONTROL].setErrors({ duplicate: true });
        }
    }

    /**
     * method to update delivery preference of user
     * updateMember api is called to store the latest delivery preference on file
     */
    deliveryPreferenceUpdate(): void {
        this.isLoading = true;
        const memberInfo = { ...this.memberData.info };
        const profile = { ...memberInfo.profile };
        profile.correspondenceType = CorrespondenceType.ELECTRONIC;
        profile.correspondenceLocation = ContactType.HOME;
        memberInfo.profile = { ...profile };
        this.subscriptions.push(
            this.memberService
                .updateMember(memberInfo, this.mpGroup.toString(), this.memberId.toString())
                .pipe(
                    switchMap((response) => {
                        if (
                            !memberInfo?.registrationStatus ||
                            !(
                                memberInfo.registrationStatus === RegistrationStatus.CIAM_BASIC ||
                                memberInfo.registrationStatus === RegistrationStatus.CIAM_FULL
                            )
                        ) {
                            return this.enrollmentService.registerCustomer(
                                ActivityPageCode.E_DELIVERY_PROMPT_COMPONENT,
                                this.memberId,
                                this.mpGroup,
                            );
                        }
                        return of(null);
                    }),
                )
                .subscribe(
                    (response) => (this.isLoading = false),
                    (error) => (this.isLoading = false),
                ),
        );
    }
    /**
     * method to unsubscribe from all active subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
    }
}
