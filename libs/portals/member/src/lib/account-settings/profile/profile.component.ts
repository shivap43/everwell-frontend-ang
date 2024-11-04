import { UserState } from "@empowered/user";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup } from "@angular/forms";
import { AdminService } from "@empowered/api";
import { ContactInfo, Credential, Admin } from "@empowered/constants";
import { Observable, Subject, combineLatest } from "rxjs";
import { Select } from "@ngxs/store";
import { takeUntil, tap, switchMap } from "rxjs/operators";
import { HttpErrorResponse } from "@angular/common/http";

@Component({
    selector: "empowered-profile",
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
})
export class ProfileComponent implements OnInit, OnDestroy {
    @Select(UserState) credential$: Observable<Credential>;
    profileForm: FormGroup;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.register.personalInfo.firstName",
        "primary.portal.register.personalInfo.middleName",
        "primary.portal.register.personalInfo.lastName",
        "primary.portal.register.personalInfo.emailAddress",
        "primary.portal.register.personalInfo.jobTitle",
        "primary.portal.members.contactLabel.phoneNumber",
        "primary.portal.members.personalLabel.streetAddress1",
        "primary.portal.members.personalLabel.streetAddress2",
        "primary.portal.common.optional",
        "primary.portal.members.personalLabel.city",
        "primary.portal.members.personalLabel.state",
        "primary.portal.members.personalLabel.zip",
        "primary.portal.maintenanceBenefitsOffering.removeContinuousPlan.openEnrollment",
        "primary.portal.dashboard.profile",
        "primary.portal.common.placeholderSelect",
        "primary.portal.common.update",
        "primary.portal.members.personalLabel.personInfo",
        "primary.portal.members.workLabel.workInfo",
        "primary.portal.members.workLabel.ongoing",
        "primary.portal.producerInfo.info",
    ]);
    userInfo: number;
    adminData: Admin;
    adminContactData: ContactInfo;
    isSpinnerLoading: boolean;
    errorMessage: string;

    constructor(
        private readonly language: LanguageService,
        private readonly fb: FormBuilder,
        private readonly adminService: AdminService,
    ) {}

    /**
     * Initial method that fetches the data required to display through service calls
     */
    ngOnInit(): void {
        this.initializeForm();
        this.isSpinnerLoading = true;
        this.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((credential) => {
                    if ("producerId" in credential) {
                        this.userInfo = credential.producerId;
                    } else if ("adminId" in credential) {
                        this.userInfo = credential.adminId;
                    }
                }),
                switchMap(() =>
                    combineLatest([this.adminService.getAdmin(this.userInfo), this.adminService.getAdminContact(this.userInfo)]),
                ),
            )
            .subscribe(
                (resp) => {
                    this.adminData = resp[0];
                    this.adminContactData = resp[1];

                    if (Object.keys(this.adminData).length) {
                        this.profileForm.controls.firstName.patchValue(this.adminData.name.firstName);
                        this.profileForm.controls.middleName.patchValue(this.adminData.name.middleName);
                        this.profileForm.controls.lastName.patchValue(this.adminData.name.lastName);
                        this.profileForm.controls.emailAddress.patchValue(this.adminData.emailAddress);
                        this.profileForm.controls.phoneNumber.patchValue(this.adminData.phoneNumber);
                    }
                    if (Object.keys(this.adminContactData).length) {
                        this.profileForm.controls.streetAddress1.patchValue(this.adminContactData.address.address1);
                        this.profileForm.controls.streetAddress2.patchValue(this.adminContactData.address.address2);
                        this.profileForm.controls.city.patchValue(this.adminContactData.address.city);
                        this.profileForm.controls.state.patchValue(this.adminContactData.address.state);
                        this.profileForm.controls.zip.patchValue(this.adminContactData.address.zip);
                    }
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.handleApiError(error);
                },
            );
    }
    /**
     * This method initializes the form
     */
    initializeForm(): void {
        this.profileForm = this.fb.group({
            firstName: [""],
            middleName: [""],
            lastName: [""],
            emailAddress: [""],
            phoneNumber: [""],
            streetAddress1: [""],
            streetAddress2: [""],
            city: [""],
            state: [""],
            zip: [""],
        });
        this.profileForm.disable();
    }
    /**
     * Handles Http error and displays error message.
     * @param error type of Http error occurred
     */
    handleApiError(error: HttpErrorResponse): void {
        this.isSpinnerLoading = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * ng life cycle hook
     * used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
