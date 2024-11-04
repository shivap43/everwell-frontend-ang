import { Component, OnInit, ViewChild, Output, EventEmitter, OnDestroy } from "@angular/core";
import {
    BenefitsOfferingService,
    AccountList,
    AppTakerService,
    CarrierFormSetupStatus,
    CarrierFormWithCarrierInfo,
    AdminService,
    ApprovalRequest,
    AccountService,
    FlexDollar,
    AccountDetails,
    AflacService,
    ProductSelection,
    AccountContacts,
} from "@empowered/api";
import { Store } from "@ngxs/store";

import {
    BenefitsOfferingState,
    SetCarrierForms,
    ApprovalToasterStatus,
    SetApprovalToastValue,
    GetCarrierSetupStatuses,
    SetSubmitApprovalToasterStatus,
    AccountListState,
    AccountInfoState,
    filterNullValues,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatDialogRef, MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MonDialogComponent, AddUpdateContactInfoComponent, BenefitOfferingUtilService, AgRefreshService } from "@empowered/ui";
import { forkJoin, Subject, of, Observable } from "rxjs";
import { takeUntil, tap, switchMap, map, mergeMap, filter, catchError } from "rxjs/operators";
import { ProductsPlansQuasiService } from "../products-plans-quasi/services/products-plans-quasi.service";
import { ActivatedRoute } from "@angular/router";
import { BenefitOfferingHelperService } from "../../benefit-offering-helper.service";
import { CancelRequestPopUpComponent } from "./cancel-request-pop-up/cancel-request-pop-up.component";
import {
    CarrierId,
    ConfigName,
    Permission,
    AccountImportTypes,
    AppSettings,
    PlanChoice,
    Plan,
    Product,
    StatusType,
    Admin,
    PlanYear,
    AddUpdateContactDialogData,
} from "@empowered/constants";
import { ChangesReviewPopUpComponent } from "./changes-review-pop-up/changes-review-pop-up.component";
import { HttpErrorResponse } from "@angular/common/http";
import { EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

@Component({
    selector: "empowered-approvals-tab",
    templateUrl: "./approvals-tab.component.html",
    styleUrls: ["./approvals-tab.component.scss"],
})
export class ApprovalsTabComponent implements OnInit, OnDestroy {
    approvalssDisplayedColumns: string[] = ["dateSubmitted", "response"];
    isApprovalRequired = false;
    isInfoMissing = false;
    private unsubscribe$ = new Subject<void>();
    mpGroup: number;
    isLoading: boolean;
    approvalRequest = [];
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.requireAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.updateDates",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.removedPlan",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.removedProductName",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.updateAvailability",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.updatedPrices",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.createdPlan",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.submitToAdmin",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.title",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.dateSubmitted",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.response",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.approvedOn",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.manage",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.review",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.updatesRequestedOn",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.cancelApprovalRequest",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.approvalRequiredData",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.reviewModalTitle",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.reviewModalDesc",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.reviewModalUpdates",
        "primary.portal.common.gotIt",
        "primary.portal.common.close",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.createdPlanYearName",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.updatedPlanYearName",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminTitle",
        "primary.portal.benefitsOffering.reviewSubmit.addAdminDescription",
        "primary.portal.common.cancel",
        "primary.portal.administrators.addAdmin",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.missingCarrierInfo",
        "primary.portal.maintenanceBenefitsOffering.approval.infoMissing",
        "primary.portal.maintenanceBenefitsOffering.approval.submitYourChanges",
        "primary.portal.maintenanceBenefitsOffering.approval.dateReceived",
        "primary.portal.maintenanceBenefitsOffering.approval.requestedChanges",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.zeroState",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.pendingHQAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.hqPending",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.hqIntegrationAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.availableForEnrollment",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.hrAdminApproval",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.submitChanges",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.submitToHQAdmin",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.approvedByHQAdminOn",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.products",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.plans",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.added",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.pendingApproval",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.responsePendingApproval",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.approvedByHQAdminIntegration",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.adminResponseDate",
        "primary.portal.maintenanceBenefitsOffering.approvalsTab.approvedDate",
    ]);
    isSettingUpdated = false;
    responseLength: number;
    offeringChangesApproved: any;
    isOfferingReady = false;
    approvalRequiredData: any[] = [];
    alertDialogRef: MatDialogRef<MonDialogComponent>;
    reviewCommentData: any;
    @ViewChild("reviewModal", { static: true }) reviewModal;
    unApprovedProductChoice: any[];
    unApprovedPlanChoice: any[];
    approvedPlanChoice: any[];
    unApprovedPlanYears: any[];
    unapprovedBenefitDollars: FlexDollar[];
    allProducts: any[];
    approvalItemsData: any[] = [];
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    APPROVED = StatusType.APPROVED;
    SUBMITTED = StatusType.SUBMITTED_TO_HQ;
    DECLINED = StatusType.DECLINED;
    SUBMITTED_TO_HR = StatusType.SUBMITTED_TO_HR;
    AUTO_APPROVED = StatusType.AUTO_APPROVED;
    ACCOUNT = "ACCOUNT";
    @Output() emitUnApprovedProducts = new EventEmitter<{ plan?: number; tabAlert?: number }>();
    @Output() emitUnApprovedApprovals = new EventEmitter<{ status: string; plans?: number }>();
    approvalStatusPending = false;
    approvalStatusAlertObject: { plan: number; tabAlert: number };
    approvalSubmitAlert: any;
    unPluggedAccount: boolean;
    currentAccount: AccountList;
    accountLocked: boolean;
    approvalToastDisplay: ApprovalToasterStatus[] = [];
    missingRequiredInfo: string[] = [];
    isRequestPending: boolean;
    carrierFormsFromStore: CarrierFormWithCarrierInfo[];
    fromInitial: any;
    today = new Date();
    allAdmins: Admin[];
    isAdmin: boolean;
    isSubmitApprovalToasterClosed: boolean;
    approvalRequestItems: ApprovalRequest[];
    ADDED = "Added";
    PLANS = "plans";
    PRODUCTS = "products";
    carriersForApproval: string[];
    unApprovedActiveVAS: Plan[] = [];
    approvalRequestToDecline: ApprovalRequest;
    agApprovalRequiredData: string[] = [];
    accountDetails: AccountDetails;
    accountImportTypes = AccountImportTypes;
    errorMessage: string;
    isVestedAgent: boolean;
    isQ60Present: boolean;
    contactInfoBilling: AccountContacts[];
    accountContactTypeIds = {
        PRIMARY: 1,
        BILLING: 2,
    };
    isBillingContactAdded = false;
    permissionEnum = Permission;
    autoApproved = "Auto-approved";
    disableSubmitButton = false;
    constructor(
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly utilService: UtilService,
        private readonly appTakerService: AppTakerService,
        private readonly quasiService: ProductsPlansQuasiService,
        private readonly route: ActivatedRoute,
        private readonly adminService: AdminService,
        private readonly staticUtilService: StaticUtilService,
        private readonly benefitsOfferingHelperService: BenefitOfferingHelperService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly aflacService: AflacService,
        private readonly agRefreshService: AgRefreshService,
        private readonly benefitOfferingUtilService: BenefitOfferingUtilService,
        private readonly dateService: DateService,
    ) {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * @description Angular Life cycle hook
     * initialize component for MBO approvals
     * @memberof ApprovalsTabComponent
     */
    ngOnInit(): void {
        this.accountDetails = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        this.isAdmin = this.quasiService.isAdminLoggedIn();
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.fromInitial = params["initial"];
        });
        this.mpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.quasiService.getConfigurationSpecifications();
        this.quasiService.carriersForApproval.pipe(takeUntil(this.unsubscribe$)).subscribe((value) => {
            this.carriersForApproval = value;
        });
        this.getApprovalToasterStatus();
        if (this.fromInitial === "true") {
            const data: ApprovalToasterStatus = {
                mpGroup: this.mpGroup,
                hasToasterAppeared: null,
            };
            if (this.approvalToastDisplay.length) {
                data.hasToasterAppeared = false;
                this.store.dispatch(new SetApprovalToastValue(data));
            } else {
                data.hasToasterAppeared = true;
                this.store.dispatch(new SetApprovalToastValue(data));
            }
            this.getApprovalToasterStatus();
        }

        this.unPluggedAccount = false;
        this.currentAccount = this.store.selectSnapshot(AccountListState.getGroup);
        this.serviceCalls();
        this.checkForVestedAgents();
        // set spinner when AG refresh api call is pending
        this.benefitsOfferingService
            .getSpinnerStatus()
            .pipe(
                filterNullValues(),
                tap((res) => (this.isLoading = res)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.accountService
            .getAccountContacts("typeId")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                // For Billing contacts as they will always have id 2
                this.contactInfoBilling = resp.filter((contact) => contact.type && contact.type.id === this.accountContactTypeIds.BILLING);
            });
    }
    /**
     * This method is to check for role 71 and make readonly
     * @returns void
     */
    checkForVestedAgents(): void {
        this.staticUtilService
            .hasPermission(Permission.BO_SETTINGS_UPDATE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.isVestedAgent = !response;
            });
    }
    getApprovalToasterStatus(): void {
        this.approvalToastDisplay = this.store
            .selectSnapshot(BenefitsOfferingState.GetApprovalStatus)
            .filter((x) => x.mpGroup === this.mpGroup);
    }

    /**
     * calling API endpoints to get data
     */
    serviceCalls(): void {
        this.getRequiredInfo()
            .pipe(
                switchMap((res) => {
                    this.isLoading = true;
                    return this.benefitsOfferingService.getBenefitOfferingCarriers(true).pipe(
                        takeUntil(this.unsubscribe$),
                        map((carriers) => carriers.map((carrier) => carrier.id)),
                        mergeMap((resp) => this.store.dispatch(new GetCarrierSetupStatuses(resp, false))),
                        mergeMap((resp) => this.store.dispatch(new SetCarrierForms(false, false))),
                        mergeMap((resp) => this.store.dispatch(new SetCarrierForms(true, false))),
                    );
                }),
            )
            .subscribe((data) => {
                this.isLoading = false;
                this.carrierFormsFromStore = this.store.selectSnapshot(BenefitsOfferingState.getAllCarrierForms);
                this.isQ60Present = Boolean(
                    this.carrierFormsFromStore.find((form) => form.carrierId === CarrierId.AFLAC && form.id !== null),
                );
                this.carrierFormsFromStore.forEach((forms) => {
                    if (
                        (forms.formStatus === CarrierFormSetupStatus.INCOMPLETE ||
                            forms.formStatus === CarrierFormSetupStatus.NOT_STARTED) &&
                        this.missingRequiredInfo.findIndex(
                            (i) =>
                                i ===
                                this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.missingCarrierInfo"] +
                                    " " +
                                    forms.formName,
                        ) === -1
                    ) {
                        this.missingRequiredInfo.push(
                            this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.missingCarrierInfo"] +
                                " " +
                                forms.formName,
                        );
                    }
                });
            });
        this.getAccountMaintenanceLockStatus();
    }
    /**
     * This method is used to get all the required info related to approvals tab
     * @returns an observable of array containing ProductSelection[],
     * PlanYear[], ApprovalRequest[] and FlexDollar[]
     */
    getRequiredInfo(): Observable<[ProductSelection[], PlanYear[], ApprovalRequest[], FlexDollar[]]> {
        this.quasiService.isApprovalRequired$.next({ status: false });
        this.quasiService.setDeclineAlert({ status: null });
        this.isLoading = true;
        this.unApprovedProductChoice = [];
        this.unApprovedPlanChoice = [];
        this.approvedPlanChoice = [];
        this.unapprovedBenefitDollars = [];
        this.allProducts = this.store.selectSnapshot(BenefitsOfferingState.getAllProducts);
        this.unApprovedPlanYears = [];
        this.isSettingUpdated = false;
        return this.staticUtilService.cacheConfigEnabled(ConfigName.BENEFIT_DOLLARS).pipe(
            switchMap((isBenefitDollarsEnabled) =>
                forkJoin([
                    this.benefitsOfferingService.getProductChoices(this.mpGroup, true),
                    this.benefitsOfferingService.getPlanYears(this.mpGroup, true),
                    this.benefitsOfferingService.getApprovalRequests(this.mpGroup),
                    isBenefitDollarsEnabled
                        ? this.accountService.getFlexDollars(this.mpGroup.toString(), "audienceGroupingId", true)
                        : of([]),
                ]),
            ),
            tap(([productOfferings, unapprovedPlanYears, approvalRequests, flexDollars]) => {
                this.unApprovedProductChoice = productOfferings;
                this.unApprovedPlanChoice = this.store.selectSnapshot(BenefitsOfferingState.getUnapprovedPlanChoices);
                this.unApprovedPlanYears = unapprovedPlanYears;
                this.approvedPlanChoice = this.store.selectSnapshot(BenefitsOfferingState.getPlanChoices);
                this.unapprovedBenefitDollars = flexDollars;
                this.missingRequiredInfo = [];
                this.approvalRequestItems = this.utilService.copy(approvalRequests);
                this.approvalRequest = this.utilService.copy(approvalRequests);
                const requests = this.utilService.copy(this.approvalRequest);
                requests.forEach((request, index) => {
                    if (request.status === StatusType.NOT_SUBMITTED) {
                        this.approvalRequest.splice(index, 1);
                    }
                });
                this.validateApprovalsData();
                this.responseLength = this.approvalRequest.length;
                this.offeringChangesApproved = 0;
                this.approvalRequest.forEach((ele) => {
                    if (
                        ele.status === StatusType.APPROVED ||
                        ele.status === StatusType.NOT_SUBMITTED ||
                        ele.status === StatusType.DECLINED
                    ) {
                        this.offeringChangesApproved++;
                    }
                });
                if (this.offeringChangesApproved === this.responseLength) {
                    this.isOfferingReady = true;
                }
            }),
            takeUntil(this.unsubscribe$),
        );
    }
    /**
     * This method is used to check whether submit approval request toaster is closed or not
     * @param  {ApprovalRequest[]}  approvalRequests is current approval requests coming from API
     */
    checkForToasterStatus(approvalRequests: ApprovalRequest[]): void {
        this.isSubmitApprovalToasterClosed = false;
        const storedToasterStatus: boolean = this.utilService
            .copy(this.store.selectSnapshot(BenefitsOfferingState.getSubmitToasterStatus))
            .filter((eachRequest: ApprovalToasterStatus) => eachRequest.mpGroup === this.mpGroup)
            .map((eachRequest: ApprovalToasterStatus) => eachRequest.isSubmitToasterClosed)
            .pop();
        if (this.isSettingUpdated && approvalRequests.length > 1 && !this.isAdmin && !storedToasterStatus) {
            this.isSubmitApprovalToasterClosed = true;
        }
    }

    /**
     * Gets maintenance lock status of an account
     */
    getAccountMaintenanceLockStatus(): void {
        this.appTakerService
            .getMaintananceLock(this.mpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.accountLocked = !response;
                    this.setIsAccountCheckedOut();
                },
                () => {
                    this.setIsAccountCheckedOut();
                },
            );
    }
    /**
     * Checks if current account is checked out by Unplugged
     */
    setIsAccountCheckedOut(): void {
        this.unPluggedAccount = this.currentAccount && this.currentAccount.status && this.currentAccount.locked && this.accountLocked;
    }

    /**
     * function to validate plan approval data
     */
    validateApprovalsData(): void {
        this.approvalRequiredData = [];
        this.approvalItemsData = [];
        this.agApprovalRequiredData = [];
        const requests = this.utilService.copy(this.approvalRequest);
        requests.forEach((request, index) => {
            if (request && request.status === StatusType.NOT_SUBMITTED) {
                this.approvalRequest.splice(index, 1);
            }
            if (request.approvalItems.length) {
                this.approvalItemsData.push(request);
            }
        });
        this.isRequestPending = false;
        if (
            this.approvalRequest.length &&
            (this.approvalRequest[this.approvalRequest.length - 1].status === StatusType.SUBMITTED_TO_HQ ||
                this.approvalRequest[this.approvalRequest.length - 1].status === StatusType.SUBMITTED_TO_HR)
        ) {
            this.isSettingUpdated = true;
            this.isRequestPending = true;
        }
        const plansYears = [];
        this.setApprovalRequiredData();
        if (this.unApprovedPlanYears.length) {
            this.unApprovedPlanYears.forEach((eachPlanYear) => {
                this.unApprovedPlanChoice.forEach((planChoice) => {
                    if (
                        planChoice.planYearId &&
                        planChoice.planYearId === eachPlanYear.id &&
                        plansYears.findIndex((p) => p.id === eachPlanYear.id) === -1
                    ) {
                        plansYears.push(eachPlanYear);
                        this.getApprovalList(eachPlanYear);
                    }
                });
                this.approvedPlanChoice.forEach((planChoice) => {
                    if (
                        planChoice.planYearId &&
                        planChoice.planYearId === eachPlanYear.id &&
                        plansYears.findIndex((p) => p.id === eachPlanYear.id) === -1
                    ) {
                        plansYears.push(eachPlanYear);
                    }
                });
            });
        }
        if (this.unapprovedBenefitDollars.length) {
            this.approvalRequiredData.push(
                this.language.fetchPrimaryLanguageValue("primary.portal.maintenanceBenefitsOffering.approvalsTab.updatedBenefitDollars"),
            );
        }
        this.approvalStatusPending = false;
        this.approvalItemsData.forEach((approvalStatus) => {
            if (approvalStatus.status === StatusType.SUBMITTED_TO_HQ || approvalStatus.status === StatusType.SUBMITTED_TO_HR) {
                this.approvalStatusPending = true;
                let plan = 0;
                approvalStatus.approvalItems.forEach((element) => {
                    if (element.object === AppSettings.PLAN) {
                        plan++;
                    }
                });
                this.sendData({
                    plan: plan,
                    alert: this.approvalRequiredData.length + this.agApprovalRequiredData.length,
                });
            }
        });
        let alert = this.utilService.copy(this.approvalRequest);
        alert = alert.pop();
        if (alert && (alert.status === StatusType.SUBMITTED_TO_HQ || alert.status === StatusType.SUBMITTED_TO_HR)) {
            const plansCount: number = this.benefitsOfferingHelperService.getPlansCountToDisplayInPendingAlert(alert);
            this.emitUnApprovedApprovals.emit({ status: alert.status, plans: plansCount });
        }
        this.setIsApprovalRequiredAlert();
        if (
            this.approvalRequest.length > 0 &&
            this.approvalRequest[this.approvalRequest.length - 1].status === StatusType.DECLINED &&
            this.unApprovedPlanChoice.length
        ) {
            this.quasiService.setDeclineAlert({
                status: StatusType.DECLINED,
                plans: this.unApprovedPlanChoice.filter((data) => data.requiredSetup).length,
            });
            this.unApprovedActiveVAS = this.quasiService.getAllVasPlans();
            if (
                this.unApprovedPlanChoice.filter(
                    (data) =>
                        this.unApprovedActiveVAS.find((value) => value.id === data.plan.id) ||
                        this.carriersForApproval.find((value) => value === data.plan.carrierId.toString()),
                ).length > 0
            ) {
                this.quasiService.setUnapprovedCarrierPlans(true);
            } else {
                this.quasiService.setUnapprovedCarrierPlans(false);
            }
        }
        this.isLoading = false;
        this.checkForToasterStatus(this.approvalRequestItems);
    }
    /**
     * This method is used to set approval required alert
     */
    setIsApprovalRequiredAlert(): void {
        if (
            (this.approvalRequest.length > 0 &&
                (this.approvalRequiredData.length || this.agApprovalRequiredData.length) &&
                !this.approvalStatusPending &&
                this.approvalRequest[this.approvalRequest.length - 1].status !== StatusType.DECLINED &&
                this.unApprovedPlanChoice.length) ||
            ((this.approvalRequiredData.length || this.agApprovalRequiredData.length) && this.approvalRequest.length === 0)
        ) {
            this.approvalSubmitAlert = this.approvalRequiredData.length + this.agApprovalRequiredData.length;
            this.quasiService.isApprovalRequired$.next({
                status: true,
                plans: this.unApprovedPlanChoice.filter((res) => res.requiredSetup).length,
                isAGPlansInvolved: this.unApprovedPlanChoice.some(
                    (planChoice) => planChoice.requiredSetup && planChoice.plan.carrierId === CarrierId.AFLAC_GROUP,
                ),
                isNonAGPlansInvolved: this.unApprovedPlanChoice.some(
                    (planChoice) => planChoice.requiredSetup && planChoice.plan.carrierId !== CarrierId.AFLAC_GROUP,
                ),
            });
        }
    }
    /**
     * to set approval required data
     */
    setApprovalRequiredData(): void {
        if (this.unApprovedPlanChoice.length) {
            this.setApprovalRequiredInfo(true);
            this.setApprovalRequiredInfo(false);
        }
    }
    /**
     * This method is used to set approval required data object
     * @param arrangeNonAGPlanRequiredInfo represent whether to arrange non-AG plan info or AG plan info
     */
    setApprovalRequiredInfo(arrangeNonAGPlanRequiredInfo: boolean): void {
        const products: Product[] = [];
        const unapprovedPlanChoices: PlanChoice[] = this.unApprovedPlanChoice.filter(
            (planChoice: PlanChoice) =>
                planChoice.requiredSetup &&
                ((arrangeNonAGPlanRequiredInfo && planChoice.plan.carrierId !== CarrierId.AFLAC_GROUP) ||
                    (!arrangeNonAGPlanRequiredInfo && planChoice.plan.carrierId === CarrierId.AFLAC_GROUP)),
        );
        this.allProducts.forEach((eachProduct) => {
            unapprovedPlanChoices.forEach((planChoice) => {
                if (planChoice.plan.productId === eachProduct.id && products.findIndex((p) => p.id === eachProduct.id) === -1) {
                    products.push(eachProduct);
                    const productRequiredInfo = `${this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.added"]}
                        ${eachProduct.name}
                        ${this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.products"]}`;
                    if (arrangeNonAGPlanRequiredInfo) {
                        this.approvalRequiredData.push(productRequiredInfo);
                    } else {
                        this.agApprovalRequiredData.push(productRequiredInfo);
                    }
                }
            });
        });
        if (unapprovedPlanChoices.length) {
            const planRequiredInfo = `${this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.added"]}
                ${unapprovedPlanChoices.length}
                ${this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.plans"]}`;
            if (arrangeNonAGPlanRequiredInfo) {
                this.approvalRequiredData.push(planRequiredInfo);
            } else {
                this.agApprovalRequiredData.push(planRequiredInfo);
            }
        }
    }
    getApprovalList(planYear: PlanYear): void {
        const enrollmentStartDate = this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting || "");
        this.today.setHours(0, 0, 0, 0);
        if (enrollmentStartDate >= this.today) {
            this.approvalRequiredData.push(
                this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.createdPlanYearName"].replace(
                    "##planyearname##",
                    planYear.name,
                ),
            );
        } else {
            this.approvalRequiredData.push(
                this.languageStrings["primary.portal.maintenanceBenefitsOffering.approvalsTab.updatedPlanYearName"].replace(
                    "##planyearname##",
                    planYear.name,
                ),
            );
        }
    }
    sendData({ alert, plan }: { alert?: number; plan?: number } = {}): void {
        this.approvalStatusAlertObject = { plan: plan, tabAlert: alert };
        this.emitUnApprovedProducts.emit(this.approvalStatusAlertObject);
    }

    /**
     * Check if billing contact is present, else add one for Q60
     */
    checkBillingContact(): void {
        this.isLoading = true;
        this.disableSubmitButton = true;
        if (this.isQ60Present && !this.contactInfoBilling.length && !this.isBillingContactAdded) {
            this.addBillingContact();
        } else {
            this.submitApprovalRequest();
        }
    }

    /**
     * Add billing contact
     */
    addBillingContact(): void {
        this.isLoading = true;
        const data: AddUpdateContactDialogData = {
            parentMode: this.ACCOUNT,
            isAdd: true,
            isPrimary: this.contactInfoBilling.length > 0 ? false : true,
            mpGroupId: this.mpGroup.toString(),
            showType: true,
            allowEditingAddress: false,
            allowEditingContactName: false,
            allowEditingPhoneNumber: false,
            allowEditingEmailAddress: false,
        };
        const dialogConfig: MatDialogConfig = {
            data: data,
        };
        const dialogRef = this.empoweredModalService.openDialog(AddUpdateContactInfoComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                tap((isContactUpdated) => {
                    if (isContactUpdated) {
                        this.isBillingContactAdded = true;
                        this.submitApprovalRequest();
                    }
                }),
            )
            .subscribe(() => {
                this.isLoading = false;
                this.disableSubmitButton = false;
            });
    }

    /**
     * This method will call when user clicks on submit to admin / submit to HQ admin button
     */
    submitApprovalRequest(): void {
        if (this.approvalRequiredData.length) {
            this.submitApproval();
        } else if (this.agApprovalRequiredData.length) {
            this.isLoading = true;
            this.checkAgRefreshStatus()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (res) => {
                        this.fromInitial = false;
                        this.isSubmitApprovalToasterClosed = true;
                        this.isLoading = false;
                        this.disableSubmitButton = false;
                    },
                    (error: HttpErrorResponse) => {
                        this.displayDefaultError(error);
                        this.disableSubmitButton = false;
                    },
                );
        }
    }
    /**
     * This method is used to check AG refresh status and opens refresh/renewal pop-up, if eligible
     * @returns observable of void or array containing ProductSelection[],
     * PlanYear[], ApprovalRequest[] and FlexDollar[]
     */
    checkAgRefreshStatus(): Observable<void | [ProductSelection[], PlanYear[], ApprovalRequest[], FlexDollar[]]> {
        this.isLoading = true;
        return forkJoin(
            this.aflacService.getAflacGroupRefreshStatus(this.mpGroup),
            this.benefitsOfferingService.refreshAflacGroupOfferablePlans(this.mpGroup).pipe(catchError(() => of(null))),
        ).pipe(
            switchMap(([aflacGroupRefreshStatus, aflacGroupOfferablePlans]) => {
                this.isLoading = false;
                if (
                    aflacGroupRefreshStatus.requiresBenefitOfferingRenewal ||
                    (aflacGroupRefreshStatus.refreshAllowed &&
                        aflacGroupOfferablePlans &&
                        (aflacGroupOfferablePlans.aflacGroupOfferingRequiresReview ||
                            aflacGroupOfferablePlans.newAflacGroupPlanYearRequired))
                ) {
                    return this.agRefreshService.refreshAgOffering(this.accountDetails, aflacGroupRefreshStatus);
                }
                return this.benefitsOfferingService.submitApprovalRequest(this.mpGroup, true);
            }),
            switchMap((res) => this.getRequiredInfo()),
        );
    }

    /**
     * This method is used to display default error status and error code defined error messages
     * @param error is the HttpErrorResponse
     */
    displayDefaultError(error: HttpErrorResponse): void {
        this.isLoading = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * This method is used to check account admins
     * If there are no admins, then add-admin pop-up will open
     * else submit approval request will get called
     */
    submitApproval(): void {
        this.isLoading = true;
        // check admins
        this.adminService
            .getAccountAdmins(this.mpGroup, "roleId,reportsToId")
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((response) => {
                    this.allAdmins = response;
                    this.isLoading = false;
                    if (this.allAdmins.length === 0) {
                        // if there is no admin inform user to add admin
                        return this.benefitOfferingUtilService.addAdminPopUp().pipe(
                            switchMap((status: string) => {
                                if (status) {
                                    return this.addAdmin(status);
                                }
                                return of(null);
                            }),
                        );
                    }
                    if (this.agApprovalRequiredData.length) {
                        return this.checkAgRefreshStatus();
                    }
                    return this.submitApprovalServiceCall();
                }),
            )
            .subscribe(
                (res) => {
                    if (res) {
                        this.fromInitial = false;
                        this.isSubmitApprovalToasterClosed = true;
                    }
                    this.isLoading = false;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }
    /**
     * This method is used to open addAdmin popup
     * @param choice is the user selection in import admin pop-up
     * @returns observable of void or array containing ProductSelection[],
     * PlanYear[], ApprovalRequest[] and FlexDollar[]
     */
    addAdmin(choice: string): Observable<void | [ProductSelection[], PlanYear[], ApprovalRequest[], FlexDollar[]]> {
        return this.benefitOfferingUtilService.addAdmin(this.allAdmins, choice).pipe(
            tap((status) => {
                if (status !== true) {
                    this.isLoading = false;
                }
            }),
            filter((status) => status === true),
            switchMap((status) => {
                if (this.agApprovalRequiredData.length) {
                    return this.checkAgRefreshStatus();
                }
                return this.submitApprovalServiceCall();
            }),
        );
    }
    /**
     * This method is used to submit approval request
     * @returns observable of void or array containing ProductSelection[],
     * PlanYear[], ApprovalRequest[] and FlexDollar[]
     */
    submitApprovalServiceCall(): Observable<void | [ProductSelection[], PlanYear[], ApprovalRequest[], FlexDollar[]]> {
        this.store.dispatch(new SetSubmitApprovalToasterStatus({ mpGroup: this.mpGroup, isSubmitToasterClosed: false }));
        return this.benefitsOfferingService.submitApprovalRequest(this.mpGroup, false).pipe(
            takeUntil(this.unsubscribe$),
            switchMap((res) => this.benefitsOfferingService.submitApprovalRequest(this.mpGroup, true)),
            switchMap((res) => this.getRequiredInfo()),
            catchError((error) => this.getRequiredInfo()),
        );
    }
    /**
     * This function will open a pop-up to display admin requested changes
     * @param approvalData approval request which admin has declined
     */
    reviewComments(approvalData: ApprovalRequest): void {
        this.empoweredModalService.openDialog(ChangesReviewPopUpComponent, { data: approvalData });
    }

    closeModal(): void {
        this.dialog.closeAll();
    }
    /**
     * This function will open a pop for confirmation to remove approval request
     * @param approvalRequest approval request to be revoked
     */
    cancelApprovalRequest(approvalRequest: ApprovalRequest): void {
        this.disableSubmitButton = false;
        this.approvalRequestToDecline = approvalRequest;
        this.empoweredModalService
            .openDialog(CancelRequestPopUpComponent, { data: approvalRequest })
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((res) => res),
                tap((res) => {
                    this.isLoading = true;
                }),
                switchMap((res) => this.benefitsOfferingService.cancelApprovalRequest(this.mpGroup)),
                switchMap((res) => this.getRequiredInfo()),
            )
            .subscribe(
                (res) => {
                    this.isLoading = false;
                    this.alert();
                },
                (error) => {
                    this.isLoading = false;
                    this.displayDefaultError(error);
                },
            );
    }

    /**
     * take alert action on cancel approval request
     */
    alert(): void {
        this.isSettingUpdated = false;
        this.emitUnApprovedApprovals.emit({ status: StatusType.NOT_SUBMITTED });
    }
    /**
     * This method will execute when user closes the toaster
     * @param isSubmitToastClosed is used to represent whether submit approval is closed or not
     */
    closeToast(isSubmitToastClosed: boolean = false): void {
        const data: ApprovalToasterStatus = {
            mpGroup: this.mpGroup,
            hasToasterAppeared: false,
        };
        this.store.dispatch(new SetApprovalToastValue(data));
        this.store.dispatch(
            new SetSubmitApprovalToasterStatus({
                mpGroup: this.mpGroup,
                isSubmitToasterClosed: isSubmitToastClosed,
            }),
        );
    }
    /**
     * This is life cycle hook method executed before the component is destroyed
     * and business logic is written to unsubscribe to all active subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
