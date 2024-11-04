import { ActivatedRoute, Router } from "@angular/router";
import { SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { CensusService, AccountService, AuthenticationService, BenefitsOfferingService, StaticService } from "@empowered/api";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { UploadCensusComponent } from "./upload-census/upload-census.component";
import { CensusEstimateComponent } from "./census-estimate/census-estimate.component";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { takeUntil, map, tap, switchMap, take } from "rxjs/operators";
import { Observable, Subject, of, combineLatest } from "rxjs";
import { Permission, ConfigName, UserPermissionList, AppSettings, ToastType, GroupAttribute, Configurations } from "@empowered/constants";
import { MembersHelperService } from "../members-helper.service";
import { OpenToast, CloseAllToast, ToastModel, CensusManualEntryComponent } from "@empowered/ui";

const TRUE_VALUE = "TRUE";
const HQ_ACCOUNT = "is_hq_account";

@Component({
    selector: "empowered-census",
    templateUrl: "./census.component.html",
    styleUrls: ["./census.component.scss"],
})
export class CensusComponent implements OnInit, OnDestroy {
    censusDialogRef: MatDialogRef<UploadCensusComponent>;
    estimateDialogRef: MatDialogRef<CensusEstimateComponent>;
    eligibleEmployee: number;
    displayEligibleEstimate = false;
    isloaded: boolean;
    canOnlyCreateTestMember: boolean;
    canCreateTestMember: boolean;
    canCreateMember: boolean;
    mpGroup: number;
    manualEmployeeDialogRef: MatDialogRef<CensusManualEntryComponent, any>;
    isUploadCensusAccessible: boolean;
    censusUploadPermission = "core.census.upload";
    estimateReadPermission = "core.census.read.estimate";
    estimateUpdatePermission = "core.census.update.estimate";
    addEmployeeInHQAccountPermission = UserPermissionList.AFLAC_HQ_ACCOUNT_ADD_EMPLOYEE;
    permissionAvailability = "";
    primaryContact: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    TOAST_DURATION = 5000;
    toastType: ToastType;
    message = "";
    actionText = "";
    DEFAULT_URL: string;
    GET_ACCOUNT_DATA_WITH_EXISTING_POLICIES: string;
    isImported = false;
    importingFromAflac: string;
    importEmployeePermission$: Observable<boolean>;
    isTpiAccount = false;
    isHqAccount = false;
    restrictUploadCensus = false;
    restrictImportAflac = false;
    restrictCreateMember = false;
    showUploadCensus = true;
    showCreateMember = true;
    showImportAflac = true;
    showAddEmployee = true;
    addEmployeeConfig = true;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.census.uploadCensus",
        "primary.portal.census.addEmployeeManually",
        "primary.portal.common.edit",
        "primary.portal.census.mainTitle",
        "primary.portal.census.addEligibleEmployeeEstimate",
        "primary.portal.census.noEmployeesAdded",
        "primary.portal.duplicateRecords.importAflac",
        "primary.portal.duplicateRecords.importedEmployeeRecords",
        "primary.portal.duplicateRecords.importingEmployeeRecords",
        "primary.portal.members.membersList.addEmployees",
        "primary.portal.duplicateRecords.viewEmployeeList",
        "primary.portal.duplicateRecords.noNewEmployeeRecords",
        "primary.portal.members.membersList.lowerCase.employees",
        "primary.portal.duplicateRecords.refreshEmployeeList",
        "primary.portal.duplicateRecords.importAflac",
        "primary.portal.duplicateRecords.noUpdatesToEmployeeRecords",
        "primary.portal.duplicateRecords.refreshCompleted",
        "primary.portal.duplicateRecords.refreshingEmployee",
        "primary.portal.duplicateRecords.existingPolicies",
    ]);
    portal: string;
    hasPrivilege$ = of(false);

    constructor(
        private readonly dialog: MatDialog,
        private readonly censusService: CensusService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        private readonly authenticationService: AuthenticationService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly utilService: UtilService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly memberService: MembersHelperService,
        private readonly staticService: StaticService,
        private readonly staticUtil: StaticUtilService,
    ) {}

    /**
     * This is the initial function that gets executed in this component
     */
    ngOnInit(): void {
        this.isloaded = false;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.memberService.isTpiAccountStatus$.pipe(takeUntil(this.unsubscribe$)).subscribe((permissions) => {
            this.isTpiAccount = permissions;
        });
        if (this.router.url.indexOf("prospect") !== -1) {
            // Checking for payroll Prospect Path
            this.mpGroup = this.route.parent.parent.snapshot.params ? this.route.parent.parent.snapshot.params.prospectId : null;
        } else {
            // Checking for payroll Account Path
            this.mpGroup = this.route.parent.parent.snapshot.params ? this.route.parent.parent.snapshot.params.mpGroupId : null;
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.shared.*"));
        this.accountService
            .getAccountProducers(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((responses) => {
                responses.forEach((response) => {
                    if (response.role === "PRIMARY_PRODUCER") {
                        this.primaryContact = response.producer.name.lastName + " " + response.producer.name.firstName;
                    }
                });
            });
        this.authenticationService.permissions$
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((response) => {
                    this.permissionAvailability = "none";
                    if (response.length > 0) {
                        if (
                            response.find((d) => String(d) === this.censusUploadPermission) &&
                            response.find((d) => String(d) === this.estimateReadPermission) &&
                            response.find((d) => String(d) === this.estimateUpdatePermission)
                        ) {
                            this.permissionAvailability = "all";
                        } else if (
                            response.find((d) => String(d) === this.estimateReadPermission) &&
                            response.find((d) => String(d) === this.estimateUpdatePermission)
                        ) {
                            this.permissionAvailability = "readAndUpdate";
                        } else if (response.find((d) => String(d) === this.estimateReadPermission)) {
                            this.permissionAvailability = "readOnly";
                        }
                        this.restrictCreateMember = Boolean(response.find((d) => String(d) === Permission.RESTRICT_CREATE_MEMBER));
                        this.restrictImportAflac = Boolean(response.find((d) => String(d) === Permission.RESTRICT_IMPORT_MEMBERS));
                        this.restrictUploadCensus = Boolean(response.find((d) => String(d) === Permission.RESTRICT_CENSUS_UPLOAD));
                        const canCreateMember = response.find((d) => String(d) === UserPermissionList.CREATE_MEMBER) ? true : false;
                        const createTestMember = response.find((d) => String(d) === UserPermissionList.CREATE_TEST_MEMBER) ? true : false;
                        if (canCreateMember) {
                            this.canCreateMember = true;
                            this.canCreateTestMember = createTestMember;
                            this.canOnlyCreateTestMember = false;
                        } else {
                            this.canCreateMember = createTestMember;
                            this.canCreateTestMember = createTestMember;
                            this.canOnlyCreateTestMember = createTestMember;
                        }
                    }
                }),
                switchMap(() => this.showAddEmployeeButton()),
            )
            .subscribe();
        this.censusService
            .checkUploadCensusAccess(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.isUploadCensusAccessible = true;
                },
                () => {
                    this.isUploadCensusAccessible = false;
                },
            );
        this.GET_ACCOUNT_DATA_WITH_EXISTING_POLICIES = this.languageStrings["primary.portal.duplicateRecords.existingPolicies"];
        this.DEFAULT_URL = `${this.portal.toLowerCase()}/payroll/${this.mpGroup}/dashboard`;
        this.onComponentLoad();
        this.getGroupAttributes();
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.mpGroup.toString())
            .pipe(map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)));
    }
    /**
     * fetch census information
     */
    onComponentLoad(): void {
        this.isloaded = false;
        this.benefitsOfferingService
            .getBenefitOfferingSettings(this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (employee) => {
                    this.eligibleEmployee = employee.totalEligibleEmployees;
                    this.displayEligibleEstimate = false;
                    if (this.eligibleEmployee > 0) {
                        this.displayEligibleEstimate = true;
                    }
                    this.isloaded = true;
                },
                () => {
                    this.isloaded = true;
                },
            );
    }
    /**
     * Import employees from aflac
     * @returns void
     */
    importFromAflac(): void {
        this.toastType = ToastType.INFO;
        this.message = this.isImported
            ? this.languageStrings["primary.portal.duplicateRecords.refreshingEmployee"]
            : this.languageStrings["primary.portal.duplicateRecords.importingEmployeeRecords"];
        this.openToast(this.message, this.toastType, this.actionText, -1);
        this.censusService
            .importSubscribers(this.mpGroup)
            .pipe(take(1), takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.toastType = ToastType.SUCCESS;
                    if (response.status === AppSettings.API_RESP_201) {
                        this.message = this.isImported
                            ? this.languageStrings["primary.portal.duplicateRecords.refreshCompleted"]
                            : this.languageStrings["primary.portal.duplicateRecords.importedEmployeeRecords"];
                        if (this.router.url === `/${this.DEFAULT_URL}/employees`) {
                            this.openToast(this.message, this.toastType, this.actionText, this.TOAST_DURATION);
                            this.router
                                .navigateByUrl("/", { skipLocationChange: true })
                                .then(() => this.router.navigate([`${this.DEFAULT_URL}/employees`]));
                        } else {
                            this.actionText = this.languageStrings["primary.portal.duplicateRecords.viewEmployeeList"];
                            this.openToast(this.message, this.toastType, this.actionText, this.TOAST_DURATION);
                        }
                    } else if (response.status === AppSettings.API_RESP_204) {
                        this.message = this.isImported
                            ? this.languageStrings["primary.portal.duplicateRecords.noUpdatesToEmployeeRecords"]
                            : this.languageStrings["primary.portal.duplicateRecords.noNewEmployeeRecords"];
                        this.openToast(this.message, this.toastType, this.actionText, this.TOAST_DURATION);
                    }
                },
                (error) => {
                    this.store.dispatch(new CloseAllToast());
                },
            );
    }
    /**
     * Initializes value for Toast Model and opens the toast component.
     * @param message content for toast component
     * @param type type of toast to display is set based on this value
     * @param actionText action text is to display the hyperlink
     * @param duration duration of time to display the toast
     * @returns void
     */
    openToast(message: string, type: ToastType, actionText: string, duration: number): void {
        const toastData: ToastModel = {
            message: message,
            toastType: type,
            duration: duration,
            action: {
                text: actionText,
                callback: () => {
                    if (actionText) {
                        if (this.router.url === `/${this.DEFAULT_URL}`) {
                            this.censusService.updateDashboardDetails(true);
                        } else {
                            this.router.navigate([`${this.DEFAULT_URL}/employees`]);
                        }
                    }
                },
            },
        };
        this.store.dispatch(new OpenToast(toastData));
    }
    /**
     * function to get group attributes
     * @returns void
     */
    getGroupAttributes(): void {
        this.accountService
            .getGroupAttributesByName([this.GET_ACCOUNT_DATA_WITH_EXISTING_POLICIES], this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isImported = response && response.length > 0;
                this.importingFromAflac = this.isImported
                    ? this.languageStrings["primary.portal.duplicateRecords.refreshEmployeeList"]
                    : this.languageStrings["primary.portal.duplicateRecords.importAflac"];
            });
    }
    uploadCensus(): void {
        this.censusDialogRef = this.dialog.open(UploadCensusComponent, {
            hasBackdrop: true,
            minWidth: "100%",
            height: "100%",
            panelClass: "upload-census",
            data: {
                mpGroupId: this.mpGroup,
            },
        });
    }

    addEligibleEstimate(): void {
        this.estimateDialogRef = this.dialog.open(CensusEstimateComponent, {
            hasBackdrop: true,
            width: "700px",
            panelClass: "census-estimate",
            data: {
                totalEligible: this.eligibleEmployee,
                mpGroupId: this.mpGroup,
            },
        });
        this.estimateDialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.eligibleEmployee = result;
                this.displayEligibleEstimate = false;
                if (this.eligibleEmployee > 0) {
                    this.displayEligibleEstimate = true;
                }
            });
    }
    addEmployeeManually(): void {
        this.manualEmployeeDialogRef = this.dialog.open(CensusManualEntryComponent, {
            hasBackdrop: true,
            minWidth: "100%",
            height: "100%",
            panelClass: "census-manual-entry",
            data: {
                canOnlyCreateTestMember: this.canOnlyCreateTestMember,
                canCreateTestMember: this.canCreateTestMember,
                canCreateMember: this.canCreateMember,
                isQuoteShopPage: false,
                mpGroupId: this.mpGroup,
            },
        });
    }
    /**
     * Function to check permissions for adding employees
     * @returns Observable<[Configurations[], GroupAttribute]>
     */
    showAddEmployeeButton(): Observable<[Configurations[], GroupAttribute[]]> {
        this.importEmployeePermission$ = this.staticUtil.hasAllPermission([Permission.WEBSERVICE_CREATE_MEMBER]);
        return combineLatest([
            this.staticService.getConfigurations(ConfigName.PRODUCER_PERMISSION_TPP_RESTRICT_CREATE_MEMBER, this.mpGroup),
            this.accountService.getGroupAttributesByName([HQ_ACCOUNT], this.mpGroup),
        ]).pipe(
            takeUntil(this.unsubscribe$),
            tap(([addEmployeeConfig, [isHqAccount]]) => {
                this.addEmployeeConfig = addEmployeeConfig[0].value === TRUE_VALUE;
                if (isHqAccount && isHqAccount.attribute === HQ_ACCOUNT) {
                    this.isHqAccount = isHqAccount.value === "true";
                }
                this.showAddEmployeeFlag();
            }),
        );
    }

    showAddEmployeeFlag(): void {
        if (this.isTpiAccount && this.addEmployeeConfig && !this.isHqAccount) {
            this.showCreateMember = !this.restrictCreateMember;
            this.showImportAflac = !this.restrictImportAflac;
            this.showUploadCensus = !this.restrictUploadCensus;
            if (this.restrictUploadCensus && this.restrictImportAflac && this.restrictCreateMember) {
                this.showAddEmployee = false;
            }
        }
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
