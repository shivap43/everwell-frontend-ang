import {
    AlertModel,
    ApprovalToasterStatus,
    BenefitsOfferingState,
    GetProductsPanel,
    MaintenanceBOTabs,
    MaintenanceBOTabsModel,
    MakeStoreEmpty,
    SetAccountThirdPartyPlatforms,
    SetAllEligiblePlans,
    SetAllProducts,
    SetApprovalToastValue,
    SetMaintenanceRequiredData,
    SetPlanEligibility,
    SetBenefitsStateMPGroup,
    SetThirdPartyPlatformRequirement,
    SetUnapprovedPanel,
    SetVasExceptions,
    SideNavService,
    AccountListState,
    AccountInfoState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { ActivatedRoute } from "@angular/router";
import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef } from "@angular/core";
import { Store, Select } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Observable, Subscription, Subject, of, combineLatest } from "rxjs";
import {
    BenefitsOfferingService,
    ApprovalRequest,
    ApprovalRequestStatus,
    AccountDetails,
    BenefitsOfferingMode,
    AccountService,
    AflacService,
    AppTakerService,
} from "@empowered/api";
import { AccountImportTypes, PlanYearType, StatusType } from "@empowered/constants";
import { ProductsPlansQuasiService } from "./products-plans-quasi/services/products-plans-quasi.service";
import { filter, takeUntil, tap, mergeMap, switchMap, finalize } from "rxjs/operators";
import { MatTabGroup, MatTabChangeEvent } from "@angular/material/tabs";
import { HttpErrorResponse } from "@angular/common/http";
import { BenefitOfferingHelperService } from "../benefit-offering-helper.service";
import { SharedService } from "@empowered/common-services";
import { AgRefreshService } from "@empowered/ui";

const STEP_5 = 5;
const STEP_1 = 1;
const STEP_4 = 4;
const VALUE_ZERO = 0;

@Component({
    selector: "empowered-maintenance-benefits-offering",
    templateUrl: "./maintenance-benefits-offering.component.html",
    styleUrls: ["./maintenance-benefits-offering.component.scss"],
})
export class MaintenanceBenefitsOfferingComponent implements OnInit, OnDestroy {
    step = 0;
    isLoading: boolean;
    unApprovedOfferingCount = 0;
    @ViewChild("matTab") MatTab;
    @ViewChild("matTabHR") MatTabHR: MatTabGroup;
    @Select(BenefitsOfferingState.hasIncompleteForms) hasIncompleteForms$: Observable<boolean>;
    @Select(AccountInfoState.getAccountInfo) accountInfo$: Observable<AccountDetails>;
    subscriptions: Subscription[] = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.title",
        "primary.portal.maintenanceBenefitsOffering.products",
        "primary.portal.maintenanceBenefitsOffering.carrier",
        "primary.portal.maintenanceBenefitsOffering.settings",
        "primary.portal.maintenanceBenefitsOffering.benefitDollars",
        "primary.portal.maintenanceBenefitsOffering.approvals",
        "primary.portal.maintenanceBenefitsOffering.approvalPending",
        "primary.portal.maintenanceBenefitsOffering.approvalDescription",
        "primary.portal.maintenanceBenefitsOffering.approvalNeeded",
        "primary.portal.maintenanceBenefitsOffering.adminApproval",
        "primary.portal.maintenanceBenefitsOffering.unapprovedOfferingCount",
        "primary.portal.maintenanceBenefitsOffering.adminApprovalChanges",
        "primary.portal.maintenanceBenefitsOffering.reviewOffering",
        "primary.portal.maintenanceBenefitsOffering.products.updateInProgress",
        "primary.portal.maintenanceBenefitsOffering.products.reviewInProgress",
        "primary.portal.maintenanceBenefitsOffering.zeroState",
        "primary.portal.maintenanceBenefitsOffering.unapprovedOfferingCountPlans",
        "primary.portal.maintenanceBenefitsOffering.unapprovedOfferingCountPlan",
        "primary.portal.maintenanceBenefitsOffering.planYearEnding",
        "primary.portal.maintenanceBenefitsOffering.planYearEndingDesc",
        "primary.portal.maintenanceBenefitsOffering.hqIntegrationAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.agApprovalRequiredChangesText",
        "primary.portal.maintenanceBenefitsOffering.approvalRequiredChangesTextAgAi",
        "primary.portal.maintenanceBenefitsOffering.benefitsOfferingCantBeUpdated",
        "primary.portal.dashboard.unpluggedAccount.checkedOutToUnpluggedNew",
        "primary.portal.maintenanceBenefitsOffering.invalidZipCode",
    ]);
    unapprovedOfferingCount = 0;
    unApprovedSettingsOfferingCount: any;
    unApprovedCarriersCount: any;
    productTabStatus: any;
    fromInitial: any;
    unApprovedApprovalsAlert = 0;
    highAlertProducts: boolean;
    approvalRequestes: ApprovalRequest[] = [];
    isPending: boolean;
    changesRequired: boolean;
    isApprovalRequired: boolean;
    isRequestPending = false;
    count = 0;
    mpGroup: number;
    isAdmin: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    errorMessage: string;
    showErrorMessage: boolean;
    countPlanYearEnding = VALUE_ZERO;
    benefitDollarsStep = STEP_4;
    approvalStep = STEP_5;
    currentAccount: AccountDetails;
    accountImportTypes = AccountImportTypes;
    pendingStatus: StatusType;
    approvalStatusType = StatusType;
    maintenanceBOTabs: MaintenanceBOTabsModel;
    isAGPlansRequiresApproval: boolean;
    isNonAGPlansRequiresApproval: boolean;
    unpluggedAccessAllowed = true;
    checkedOut = false;
    maintenanceLock = true;
    validZip = true;

    constructor(
        private readonly store: Store,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly benefitsService: BenefitsOfferingService,
        private readonly utilService: UtilService,
        private readonly sideNavService: SideNavService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly benefitOfferingHelperService: BenefitOfferingHelperService,
        private readonly aflacService: AflacService,
        private readonly agRefreshService: AgRefreshService,
        private readonly sharedService: SharedService,
        private readonly appTakerService: AppTakerService,
        private readonly changeDetectorRef: ChangeDetectorRef,
    ) {
        this.maintenanceBOTabs = MaintenanceBOTabs.withBenefitDollars;
    }

    /**
     * initialize for the MBO module
     */
    ngOnInit(): void {
        this.initializeBehaviorSubjectValues();
        this.store.dispatch(new SetVasExceptions());
        this.sharedService.currentUnpluggedDetails$.pipe(takeUntil(this.unsubscribe$)).subscribe((unpluggedDetails) => {
            this.checkedOut = unpluggedDetails.isCheckedOut;
            this.maintenanceLock = unpluggedDetails.hasMaintenanceLock;
            this.unpluggedAccessAllowed = unpluggedDetails.allowAccess;
        });
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.fromInitial = params["initial"];
        });
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (this.currentAccount && this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP) {
            this.maintenanceBOTabs = MaintenanceBOTabs.withoutBenefitDollarsAndCarrierForms;
        }
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.isAdmin = this.quasiService.isAdminLoggedIn();
        this.getUnpluggedDetails();
        this.subscriptions.push(
            this.staticUtilService
                .cacheConfigEnabled("general.feature.enable.benefitDollars")
                .pipe(
                    tap((enabled) => {
                        if (!enabled) {
                            this.maintenanceBOTabs =
                                this.currentAccount && this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP
                                    ? MaintenanceBOTabs.withoutBenefitDollarsAndCarrierForms
                                    : MaintenanceBOTabs.withoutBenefitDollars;
                            this.benefitDollarsStep = null;
                            this.approvalStep = STEP_4;
                        }
                    }),
                    filter((enabled) => enabled && !this.isAdmin),
                    switchMap((enabled) => this.accountService.getFlexDollars(this.mpGroup.toString(), "audienceGroupingId", true)),
                )
                .subscribe((flexDollars) => {
                    this.unApprovedOfferingCount = flexDollars.length;
                }),
        );
        // The below if-else condition is used to loose couple the service calls when admin logs in
        if (!this.isAdmin) {
            this.storeUpdate();
            this.checkApprovalRequired();
            this.checkDeclinedAlert();
        } else {
            this.getApprovalRequestServiceCall();
        }
        this.store.dispatch(new SetAccountThirdPartyPlatforms());
        this.store.dispatch(new SetThirdPartyPlatformRequirement());
        if (
            this.currentAccount.importType === AccountImportTypes.AFLAC_GROUP ||
            this.currentAccount.importType === AccountImportTypes.SHARED_CASE
        ) {
            this.checkRefreshEligibility();
        }
        this.subscriptions.push(
            this.utilService.validateZip(this.currentAccount.situs.state.abbreviation, this.currentAccount.situs.zip).subscribe((resp) => {
                this.validZip = resp;
            }),
        );
    }
    /**
     * This method checks if group is refresh eligible or renewal eligible
     */
    checkRefreshEligibility(): void {
        this.isLoading = true;
        combineLatest([
            this.aflacService.getAflacGroupRefreshStatus(this.currentAccount.id),
            this.benefitsService.getPlanYears(this.mpGroup, false),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                filter(
                    ([refreshStatusInfo, approvedPlanYears]) =>
                        refreshStatusInfo.refreshAllowed &&
                        !approvedPlanYears.some((planYear) => planYear.type === PlanYearType.AFLAC_GROUP && planYear.locked),
                ),
                switchMap(([refreshStatusInfo]) => this.agRefreshService.refreshAgOffering(this.currentAccount, refreshStatusInfo)),
                finalize(() => (this.isLoading = false)),
            )
            .subscribe(() => {
                this.benefitOfferingHelperService.updateResetProducts$(true);
            });
    }
    /**
     * This method is used to check approval required status
     * This method is used to arrange plan count for approval required alert
     */
    checkApprovalRequired(): void {
        this.quasiService.isApprovalRequired$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            this.unApprovedApprovalsAlert = 0;
            this.isApprovalRequired = false;
            if (data.status) {
                this.isApprovalRequired = true;
                this.isPending = false;
                this.changesRequired = false;
                if (data.plans) {
                    this.unApprovedApprovalsAlert = data.plans;
                    this.unapprovedOfferingCount = data.plans;
                }
                this.isAGPlansRequiresApproval = data.isAGPlansInvolved;
                this.isNonAGPlansRequiresApproval = data.isNonAGPlansInvolved;
            }
        });
    }
    /**
     * This method will execute on load of maintenance of benefits offering
     * This method is used to get all required info for MBO
     */
    storeUpdate(): void {
        this.isLoading = true;
        this.store
            .dispatch(new MakeStoreEmpty())
            .pipe(
                takeUntil(this.unsubscribe$),
                mergeMap((response) => this.store.dispatch(new SetAllProducts()).pipe(takeUntil(this.unsubscribe$))),
                mergeMap((response) => this.store.dispatch(new SetMaintenanceRequiredData()).pipe(takeUntil(this.unsubscribe$))),
                mergeMap((response) => {
                    if (this.currentAccount && this.currentAccount.importType !== AccountImportTypes.AFLAC_GROUP) {
                        return this.store.dispatch(new SetAllEligiblePlans([], AccountImportTypes.AFLAC_INDIVIDUAL));
                    }
                    return of(null);
                }),
                mergeMap((response) => this.store.dispatch(new SetPlanEligibility()).pipe(takeUntil(this.unsubscribe$))),
                mergeMap((response) => this.store.dispatch(new GetProductsPanel()).pipe(takeUntil(this.unsubscribe$))),
                mergeMap((response) => this.store.dispatch(new SetUnapprovedPanel()).pipe(takeUntil(this.unsubscribe$))),
                mergeMap((response) => {
                    if (this.approvalRequestes && !this.approvalRequestes.length) {
                        return this.benefitsService
                            .getApprovalRequests(this.route.parent.snapshot.parent.parent.params.mpGroupId)
                            .pipe(takeUntil(this.unsubscribe$));
                    }
                    return of(null);
                }),
                tap((response) => {
                    if (this.approvalRequestes && !this.approvalRequestes.length) {
                        this.approvalRequestes = this.utilService.copy(response);
                    }
                    const approvals = this.approvalRequestes;
                    approvals.forEach((request, index) => {
                        if (request.status === ApprovalRequestStatus.NOT_SUBMITTED) {
                            this.approvalRequestes.splice(index, STEP_1);
                        }
                    });
                    const alert = this.utilService.copy(this.approvalRequestes).pop();
                    if (
                        alert &&
                        (alert.status === ApprovalRequestStatus.SUBMITTED_TO_HR || alert.status === ApprovalRequestStatus.SUBMITTED_TO_HQ)
                    ) {
                        this.pendingStatus = alert.status;
                        this.isPending = true;
                        this.isApprovalRequired = false;
                        this.changesRequired = false;
                        this.setPlansCountInAlert(alert);
                    } else if (alert && alert.status === ApprovalRequestStatus.DECLINED) {
                        this.changesRequired = true;
                        this.isApprovalRequired = false;
                        this.isPending = false;
                        this.setPlansCountInAlert(alert);
                    }
                }),
                finalize(() => this.changeDetectorRef.detectChanges()),
            )
            .subscribe(
                (response) => {
                    this.isLoading = false;
                    this.showErrorMessage = false;
                    if (this.fromInitial) {
                        this.step = this.maintenanceBOTabs.APPROVALS;
                    } else {
                        this.step = this.maintenanceBOTabs.PRODUCTS;
                    }
                    if (this.isAdmin) {
                        this.MatTabHR.selectedIndex = this.step - STEP_1;
                    } else {
                        this.MatTab.selectedIndex = this.step - STEP_1;
                    }
                },
                (httpErrorResponse: HttpErrorResponse) => {
                    this.displayErrorMessage(httpErrorResponse);
                },
            );
    }

    /**
     * This below method is used to navigate to approval tab
     */
    navigateToApprovalTab(): void {
        if (this.step !== this.maintenanceBOTabs.APPROVALS && this.isAdmin) {
            this.MatTabHR.selectedIndex = this.maintenanceBOTabs.APPROVALS - STEP_1;
        } else if (this.step !== this.maintenanceBOTabs.APPROVALS) {
            this.MatTab.selectedIndex = this.maintenanceBOTabs.APPROVALS - STEP_1;
        }
    }
    /**
     * This method will execute on change of tabs
     * @param event is the mat tab change event
     */
    onTabChange(event: MatTabChangeEvent): void {
        this.step = event.index + 1;
        const approvalDisplay: ApprovalToasterStatus[] = this.store
            .selectSnapshot(BenefitsOfferingState.GetApprovalStatus)
            .filter((x) => x.mpGroup === this.mpGroup);
        if (this.step === this.maintenanceBOTabs.APPROVALS) {
            const data: ApprovalToasterStatus = {
                mpGroup: this.mpGroup,
                hasToasterAppeared: null,
            };
            data.hasToasterAppeared = approvalDisplay.length === 0;
            this.store.dispatch(new SetApprovalToastValue(data));
        }
    }

    onUnApprovedOfferings(event: any): void {
        this.unApprovedOfferingCount = event;
    }
    onUnApprovedProducts(event: any): void {
        this.displayPendingAlert(event);
    }
    /**
     * Method to display pending alert
     * @param event data of pending plans and status
     */
    displayPendingAlert(event: AlertModel): void {
        this.isPending = false;
        if (event.status === StatusType.SUBMITTED_TO_HQ || event.status === StatusType.SUBMITTED_TO_HR) {
            this.pendingStatus = event.status;
            this.isPending = true;
            this.changesRequired = false;
            this.isApprovalRequired = false;
        }
        if (event.plans) {
            this.unapprovedOfferingCount = event.plans;
        }
    }
    applyHighAlertProducts(event: boolean): void {
        this.highAlertProducts = false;
        if (event) {
            this.highAlertProducts = true;
        }
    }
    /**
     * Function to check plan year ending soon or not
     * @param event planyear ending counts from output
     */
    checkPlanYearEndingSoon(event: number): void {
        this.countPlanYearEnding = event;
    }
    onUnApprovedSettings(event: any): void {
        this.displayPendingAlert(event);
    }
    onUnApprovedCarriers(event: any): void {
        this.displayPendingAlert(event);
    }
    onUnApprovedApprovals(event: any): void {
        this.displayPendingAlert(event);
    }
    /**
     * This method is used to monitor the handleDeclinedAlert observable
     * This method sets the @var changesRequired to true/false and further used to show/hide of Declined Alert
     */
    checkDeclinedAlert(): void {
        this.subscriptions.push(
            this.quasiService
                .getDeclinedAlert()
                .pipe(filter((status) => status !== null && status !== undefined))
                .subscribe((event) => {
                    this.changesRequired = false;
                    if (event.status && event.status === StatusType.DECLINED) {
                        this.isPending = false;
                        this.changesRequired = true;
                        this.isApprovalRequired = false;
                    }
                    if (event.plans) {
                        this.unapprovedOfferingCount = event.plans;
                    }
                }),
        );
        this.subscriptions.push(
            this.quasiService.getUnapprovedCarrierPlans().subscribe((value) => {
                this.changesRequired = value;
            }),
        );
    }

    /**
     * This method is used to set plans count in the alert in maintenance BO
     * @param alert is latest approval request from which we are setting plans count and alert
     */
    setPlansCountInAlert(alert: ApprovalRequest): void {
        const plansCount: number = this.benefitOfferingHelperService.getPlansCountToDisplayInPendingAlert(alert);
        if (plansCount) {
            this.unapprovedOfferingCount = plansCount;
        }
    }

    // This method is used to initialize the behavior subjects and dispatches mpGroup, secondary language
    initializeBehaviorSubjectValues(): void {
        this.store.dispatch(new SetBenefitsStateMPGroup(this.route.parent.snapshot.parent.parent.params.mpGroupId));
        this.sideNavService.initializeStepperData(true);
        this.fromInitial = null;
        this.benefitsService.approvalToast = true;
        this.sideNavService.setBenefitsOfferingMode(BenefitsOfferingMode.MAINTENANCE);
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * This method is used to call getApprovalRequests API and stores the value
     */
    getApprovalRequestServiceCall(): void {
        this.isLoading = true;
        this.subscriptions.push(
            this.benefitsService
                .getApprovalRequests(this.mpGroup)
                .pipe(
                    tap((requests) => {
                        const approvalRequests = this.utilService.copy(requests);
                        requests.forEach((approvals, index) => {
                            if (approvals.status === ApprovalRequestStatus.NOT_SUBMITTED) {
                                approvalRequests.splice(index, 1);
                            } else if (
                                approvals.status === ApprovalRequestStatus.SUBMITTED ||
                                approvals.status === ApprovalRequestStatus.SUBMITTED_TO_HR
                            ) {
                                this.isRequestPending = true;
                            }
                        });
                        this.approvalRequestes = approvalRequests;
                    }),
                )
                .subscribe(
                    (res) => {
                        this.isLoading = false;
                        this.showErrorMessage = false;
                        if (
                            this.approvalRequestes &&
                            this.approvalRequestes.length &&
                            (this.approvalRequestes[this.approvalRequestes.length - STEP_1].status === ApprovalRequestStatus.APPROVED ||
                                (this.approvalRequestes.length > 1 &&
                                    this.approvalRequestes[this.approvalRequestes.length - STEP_1].status ===
                                        ApprovalRequestStatus.DECLINED))
                        ) {
                            this.storeUpdate();
                        }
                    },
                    (httpErrorResponse: HttpErrorResponse) => {
                        this.displayErrorMessage(httpErrorResponse);
                    },
                ),
        );
    }

    /**
     * This method is used to display error message when an API call fails
     * @param httpErrorResponse is instance of HttpErrorResponse
     */
    displayErrorMessage(httpErrorResponse: HttpErrorResponse): void {
        this.showErrorMessage = true;
        this.isLoading = false;
        const error = httpErrorResponse.error;
        this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
    }
    /**
     * This method is used to check whether the account is checked out to unplugged and appropriate messages are shown.
     */
    getUnpluggedDetails(): void {
        const currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
        this.checkedOut = currentAccount && currentAccount.locked;
        this.appTakerService
            .getMaintananceLock(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (permissions) => {
                    this.maintenanceLock = permissions;
                    this.unpluggedAccessAllowed = this.maintenanceLock;
                    this.sharedService.checkUnpluggedDetails({
                        allowAccess: this.unpluggedAccessAllowed,
                        isCheckedOut: this.checkedOut,
                        hasMaintenanceLock: this.maintenanceLock,
                    });
                },
                (error) => {
                    this.maintenanceLock = true;
                    this.unpluggedAccessAllowed = this.maintenanceLock;
                    this.sharedService.checkUnpluggedDetails({
                        allowAccess: this.unpluggedAccessAllowed,
                        isCheckedOut: this.checkedOut,
                        hasMaintenanceLock: this.maintenanceLock,
                    });
                },
            );
    }

    /**
     * ng life cycle hook
     * used to unsubscribe all subscription
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.subscriptions.forEach((subscription) => subscription && subscription.unsubscribe());
    }
}
