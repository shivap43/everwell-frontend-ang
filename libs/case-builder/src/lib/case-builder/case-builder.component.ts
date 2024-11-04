import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { AccountService } from "@empowered/api";
import { SharedService } from "@empowered/common-services";
import { CaseBuilder, PagePrivacy, Permission } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { AccountListState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { MonDialogComponent, MonDialogData } from "@empowered/ui";
import { Select, Store } from "@ngxs/store";
import { EMPTY, Observable, Subscription, combineLatest } from "rxjs";
import { CaseBuilderAddEditComponent } from "../case-builder-add-edit/case-builder-add-edit.component";
import { CaseBuilderAdmin } from "@empowered/constants";
import { CaseBuilderTableData } from "./case-builder.model";
import { DateFormats } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { catchError, tap } from "rxjs/operators";

@Component({
    selector: "empowered-case-builder",
    templateUrl: "./case-builder.component.html",
    styleUrls: ["./case-builder.component.scss"],
})
export class CaseBuilderComponent implements OnInit, OnDestroy {
    displayedColumns = ["caseBuilderAdmin", "startDate", "endDate", "manage"];
    dataSource = new MatTableDataSource<CaseBuilderTableData>();
    subscriptions: Subscription[] = [];
    showSpinner = false;
    mpGroup: number;
    isDataFound = false;
    isOnGoing = false;
    isDisableRemoveButton = false;
    caseBuilderAdmins: CaseBuilderAdmin[] = [];
    caseBuilderList: CaseBuilder[] = [];
    apiError: string;
    isEnroller = false;
    isPrivacyOnForEnroller = false;
    hasCreatePermission = false;
    hasUpdatePermission = false;
    hasDeletePermission = false;
    hasManagePermission = false;
    hasBBName = false;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.dashboard.caseBuilderAdmins",
        "primary.portal.caseBuilderAdmin.static.content",
        "primary.portal.caseBuilderAdmin.submit",
        "primary.portal.caseBuilderAdmin",
        "primary.portal.caseBuilderAdmin.startDate",
        "primary.portal.caseBuilderAdmin.endDate",
        "primary.portal.caseBuilderAdmin.manage",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.caseBuilderAdmin.edit",
        "primary.portal.caseBuilderAdmin.remove",
        "primary.portal.caseBuilderAdmin.altText",
        "primary.portal.caseBuilderAdmin.ongoing",
        "primary.portal.common.cancel",
        "primary.portal.caseBuilderAdmin.removeHeader",
        "primary.portal.caseBuilderAdmin.removeCaseBuilderContent",
    ]);
    @Select(AccountListState.getMpGroupId) mpGroup$: Observable<number>;
    constructor(
        private readonly languageService: LanguageService,
        private readonly accountService: AccountService,
        private readonly dialog: MatDialog,
        private readonly dateService: DateService,
        private readonly store: Store,
        private readonly sharedService: SharedService,
        private readonly staticUtilService: StaticUtilService,
    ) {}

    ngOnInit(): void {
        this.subscriptions.push(this.mpGroup$.subscribe((x) => (this.mpGroup = x)));
        this.subscriptions.push(
            this.accountService
                .getCaseBuilders()
                .pipe(
                    tap((response) => {
                        this.caseBuilderAdmins = response;
                    }),
                )
                .subscribe(),
        );
        this.showCaseBuilderAdmins();
        this.isLoggedInProducerEnroller();
        this.checkUserPermissions();
    }

    /**
     * Method to list the case builder admins
     */
    showCaseBuilderAdmins(): void {
        this.showSpinner = true;
        const todayDate = this.dateService.format(new Date(), DateFormats.MONTH_DAY_YEAR);
        this.subscriptions.push(
            this.accountService.getAccountCaseBuilders(this.mpGroup?.toString()).subscribe(
                (caseBuilder) => {
                    this.caseBuilderList = caseBuilder;
                    this.dataSource.data = caseBuilder.map((data) => ({
                        id: data?.id,
                        name: data?.caseBuilder?.name,
                        startDate: data?.validity?.effectiveStarting
                            ? this.dateService.format(data?.validity?.effectiveStarting, DateFormats.MONTH_DAY_YEAR)
                            : data?.validity?.effectiveStarting,
                        endDate: data?.validity?.expiresAfter
                            ? this.dateService.format(data?.validity?.expiresAfter, DateFormats.MONTH_DAY_YEAR)
                            : this.languageStrings["primary.portal.caseBuilderAdmin.ongoing"],
                        activateMenu: !data?.validity?.expiresAfter
                            ? true
                            : this.dateService.getIsAfterOrIsEqual(data?.validity?.expiresAfter, todayDate),
                        disableRemove: this.dateService.isBeforeOrIsEqual(data?.validity?.effectiveStarting, todayDate),
                    }));
                    if (caseBuilder.length) {
                        this.isDataFound = true;
                        this.hasBBName = this.dataSource.data.some(data => data.name === "Building Blocks");
                    } else {
                        this.isDataFound = false;
                    }

                    // isOnGoing will remain true of either the following two condition. "expiresAfter" is null or not provided
                    // OR "expiresAfter" is a future date
                    // if start date is in future enabled caseBuilder button
                    this.isOnGoing = caseBuilder?.some(
                        (casebuilder) =>
                            (!casebuilder?.validity?.expiresAfter ||
                                this.dateService.checkIsTodayOrAfter(casebuilder?.validity?.expiresAfter)) &&
                            this.dateService.checkIsTodayOrBefore(casebuilder?.validity?.effectiveStarting),
                    );

                    this.showSpinner = false;
                },
                (error) => {
                    this.showErrorAlertMessage(error);
                },
            ),
        );
    }

    /**
     * Method to open Add/Edit CaseBuilder dialog box;
     * @param data - case builder
     */
    showCaseBuilderPopup(type: string, caseBuilder?: CaseBuilderTableData): void {
        const caseBuilderAdminDialog = this.dialog.open(CaseBuilderAddEditComponent, {
            width: "650px",
            data: {
                allCaseBuilderAdmin: this.caseBuilderAdmins,
                caseBuilderList: this.caseBuilderList,
                selectedCaseBuilder: caseBuilder,
                mpGroup: this.mpGroup,
                type: type,
                id: caseBuilder?.id,
            },
        });

        this.subscriptions.push(
            caseBuilderAdminDialog.afterClosed().subscribe((response) => {
                if (response) {
                    this.showCaseBuilderAdmins();
                }
            }),
        );
    }

    /* Shows an alert on the screen in case of an error.
     * @param errorDetails http error response
     */
    showErrorAlertMessage(errorDetails: HttpErrorResponse): void {
        if (errorDetails?.error?.status) {
            this.apiError = this.languageService.fetchSecondaryLanguageValue(
                `secondary.api.${errorDetails.error.status}.${errorDetails.error.code}`,
            );
        } else {
            this.apiError = this.languageService.fetchSecondaryLanguageValue("secondary.api.400.badRequest");
        }
        this.showSpinner = false;
        this.isDataFound = false;
    }

    /**
     * Method to call remove case builder API
     * @param flag boolean value set on remove dialog
     */
    onRemoveAlertConfirm(flag: boolean, accountCaseBuilderId: number): void {
        if (flag) {
            this.showSpinner = true;
            this.subscriptions.push(
                this.accountService
                    .deleteAccountCaseBuilder(this.mpGroup?.toString(), accountCaseBuilderId)
                    .pipe(
                        tap(() => {
                            this.showSpinner = false;
                            this.showCaseBuilderAdmins();
                        }),
                        catchError((res) => {
                            this.showSpinner = false;
                            this.showErrorAlertMessage(res);
                            this.showCaseBuilderAdmins();
                            return EMPTY;
                        }),
                    )
                    .subscribe(),
            );
        }
    }

    /*
    Method to open remove case builder dialog
    */
    openRemoveAlert(caseBuilderId: number, caseBuilderName: string): void {
        const dialogData: MonDialogData = {
            title: this.languageStrings["primary.portal.caseBuilderAdmin.removeHeader"],
            content: this.languageStrings["primary.portal.caseBuilderAdmin.removeCaseBuilderContent"].replace(
                "#caseBuilderName",
                caseBuilderName,
            ),
            primaryButton: {
                buttonTitle: this.languageStrings["primary.portal.caseBuilderAdmin.remove"],
                buttonAction: this.onRemoveAlertConfirm.bind(this, true, caseBuilderId),
            },
            secondaryButton: {
                buttonTitle: this.languageStrings["primary.portal.common.cancel"],
                buttonAction: this.onRemoveAlertConfirm.bind(this, false, caseBuilderId),
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    /**
     * method to check if the loggedIn producer is enroller and set flags
     */
    isLoggedInProducerEnroller(): void {
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.CASE_BUILDER);
        }
    }
    /**
     * Method to check permissions and set appropriate flags.
     */
    checkUserPermissions() {
        this.subscriptions.push(
            combineLatest([
                this.staticUtilService.hasPermission(Permission.CASE_BUILDER_ADMINS_CREATE),
                this.staticUtilService.hasPermission(Permission.CASE_BUILDER_ADMINS_UPDATE),
                this.staticUtilService.hasPermission(Permission.CASE_BUILDER_ADMINS_DELETE),
            ]).subscribe(([createPermission, updatePermission, deletePermission]) => {
                this.hasCreatePermission = createPermission;
                this.hasUpdatePermission = updatePermission;
                this.hasDeletePermission = deletePermission;
                if (updatePermission || deletePermission) {
                    this.hasManagePermission = true;
                }
            }),
        );
    }

    /**
     * Unsubscribes from all subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
    }
}
