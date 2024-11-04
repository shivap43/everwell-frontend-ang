import { Store } from "@ngxs/store";
import { AccountContacts, AccountService, ContactGridTitles, AuthenticationService, NotificationService } from "@empowered/api";
import { Component, OnInit, OnDestroy, AfterViewChecked } from "@angular/core";
import { SharedState, UtilService } from "@empowered/ngxs-store";
import { PhoneFormatConverterPipe, MonDialogComponent, AddUpdateContactInfoComponent } from "@empowered/ui";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { EMPTY, Subscription } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatCheckboxChange } from "@angular/material/checkbox";
import { catchError, switchMap } from "rxjs/operators";
import { ClientErrorResponseCode, Permission, PagePrivacy, AppSettings, Address, AddUpdateContactDialogData } from "@empowered/constants";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-account-contacts",
    templateUrl: "./account-contacts.component.html",
    styleUrls: ["./account-contacts.component.scss"],
    providers: [PhoneFormatConverterPipe],
})
export class AccountContactsComponent implements OnInit, OnDestroy, AfterViewChecked {
    isSpinnerLoading = false;
    showErrorMessage = false;
    langStrings: Record<string, string>;
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    ACCOUNT = "ACCOUNT";
    errorMessage: string;
    mpGroupId: number;
    data: any[];
    portal: string;
    isAdmin = false;
    country = AppSettings.COUNTRY_US;
    accountContactTypeIds = {
        PRIMARY: 1,
        BILLING: 2,
    };
    CONTACT_PERMISSION_EDIT_ADDRESS = "core.account.update.contact.address";
    CONTACT_PERMISSION_EDIT_ACCOUNT_NAME = "core.account.update.name";
    CONTACT_PERMISSION_EDIT_PHONE_NUMBER = "core.account.update.contact.phone";
    CONTACT_PERMISSION_EDIT_EMAIL = "core.account.update.contact.email";

    allowEditingAddress = true;
    allowEditingContactName = true;
    allowEditingPhoneNumber = true;
    allowEditingEmailAddress = true;

    displayedColumnsDocs: ContactGridTitles[];
    dataSourcePrimary: MatTableDataSource<any[]>;
    dataSourceBilling: MatTableDataSource<any[]>;
    contactInfoPrimary: AccountContacts[];
    contactInfoBilling: AccountContacts[];

    subscriber: Subscription[] = [];
    checked = false;
    error: string;
    errorOccur: boolean;
    errorResponse: string;
    hasError: boolean;
    updateEmailOptOut = false;
    readEmailOptOut = false;
    UPDATE_EMAIL_OPT_OUT = "core.account.update.emailOptOut";
    READ_EMAIL_OPT_OUT = "core.account.read.emailOptOut";
    permissionEnum = Permission;
    isEnroller: boolean;
    isPrivacyEnabledForEnroller: boolean;

    constructor(
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly languageService: LanguageService,
        private readonly authenticationService: AuthenticationService,
        private readonly utilService: UtilService,
        private readonly notificationService: NotificationService,
        private readonly router: Router,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly sharedService: SharedService,
    ) {
        const params = this.route.parent.parent.snapshot.params;
        this.mpGroupId = this.router.url.indexOf("prospect") !== -1 ? params["prospectId"] : params["mpGroupId"];

        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyEnabledForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_CONTACTS);
        }
    }

    ngOnInit(): void {
        this.checkForUserType();
        this.isSpinnerLoading = false;
        this.fetchLanguageStrings();
        this.getPermission();
        this.fetchContactsData();
        this.getRolePermission();
        this.getOptOutNotification();
    }

    ngAfterViewChecked(): void {
        this.subscriber.push(
            this.utilService.getRefreshActivity().subscribe((response) => {
                if (response) {
                    this.fetchContactsData();
                    this.utilService.setRefreshActivity(false);
                }
            }),
        );
    }

    /**
     * Function to get the role permission for the notifications opt out
     */
    getRolePermission(): void {
        this.updateEmailOptOut = this.store.selectSnapshot(SharedState.hasPermission(this.UPDATE_EMAIL_OPT_OUT));
        this.readEmailOptOut = this.store.selectSnapshot(SharedState.hasPermission(this.READ_EMAIL_OPT_OUT));
    }
    /**
     * Function to get the opt out notification response
     */
    getOptOutNotification(): void {
        this.isSpinnerLoading = true;
        this.subscriber.push(
            this.notificationService.getOptOutOfNotifications().subscribe(
                (res) => {
                    this.isSpinnerLoading = false;
                    this.checked = res;
                },
                (error) => {
                    this.hasError = true;
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }

    /**
     * If the checkbox is checked then not sending the nonessential email or text notifications to admin and employees.
     * @param event :MatCheckboxChange
     */
    changeValue(event: MatCheckboxChange): void {
        this.checked = event.checked;
        this.isSpinnerLoading = true;
        this.subscriber.push(
            this.notificationService.updateEmailOptOut(this.checked).subscribe(
                (response) => {
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.errorOccur = true;
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }

    checkForUserType(): void {
        this.isAdmin = this.portal === AppSettings.PORTAL_ADMIN;
    }

    getPermission(): void {
        this.subscriber.push(
            this.authenticationService.permissions$.subscribe((Response) => {
                this.allowEditingAddress =
                    Response.length > 0 && Response.find((d) => String(d) === this.CONTACT_PERMISSION_EDIT_ADDRESS) ? true : false;
                this.allowEditingContactName =
                    Response.length > 0 && Response.find((d) => String(d) === this.CONTACT_PERMISSION_EDIT_ACCOUNT_NAME) ? true : false;
                this.allowEditingPhoneNumber =
                    Response.length > 0 && Response.find((d) => String(d) === this.CONTACT_PERMISSION_EDIT_EMAIL) ? true : false;
                this.allowEditingEmailAddress =
                    Response.length > 0 && Response.find((d) => String(d) === this.CONTACT_PERMISSION_EDIT_PHONE_NUMBER) ? true : false;
            }),
        );
    }

    /** Gets the existing contact data */
    fetchContactsData(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.subscriber.push(
            this.accountService.getAccountContacts("typeId").subscribe(
                (Response) => {
                    // For Primary contacts as they will always have id 1
                    this.contactInfoPrimary = Response.filter((x) => x.type && x.type.id === this.accountContactTypeIds.PRIMARY);
                    // For Billing contacts as they will always have id 2
                    this.contactInfoBilling = Response.filter((x) => x.type && x.type.id === this.accountContactTypeIds.BILLING);

                    this.setDatasource(this.contactInfoPrimary, this.contactInfoBilling);
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
    getAddressDisplayText(address: Address): string {
        const addressArray = [];
        if (address.address1 && address.address1 !== "") {
            addressArray.push(address.address1);
        }
        if (address.address2 && address.address2 !== "") {
            addressArray.push(address.address2);
        }
        const cityStateArray = [];
        if (address.city && address.city !== "") {
            cityStateArray.push(address.city);
        }
        cityStateArray.push(address.state + " " + address.zip);
        return addressArray.join(", ") + "<br/>" + cityStateArray.join(", ");
    }

    getDataSource(data: any): any {
        return data.map((row) => ({
            name: row.name ? row.name : null,
            address: row.address ? row.address : null,
            addressText: this.getAddressDisplayText(row.address),
            phoneNumbers: row.phoneNumbers ? row.phoneNumbers : null,
            phoneNumber: row.phoneNumbers.length ? row.phoneNumbers[0].phoneNumber : null,
            emailAddresses: row.emailAddresses ? row.emailAddresses : null,
            email: row.emailAddresses.length ? row.emailAddresses[0].email : null,
            uploadDate: row.phoneNumbers ? row.phoneNumbers : null,
            id: row.id ? row.id : null,
            type: row.type ? row.type : null,
            primary: row.primary,
        }));
    }

    /** Sets the data to be displayed in the grid */
    setDatasource(dataPrimary: any, dataBilling: any): void {
        this.dataSourcePrimary = new MatTableDataSource(this.getDataSource(dataPrimary));
        this.dataSourceBilling = new MatTableDataSource(this.getDataSource(dataBilling));
        this.displayedColumnsDocs = [
            ContactGridTitles.NAME,
            ContactGridTitles.ADDRESS,
            ContactGridTitles.PHONE,
            ContactGridTitles.EMAIL,
            ContactGridTitles.MANAGE,
        ];
        this.isSpinnerLoading = false;
    }

    addBillingContact(): void {
        const data: AddUpdateContactDialogData = {
            parentMode: this.ACCOUNT,
            isAdd: true,
            isPrimary: this.contactInfoBilling.length > 0 ? false : true,
            mpGroupId: this.mpGroupId.toString(),
            showType: true,
            allowEditingAddress: false,
            allowEditingContactName: false,
            allowEditingPhoneNumber: false,
            allowEditingEmailAddress: false,
        };
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            maxWidth: "600px",
            panelClass: "add-contact",
            data: data,
        };
        const dialogRef = this.dialog.open(AddUpdateContactInfoComponent, dialogConfig);
        this.subscriber.push(
            dialogRef.afterClosed().subscribe((flag) => {
                if (flag) {
                    this.fetchContactsData();
                }
            }),
        );
    }

    editContact(rowData: any, isBilling: boolean): void {
        const data: AddUpdateContactDialogData = {
            parentMode: this.ACCOUNT,
            isAdd: false,
            isPrimary: rowData.primary,
            mpGroupId: this.mpGroupId.toString(),
            showType: isBilling,
            accountContact: rowData,
            allowEditingAddress: isBilling ? true : this.allowEditingAddress,
            allowEditingContactName: isBilling ? true : this.allowEditingContactName,
            allowEditingPhoneNumber: isBilling ? true : this.allowEditingPhoneNumber,
            allowEditingEmailAddress: isBilling ? true : this.allowEditingEmailAddress,
        };
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            maxWidth: "600px",
            panelClass: "edit-contact",
            data: data,
        };
        const dialogRef = this.dialog.open(AddUpdateContactInfoComponent, dialogConfig);
        this.subscriber.push(
            dialogRef.afterClosed().subscribe((flag) => {
                if (flag) {
                    this.fetchContactsData();
                }
            }),
        );
    }

    /**
     * This function is for confirmation of remove billing contact
     * @param contactId for the billing contact which needs to be removed
     */
    confirmRemoveBillingContact(contactId: string): void {
        this.empoweredModalService.openDialog(MonDialogComponent, {
            data: {
                title: this.langStrings["primary.portal.profile.accountContacts.billing.removeTitle"],
                content: this.langStrings["primary.portal.profile.accountContacts.billing.removeDesc"],
                primaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.remove"],
                    buttonAction: this.removeBillingContact.bind(this, contactId),
                },
                secondaryButton: {
                    buttonTitle: this.langStrings["primary.portal.common.cancel"],
                },
            },
        });
    }

    /**
     * This function is for removing billing contact
     * @param contactId for the billing contact which needs to be removed
     */
    removeBillingContact(contactId: string): void {
        this.subscriber.push(
            this.accountService
                .deleteAccountContact(this.mpGroupId.toString(), contactId)
                .pipe(
                    switchMap(() => {
                        this.fetchContactsData();
                        return EMPTY;
                    }),
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        return EMPTY;
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Fetching language strings from DB
     * @returns void
     */
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.profile.accountContacts.title",
            "primary.portal.profile.accountContacts.addItemButton",
            "primary.portal.profile.accountContacts.table.name",
            "primary.portal.profile.accountContacts.table.address",
            "primary.portal.profile.accountContacts.table.phone",
            "primary.portal.profile.accountContacts.table.email",
            "primary.portal.profile.accountContacts.table.manage",
            "primary.portal.profile.accountContacts.table.manageMenu.edit",
            "primary.portal.profile.accountContacts.table.manageMenu.remove",
            "primary.portal.profile.accountContacts.primary",
            "primary.portal.profile.accountContacts.billing",
            "primary.portal.profile.accountContacts.titleAdmin",
            "primary.portal.profile.accountContacts.billing.removeTitle",
            "primary.portal.profile.accountContacts.billing.removeDesc",
            "primary.portal.notification.notification",
            "primary.portal.notification.warning",
            "primary.portal.common.remove",
            "primary.portal.common.cancel",
        ]);
    }

    /** Error Handling */
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
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        this.showErrorMessage = true;
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.accountContact.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
