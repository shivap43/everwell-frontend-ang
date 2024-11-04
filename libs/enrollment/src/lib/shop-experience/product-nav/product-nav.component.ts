import { Component, EventEmitter, Output, Input, ViewChild, OnChanges, OnInit, OnDestroy, Renderer2 } from "@angular/core";
import { EnrollmentService, EnrollmentStatus, ShoppingService, QLEEndPlanRequestStatus } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { EnrollmentState, ShopCartService, SetEnrollments, UtilService, TPIState } from "@empowered/ngxs-store";
import { Observable, Subject, Subscription } from "rxjs";
import { LanguageService } from "@empowered/language";
import { EditPlan, AppSettings, ProductType, MemberQualifyingEvent, ProductOfferingPanel } from "@empowered/constants";
import { take, takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";
import { TpiServices, EmpoweredModalService } from "@empowered/common-services";
import { TpiSSOModel } from "@empowered/constants";
import { MatDialogConfig } from "@angular/material/dialog";
import { ExitPopupModalComponent } from "@empowered/ui";

interface IconClass {
    name?: string;
}
interface IconDetailsClass {
    name: string;
    class: string;
}

@Component({
    selector: "empowered-product-nav",
    templateUrl: "./product-nav.component.html",
    styleUrls: ["./product-nav.component.scss"],
})
export class ProductNavComponent implements OnChanges, OnInit, OnDestroy {
    @ViewChild("stepper") stepper;
    @Input() productId: number;
    @Input() productOfferings: ProductOfferingPanel[];
    @Output() showShop = new EventEmitter<boolean>();
    @Output() reviewEvent = new EventEmitter<void>();
    grandFatherPlan: any;
    isNavWizard = true;
    mpGroup: number;
    memberId: number;
    presentProductIndex = 0;
    selectedProductOffering: ProductOfferingPanel;
    isLoading: boolean;
    previousProductName = "";
    nextProductName = "";
    navType: string;
    expandCartItemId: number;
    reinstateIndex: number;
    display = true;
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.shoppingExperience.backToShop",
        "primary.portal.shoppingExperience.goTo",
        "primary.portal.shoppingExperience.reviewSelections",
        "primary.portal.shoppingExperience.backTo",
        "primary.portal.shoppingExperience.back",
        "primary.portal.tpi.reviewApply",
        "primary.portal.tpi.nextProduct",
        "primary.portal.tpi.prevProduct",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.tpi.applyForTheseBenefits",
        "primary.portal.tpi.exitTitle",
        "primary.portal.tpiEnrollment.selectionsNotSaved",
        "primary.portal.brandingModalExit.buttonCancel",
    ]);

    @Select(EnrollmentState.GetMPGroup) mpGroup$: Observable<number>;
    @Select(EnrollmentState.GetMemberId) memberId$: Observable<number>;
    @Select(EnrollmentState.GetNavBarType) navType$: Observable<string>;
    editProductOfferingId: any;
    tpiLnlMode = false;
    isFooterHidden = false;
    monIcon = {
        shoppingCart: {
            name: "cart",
            class: "plan-in-cart icon-status icon-primary",
        },
        greenTick: {
            name: "circle-check",
            class: "plan-in-cart icon-status icon-success",
        },
        yellowTick: {
            name: "Filled-check",
            class: "plan-in-cart icon-status icon-warning",
        },
        yellowDash: {
            name: "Filled-dash",
            class: "plan-in-cart icon-status icon-warning",
        },
        redCross: {
            name: "In-cart-decline",
            class: "plan-in-cart icon-status icon-danger",
        },
    };
    iconClass = {
        future: {
            name: "nav-future",
        },
        active: {
            name: "nav-active",
        },
        passed: {
            name: "nav-passed",
        },
    };
    productIcon = {};
    productIconClass: IconClass = {};
    aflacPassProduct: boolean;
    isTpi = false;
    isSsoToShop = false;
    isSsoToProduct = false;
    isSsoToPlan = false;
    isReviewDisable = false;
    isProductDisabled = false;
    ssoPlanId: number;
    isAgentAssisted = false;
    tpiSsoDetail: TpiSSOModel;
    COLOR_WHITE = "#fff";
    policyExpired = false;
    isVASPlanEligible: boolean;
    private unsubscribe$ = new Subject<void>();

    constructor(
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly shopCartService: ShopCartService,
        private readonly enrollmentService: EnrollmentService,
        private readonly shoppingService: ShoppingService,
        private readonly router: Router,
        private readonly utilService: UtilService,
        private readonly tpiService: TpiServices,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly renderer: Renderer2,
    ) {
        if (this.router.url.indexOf(AppSettings.TPI) >= 0) {
            this.isTpi = true;
            this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
            this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
            if (this.tpiSsoDetail.planId) {
                this.isSsoToPlan = true;
                this.ssoPlanId = this.tpiSsoDetail.planId;
            } else if (this.tpiSsoDetail.productId) {
                this.isSsoToProduct = true;
            } else {
                this.isSsoToShop = true;
                this.productOfferings = this.productOfferings?.filter((product) => product.planOfferings?.length);
            }
        }
        this.mpGroup$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.mpGroup = x));
        this.memberId$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.memberId = x));
        this.navType$.pipe(takeUntil(this.unsubscribe$)).subscribe((x) => (this.navType = x));
        this.shopCartService.currentEditPlan.pipe(takeUntil(this.unsubscribe$)).subscribe((currentEditPlan: EditPlan) => {
            this.editProductOfferingId = currentEditPlan.editProductId;
            this.expandCartItemId = currentEditPlan.cartItemId;
            if (this.editProductOfferingId && this.productOfferings) {
                const pindex = this.productOfferings.findIndex((product) => product.id === this.editProductOfferingId);
                this.setIndex(pindex > -1 ? pindex : 0);
            }
        });
        this.shopCartService.refreshAfterReinstate$.pipe(takeUntil(this.unsubscribe$)).subscribe((productOfferingId) => {
            this.reinstateIndex = -1;
            this.enrollmentService.getEnrollments(this.memberId, this.mpGroup, "planId,coverageLevelId").subscribe((response) => {
                this.store.dispatch(new SetEnrollments(response));
                this.reinstateIndex = productOfferingId;
                const Index = this.productOfferings.findIndex((product) => product.id === productOfferingId);
                this.setIndex(Index > -1 ? Index : 0);
            });
        });

        this.shoppingService.isVASPlanEligible$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isVASPlanEligible) => (this.isVASPlanEligible = isVASPlanEligible));
    }
    /**
     * Life cycle hook of angular. Called on initialization of component.
     */
    ngOnInit(): void {
        if (this.isTpi && (this.tpiSsoDetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId))) {
            this.isAgentAssisted = true;
        } else {
            this.isAgentAssisted = false;
            this.shoppingService.acquireShoppingCartLock(this.memberId, this.mpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
        this.autoScroll();
    }

    /**
     * Method to decide which product will display on shop page
     */
    ngOnChanges(): void {
        if (this.productId != null && this.productOfferings) {
            if (this.productOfferings.length && (this.isSsoToPlan || this.isSsoToProduct)) {
                this.isReviewDisable =
                    !this.productOfferings.find((product) => product.id === this.productId)?.inCart || !this.isVASPlanEligible;
            } else {
                this.isReviewDisable = !this.productOfferings.some((product) => product.inCart) || !this.isVASPlanEligible;
            }
            this.productOfferings.forEach((productOfr) => {
                this.productIcon[productOfr.id] = this.getProductIcon(productOfr);
            });
            this.setProduct();
            this.setIconClass();
        }
        if (this.isSsoToShop) {
            this.productOfferings = this.productOfferings?.filter((product) => product.planOfferings?.length);
        }
    }

    /**
     * Function to set product icon class
     */
    setIconClass(): void {
        this.productOfferings.forEach((productOfr: ProductOfferingPanel, index: number) => {
            this.productIconClass[productOfr.id] = this.getIconClass(index);
        });
    }
    /**
     * Function to get the product icon for individual products.
     *  @param productOfr which contains the related details of plan
     * @return Object of name and class
     */
    getProductIcon(productOfr: ProductOfferingPanel): IconDetailsClass | undefined {
        const enrollments = this.store.selectSnapshot(EnrollmentState.GetEnrollments);
        const currentQualifyingEvents = this.store.selectSnapshot(EnrollmentState.GetQLEResponse);
        const filteredEnrollment = enrollments.find((ele) => ele.plan.productId === productOfr.product.id);
        let filteredQualifyingEvent: MemberQualifyingEvent;
        if (filteredEnrollment) {
            filteredQualifyingEvent = currentQualifyingEvents.find((ele) => ele.id === filteredEnrollment.qualifyingEventId);
        }
        const endPlanRequestStatus = (filteredQualifyingEvent || ({} as MemberQualifyingEvent)).endPlanRequestStatus;
        const QleArray: string[] = [
            QLEEndPlanRequestStatus.PENDING_HR_APPROVAL,
            QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED,
        ];
        this.policyExpired = this.utilService.checkPolicyExpired(filteredQualifyingEvent, endPlanRequestStatus);
        if (productOfr.inCart && !this.policyExpired) {
            return this.monIcon.shoppingCart;
        }
        if (
            ((productOfr.enrollStatus === EnrollmentStatus.approved && !QleArray.includes(endPlanRequestStatus)) ||
                this.checkForGrandfatheredPlan(productOfr)) &&
            !this.policyExpired
        ) {
            return this.monIcon.greenTick;
        }
        if (productOfr.enrollStatus === EnrollmentStatus.lapsed && !this.policyExpired) {
            return this.monIcon.yellowTick;
        }
        if (
            productOfr.enrollStatus &&
            (productOfr.enrollStatus.startsWith("Pending") || QleArray.includes(endPlanRequestStatus)) &&
            !this.policyExpired
        ) {
            return this.monIcon.yellowDash;
        }
        if (
            productOfr.declined ||
            productOfr.enrollStatus === EnrollmentStatus.ended ||
            productOfr.enrollStatus === EnrollmentStatus.application_denied ||
            this.policyExpired
        ) {
            return this.monIcon.redCross;
        }
        return undefined;
    }

    setProduct(): void {
        this.isLoading = true;
        if (this.navType === "al-la-carte") {
            this.isNavWizard = false;
        }
        if (this.productId > 0) {
            const pindex = this.productOfferings.findIndex((product) => product.id === this.productId);
            this.presentProductIndex = pindex > -1 ? pindex : 0;
        }
        if (this.productOfferings) {
            this.showProductName(this.presentProductIndex);
        }
        this.isLoading = false;
    }

    /**
     * Function to set present product index.
     *  @param id: number
     */
    setIndex(id: number): void {
        this.grandFatherPlan = undefined;
        this.presentProductIndex = id;
        this.productId = this.productOfferings[this.presentProductIndex].id;
        const enrollments = this.store.selectSnapshot(EnrollmentState.GetEnrollments);
        const pidx = this.productOfferings.findIndex((res) => this.productId === res.id);
        enrollments.forEach((enrollment) => {
            if (
                enrollment.plan.sunsetDate &&
                enrollment.plan.productId === this.productOfferings[pidx].product.id &&
                enrollment.status === "APPROVED"
            ) {
                this.getEnrollmentDetails(enrollment, this.productOfferings[pidx]);
            }
        });
        this.showProductName(this.presentProductIndex);
        this.setIconClass();
    }

    getEnrollmentDetails(enrollment: any, productOffering: any): void {
        let dependents = [];
        let riders = [];
        this.enrollmentService
            .getEnrollmentDependents(this.memberId, enrollment.id, this.mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((dependent) => {
                dependents = dependent;
                this.enrollmentService
                    .getEnrollmentRiders(this.memberId, enrollment.id, this.mpGroup)
                    .pipe(take(1))
                    .subscribe((rider) => {
                        riders = rider;
                        this.grandFatherPlan = { ...enrollment, riders, dependents, productOffering };
                    });
            });
    }

    onStepChange(event: any): void {
        this.setIndex(event.selectedIndex);
    }

    gotoPreviousProduct(): void {
        if (this.stepper) {
            if (this.stepper.selectedIndex === 0) {
                this.showShopPage();
            }
            this.stepper.linear = false;
            this.stepper.previous();
            this.stepper.linear = true;
            this.setIndex(this.stepper.selectedIndex);
        }
    }

    gotoNextProduct(): void {
        if (this.stepper) {
            if (this.stepper.selectedIndex === this.productOfferings.length - 1) {
                this.openShoppingCart();
            }
            this.stepper.linear = false;
            this.stepper.next();
            this.stepper.linear = true;
            this.setIndex(this.stepper.selectedIndex);
        }
    }

    showProductName(index: number): void {
        if (index === 0) {
            this.previousProductName = this.languageStrings["primary.portal.shoppingExperience.backToShop"];
            if (this.productOfferings.length > 1) {
                this.nextProductName = `${this.languageStrings["primary.portal.shoppingExperience.goTo"]} ${
                    this.productOfferings[index + 1].product.name
                }`;
            } else {
                this.nextProductName = this.languageStrings["primary.portal.shoppingExperience.reviewSelections"];
            }
        } else if (index === this.productOfferings.length - 1) {
            this.nextProductName = this.languageStrings["primary.portal.shoppingExperience.reviewSelections"];
            this.previousProductName = `${this.languageStrings["primary.portal.shoppingExperience.backTo"]} ${
                this.productOfferings[index - 1].product.name
            }`;
        } else {
            this.nextProductName = `${this.languageStrings["primary.portal.shoppingExperience.goTo"]} ${
                this.productOfferings[index + 1].product.name
            }`;
            this.previousProductName = `${this.languageStrings["primary.portal.shoppingExperience.backTo"]} ${
                this.productOfferings[index - 1].product.name
            }`;
        }
        this.selectedProductOffering = this.productOfferings[index];
        if (this.isSsoToPlan) {
            const ssoPlan = this.selectedProductOffering.planOfferings.find((plan) => plan.plan.id === this.ssoPlanId);
            if (ssoPlan) {
                this.selectedProductOffering = this.utilService.copy(this.selectedProductOffering);
                this.selectedProductOffering.planOfferings = [ssoPlan];
            }
        }
        this.isProductDisabled = this.isAgentAssisted
            ? this.selectedProductOffering.productType === ProductType.MEDICAL
            : this.selectedProductOffering.productType === ProductType.MEDICAL || this.selectedProductOffering.agentAssistanceRequired;
        this.aflacPassProduct = this.selectedProductOffering.productType === ProductType.AFLAC_PASS;
    }

    showShopPage(): void {
        this.showShop.emit(true);
        this.productId = 0;
    }

    /**
     * This method is used to auto scroll page till product Header
     */
    autoScroll(): void {
        const element = this.renderer.selectRootElement("#product-details", true);
        if (element) {
            element.scrollIntoView();
        }
    }

    openShoppingCart(): void {
        window.scrollTo(0, 0);
        this.shopCartService.expandShoppingCart();
    }
    /**
     * Fuction to get product icon class
     * @param index : number
     */
    getIconClass(index: number): IconClass {
        if (this.presentProductIndex === index) {
            return this.iconClass.active;
        }
        if (
            (this.productOfferings[index].planOfferings[0] && this.productOfferings[index].planOfferings[0].planPricing) ||
            !this.isNavWizard
        ) {
            return this.iconClass.passed;
        }
        return this.iconClass.future;
    }
    checkForGrandfatheredPlan(productOffering: any): boolean {
        if (this.grandFatherPlan) {
            if (this.grandFatherPlan.productOffering.id === productOffering.id) {
                return true;
            }
            return false;
        }
        return false;
    }

    /**
     * Function triggered on click of 'Exit' button
     */
    onExit(): void {
        const dialogConfig = new MatDialogConfig();
        const modalData = {
            memberId: this.memberId,
            groupId: this.mpGroup,
            ssoToShop: this.isSsoToShop,
        };
        dialogConfig.data = modalData;
        this.empoweredModalService.openDialog(ExitPopupModalComponent, dialogConfig);
    }

    /**
     * Function to navigate user to Shop Review Screen
     */
    navigateToReviewPage(): void {
        this.reviewEvent.emit();
    }

    /**
     * Function to navigate user to TPI Application Flow Screen
     */
    navigateToTpiAppFlow(): void {
        this.router.navigate([`tpi/app-flow/${this.mpGroup}/${this.memberId}`]);
    }

    /**
     * Function to navigate user to previous product page in TPI flow
     */
    gotoPreviousTPIProduct(): void {
        this.setIndex(this.presentProductIndex - 1);
    }

    /**
     * Function to navigate user to next product page in TPI flow
     */
    gotoNextTPIProduct(): void {
        this.setIndex(this.presentProductIndex + 1);
    }

    /**
     * Function to handle product changed event from product-details component
     * @param {number} $event
     */
    onProductChange($event: number): void {
        this.setIndex($event);
    }

    /**
     * Function to hide footer
     * @param {boolean} $event
     */
    onHideFooter($event: boolean): void {
        this.isFooterHidden = $event;
    }

    /**
     * @description to unsubscribe all subscriptions
     * @return void
     */
    ngOnDestroy(): void {
        if (!this.isAgentAssisted) {
            this.shoppingService.releaseShoppingCartLock(this.memberId, this.mpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
