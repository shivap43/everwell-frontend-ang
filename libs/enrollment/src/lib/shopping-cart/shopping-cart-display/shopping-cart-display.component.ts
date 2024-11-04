import {
    EnrollmentState,
    ShopCartService,
    QuoteShopHelperService,
    SetAccountProducerList,
    SetErrorForShop,
    AccountListState,
    DualPlanYearState,
    EnrollmentMethodState,
    EnrollmentMethodModel,
    SharedState,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, ChangeDetectorRef, Injector, Input } from "@angular/core";
import {
    ShoppingCartDisplayService,
    GetShoppingCart,
    ShoppingService,
    MemberService,
    AccountService,
    EnrollmentService,
} from "@empowered/api";

import {
    AccountProducerList,
    EnrollmentStateModel,
    PayFrequency,
    PayFrequencyObject,
    AppSettings,
    Portals,
    PlanOffering,
    MemberCredential,
    FlexDollarModel,
    StepType,
} from "@empowered/constants";
import { Subscription, Observable, forkJoin, iif, of, combineLatest, Subject } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { Store, Select } from "@ngxs/store";
import { MatDialogRef, MatDialog } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { OverlayRef, Overlay, OverlayConfig, OverlayPositionBuilder } from "@angular/cdk/overlay";
import {
    // TODO: TemplatePortalDirective is deprecated https://material.angular.io/cdk/portal/api#TemplatePortalDirective
    // Switch to CdkPortal
    TemplatePortalDirective,
    ComponentPortal,
    // TODO: PortalInjector is deprecated
    // Switch to Injector.create or use the following resources to refactor:
    // https://github.com/angular/material.angular.io/issues/701
    // https://github.com/angular/angular/issues/35548#issuecomment-588551120
    PortalInjector,
} from "@angular/cdk/portal";
import { ExpandedShoppingCartComponent } from "../expanded-shopping-cart/expanded-shopping-cart.component";
import { RemoveCartItemComponent } from "../remove-cart-item/remove-cart-item.component";
import { CONTAINER_DATA } from "../injector";
import { tap, switchMap, filter, distinctUntilChanged, map, catchError, takeUntil } from "rxjs/operators";
import { HttpResponse } from "@angular/common/http";
import { SharedService } from "@empowered/common-services";

@Component({
    selector: "empowered-shopping-cart-display",
    templateUrl: "./shopping-cart-display.component.html",
    styleUrls: ["./shopping-cart-display.component.scss"],
})
export class ShoppingCartDisplayComponent implements OnInit, OnDestroy, AfterViewInit {
    @Input() planOfferings: PlanOffering[];
    @Select(EnrollmentState) enrollmentState$: Observable<EnrollmentStateModel>;
    shoppingCart: any;
    memberId: any;
    mpGroup: any;
    totalCost = 0;
    cartCount = 0;
    selectedProductOffId;
    planId: any;
    planOffId: any;
    loadComponent = false;
    locked = false;
    isMember = false;
    portal = "";
    priceChanged = false;
    modified = false;
    cartItems: any;
    cartOpened = false;
    overlayRef: OverlayRef;
    enrollmentObj: EnrollmentMethodModel;
    @ViewChild("overlayTemplate")
    overlayTemplate: TemplatePortalDirective;
    removeDialogRef: MatDialogRef<RemoveCartItemComponent>;
    removeItem: any;
    isCartOpen = false;
    payFrequencyId: number;
    payFrequencies: PayFrequency;
    payFrequencyStore: PayFrequency;
    payFrequencyLoaded = false;
    payFrequencyObject: PayFrequencyObject;
    isSpinnerLoading: boolean;
    flexDollar: FlexDollarModel;
    flexCost = 0;
    isBenefitDollarConfigEnabled = false;
    planYearId = undefined;
    producerData: AccountProducerList;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private shoppingCartDisplayService: ShoppingCartDisplayService,
        private memberService: MemberService,
        private router: ActivatedRoute,
        private route: Router,
        private store: Store,
        private shoppingService: ShoppingService,
        private dialog: MatDialog,
        private user: UserService,
        private overlay: Overlay,
        private overlayPositionBuilder: OverlayPositionBuilder,
        private elementRef: ElementRef,
        private shopCartService: ShopCartService,
        private cd: ChangeDetectorRef,
        private accountService: AccountService,
        private readonly injector: Injector,
        private readonly staticUtilService: StaticUtilService,
        private readonly eService: EnrollmentService,
        private readonly quoteShopHelperService: QuoteShopHelperService,
        private readonly sharedService: SharedService,
    ) {
        this.shopCartService.expandShopCart.pipe(takeUntil(this.unsubscribe$)).subscribe((expand) => {
            if (expand) {
                this.checkLock();
            }
        });
        this.staticUtilService
            .cacheConfigEnabled("general.feature.enable.benefitDollars")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => {
                this.isBenefitDollarConfigEnabled = result;
            });
    }

    /**
     * set up shopping cart display on the shop page
     */
    ngOnInit(): void {
        this.isSpinnerLoading = false;
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.enrollmentObj = this.store.selectSnapshot(EnrollmentMethodState.currentEnrollment);
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            this.isMember = true;
            this.user.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                this.memberId = credential.memberId;
                this.mpGroup = credential.groupId;
            });
        } else {
            if (this.router.snapshot.params.id) {
                this.memberId = this.router.snapshot.params.id;
            } else {
                this.memberId = this.store.selectSnapshot(EnrollmentMethodState.getUniqueMemberId);
            }
            const mpGroupObj = this.store.selectSnapshot(AccountListState.getGroup);
            if (mpGroupObj && this.route.url.indexOf("payroll") >= 0) {
                this.mpGroup = mpGroupObj.id;
            } else {
                this.mpGroup = this.router.snapshot.params.mpGroupId;
            }
        }
        this.planYearId = this.store.selectSnapshot(DualPlanYearState.getCurrentPYId);
        this.closeOverlayOnEnroll();
        this.getCartItems();
        this.closeOverlayOnEditPlan();
        if (this.portal === Portals.PRODUCER) {
            this.setAccountProducerList();
        }
        this.getPayFrequency();
    }

    /**
     * Angular life-cycle hook ngAfterViewInit
     * Get Shopping cart data
     * Get flex dollar data if config enabled
     */
    ngAfterViewInit(): void {
        this.shoppingCartDisplayService.shoppingCart
            .pipe(
                distinctUntilChanged((previous, incoming) => this.isIdenticalToPreviousShoppingCart(previous, incoming)),
                switchMap((shoppingCart) => this.getFlexDollarForCart().pipe(map((flexDollar) => [shoppingCart, flexDollar]))),
                tap(([shoppingCart, flexDollar]) => {
                    this.shoppingCart = shoppingCart;
                    this.cartCount = this.shoppingCart.productOfferingsInCart.length;
                    this.totalCost = this.shoppingCart.totalCost;
                    this.locked = this.shoppingCart.locked;
                    if (
                        this.isBenefitDollarConfigEnabled &&
                        flexDollar &&
                        flexDollar.planFlexDollarOrIncentives &&
                        flexDollar.planFlexDollarOrIncentives.length
                    ) {
                        this.flexDollar = flexDollar;
                        this.flexCost = flexDollar.planFlexDollarOrIncentives
                            .map((x) => x.flexDollarOrIncentiveAmount)
                            .reduce((total, current) => total + current, 0);
                    } else {
                        this.flexCost = 0;
                    }
                    this.cd.detectChanges();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * check if new shopping cart is the same as the previous cart
     *
     * @param previousCart previous shopping cart object
     * @param newCart new shopping cart object
     * @returns if the previous shopping cart is identical to the new shopping cart
     */
    isIdenticalToPreviousShoppingCart(previousCart: GetShoppingCart, newCart: GetShoppingCart): boolean {
        return (
            previousCart.cartId === newCart.cartId &&
            previousCart.locked === newCart.locked &&
            previousCart.lockedBy === newCart.lockedBy &&
            previousCart.totalCost === newCart.totalCost &&
            previousCart.productOfferingsDeclined.length === newCart.productOfferingsDeclined.length &&
            previousCart.productOfferingsDeclined.every((previousPODeclinedId) =>
                newCart.productOfferingsDeclined.some((newPODeclinedId) => previousPODeclinedId === newPODeclinedId),
            ) &&
            previousCart.productOfferingsInCart.length === newCart.productOfferingsInCart.length &&
            previousCart.productOfferingsInCart.every((previousPOInCartId) =>
                newCart.productOfferingsInCart.some((newPOInCartId) => previousPOInCartId === newPOInCartId),
            ) &&
            previousCart.recentExpiredCartItemIds.length === newCart.recentExpiredCartItemIds.length &&
            previousCart.recentExpiredCartItemIds.every((previousRecExpCartItemId) =>
                newCart.recentExpiredCartItemIds.some((newRecExpCartItemId) => previousRecExpCartItemId === newRecExpCartItemId),
            )
        );
    }

    /**
     * get shopping cart and flex dollar details
     */
    getShoppingCart(): void {
        this.shoppingService
            .getShoppingCart(this.memberId, this.mpGroup, this.planYearId)
            .pipe(
                tap(
                    (resp) => {
                        this.shoppingCart = resp;
                        this.shoppingCartDisplayService.setShoppingCart(this.shoppingCart);
                        this.cartCount = this.shoppingCart.productOfferingsInCart.length;
                        this.totalCost = this.shoppingCart.totalCost;
                        this.locked = this.shoppingCart.locked;
                    },
                    (error) => {
                        this.isSpinnerLoading = false;
                    },
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * get flex dollar details for shopping cart
     * @returns Observable of FlexDollarModel
     */
    getFlexDollarForCart(): Observable<FlexDollarModel> {
        return iif(
            () => this.isBenefitDollarConfigEnabled,
            this.shoppingCartDisplayService.getAppliedFlexDollarOrIncentivesForCart(this.memberId, this.mpGroup),
            of(null as FlexDollarModel),
        ).pipe(catchError((error) => of(null)));
    }
    /**
     *
     * @description stores cart items and manages item data between the portals
     * @memberof ShoppingCartDisplayComponent
     */
    getCartItems(): void {
        let cartItemsUpdated = false;
        combineLatest([
            this.shoppingService.getCartItems(this.memberId, this.mpGroup, "", this.planYearId),
            this.eService.getEnrollments(this.memberId, this.mpGroup, "").pipe(catchError(() => of([]))),
        ])
            .pipe(
                switchMap(([cartItems, enrollments]) => {
                    this.cartItems = cartItems;
                    this.cartItems.forEach((element) => {
                        if (element.recentChange) {
                            this.priceChanged = true;
                        }
                    });
                    let deleteApiCalls: Observable<HttpResponse<void>>[] = [];
                    if (this.planOfferings && this.planOfferings.length && this.cartItems.length && this.isMember && enrollments.length) {
                        deleteApiCalls = this.quoteShopHelperService.getDeleteCartItems(
                            enrollments,
                            this.planOfferings,
                            this.cartItems.filter((cartItem) => cartItem.applicationType !== StepType.REINSTATEMENT),
                            this.memberId,
                            this.mpGroup,
                        );
                    }
                    if (deleteApiCalls.length) {
                        cartItemsUpdated = true;
                        return forkJoin(deleteApiCalls);
                    }
                    return of();
                }),
                filter((res) => cartItemsUpdated),
                switchMap((res) => this.updatedShoppingCart()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    /**
     * updated shoppingCart on update of cart items
     * @returns Observable of getShoppingCart
     */
    updatedShoppingCart(): Observable<GetShoppingCart> {
        return this.shoppingService.getShoppingCart(this.memberId, this.mpGroup, this.planYearId).pipe(
            tap(
                (res) => {
                    this.shoppingCartDisplayService.setShoppingCart(res);
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
    }

    /**
     * Set account producer list in store
     */
    setAccountProducerList(): void {
        if (!this.producerData || this.producerData.mpGroup !== +this.mpGroup) {
            this.store.dispatch(new SetAccountProducerList(null));
            this.accountService
                .getAccountProducers(this.mpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((response) => {
                    this.producerData = {
                        mpGroup: +this.mpGroup,
                        producerList: response,
                    };
                    this.store.dispatch(new SetAccountProducerList(this.producerData));
                });
        }
    }
    /**
     * Method to get the pay frequency
     */
    getPayFrequency(): void {
        if (this.mpGroup) {
            this.isSpinnerLoading = true;
            forkJoin([
                this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
                this.accountService.getPayFrequencies(this.mpGroup.toString()),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (dataList) => {
                        const res = dataList[0];
                        const resp = dataList[1];
                        this.payFrequencyId = res.body.workInformation.payrollFrequencyId;
                        this.payFrequencies = resp.find((item) => item.id === res.body.workInformation.payrollFrequencyId);
                        const monthlyPayFrequency = resp.find((ele) => ele.frequencyType === "MONTHLY");
                        this.payFrequencyObject = {
                            payFrequencies: [...resp],
                            pfType: this.payFrequencies.name,
                            payrollsPerYear: monthlyPayFrequency.payrollsPerYear,
                        };
                        this.getShoppingCart();
                        this.payFrequencyLoaded = true;
                        this.isSpinnerLoading = false;
                    },
                    (error) => {
                        if (error.error) {
                            this.store.dispatch(new SetErrorForShop(error.error));
                        }
                        this.isSpinnerLoading = false;
                    },
                );
        }
    }

    checkLock(): void {
        this.loadExpandedView();

        this.cartOpened = true;
    }

    loadExpandedView(): void {
        const bodyElement = document.querySelector("body");
        bodyElement.classList.add("negate-blur");

        this.isCartOpen = true;
        const positionStrategy = this.overlayPositionBuilder.flexibleConnectedTo(this.elementRef).withPositions([
            {
                originX: "end",
                originY: "top",
                overlayX: "end",
                overlayY: "top",
                offsetY: 85,
                offsetX: 0,
            },
        ]);

        const overlayConfig = new OverlayConfig({
            hasBackdrop: true,
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.block(),
            width: 577,
            maxHeight: 600,
            backdropClass: "expanded-card-view",
            panelClass: "shopping-cart-expanded",
        });

        const popupComponentPortal = new ComponentPortal(
            ExpandedShoppingCartComponent,
            null,
            this.createInjector({
                mpGroup: this.mpGroup,
                activatedRoute: this.router,
                payFrequency: this.payFrequencies.name,
            }),
        );

        this.overlayRef = this.overlay.create(overlayConfig);

        this.overlayRef
            .backdropClick()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(() => {
                this.isCartOpen = false;
                this.overlayRef.dispose();
                bodyElement.classList.remove("negate-blur");
            });

        this.overlayRef.attach(popupComponentPortal);
    }
    /**
     * @description function is used to dispose overlay and unsubscribe all subscriptions
     * @returns void
     */
    ngOnDestroy(): void {
        if (this.overlayRef) {
            this.overlayRef.dispose();
        }
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * @function closeOverlayOnEditPlan
     * @description Function to close expanded-shopping-cart overlay on click of Plan name.
     * @memberof ShoppingCartDisplayComponent
     */
    closeOverlayOnEditPlan(): void {
        this.shopCartService.currentEditPlan.pipe(takeUntil(this.unsubscribe$)).subscribe((currentEditPlan) => {
            if (currentEditPlan.isCloseOverlay) {
                this.overlayRef.dispose();
            }
        });
        this.shopCartService.higlightedOverlay.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp.isCartOpen === false) {
                this.isCartOpen = false;
            }
        });
    }
    closeOverlayOnEnroll(): void {
        this.shopCartService.expandedOverlay.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp.isCloseOverlay === true) {
                if (this.overlayRef) {
                    this.overlayRef.dispose();
                }
                this.shopCartService.closeExpandedOverlayCart({ isCloseOverlay: false });
            }
        });
        this.shopCartService.higlightedOverlay.pipe(takeUntil(this.unsubscribe$)).subscribe((resp) => {
            if (resp.isCartOpen === false) {
                this.isCartOpen = false;
            }
        });
    }
    createInjector(dataToPass: any): PortalInjector {
        const injectorTokens = new WeakMap();
        injectorTokens.set(CONTAINER_DATA, dataToPass);
        return new PortalInjector(this.injector, injectorTokens);
    }
}
