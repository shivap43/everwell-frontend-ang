import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { AccountService, ThirdPartyPlatforms, ThirdPartyPlatform, DashboardService, AccountDetails } from "@empowered/api";
import { UserService } from "@empowered/user";

import { Observable, Subscription, iif, EMPTY, of } from "rxjs";
import { AddEditThirdPartyPlatformComponent } from "./add-edit-third-party-platform/add-edit-third-party-platform.component";
import { LanguageService } from "@empowered/language";
import { tap, switchMap, catchError, finalize } from "rxjs/operators";
import { Select, Store } from "@ngxs/store";
import { Permission, AppSettings, Validity } from "@empowered/constants";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";
import { AccountListState, AddAccountInfo, UtilService } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";
const DOCUMENT = "Worksheet";
const TPP_NAME = "thirdPartyPlatformName";
const START_DATE = "startDate";
const END_DATE = "endDate";
const ADMIN_PORTAL = "admin";

enum Actions {
    REMOVE_ACTION = "remove",
    UPDATE_ACTION = "update",
    ADD_ACTION = "add",
    NEW_ACTION = "new",
    EDIT_ACTION = "edit",
}

enum DocType {
    PDF_DOCTYPE = "pdf",
    XML_DOCTYPE = "xml",
}

@Component({
    selector: "empowered-third-party",
    templateUrl: "./third-party.component.html",
    styleUrls: ["./third-party.component.scss"],
})
export class ThirdPartyComponent implements OnInit, OnDestroy {
    showSpinner = false;
    mpGroup: number;
    thirdPartyPlatforms: ThirdPartyPlatforms[];
    dataSource = new MatTableDataSource<any>();
    isDataFound = false;
    displayedColumns = ["thirdPartyPlatformName", "startDate", "endDate", "viewDocument", "manage"];
    thirdPartyPlatformsData: any;
    isMpGroupExist = true;
    originalThirdPartyPlatforms = [];
    filename = "PDA.htm";
    portal: string;
    isAdmin = false;
    dateformat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    currentDate = new Date();
    importType: string;

    languageStrings = this.language.fetchPrimaryLanguageValues([
        "primary.portal.thirdParty.remove_tppname",
        "primary.portal.thirdParty.removetppname_content",
        "primary.portal.thirdParty.remove",
        "primary.portal.common.cancel",
        "primary.portal.thirdParty.addparty_enrollment",
        "primary.portal.thirdParty.addparty_platform",
        "primary.portal.thirdParty.view_pdf",
        "primary.portal.thirdParty.viewbyxml",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.thirdParty.edit",
        "primary.portal.thirdParty.remove",
    ]);

    @Select(AccountListState.getMpGroupId) mpGroup$: Observable<number>;
    subscriptions: Subscription[] = [];
    permissionEnum = Permission;
    @Input() isPrivacyOnForEnroller: boolean;

    constructor(
        private readonly dialog: MatDialog,
        private readonly accountService: AccountService,
        readonly user: UserService,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly dashboardService: DashboardService,
        private readonly dateService: DateService,
        private readonly store: Store,
    ) {
        this.mpGroup$.subscribe((x) => (this.mpGroup = x));
        this.subscriptions.push(this.user.portal$.pipe(tap((portal) => (this.isAdmin = portal === ADMIN_PORTAL))).subscribe());
    }

    /**
     * Life cycle hook method used to show all the tpp enrolled and to get all the available tpp for enrollment
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.accountService.getThirdPartyPlatforms().subscribe((response) => {
                this.thirdPartyPlatformsData = response;
                this.originalThirdPartyPlatforms = this.utilService.copy(this.thirdPartyPlatformsData);
            }),
        );
        if (this.mpGroup) {
            this.showThirdPartyPlatforms(Actions.NEW_ACTION);
        } else {
            this.isMpGroupExist = false;
        }
        if (this.isAdmin) {
            this.displayedColumns = [TPP_NAME, START_DATE, END_DATE];
        }
        this.getAccountDetails();
    }

    /**
     * This method is to get the account details
     */
    getAccountDetails(): void {
        this.subscriptions.push(
            this.dashboardService.getAccount(this.mpGroup.toString()).subscribe((accountDetails: AccountDetails) => {
                this.importType = accountDetails.importType;
                this.store.dispatch(
                    new AddAccountInfo({
                        accountInfo: accountDetails,
                        mpGroupId: this.mpGroup.toString(),
                    }),
                );
            }),
        );
    }

    /**
     * Method to open Add Tpp dialog box
     * @param data - tpp list
     */
    showAddTPPPopup(data: ThirdPartyPlatform[]): void {
        const addTPPdialog = this.dialog.open(AddEditThirdPartyPlatformComponent, {
            width: "800px",
            data: {
                allThirdPartyPlatforms: data,
                accountWiseThirdPartyPlatforms:
                    this.thirdPartyPlatforms && this.thirdPartyPlatforms.length > 0 ? this.thirdPartyPlatforms : [],
                mpGroup: this.mpGroup,
                type: Actions.ADD_ACTION,
                isEqual: false,
                isDataFound: this.isDataFound,
                isDisableEditButton: true,
                importType: this.importType,
            },
        });

        this.subscriptions.push(
            addTPPdialog.afterClosed().subscribe((updatedData) => {
                this.showThirdPartyPlatforms(Actions.ADD_ACTION);
                this.getAccountDetails();
            }),
        );
    }

    /**
     * Method to open the document
     * @param tppId - tpp id
     * @param docType - document type(xml, pdf etc.)
     */
    openPdfDocument(tppId: number, docType: string): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.accountService.getAccountThirdPartyPlatformWorksheet(this.mpGroup, tppId, docType).subscribe(
                (response) => {
                    const blob = new Blob([response], {
                        type: `application/${docType}`,
                    });
                    this.showSpinner = false;

                    /*
                    source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                    msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                    Typescript won't know this is a thing, so we have to use Type Assertion
                    */
                    // For IE, Edge
                    if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
                        this.filename = docType === DocType.XML_DOCTYPE ? "PDA.xml" : "PDA.pdf";
                        (window.navigator as any).msSaveOrOpenBlob(blob, this.filename);
                    } else {
                        // For Chrome, Firefox
                        // Opens file in a new tab
                        const fileURL = URL.createObjectURL(blob);
                        window.open(fileURL, "_blank");

                        // ...and prompts the user to save it
                        const temporaryWorksheetDownloadLink = document.createElement("a");
                        temporaryWorksheetDownloadLink.download = DOCUMENT;
                        temporaryWorksheetDownloadLink.href = fileURL;

                        document.body.appendChild(temporaryWorksheetDownloadLink);
                        temporaryWorksheetDownloadLink.click();

                        // Remove link and release URL after use
                        temporaryWorksheetDownloadLink.remove();
                        URL.revokeObjectURL(fileURL);
                    }
                },
                (error) => {
                    this.showSpinner = false;
                },
            ),
        );
    }

    /**
     * Method to remove tpp data
     * @param id -tpp id
     * @param name - tpp name
     * @param tppValidity - TPP validity
     * @returns void
     */
    removeThirdPartyPlatform(id: number, name: string, tppValidity: Validity): void {
        this.showSpinner = true;
        let isStatus204: boolean;
        this.subscriptions.push(
            this.accountService
                .deleteAccountThirdPartyPlatform(this.mpGroup, id)
                .pipe(
                    tap((res) => {
                        if (res.status === AppSettings.API_RESP_204) {
                            isStatus204 = true;
                        }
                    }),
                    catchError((res) => {
                        this.showSpinner = false;
                        return EMPTY;
                    }),
                    switchMap((res) =>
                        iif(() => isStatus204, this.accountService.getAccountThirdPartyPlatforms(this.mpGroup.toString()), of(null)),
                    ),
                )
                .subscribe(
                    (res) => {
                        this.thirdPartyPlatforms = res;
                        this.thirdPartyPlatforms.forEach((tppData) => {
                            this.compareDates(tppData);
                        });
                        if (this.thirdPartyPlatforms && this.thirdPartyPlatforms.length > 0) {
                            this.isDataFound = true;
                            this.dataSource.data = res;
                        } else {
                            this.isDataFound = false;
                        }
                        this.showSpinner = false;
                    },
                    (error) => {
                        this.showSpinner = false;
                    },
                ),
        );
    }

    /**
     * Method to display the tpp
     * @param type - it can be add, edit or update
     * @param id - tpp id
     * @param name - tpp name
     */
    showThirdPartyPlatforms(type: string, id?: any, name?: string): void {
        this.showSpinner = true;
        this.subscriptions.push(
            this.accountService
                .getAccountThirdPartyPlatforms(this.mpGroup.toString())
                .pipe(
                    finalize(() => {
                        this.showSpinner = false;
                    }),
                )
                .subscribe((data) => {
                    this.thirdPartyPlatforms = data;
                    this.thirdPartyPlatformsData = this.utilService.copy(this.originalThirdPartyPlatforms);
                    if (this.thirdPartyPlatforms && this.thirdPartyPlatforms.length > 0) {
                        this.isDataFound = true;
                        this.dataSource.data = data;
                    } else {
                        this.isDataFound = false;
                    }
                    if (this.thirdPartyPlatforms.length > 0 && this.thirdPartyPlatformsData && this.thirdPartyPlatformsData.length > 0) {
                        this.thirdPartyPlatforms.forEach((tppData) => {
                            this.compareDates(tppData);
                            const endDate = this.dateService.toDate(tppData.validity.expiresAfter);
                            if (
                                (type === Actions.NEW_ACTION || type === Actions.ADD_ACTION || type === Actions.UPDATE_ACTION) &&
                                (this.dateService.getIsAfterOrIsEqual(endDate, this.currentDate) || !tppData.validity.expiresAfter)
                            ) {
                                const index = this.thirdPartyPlatformsData.findIndex((x) => x.id === tppData.thirdPartyPlatform.id);
                                if (index > -1) {
                                    this.thirdPartyPlatformsData.splice(index, 1);
                                }
                            }
                        });
                    }
                    if (type === Actions.REMOVE_ACTION) {
                        const addRemovedTPP = {
                            id: id,
                            name: name,
                        };
                        const index = this.originalThirdPartyPlatforms.findIndex((x) => x.id === id);
                        if (index > -1) {
                            this.thirdPartyPlatformsData.splice(index, 0, addRemovedTPP);
                        }
                    }
                }),
        );
    }

    /**
     * Method used to open remove tpp dialog box
     * @param tppId - id of tpp
     * @param tppName - name of tpp
     * @param tppValidity - validity of tpp
     */
    openAlert(tppId: number, tppName: string, tppValidity: Validity): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.thirdParty.remove_tppname"].replace("#tppname", tppName),
            content: this.languageStrings["primary.portal.thirdParty.removetppname_content"].replace("#tppname", tppName),
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.thirdParty.remove"],
                buttonAction: this.onAlertConfirm.bind(this, true, tppId, tppName, tppValidity),
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                buttonAction: this.onAlertConfirm.bind(this, false, 0, null),
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }

    /**
     * Methods called on confirming removal of tpp(click on remove button)
     * @param flag
     * @param tppId - id of tpp
     * @param tppName - name of tpp
     * @param tppValidity - validity of tpp
     */
    onAlertConfirm(flag: boolean, tppId: number, tppName: string, tppValidity: Validity): void {
        if (flag && tppId > 0) {
            this.removeThirdPartyPlatform(tppId, tppName, tppValidity);
            this.showThirdPartyPlatforms(Actions.REMOVE_ACTION, tppId, tppName);
        }
    }

    getClassName(sDate: string): string {
        let className = "active";
        const todaysDate = new Date();
        if (this.dateService.toDate(sDate) < todaysDate) {
            className = "inactive";
        }
        return className;
    }

    /**
     * Method to edit the existing tpp data
     * @param existingData - tpp Data
     */
    editExisting(existingData: any): void {
        const existingTPPData = [existingData.thirdPartyPlatform];
        const editTPPdialog = this.dialog.open(AddEditThirdPartyPlatformComponent, {
            width: "1000px",
            data: {
                allThirdPartyPlatforms: existingTPPData,
                accountWiseThirdPartyPlatforms:
                    this.thirdPartyPlatforms && this.thirdPartyPlatforms.length > 0 ? this.thirdPartyPlatforms : [],
                mpGroup: this.mpGroup,
                type: Actions.EDIT_ACTION,
                isEditingExisting: true,
                isDisableEditButton: true,
                importType: this.importType,
                id: existingData.id,
            },
        });

        editTPPdialog.afterClosed().subscribe((updatedData) => {
            this.showThirdPartyPlatforms(Actions.UPDATE_ACTION);
        });
    }

    /**
     * Method to check if the Tpp is ongoing or if in past
     * @param tppData - TPP data
     */
    compareDates(tppData: ThirdPartyPlatforms): void {
        const startDate = this.dateService.toDate(tppData.validity.effectiveStarting);
        const endDate = this.dateService.toDate(tppData.validity.expiresAfter);
        if (this.dateService.isBefore(endDate, this.currentDate) || this.dateService.isBeforeOrIsEqual(startDate, this.currentDate)) {
            tppData.isActive = true;
        }
    }

    /**
     * Unsubscribes from all subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
