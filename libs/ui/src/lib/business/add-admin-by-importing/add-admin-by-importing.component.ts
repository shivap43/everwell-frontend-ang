import { takeUntil } from "rxjs/operators";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { FormGroup, FormBuilder, FormControl, Validators } from "@angular/forms";
import { Store, Select } from "@ngxs/store";
import { AccountListState } from "@empowered/ngxs-store";
import { SharedState } from "@empowered/ngxs-store";
import { AppSettings } from "@empowered/constants";
import { AdminService } from "@empowered/api";
import { Subscription, Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { Router } from "@angular/router";

const BACK_BUTTON = "Back";
@Component({
    selector: "empowered-add-admin-by-importing",
    templateUrl: "./add-admin-by-importing.component.html",
    styleUrls: ["./add-admin-by-importing.component.scss"],
})
export class AddAdminByImportingComponent implements OnInit, OnDestroy {
    addByImportingForm: FormGroup;
    emailAddress: any;
    mpGroupId: number;
    testData: any;
    searchErrorFlag = false;
    searchAdminSubscription: Subscription;
    searchedAdmin: any;
    isSearched = false;
    adminFoundFlag: boolean;
    adminAccounts: any;
    importSubscription: Subscription;
    admin: any = {};
    isLoading: boolean;
    errorMessage = "";
    errorResponse: boolean;
    accountFlag: boolean;
    isOffering = false;
    private unsubscribe$ = new Subject<void>();
    @Select(SharedState?.regex) regex$: Observable<any>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.administrators.searchForAdmin",
        "primary.portal.administrators.searchByEmailAddress",
        "primary.portal.common.requiredField",
        "primary.portal.administrators.enterValidName",
        "primary.portal.administrators.enterValidEmail",
        "primary.portal.administrators.enterValidPhone",
        "primary.portal.administrators.currentlyAssignedTo",
        "primary.portal.common.close",
        "primary.portal.common.back",
        "primary.portal.common.search",
        "primary.portal.common.cancel",
        "primary.portal.administrators.emailNotFound",
        "primary.portal.administrators.isSearched",
        "primary.portal.administrators.inValidAdmin",
        "primary.portal.administrators.alreadyExists",
        "primary.portal.administrators.addAdministrator",
        "primary.portal.administrators.importAdmin.role",
        "primary.portal.common.next",
    ]);
    errorFlag = false;
    constructor(
        private readonly dialogRef: MatDialogRef<AddAdminByImportingComponent>,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly store: Store,
        private readonly adminService: AdminService,
        private readonly language: LanguageService,
    ) {}

    ngOnInit(): void {
        if (this.router.url.includes("benefits/offering")) {
            this.isOffering = true;
        }
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
            this.addByImportingForm = this.fb.group({
                emailAddress: ["", [Validators.required, Validators.pattern(data.EMAIL)]],
            });
        });
    }

    closeForm(): void {
        this.dialogRef.close(false);
    }
    onSearch(email: FormControl): void {
        if (this.addByImportingForm.valid) {
            this.isLoading = true;
            const query = {
                property: "emailAddress",
                value: email.value,
            };
            this.isSearched = true;
            this.searchErrorFlag = false;
            this.errorFlag = false;
            this.adminService
                .searchAccountAdmins(query)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    if (response.length !== 0) {
                        this.addByImportingForm.controls.emailAddress.setErrors(null);
                        this.searchedAdmin = response[0];
                        this.adminAccounts = this.searchedAdmin.accounts;
                        if (this.searchedAdmin !== null) {
                            this.adminFoundFlag = true;
                        }
                    } else {
                        if (!this.addByImportingForm.controls.emailAddress.hasError("pattern")) {
                            this.addByImportingForm.controls.emailAddress.setErrors({
                                invalid: true,
                            });
                        }
                        this.adminFoundFlag = false;
                    }
                    if (this.adminAccounts && this.adminAccounts.length !== 0) {
                        this.accountFlag = true;
                    }
                    this.isLoading = false;
                });
        }
    }
    onImport(): void {
        if (this.isSearched === true) {
            this.isLoading = true;
            this.admin.adminId = this.searchedAdmin.id;
            this.adminService
                .importAdmin(this.mpGroupId, this.admin)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.isLoading = false;
                        this.dialogRef.close(true);
                        this.adminService.updateAdminList(true);
                    },
                    (error) => {
                        this.isLoading = false;
                        this.errorFlag = true;
                        if (error.status === AppSettings.API_RESP_400) {
                            this.errorMessage = this.languageStrings["primary.portal.administrators.inValidAdmin"];
                        } else if (error.status === AppSettings.API_RESP_409) {
                            this.errorMessage = this.languageStrings["primary.portal.administrators.alreadyExists"];
                        }
                    },
                );
        } else {
            this.isLoading = false;
            this.searchErrorFlag = true;
            this.errorMessage = this.languageStrings["primary.portal.administrators.isSearched"];
        }
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    onBack(): void {
        this.dialogRef.close(BACK_BUTTON);
    }
}
