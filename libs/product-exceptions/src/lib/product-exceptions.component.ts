import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import { ActivatedRoute } from "@angular/router";
import { StaticService, AppTakerService, ExceptionsService } from "@empowered/api";
import { NewExceptionComponent } from "./new-exception/new-exception.component";
import { MatDialog } from "@angular/material/dialog";
import { ViewExceptionComponent } from "./view-exception/view-exception.component";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";
import { RemoveExceptionComponent } from "./remove-exception/remove-exception.component";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { EditExceptionComponent } from "./edit-exception/edit-exception.component";
import { MatMenuTrigger } from "@angular/material/menu";
import { tap, map, takeUntil, catchError, filter, take } from "rxjs/operators";
import { Observable, Subject, of } from "rxjs";
import {
    Permission,
    ConfigName,
    UserPermissionList,
    AppSettings,
    Exceptions,
    ExceptionTypeCategory,
    ExceptionType,
    CountryState,
    PlanException,
} from "@empowered/constants";
import { SafeHtml } from "@angular/platform-browser";
import { AccountListState, AccountInfoState, SharedState } from "@empowered/ngxs-store";
import { DateService } from "@empowered/date";

const STATES_TOOLTIP_MAX_LENGTH = 5;
@Component({
    selector: "empowered-product-exceptions",
    templateUrl: "./product-exceptions.component.html",
    styleUrls: ["./product-exceptions.component.scss"],
})
export class ProductExceptionsComponent implements OnInit, OnDestroy {
    accountName: string = this.store.selectSnapshot(AccountInfoState.getAccountInfo).name;
    mpGroup: string;
    showSpinner = false;
    userPermissions = Permission;
    exceptionDisplayedColumns: string[] = ["planName", "availability", "ApprovedBy", "States", "manage"];
    exceptions$: Observable<
        | (Exceptions & { statesTooltip?: SafeHtml }[])
        | {
              name: string;
              states: string[];
              isExpired: boolean;
              statesTooltip: SafeHtml;
              id: number;
              type: string;
              plan?: PlanException;
              restrictionValue?: number;
          }[]
    >;
    languageStrings: Record<string, string>;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    allStates: CountryState[];
    @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
    disableException = false;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    createPermission: boolean =
        this.store.selectSnapshot(SharedState.hasPermission(this.userPermissions.EXCEPTION_CREATE)) ||
        this.store.selectSnapshot(SharedState.hasPermission(this.userPermissions.VAS_EXCEPTIONS_CREATE_PERMISSION));
    accountCheckedOut: boolean;
    isVasExceptionUser = false;
    vasExceptionsDeletePermission = UserPermissionList.VAS_EXCEPTIONS_DELETE_PERMISSION;
    isRole12 = false;
    isRole20 = false;
    isRole108 = false;
    configs = ConfigName;
    unpluggedAccessAllowed = true;
    maintenanceLock = true;
    exceptionTypes: { name: string; value: string }[];

    constructor(
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly dialog: MatDialog,
        private readonly exceptionService: ExceptionsService,
        private readonly langService: LanguageService,
        private readonly staticService: StaticService,
        private readonly appTakerService: AppTakerService,
        private readonly sharedService: SharedService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Function to call API and initialize Exception table
     */
    ngOnInit(): void {
        this.checkRole();
        this.fetchLanguageData();
        this.mpGroup = this.route.parent.parent.snapshot.params.mpGroupId;
        this.sharedService.currentUnpluggedDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((unpluggedDetails) => {
            this.accountCheckedOut = unpluggedDetails.isCheckedOut;
            this.maintenanceLock = unpluggedDetails.hasMaintenanceLock;
            this.unpluggedAccessAllowed = unpluggedDetails.allowAccess;
        });
        this.getProducerCheckoutStatus();
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.productExceptions.*"));
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.benefitsOffering.coveragedates.*"));
        this.getUnpluggedDetails();
        this.getAllowedExceptionTypes()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((allowedExceptionTypes) => (this.exceptionTypes = allowedExceptionTypes));
        if (this.isRole108) {
            this.getExceptions();
        } else {
            this.staticService
                .getStates()
                .pipe(
                    tap((states) => {
                        this.allStates = states;
                        this.getExceptions();
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Checks if the current account is checked out by Unplugged
     */
    getProducerCheckoutStatus(): void {
        const currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
        this.accountCheckedOut = currentAccount && currentAccount.locked;
    }

    /**
     * Function to show new exception dialog
     */
    showNewException(): void {
        const dialogRef = this.empoweredModal.openDialog(NewExceptionComponent, {
            width: "700px",
            data: {
                mpGroup: this.mpGroup,
                isVasExceptionUser: this.isVasExceptionUser,
                exceptionTypes: this.exceptionTypes,
            },
            backdropClass: "backdrop-blur",
        });
        dialogRef
            .afterClosed()
            .pipe(take(1))
            .subscribe((elementData) => {
                if (elementData) {
                    this.getExceptions();
                }
            });
    }
    /**
     * get the list of exceptions
     */
    getExceptions(): void {
        this.showSpinner = true;
        this.exceptions$ = this.exceptionService
            .getExceptions(this.mpGroup, null, [ExceptionTypeCategory.OFFERING, ExceptionTypeCategory.VAS])
            .pipe(
                map((productExceptions) =>
                    productExceptions
                        .filter((exception) => !this.isRole108 || exception.type !== ExceptionType.ALLOW_WITHDRAWN_PLAN)
                        .map((exception) => {
                            const states =
                                exception.states
                                    ?.sort()
                                    .map((abbr) => this.allStates.find((stateObj) => stateObj.abbreviation === abbr).name) ?? [];
                            return {
                                ...exception,
                                name:
                                    exception.name ||
                                    this.langService.fetchPrimaryLanguageValue(
                                        `primary.portal.exceptions.exceptionTypes.${exception.type}`,
                                    ),
                                states,
                                isExpired:
                                    exception.type === ExceptionType.ALLOW_WITHDRAWN_PLAN &&
                                    !this.isRole20 &&
                                    this.isExpirationExpired(exception),
                                statesTooltip: exception.states?.length && this.getStatesTooltip(states),
                            };
                        }),
                ),
                tap(() => (this.showSpinner = false)),
                catchError(() => {
                    this.showSpinner = false;
                    return of(null);
                }),
            );
    }
    /**
     *@description method to view exception
     * @param exception {Exceptions} used to pass exception
     * @returns {void} It returns void
     * @memberof ProductExceptionsComponent
     */
    viewException(exception: Exceptions): void {
        const data = {
            mpGroup: this.mpGroup,
            createPermission: this.createPermission,
            accountCheckedOut: this.accountCheckedOut,
            isVasExceptionUser: this.isVasExceptionUser,
            exception,
        };
        const dialogRef = this.empoweredModal.openDialog(ViewExceptionComponent, {
            width: "600px",
            data: data,
            backdropClass: "backdrop-blur",
        });
        // if response is true EditException dialog is opened
        dialogRef
            .afterClosed()
            .pipe(
                take(1),
                filter((response) => response),
            )
            .subscribe(() => {
                this.EditException(exception.id);
            });
    }

    /**
     * Function to remove exception
     * @param element {Exceptions}
     */
    removeException(element: Exceptions): void {
        const data = { id: element.id, mpGroup: this.mpGroup, isVasException: !element.plan, element };
        const dialogRef = this.dialog.open(RemoveExceptionComponent, {
            width: "600px",
            data: data,
            backdropClass: "backdrop-blur",
        });
        dialogRef
            .afterClosed()
            .pipe(
                take(1),
                filter((remove) => remove),
            )
            .subscribe(() => {
                this.getExceptions();
            });
    }

    /**
     * Function to edit exception
     * @param id {number}
     */
    EditException(id: number): void {
        const data = { id: id, mpGroup: this.mpGroup, exceptionTypes: this.exceptionTypes };
        const dialogRef = this.empoweredModal.openDialog(EditExceptionComponent, {
            width: "700px",
            data: data,
            backdropClass: "backdrop-blur",
        });
        dialogRef
            .afterClosed()
            .pipe(take(1))
            .subscribe((elementData) => {
                if (elementData) {
                    this.getExceptions();
                }
            });
    }
    /**
     * Method to get the language string from the db
     */
    fetchLanguageData(): void {
        this.languageStrings = this.langService.fetchPrimaryLanguageValues([
            "primary.portal.productExceptions.exceptions",
            "primary.portal.productExceptions.exceptionDescFirstHalf",
            "primary.portal.productExceptions.exceptionDescSecondHalf",
            "primary.portal.productExceptions.addException",
            "primary.portal.productExceptions.planName",
            "primary.portal.productExceptions.availability",
            "primary.portal.productExceptions.approvedBy",
            "primary.portal.productExceptions.states",
            "primary.portal.productExceptions.state",
            "primary.portal.productExceptions.Manage",
            "primary.portal.common.view",
            "primary.portal.common.edit",
            "primary.portal.common.remove",
            "primary.portal.common.close",
            "primary.portal.productExceptions.availabeExceptions",
            "primary.portal.accounts.accountList.state",
            "primary.portal.productExceptions.viewException.exceptionType",
            "primary.portal.benefitsOffering.vas",
            "primary.portal.dashboard.hyphen",
            "primary.portal.customer.all",
            "primary.portal.exception.withdrawn.plan",
            "primary.portal.exception.vas.max.employee",
            "primary.portal.exception.vas.year.one.product.add",
            "primary.portal.exception.vas.renewal.year.product.add",
            "primary.portal.exception.vas.multiple.aflac.funded",
            "primary.portal.maintenanceBenefitsOffering.editExceptionsDisabled",
            "primary.portal.dashboard.unpluggedAccount.checkedOutToUnpluggedNew",
        ]);
    }

    getStatesString(states: string[]): string {
        return `${states.length} ${this.languageStrings[
            states.length > 1 ? "primary.portal.productExceptions.state" : "primary.portal.accounts.accountList.state"
        ].toLowerCase()}`;
    }
    /**
     * Function to check exception is expired or not
     * @param exception
     * @returns boolean
     */
    isExpirationExpired(exception: Exceptions): boolean {
        return this.dateService.isBefore(this.dateService.toDate(exception.validity.expiresAfter.toString()));
    }

    /**
     * Function to check user role based on permission
     *
     */
    checkRole(): void {
        const productExceptionPermission = this.store.selectSnapshot(SharedState.hasPermission(Permission.EXCEPTION_CREATE));
        const vasExceptionPermission = this.store.selectSnapshot(SharedState.hasPermission(Permission.VAS_EXCEPTIONS_CREATE_PERMISSION));
        if (productExceptionPermission && vasExceptionPermission) {
            this.isRole20 = true;
        } else if (vasExceptionPermission) {
            this.isRole108 = true;
        } else {
            this.isRole12 = true;
        }
    }

    /**
     * This method is used to check whether the account is checked out to unplugged or not and appropriate messages are shown.
     */
    getUnpluggedDetails(): void {
        this.appTakerService
            .getMaintananceLock(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (permissions) => {
                    this.maintenanceLock = permissions;
                    this.unpluggedAccessAllowed = this.maintenanceLock;
                    this.sharedService.checkUnpluggedDetails({
                        allowAccess: this.unpluggedAccessAllowed,
                        isCheckedOut: this.accountCheckedOut,
                        hasMaintenanceLock: this.maintenanceLock,
                    });
                },
                () => {
                    this.maintenanceLock = true;
                    this.unpluggedAccessAllowed = this.maintenanceLock;
                    this.sharedService.checkUnpluggedDetails({
                        allowAccess: this.unpluggedAccessAllowed,
                        isCheckedOut: this.accountCheckedOut,
                        hasMaintenanceLock: this.maintenanceLock,
                    });
                },
            );
    }

    /**
     * Returns allowed exception types for a group.
     *
     * @returns observable of exception types
     */
    getAllowedExceptionTypes(): Observable<{ name: string; value: string }[]> {
        return this.exceptionService.getAllowedExceptionTypes([ExceptionTypeCategory.OFFERING, ExceptionTypeCategory.VAS]).pipe(
            map((exceptionTypes) =>
                exceptionTypes.sort().map((exceptionType) => ({
                    name: this.langService.fetchPrimaryLanguageValue(`primary.portal.exceptions.exceptionTypes.${exceptionType}`),
                    value: exceptionType,
                })),
            ),
        );
    }

    /**
     * Generates tooltip for states where exception is valid.
     *
     * @param states array of state names
     * @returns HTML tooltip content
     */
    getStatesTooltip(states: string[]): SafeHtml {
        if (states.length < STATES_TOOLTIP_MAX_LENGTH) {
            return states.join("<br>");
        }
        return states.reduce((tooltip, state) => `${tooltip}<div>${state}</div>`, "");
    }

    /**
     * Function to unsubscribe subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
