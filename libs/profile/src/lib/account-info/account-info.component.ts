import { EMPTY, Subscription } from "rxjs";
import { Component, OnInit, OnDestroy, AfterViewChecked } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { AccountService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { EditAccountInfoComponent } from "./edit-account-info/edit-account-info.component";
import { MatDialog } from "@angular/material/dialog";

import { SharedState, UtilService } from "@empowered/ngxs-store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UserService } from "@empowered/user";
import { ClientErrorResponseCode, AppSettings, Accounts, AdminRoles } from "@empowered/constants";
import { catchError } from "rxjs/operators";

const PERMISSION_TO_SHOW_NAME = "core.account.update.name",
    PERMISSION_TO_SHOW_SITUS = "core.account.update.situs";

@Component({
    selector: "empowered-account-info",
    templateUrl: "./account-info.component.html",
    styleUrls: ["./account-info.component.scss"],
})
export class AccountInfoComponent implements OnInit, OnDestroy, AfterViewChecked {
    mpGroupId: number;
    accountDetails: Accounts;
    isSpinnerLoading = false;
    isProducer = false;
    isAdmin = false;
    langStrings: Record<string, string>;
    showErrorMessage = false;
    errorMessage = null;
    subscriber: Subscription[] = [];
    isAccountNameAndContactSame = false;
    accountContactTypeIds = {
        PRIMARY: 1,
        BILLING: 2,
    };
    role: AdminRoles;
    allowNameEdit = false;
    allowSitusEdit = false;

    constructor(
        private readonly route: ActivatedRoute,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly userService: UserService,
        private readonly languageService: LanguageService,
        private readonly utilService: UtilService,
        private readonly router: Router,
    ) {
        this.fetchLanguageStrings();

        const params = this.route.parent.parent.snapshot.params;
        this.mpGroupId = this.router.url.indexOf("prospect") !== -1 ? params["prospectId"] : params["mpGroupId"];
    }

    ngOnInit(): void {
        this.getPermission();
        this.getAccountInfo(this.mpGroupId);
        if (this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_PRODUCER) {
            this.isProducer = true;
        } else if (this.store.selectSnapshot(SharedState.portal) === AppSettings.PORTAL_ADMIN) {
            this.isAdmin = true;
        }
        this.subscriber.push(
            this.userService.credential$.subscribe((credential) => {
                if ((credential as any).producerId) {
                    const producerId = (credential as any).producerId;
                    if (producerId) {
                        this.subscriber.push(
                            this.accountService
                                .getAccountAdmin(producerId, this.mpGroupId.toString(), "roleId")
                                .pipe(catchError(() => EMPTY))
                                .subscribe((result) => {
                                    if (result && result.role) {
                                        this.role = result.role;
                                    }
                                }),
                        );
                    }
                }
            }),
        );
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    ngAfterViewChecked(): void {
        this.subscriber.push(
            this.utilService.getRefreshActivity().subscribe((response) => {
                if (response) {
                    this.getAccountInfo(this.mpGroupId);
                    this.utilService.setRefreshActivity(false);
                }
            }),
        );
    }
    getAccountInfo(mpGroupId: number): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.subscriber.push(
            this.accountService.getAccount(mpGroupId.toString()).subscribe(
                (Response) => {
                    this.isSpinnerLoading = false;
                    if (Response) {
                        this.accountDetails = Response;
                        this.getAccountContact(this.accountDetails.name);
                    }
                },
                (Error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(Error);
                },
            ),
        );
    }
    getPermission(): void {
        this.allowNameEdit = this.store.selectSnapshot(SharedState.hasPermission(PERMISSION_TO_SHOW_NAME));
        this.allowSitusEdit = this.store.selectSnapshot(SharedState.hasPermission(PERMISSION_TO_SHOW_SITUS));
    }
    getAccountContact(accountName: any): void {
        this.hideErrorAlertMessage();
        this.subscriber.push(
            this.accountService.getAccountContacts("typeId").subscribe(
                (Response) => {
                    // For Primary contacts as they will always have id 1
                    const primary = Response.find((x) => x.type && x.type.id === this.accountContactTypeIds.PRIMARY);
                    this.isAccountNameAndContactSame = primary && primary.name === accountName ? true : false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            ),
        );
    }
    openEditPopup(): void {
        const dialogConfig = {
            disableClose: false,
            width: "500px",
            height: "auto",
            panelClass: "edit-account-info",
            data: {
                accountDetails: this.accountDetails,
                mpGroupId: this.mpGroupId,
                isProducer: this.isProducer,
                isAdmin: this.isAdmin,
                allowNameEdit: this.allowNameEdit,
                allowSitusEdit: this.allowSitusEdit,
                isAccountNameAndContactSame: this.isAccountNameAndContactSame,
                role: this.role,
            },
        };
        const dialogRef = this.dialog.open(EditAccountInfoComponent, dialogConfig);
        this.subscriber.push(
            dialogRef.afterClosed().subscribe((flag) => {
                if (flag) {
                    this.getAccountInfo(this.mpGroupId);
                    this.getAccountContact(this.accountDetails.name);
                }
            }),
        );
    }
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err["error"];
        if (error.status === ClientErrorResponseCode.RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.profile.accountInfo.api.${error.status}.${error.code}.${error["details"][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.profile.accountInfo.title",
            "primary.portal.profile.accountInfo.edit",
            "primary.portal.profile.accountInfo.name",
            "primary.portal.profile.accountInfo.number",
            "primary.portal.profile.accountInfo.situs",
            "primary.portal.profile.accountInfo.status",
            "primary.portal.profile.accountInfo.eaaStatus",
            "primary.portal.profile.accountInfo.eaaStatus.available",
            "primary.portal.profile.accountInfo.eaaStatus.notAvailable",
        ]);
    }
    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
