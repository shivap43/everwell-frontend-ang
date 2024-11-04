import {
    ClientErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    PhoneNumber,
    AppSettings,
    MemberListItem,
    AdminCredential,
    Admin,
} from "@empowered/constants";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { AdminService } from "@empowered/api";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import { Subscription, Observable, Subject } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { retry, switchMap, takeUntil } from "rxjs/operators";
import { StaticUtilService, AccountListState, SharedState } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

const PHONE_NUMBER_REPLACE_REGEX = /[-]/g;
const ERROR = "error";

@Component({
    selector: "empowered-add-admin-manually",
    templateUrl: "./add-admin-manually.component.html",
    styleUrls: ["./add-admin-manually.component.scss"],
})
export class AddAdminManuallyComponent implements OnInit, OnDestroy {
    mpGroupId: number;
    addManuallyForm: FormGroup;
    editAdminForm: FormGroup;
    formBody: unknown;
    firstName: string;
    lastName: string;
    emailAddress: any;
    roleId: number;
    formTitle: string;
    dataSource: Admin[];
    emailsList = [];
    emailFlag = false;
    adminRoles: any;
    namesArray: any;
    searchAdminSubscription: Subscription;
    searchedAdmin: any;
    adminFoundFlag: boolean;
    phoneNumber: string;
    validationRegex: any;
    fName: string;
    lName: string;
    showErrorMessage = false;
    isSpinnerLoading = false;
    errorMessage: string;
    readonly PHONE_NUMBER_MAX_LENGTH = PhoneNumber.MAX_LENGTH;
    @Select(SharedState.regex) regex$: Observable<any>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.administrators.addAdmin.firstName",
        "primary.portal.administrators.addAdmin.secondName",
        "primary.portal.census.manualEntry.emailAddress",
        "primary.portal.administrators.phoneNumber",
        "primary.portal.administrators.filterRole",
        "primary.portal.administrators.editAdministrator",
        "primary.portal.administrators.editTpaAdminintrator",
        "primary.portal.common.requiredField",
        "primary.portal.administrators.enterValidName",
        "primary.portal.administrators.enterValidEmail",
        "primary.portal.administrators.enterValidPhone",
        "primary.portal.common.add",
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.optional",
        "primary.portal.common.placeholderSelect",
        "primary.portal.administrator.update",
        "primary.portal.administrators.addAdministrator",
        "primary.portal.administrator.phoneNumber.exists.error",
        "primary.portal.assignAdmin.addManually.emailUsedImportMessage",
        "primary.portal.administrators.email",
        "primary.portal.administrators.enteredEmail.matchWithExistingEmployee",
        "primary.portal.administrators.enteredFirstLastName.matchWithExistingEmployee",
        "primary.portal.administrators.enteredPhoneNumber.matchWithExistingEmployee",
        "primary.portal.administrators.enteredPhoneNumber.matchWithExistingAdmin",
    ]);

    showReportsTo: boolean;
    isAdmin = false;
    loggedInAdminId: number;
    nameMatchesWithExistingEmp = false;
    firstAndLastNameMatch: SafeHtml;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly dialogRef: MatDialogRef<AddAdminManuallyComponent>,
        private readonly fb: FormBuilder,
        private readonly adminService: AdminService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly userService: UserService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
        private readonly domSanitizer: DomSanitizer,
    ) {
        this.isAdmin = this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_ADMIN;
        if (this.isAdmin) {
            this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: AdminCredential) => {
                if (credential.adminId) {
                    this.loggedInAdminId = credential.adminId;
                }
            });
        }
    }

    ngOnInit(): void {
        this.isSpinnerLoading = true;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.admin.reportsTo")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    if (resp) {
                        this.showReportsTo = resp;
                    } else {
                        this.showReportsTo = false;
                    }
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );

        this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
        if (this.data.editAdministrator === true) {
            this.fName = this.data.selectedAdmin.name.firstName;
            this.lName = this.data.selectedAdmin.name.lastName;
            if (this.showReportsTo) {
                this.data.allAdmins = this.data.allAdmins.filter((result) => result.reportsTo.id !== this.data.selectedAdmin.id);
            }
        }
        if (
            this.data.selectedAdmin &&
            this.data.selectedAdmin.reportsTo &&
            !this.data.allAdmins.find((admin) => admin.id === this.data.selectedAdmin.reportsTo.id)
        ) {
            this.adminService
                .getAdmin(this.data.selectedAdmin.reportsTo.id)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((admin: any) => {
                    this.data.allAdmins = [...this.data.allAdmins, admin];
                });
        }
        this.serviceCalls();

        this.formValidations();

        if (this.data.selectedAdmin) {
            this.data.allAdmins = this.data.allAdmins.filter((admin) => admin.id !== this.data.selectedAdmin.id);
        }
        this.firstAndLastNameMatch = this.domSanitizer.bypassSecurityTrustHtml(
            this.languageStrings["primary.portal.administrators.enteredFirstLastName.matchWithExistingEmployee"],
        );
    }

    formValidations(): void {
        const defaultReportsTo: string =
            this.data.selectedAdmin && this.data.selectedAdmin.reportsTo ? this.data.selectedAdmin.reportsTo.id : "";

        this.addManuallyForm = this.fb.group(
            {
                firstName: [
                    this.data.editAdministrator ? this.fName : null,
                    [Validators.pattern(this.validationRegex.NAME), Validators.required],
                ],
                lastName: [
                    this.data.editAdministrator ? this.lName : null,
                    [Validators.pattern(this.validationRegex.NAME), Validators.required],
                ],
                emailAddress: [
                    this.data.editAdministrator ? this.data.selectedAdmin.emailAddress : null,
                    [Validators.pattern(this.validationRegex.EMAIL), Validators.required],
                ],
                phoneNumber: [
                    this.data.editAdministrator ? this.data.selectedAdmin.phoneNumber : null,
                    Validators.pattern(new RegExp(this.validationRegex.VALID_PHONE)),
                ],
                roleId: [
                    this.data.editAdministrator && this.data.selectedAdmin.role ? this.data.selectedAdmin.role.id : null,
                    [Validators.required],
                ],
                reportsTo: [defaultReportsTo],
            },
            { updateOn: "blur" },
        );
    }

    disableEditFields(): void {
        if (this.data.editAdministrator === true) {
            this.addManuallyForm.controls["firstName"].disable();
            this.addManuallyForm.controls["lastName"].disable();
            const emailAddressControl = this.addManuallyForm.controls["emailAddress"];
            const phoneNumberControl = this.addManuallyForm.controls["phoneNumber"];
            if (this.isAdmin && this.loggedInAdminId === this.data.selectedAdmin.id) {
                emailAddressControl.enable();
                phoneNumberControl.enable();
            } else {
                emailAddressControl.disable();
                phoneNumberControl.disable();
            }
        }
    }

    numberValidation(event: any): void {
        if (event.type === "keypress" && !(event.keyCode <= 57 && event.keyCode >= 48)) {
            event.preventDefault();
        }
    }

    serviceCalls(): void {
        this.adminService
            .getAccountAdminRoles(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.adminRoles = resp;
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.api." + error.error.status + "." + error.error.code,
                    );
                },
            );
    }

    /**
     * function to check entered email is match with any existing admin on blur
     * @param email Entered email in form by user
     * @param onEdit to identify add/edit admin modal is opened
     */
    onSearch(email: FormControl, onEdit: boolean): any {
        if (this.addManuallyForm.controls.emailAddress.valid) {
            const query = {
                property: "emailAddress",
                value: email,
            };
            // restricting from search for email already exists, when email edited is same as previous irrespective of letter's case
            if (!(onEdit && email.toString().toLowerCase() === this.data.selectedAdmin.emailAddress.toLowerCase())) {
                this.adminService
                    .searchAccountAdmins(query)
                    .pipe(takeUntil(this.unsubscribe$))
                    .subscribe(
                        (response) => {
                            this.adminFoundFlag = false;
                            if (response.length !== 0) {
                                this.searchedAdmin = response[0];
                            } else {
                                this.searchedAdmin = null;
                            }
                            this.checkExistingEmails();
                        },
                        () => {},
                    );
                this.checkExistingEmployeeEmail(email);
            }
        }
    }
    /**
     * function to check admin email exist or not.If admin email not exist then set the error
     * @returns void
     */
    checkExistingEmails(): void {
        if (this.searchedAdmin) {
            this.adminFoundFlag = true;
        }
        // if entered email address matches any of the existing admin emails then set inline error message
        if (this.adminFoundFlag) {
            this.addManuallyForm.controls.emailAddress.setErrors({ incorrect: true });
        }
    }

    /**
     * function to check entered email in form by user is match with any existing employee on blur, If employee exist then set error.
     * Also, check for existing employee first/last name match with first/last name enter by user in form.
     * If match then set flag to show alert.
     * @param email Entered email in form by user
     * @returns void
     */
    checkExistingEmployeeEmail(email: FormControl): void {
        const existingEmployee: MemberListItem[] = this.data.employeeList.filter(
            (member) => member.email?.toLowerCase() === email.toString().toLowerCase(),
        );
        if (existingEmployee.length && existingEmployee[0].email.toLowerCase() === email.toString().toLowerCase()) {
            this.addManuallyForm.controls.emailAddress.setErrors({ existingEmployee: true });
        }
        this.nameMatchesWithExistingEmp =
            existingEmployee.length &&
            existingEmployee[0].firstName === this.addManuallyForm.controls.firstName.value &&
            existingEmployee[0].lastName === this.addManuallyForm.controls.lastName.value;
    }

    /**
     * function to check first/last name enter by user in form is match with any existing employee, If match then set flag to show alert.
     */
    checkExistingEmployeeName(): void {
        this.nameMatchesWithExistingEmp = false;
        if (this.addManuallyForm.controls.firstName.value && this.addManuallyForm.controls.lastName.value) {
            const existingEmployee: MemberListItem[] = this.data.employeeList.filter(
                (member) =>
                    member.firstName.toLowerCase() === this.addManuallyForm.controls.firstName.value.toLowerCase() &&
                    member.lastName.toLowerCase() === this.addManuallyForm.controls.lastName.value.toLowerCase(),
            );
            if (existingEmployee.length > 0) {
                this.nameMatchesWithExistingEmp = true;
            }
        }
    }

    getExistingEmailError(): string {
        return this.addManuallyForm.get("emailAddress").hasError("incorrect")
            ? "primary.portal.assignAdmin.addManually.emailUsedImportMessage"
            : "primary.portal.administrators.enterValidEmail";
    }

    /**
     * Adding Admin users manually
     * @returns Nothing
     */
    addAdminManually(): void {
        if (this.addManuallyForm.invalid) {
            return;
        }
        this.isSpinnerLoading = true;
        this.firstName = this.addManuallyForm.controls.firstName.value;
        this.lastName = this.addManuallyForm.controls.lastName.value;
        this.emailAddress = this.addManuallyForm.controls.emailAddress.value;
        this.roleId = this.addManuallyForm.controls.roleId.value;
        if (this.addManuallyForm.controls.phoneNumber.value) {
            this.phoneNumber = this.addManuallyForm.controls.phoneNumber.value.replace(PHONE_NUMBER_REPLACE_REGEX, "");
        }
        const reportsTo: number = this.addManuallyForm.controls.reportsTo.value;

        this.formBody = {
            type: "ACCOUNT",
            name: {
                firstName: this.firstName,
                lastName: this.lastName,
            },
            phoneNumber: this.phoneNumber,
            emailAddress: this.emailAddress,
            roleId: this.roleId,
            reportsToId: reportsTo,
        };
        if (this.data.editAdministrator === false) {
            this.adminService
                .createAdmin(this.mpGroupId, this.formBody)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (resp) => {
                        this.dialogRef.close(true);
                        this.isSpinnerLoading = false;
                        this.adminService.updateAdminList(true);
                    },
                    (error) => {
                        this.showErrorAlertMessage(error);
                    },
                );
        }
    }
    /**
     * Update admin users
     * @returns Nothing
     */
    updateAdmin(): void {
        if (this.addManuallyForm.invalid) {
            return;
        }
        this.isSpinnerLoading = true;
        let roleIdPopulated;
        this.adminRoles.forEach((element) => {
            if (element.id === this.addManuallyForm.controls.roleId.value) {
                roleIdPopulated = element.id;
            }
        });
        // Admin object has been editted, safer to just get it again
        this.adminService
            .getAdmin(this.data.selectedAdmin.id)
            .pipe(
                retry(3),
                switchMap((admin) => {
                    admin.name.firstName = this.addManuallyForm.controls.firstName.value;
                    admin.name.lastName = this.addManuallyForm.controls.lastName.value;
                    admin.emailAddress = this.addManuallyForm.controls.emailAddress.value;
                    admin.roleId = roleIdPopulated;
                    admin.phoneNumber = this.addManuallyForm.controls.phoneNumber.value
                        ? this.addManuallyForm.controls.phoneNumber.value.replace(PHONE_NUMBER_REPLACE_REGEX, "")
                        : null;
                    admin.reportsToId = this.addManuallyForm.controls.reportsTo.value;
                    return this.adminService.updateAccountAdmin(admin, this.mpGroupId).pipe(retry(3));
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (success) => {
                    this.dialogRef.close();
                    this.isSpinnerLoading = false;
                    this.adminService.updateAdminList(true);
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            );
    }
    /**
     * This method is used to show error messages when the API call fails.
     * @param err error object of type ERROR
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[ERROR];
        this.showErrorMessage = true;
        this.isSpinnerLoading = false;
        if (error.status === ClientErrorResponseCode.RESP_400 && error.details && error.details.length) {
            if (error.details[0].code === ClientErrorResponseDetailCodeType.VALID_EMAIL) {
                this.showErrorMessage = false;
                this.addManuallyForm.controls.emailAddress.setErrors({
                    invalid: true,
                });
            } else if (error.details[0].field === ClientErrorResponseDetailCodeType.EMAIL) {
                this.showErrorMessage = false;
                this.addManuallyForm.controls.emailAddress.setErrors({
                    existingEmployee: true,
                });
            } else {
                this.errorMessage = error.details[0].message;
            }
            const phoneConstAdmin = "phoneNumber";
            const phoneConstEmp = "phone";
            const duplicateAdminPhn = error.details.some((detail) => detail.field === phoneConstAdmin);
            const duplicateEmpPhn = error.details.some((detail) => detail.field === phoneConstEmp);
            if (duplicateAdminPhn || duplicateEmpPhn) {
                this.showErrorMessage = false;
                this.addManuallyForm.controls.phoneNumber.setErrors({
                    invalid: true,
                });
                this.errorMessage = duplicateAdminPhn
                    ? this.languageStrings["primary.portal.administrators.enteredPhoneNumber.matchWithExistingAdmin"]
                    : this.languageStrings["primary.portal.administrators.enteredPhoneNumber.matchWithExistingEmployee"];
            }
        } else if (error.status === ClientErrorResponseCode.RESP_409) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.addAdminManually.duplicateEmailImportMessage");
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * function to check entered phone number in form by user is match with any existing employee on blur, If employee exist then set error.
     * If match then set flag to show alert.
     * @returns void
     */
    checkExistingEmployeePhone(): void {
        this.phoneNumber = null;
        if (this.addManuallyForm.controls.phoneNumber.valid) {
            const PHONE_REPLACE_REGEX = /[-() ]/g;
            const adminPhoneNumber = this.addManuallyForm.controls.phoneNumber.value
                ? this.addManuallyForm.controls.phoneNumber.value.replace(PHONE_REPLACE_REGEX, "")
                : null;
            const existingEmployee: MemberListItem[] = this.data.employeeList.filter(
                (member) => member.phoneNumber.replace(PHONE_REPLACE_REGEX, "") === adminPhoneNumber,
            );
            if (existingEmployee.length) {
                this.addManuallyForm.controls.phoneNumber.setErrors({ existingEmployee: true });
            }
        }
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    closeForm(): void {
        this.dialogRef.close(false);
    }
}
