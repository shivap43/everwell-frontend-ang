import {
    EnrollmentState,
    ShopCartService,
    MemberWizardState,
    DualPlanYearState,
    SharedState,
    StaticUtilService,
    UtilService,
    TPIState,
} from "@empowered/ngxs-store";
import {
    ShoppingService,
    EnrollmentStatus,
    EnrollmentStatusType,
    QLEEndPlanRequestStatus,
    LanguageModel,
    Carrier,
    MemberFullProfile,
} from "@empowered/api";
import { Component, OnInit, Output, EventEmitter, OnDestroy } from "@angular/core";
import { TpiServices } from "@empowered/common-services";
import { LanguageService, LanguageState } from "@empowered/language";
import { MatTableDataSource } from "@angular/material/table";
import { Select } from "@ngxs/store";
import { MatDialog } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
import { combineLatest, Observable, Subject, Subscription } from "rxjs";
import {
    CarrierId,
    ConfigName,
    EditPlan,
    TpiSSOModel,
    AppSettings,
    PolicyOwnershipType,
    Plan,
    GetCartItems,
    Enrollments,
    PlanOfferingPanel,
    Accounts,
    MemberContact,
    MemberQualifyingEvent,
    ProductOfferingPanel,
} from "@empowered/constants";
import { takeUntil, tap, map, take } from "rxjs/operators";
import { PlanDetailsComponent } from "@empowered/ui";

// Component Level Constant
const TPI = "tpi";

@Component({
    selector: "empowered-product-info",
    templateUrl: "./product-info.component.html",
    styleUrls: ["./product-info.component.scss"],
})
export class ProductInfoComponent implements OnInit, OnDestroy {
    @Output() products = new EventEmitter<boolean>();

    mpGroup: number;
    dataSource = new MatTableDataSource<ProductOfferingPanel>();
    displayedColumns = ["productIcon", "productName", "productDescription", "viewPlans"];
    enrollmentState: string;
    productOfferings: ProductOfferingPanel[];
    showSpinner: boolean;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    enrollments: Enrollments[];
    memberId: number;
    editPlan: EditPlan;
    editProductOfferingId: number;
    isWizardFlow: boolean;
    cartItems: GetCartItems[];
    daysLeft: number;
    dateToday = new Date();
    grandfatheredPlan = {};
    subscriptions: Subscription[] = [];
    @Select(EnrollmentState.GetMPGroup) mpGroup$: Observable<number>;
    @Select(EnrollmentState.GetProductOfferings) productOfferings$: Observable<ProductOfferingPanel[]>;
    @Select(EnrollmentState.GetEnrollments) enrollments$: Observable<Enrollments[]>;
    @Select(EnrollmentState.GetMemberId) memberId$: Observable<number>;
    @Select(EnrollmentState.GetEnrollmentState) enrollmentState$: Observable<string>;
    @Select(EnrollmentState.GetNavBarType) navType$: Observable<string>;
    @Select(MemberWizardState.GetAllCarriers) allMemberWizardCarriers$: Observable<Carrier[]>;
    @Select(TPIState.GetAllCarriers) allTPICarriers$: Observable<Carrier[]>;
    policyEndDates: string[] = [];

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shoppingCart.planOfferings.inCart",
        "primary.portal.shoppingExperince.declined",
        "primary.portal.shoppingExperience.comapnyProvided",
        "primary.portal.shoppingExperience.viewPlans",
        "primary.portal.shoppingExperience.viewPlan",
        "primary.portal.tpi.coverageStartsOn",
        "primary.portal.tpi.selected",
        "primary.portal.coverage.endCoverageRequested",
        "primary.portal.coverage.policyEnds",
        "primary.portal.members.planOptions",
    ]);
    isTpi = false;
    isTpiFlow = false;
    tpiLnlMode = false;
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    qualifyingEventStatuses: string[] = [];
    carrierStatusCheckForQLE: string[] = [];
    NOT_ALLOWED_CARRIER_STATUS = "user.enrollment.policy.override_qle_pending_statuses";
    isWarnings: boolean[] = [];
    qleEndPlanRequestStatus = QLEEndPlanRequestStatus;
    currentQualifyingEvents: MemberQualifyingEvent[];
    statusEnded = EnrollmentStatus.ended;
    policiesExpired: boolean[] = [];
    tpiSsoDetail: TpiSSOModel;
    isAgentAssisted = false;
    private readonly unsubscribe$ = new Subject<void>();
    allCarriers$: Observable<Carrier[]>;
    userState$: Observable<string>;
    virginiaFeatureEnabledConfig$: Observable<boolean>;
    virginiaFeatureEnabled$: Observable<boolean>;

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * This method will check for TPI producer Id and determine whether it is Agent assisted or not.
     * This method is also used for initialization of other data
     * @param dialog is instance of MatDialog
     * @param store is instance of Store
     * @param shoppingService is the instance of ShoppingService
     * @param language is instance of LanguageService
     * @param shopCartService is instance of ShopCartService
     * @param datePipe is instance of DatePipe
     * @param router is instance of Router
     * @param tpiService is instance of TpiServices
     * @param util is instance of UtilService
     */
    constructor(
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly shoppingService: ShoppingService,
        private readonly language: LanguageService,
        private readonly shopCartService: ShopCartService,
        private readonly datePipe: DatePipe,
        private readonly router: Router,
        private readonly tpiService: TpiServices,
        private readonly util: UtilService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        if (this.router.url.indexOf(TPI) >= 0) {
            this.isTpi = true;
            this.isTpiFlow = true;
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
            if (this.tpiLnlMode) {
                this.isTpi = false;
            }
            this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.isAgentAssisted = Boolean(this.tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId));
        }
        this.currentQualifyingEvents = this.store.selectSnapshot(EnrollmentState.GetQLEResponse);
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
        this.subscriptions.push(this.mpGroup$.subscribe((x) => (this.mpGroup = x)));
        this.subscriptions.push(this.enrollments$.subscribe((x) => (this.enrollments = x)));
        this.subscriptions.push(this.memberId$.subscribe((x) => (this.memberId = x)));
        this.subscriptions.push(this.enrollmentState$.subscribe((x) => (this.enrollmentState = x)));
        this.subscriptions.push(this.navType$.subscribe((x) => (this.isWizardFlow = x === "wizard")));
    }

    /**
     * Life cycle hook used to get cart items, grandfatheredPlan and QLE status and edited plans
     */
    ngOnInit(): void {
        // Gets all carriers from either the member or TPI flow
        this.allCarriers$ = combineLatest([this.allMemberWizardCarriers$, this.allTPICarriers$]).pipe(
            map(([wizardCarriers, tpiCarriers]) => wizardCarriers ?? tpiCarriers),
        );
        // Virginia Connection configuration enabled/disabled
        this.virginiaFeatureEnabledConfig$ = this.staticUtilService.cacheConfigEnabled(ConfigName.FEATURE_ENABLE_VIRGINIA_OBJECTION);
        // Virginia Connection config
        this.virginiaFeatureEnabled$ = this.virginiaFeatureEnabledConfig$.pipe(
            map((virginiaConfig) =>
                // if virginia objection config is off, then disable feature
                !!virginiaConfig),
        );
        // Sets product offerings
        combineLatest([this.productOfferings$, this.virginiaFeatureEnabled$, this.allCarriers$])
            .pipe(
                tap(([offerings, virginiaEnabled, allCarriers]) => {
                    let prodOfferings = this.tpiSsoDetail?.productId
                        ? offerings
                        : offerings?.filter((product) => product.planOfferings?.length);
                    if (virginiaEnabled) {
                        const aflacCarrierObj = allCarriers.find((carrier) => CarrierId.AFLAC === carrier.id);
                        const newOfferings = prodOfferings.map((product) => {
                            const multipleCarriers = product.product.carrierName.includes(",");
                            return {
                                ...product,
                                product: { ...product.product, legalName: aflacCarrierObj?.legalName },
                                multipleCarriers,
                            };
                        });
                        prodOfferings = newOfferings;
                    }
                    this.productOfferings = prodOfferings;
                    this.dataSource.data = prodOfferings;
                    this.showSpinner = false;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        this.getEditPlan();
        this.getCartIems();
        this.getGrandfatheredPlan();
        if (this.productOfferings?.length) {
            this.setQLEStatuses();
        }
    }

    showPlans(id: any): void {
        this.products.emit(id);
    }
    getGrandfatheredPlan(): void {
        this.enrollments.forEach((eachEnrollment) => {
            let productIdx;
            if (eachEnrollment.status === "APPROVED" || eachEnrollment.carrierStatus === "ACTIVE") {
                productIdx = this.productOfferings.findIndex((product) => product.product.id === eachEnrollment.plan.productId);
                if (productIdx > -1) {
                    this.productOfferings.forEach((eachProduct) => {
                        if (eachEnrollment.plan.sunsetDate && eachProduct.product.id === eachEnrollment.plan.productId) {
                            this.daysLeft = this.datediff(
                                this.parseDate(this.datePipe.transform(this.dateToday, "yyyy-MM-dd")),
                                this.parseDate(eachEnrollment.plan.sunsetDate),
                            );
                            if (this.daysLeft < 0) {
                                this.grandfatheredPlan[eachEnrollment.plan.productId] = true;
                            }
                        }
                    });
                }
            }
        });
    }

    showPlanDetailsPopup(productOffering: ProductOfferingPanel): void {
        const memberGroupAccount: Accounts = this.store.selectSnapshot(SharedState.getState).memberMPGroupAccount;
        let plan: Plan;
        if (productOffering.companyProvided) {
            plan = productOffering.planOfferings.length ? productOffering.planOfferings[0].plan : null;
        } else if (productOffering.inCart) {
            plan = this.getInCartPlan(productOffering);
        } else if (productOffering.enrollStatus === EnrollmentStatus.approved) {
            const enrollment = this.enrollments.find(
                (erl) => erl.plan.productId === productOffering.product.id && erl.status === EnrollmentStatusType.APPROVED,
            );
            if (enrollment) {
                plan = enrollment.plan;
            }
        }
        if (plan) {
            this.dialog.open(PlanDetailsComponent, {
                data: {
                    planId: plan.id,
                    planName: plan.name,
                    states: [
                        {
                            abbreviation:
                                plan.policyOwnershipType === PolicyOwnershipType.GROUP && memberGroupAccount
                                    ? memberGroupAccount.situs.state.abbreviation
                                    : this.enrollmentState,
                        },
                    ],
                    mpGroup: this.mpGroup,
                },
            });
        }
    }

    getEditPlan(): void {
        this.subscriptions.push(
            this.shopCartService.currentEditPlan.subscribe((currentEditPlan: EditPlan) => {
                this.editProductOfferingId = currentEditPlan.editProductId;
                if (this.editProductOfferingId) {
                    const newProduct = this.productOfferings.find((product) => product.id === this.editProductOfferingId);
                    this.showPlans(this.editProductOfferingId);
                }
            }),
        );
    }
    /**
     * Method to get cart items
     */
    getCartIems(): void {
        const planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.subscriptions.push(
            this.shoppingService.getCartItems(this.memberId, this.mpGroup, "", this.isTpiFlow ? [] : planYearId).subscribe((response) => {
                this.cartItems = response;
            }),
        );
    }

    getInCartPlan(productOffering: ProductOfferingPanel): Plan | undefined {
        const planOffering = productOffering.planOfferings.find((planOfr) => this.cartItems.some((x) => x.planOfferingId === planOfr.id));
        if (planOffering) {
            return planOffering.plan;
        }
        return undefined;
    }
    datediff(dateToday: any, expiresOn: any): number {
        return Math.round((expiresOn - dateToday) / (1000 * 60 * 60 * 24));
    }
    parseDate(dateParse: any): any {
        dateParse = dateParse + "";
        const dateParsed = dateParse.split("-");
        return new Date(dateParsed[0], dateParsed[1] - 1, dateParsed[2]);
    }

    /**
     * method to set QLE Statuses of ProductOfferings wrt coverage cancellation
     * @return void
     */
    setQLEStatuses(): void {
        this.productOfferings.forEach((product, index) => {
            if (product.planOfferings) {
                product.planOfferings.forEach((element) => {
                    const planEnrollment = this.getPlanEnrollment(element);
                    if (planEnrollment) {
                        const qleEvent = this.currentQualifyingEvents.find(
                            (event) =>
                                event.id === planEnrollment.qualifyingEventId &&
                                product.enrollStatus.toUpperCase() === EnrollmentStatus.approved.toUpperCase(),
                        );
                        this.qualifyingEventStatuses[index] = qleEvent ? qleEvent.endPlanRequestStatus : "";
                        this.policyEndDates[index] = qleEvent ? qleEvent.requestedCoverageEndDate : "";
                        const endPlanRequestStatus = (qleEvent || ({} as MemberQualifyingEvent)).endPlanRequestStatus;
                        this.policiesExpired[index] = this.util.checkPolicyExpired(qleEvent, endPlanRequestStatus);
                    }
                });
            } else {
                this.qualifyingEventStatuses[index] = "";
                this.policyEndDates[index] = "";
            }
            this.isWarnings[index] =
                this.qualifyingEventStatuses[index] === this.qleEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED ||
                this.qualifyingEventStatuses[index] === this.qleEndPlanRequestStatus.PENDING_HR_APPROVAL;
        });
    }

    /**
     * getPlanEnrollment() method to find correct plan enrollment.
     * @param planOffering : PlanOfferingPanel
     * @returns Enrollments object
     */
    getPlanEnrollment(planOffering: PlanOfferingPanel): Enrollments {
        return this.enrollments.find((event) => event.planOfferingId === planOffering.id);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
