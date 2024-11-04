import { ActivatedRoute } from "@angular/router";
import { Component, OnInit, EventEmitter, Output, Input, OnDestroy } from "@angular/core";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { CreateAccountFormComponent } from "../create-account-form/create-account-form.component";
import { ImportAccountFormComponent } from "../import-account-form/import-account-form.component";
import { UserService } from "@empowered/user";
import { EMPTY, Observable, Subscription } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { CallCenterFormComponent } from "../call-center-form/call-center-form.component";
import { LanguageService } from "@empowered/language";
import { Permission, UserPermissionList, AppSettings, ProducerCredential } from "@empowered/constants";
import { StaticService, ProducerService } from "@empowered/api";
import { AgImportFormComponent } from "../ag-import-form/ag-import-form.component";
import { combineLatest } from "rxjs";
import { SharedState, StaticUtilService } from "@empowered/ngxs-store";

const AG_IMPORT_CARRIER_ID = 65;
const GROUP_CARRIER_INDEX = 0;
const GROUP_CREATE_INDEX = 1;
const GROUP_ENABLE_INDEX = 2;
@Component({
    selector: "empowered-new-account-button",
    templateUrl: "./new-account-button.component.html",
    styleUrls: ["./new-account-button.component.scss"],
})
export class NewAccountButtonComponent implements OnInit, OnDestroy {
    @Input() haveAccounts: boolean;
    @Output() accountImported = new EventEmitter<boolean>();
    createAccountDialogRef: MatDialogRef<CreateAccountFormComponent>;
    importAccountDialogRef: MatDialogRef<ImportAccountFormComponent>;
    importcallCenterDialogRef: MatDialogRef<CallCenterFormComponent>;
    canAddAccount: boolean;
    canImportAccount: boolean;
    portal$: Observable<string>;
    subscriptionList: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accounts.addAccount",
        "primary.portal.common.add",
        "primary.portal.pendedBusiness.account",
    ]);
    isHybridUser = false;
    isCallCenterAgent = false;
    isAgImport = false;
    showSpinner = false;
    menuItems = ["Add Account", "Import Account"];
    isVCCPermission: boolean;
    getCallCenterSubscription: Subscription;
    subscriber: Subscription[] = [];
    hybridUserPermission: boolean;
    isAGAllowed: boolean;

    constructor(
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly user: UserService,
        private readonly producerService: ProducerService,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
    ) {}
    /**
     * @description sets the add account dropdown based on permission
     * @param {void}
     * @returns {void}
     */
    ngOnInit(): void {
        this.portal$ = this.user.portal$;
        this.checkHybridUserPermission();
        this.subscriptionList.push(
            this.store
                .select(SharedState.hasPermission(UserPermissionList.VCC_CREATE_ACCOUNT_PERMISSION))
                .pipe(
                    tap((resp) => (this.isVCCPermission = resp)),
                    switchMap(() => this.user.credential$),
                    switchMap((credential: ProducerCredential) => {
                        if (credential.producerId && credential.callCenterId) {
                            if (this.hybridUserPermission && this.isVCCPermission) {
                                this.isHybridUser = true;
                            } else {
                                this.isCallCenterAgent = true;
                            }
                            return this.staticService.getCallCenter(credential.callCenterId);
                        }
                        return EMPTY;
                    }),
                )
                .subscribe((callCenter) => {
                    this.isAGAllowed = callCenter.aflacGroupEnrollmentAllowed;
                    // eslint-disable-next-line max-len
                    this.menuItems[0] = `${this.languageStrings["primary.portal.common.add"]} ${callCenter.name} ${this.languageStrings["primary.portal.pendedBusiness.account"]}`;
                }),
        );
        this.hasAgImportAccess();
    }
    /**
     * This method will check for the hybrid user permission.
     */
    checkHybridUserPermission(): void {
        this.subscriber.push(
            this.staticUtilService.hasPermission(Permission.HYBRID_USER).subscribe((responseValue: boolean) => {
                this.hybridUserPermission = responseValue;
            }),
        );
    }
    /**
     * This method will verify user have access to import ag account or not.
     */
    hasAgImportAccess(): void {
        this.showSpinner = true;
        this.user.credential$
            .pipe(
                switchMap((credential: ProducerCredential) =>
                    combineLatest([
                        this.producerService.getProducerInformation(credential.producerId.toString()),
                        this.staticUtilService.cacheConfigValue("general.aflac_groups.enable"),
                        this.staticUtilService.hasPermission("aflac.account.group.create"),
                    ]),
                ),
            )
            .subscribe(
                (response) => {
                    this.showSpinner = false;
                    const isCarrierAllowed = response[GROUP_CARRIER_INDEX].carrierAppointments.some(
                        (carrierInfo) => carrierInfo.carrier.id === AG_IMPORT_CARRIER_ID,
                    );
                    const canCreate =
                        response[GROUP_CREATE_INDEX] && response[GROUP_CREATE_INDEX].toLowerCase() === AppSettings.TRUE.toLowerCase();
                    const aflacAccess = response[GROUP_ENABLE_INDEX];
                    this.isAgImport = canCreate && aflacAccess && isCarrierAllowed;
                },
                (err) => {
                    this.isAgImport = false;
                    this.showSpinner = false;
                },
            );
    }

    addAccount(): void {
        this.createAccountDialogRef = this.dialog.open(CreateAccountFormComponent, {
            backdropClass: "backdrop-blur",
            maxWidth: "600px", // 600px max-width based on the definition in abstract.
            panelClass: "create-account",
            data: { route: this.route },
        });
    }

    importAccount(): void {
        this.importAccountDialogRef = this.dialog.open(ImportAccountFormComponent, {
            backdropClass: "backdrop-blur",
            panelClass: "import-account",
            maxWidth: "600px",
            data: { route: this.route },
            ariaLabelledBy: "step-1-title",
        });
        this.importAccountDialogRef.afterClosed().subscribe((imported) => this.accountImported.emit(imported));
    }
    /**
     * This method will open Ag Import pop-up.
     */
    importAgAccount(): void {
        this.dialog.open(AgImportFormComponent, {
            backdropClass: "backdrop-blur",
            panelClass: "import-account",
            maxWidth: "600px",
            data: { route: this.route },
        });
    }
    /**
     * @description checks the VCC permission and opens the respective dialog
     * @param {void}
     * @returns {void}
     */
    callCenterAddAccount(): void {
        if (this.isVCCPermission === false) {
            this.importAccount();
        } else {
            this.importcallCenterDialogRef = this.dialog.open(CallCenterFormComponent, {
                backdropClass: "backdrop-blur",
                panelClass: "callcenter-account",
                width: "750px",
                data: { route: this.route },
            });
            this.importcallCenterDialogRef.afterClosed().subscribe();
        }
    }
    /**
     * function to check user permissions
     * @param getPermissionData permission details
     */
    checkuserPermissions(getPermissionData: string[]): void {
        for (const permission of getPermissionData) {
            if (permission === UserPermissionList.ACCOUNT_CREATE) {
                this.canAddAccount = true;
            }
            if (permission === UserPermissionList.AFLAC_ACCOUNT_CREATE) {
                this.canImportAccount = true;
            }
        }
        if (this.canAddAccount) {
            this.canImportAccount = false;
        } else if (this.canImportAccount) {
            this.canAddAccount = false;
        }
        this.canImportAccount =
            this.canImportAccount || this.store.selectSnapshot(SharedState.hasPermission(Permission.SHARED_CASE_CREATE_ACCOUNT));
    }
    decider(index: number): void {
        if (index === 0) {
            this.callCenterAddAccount();
        } else if (index === 1) {
            this.importAccount();
        }
    }
    /**
     * @description unsubscribes all subscriptions upon destroy of component
     * @param {void}
     * @returns {void}
     */
    ngOnDestroy(): void {
        if (this.getCallCenterSubscription) {
            this.getCallCenterSubscription.unsubscribe();
        }
        this.subscriber.forEach((sub) => {
            sub.unsubscribe();
        });
    }
}
