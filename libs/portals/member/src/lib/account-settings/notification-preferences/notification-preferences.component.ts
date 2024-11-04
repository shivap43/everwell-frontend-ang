import { UserService } from "@empowered/user";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MemberService } from "@empowered/api";
import { MemberProfile } from "@empowered/constants";
import { Subscription } from "rxjs";

@Component({
    selector: "empowered-notification-preferences",
    templateUrl: "./notification-preferences.component.html",
    styleUrls: ["./notification-preferences.component.scss"],
})
export class NotificationPreferencesComponent implements OnInit, OnDestroy {
    notificationsLanguagePath = "primary.portal.members.settings.notifications";
    notificationPreferenceForm: FormGroup;
    memberId: number;
    memberProfile: MemberProfile;
    primaryEmail: any;
    primaryPhone: any;
    isSaved = false;
    isLoading = false;
    initialNotificationPreference = "EMAIL" || "PHONE";

    userSubscription: Subscription;
    memberSubscription: Subscription;
    memberContactSubscription: Subscription;
    updateMemberSubscription: Subscription;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.members.settings.notifications.title",
        "primary.portal.members.settings.notifications.header",
        "primary.portal.members.settings.notifications.save",
        "primary.portal.members.settings.notifications.updateVerifyContact",
        "primary.portal.common.saved",
        "primary.portal.members.contactLabel.notificationPreferences.primaryPhone",
        "primary.portal.members.contactLabel.notificationPreferences.primaryEmail",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly memberService: MemberService,
        private readonly userService: UserService,
    ) {}

    ngOnInit(): void {
        this.notificationPreferenceForm = this.formBuilder.group({});
        this.notificationPreferenceForm.addControl("notificationPreference", this.formBuilder.control({}));
        this.userSubscription = this.userService.credential$.subscribe((credential) => {
            if ("memberId" in credential) {
                this.isLoading = true;
                this.memberId = credential.memberId;
                this.memberSubscription = this.memberService.getMember(this.memberId, true).subscribe((member) => {
                    this.memberProfile = member.body;

                    this.initialNotificationPreference =
                        this.memberProfile.profile === undefined ? undefined : this.memberProfile.profile.communicationPreference;

                    this.notificationPreferenceForm = this.formBuilder.group({
                        notificationPreference: this.formBuilder.control(this.initialNotificationPreference, Validators.required),
                    });

                    this.notificationPreferenceForm.valueChanges.subscribe(() => {
                        this.isSaved = false;
                    });
                    this.memberContactSubscription = this.memberService.getMemberContacts(this.memberId).subscribe((contacts) => {
                        if (contacts.length > 0) {
                            for (const contact of contacts) {
                                if (contact.emailAddresses !== undefined && contact.emailAddresses.length > 0) {
                                    const filteredEmails = contact.emailAddresses.filter((emailAddress) => emailAddress.primary);
                                    if (filteredEmails.length) {
                                        this.primaryEmail = filteredEmails[0];
                                    }
                                }
                                if (contact.phoneNumbers !== undefined && contact.phoneNumbers.length > 0) {
                                    const filteredPhoneNumbers = contact.phoneNumbers.filter((phoneNumber) => phoneNumber.primary);
                                    if (filteredPhoneNumbers.length) {
                                        this.primaryPhone = filteredPhoneNumbers[0];
                                    }
                                }
                            }
                            this.isLoading = false;
                            if (this.primaryPhone === undefined && document.getElementById("noPrimaryPhone") !== null) {
                                document.getElementById("noPrimaryPhone").classList.remove("mat-radio-checked");
                            }
                        }
                    });
                });
            }
        });
    }

    onSubmit(submittedForm: any): void {
        this.memberProfile.profile.communicationPreference = submittedForm.value.notificationPreference;
        this.updateMemberSubscription = this.memberService.updateMember(this.memberProfile).subscribe((response) => {
            this.isSaved = true;
            this.initialNotificationPreference = submittedForm.value.notificationPreference;
        });
    }

    ngOnDestroy(): void {
        if (this.userSubscription !== undefined) {
            this.userSubscription.unsubscribe();
        }
        if (this.memberSubscription !== undefined) {
            this.memberSubscription.unsubscribe();
        }
        if (this.memberContactSubscription !== undefined) {
            this.memberContactSubscription.unsubscribe();
        }
        if (this.updateMemberSubscription !== undefined) {
            this.updateMemberSubscription.unsubscribe();
        }
    }
}
