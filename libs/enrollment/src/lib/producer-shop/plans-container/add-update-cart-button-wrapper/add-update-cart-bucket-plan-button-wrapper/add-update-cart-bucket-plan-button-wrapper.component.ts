import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { PlanOfferingWithCartAndEnrollment } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { NGRXStore } from "@empowered/ngrx-store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { ShoppingCartsSelectors } from "@empowered/ngrx-store/ngrx-states/shopping-carts";
import { select } from "@ngrx/store";
import { combineLatest, Observable, Subject } from "rxjs";
import { map, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import { ManageCartItemsHelperService } from "../../../services/manage-cart-items/manage-cart-items-helper.service";
import { PlanPanelService } from "../../../services/plan-panel/plan-panel.service";
import { AnnualContributionState } from "../../../services/producer-shop-component-store/producer-shop-component-store.model";
import { ProducerShopComponentStoreService } from "../../../services/producer-shop-component-store/producer-shop-component-store.service";
import { ROUND } from "../../bucket-plan/bucket-plan.model";
import { AddUpdateCartButtonState } from "../add-update-cart-button-wrapper.model";
import { AddUpdateCartButton } from "./add-update-cart-bucket-plan-button-wrapper.modal";

@Component({
    selector: "empowered-add-update-cart-bucket-plan-button-wrapper",
    templateUrl: "./add-update-cart-bucket-plan-button-wrapper.component.html",
    styleUrls: ["./add-update-cart-bucket-plan-button-wrapper.component.scss"],
})
export class AddUpdateCartBucketPlanButtonWrapperComponent implements OnInit, OnDestroy {
    @Input() planPanel!: PlanOfferingWithCartAndEnrollment;

    readonly addUpdateCartButtonStateEnum = AddUpdateCartButtonState;

    private readonly unsubscriber$ = new Subject<void>();

    private readonly addUpdateCartSubject$ = new Subject<void>();

    // applicable pay frequency for selected member
    readonly payFrequency$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberPayFrequency));

    // Get MpGroup ID
    readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    // Get member ID
    readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));

    isCartDataChanged$: Observable<boolean>;

    addUpdateCartButton$!: Observable<AddUpdateCartButton | null>;

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    // Get Shopping Cart Information
    readonly isShoppingCartLocked$ = this.ngrxStore.onAsyncValue(select(ShoppingCartsSelectors.getShoppingCart)).pipe(
        map((cartDetails) =>
            // Incase of locked property is false, returning null in order to satisfy nullish condition and assign disableAddCart flag
            cartDetails.locked ? true : null,
        ),
    );

    // Gets selected Plan Offering With cart and enrollment
    // Get PlanOfferingWithCartAndEnrollment using PlanOffering input bind
    selectedPlanOfferingWithCartAndEnrollment$!: Observable<PlanOfferingWithCartAndEnrollment>;

    annualContribution$!: Observable<AnnualContributionState | null>;

    disableAddCart$!: Observable<boolean>;

    constructor(
        private readonly planPanelService: PlanPanelService,
        private readonly ngrxStore: NGRXStore,
        private readonly producerShopComponentStoreService: ProducerShopComponentStoreService,
        private readonly manageCartItemHelperService: ManageCartItemsHelperService,
        private readonly languageService: LanguageService,
    ) {}

    ngOnInit(): void {
        const panelIdentifiers = this.planPanelService.getPanelIdentifiers(this.planPanel);

        this.annualContribution$ = this.producerShopComponentStoreService.getAnnualContributionState(panelIdentifiers);

        this.selectedPlanOfferingWithCartAndEnrollment$ = this.ngrxStore.onAsyncValue(
            select(
                PlanOfferingsSelectors.getPlanOfferingData(
                    panelIdentifiers.planOfferingId,
                    panelIdentifiers.cartId,
                    panelIdentifiers.enrollmentId,
                ),
            ),
        );

        this.addUpdateCartSubject$
            .pipe(
                withLatestFrom(this.selectedPlanOfferingWithCartAndEnrollment$),
                // triggers add to cart logic by opening knockout dialog
                switchMap(([, selectedPlanOfferingWithCartAndEnrollment]) =>
                    this.manageCartItemHelperService.addUpdateBucketPlanToCart(
                        panelIdentifiers,
                        selectedPlanOfferingWithCartAndEnrollment.cartItemInfo?.id,
                    ),
                ),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();

        this.isCartDataChanged$ = combineLatest([this.annualContribution$, this.selectedPlanOfferingWithCartAndEnrollment$]).pipe(
            withLatestFrom(this.payFrequency$),
            map(([[annualContribution, planData], payFrequency]) => {
                const annualContributionInCart = Number(
                    (planData.cartItemInfo?.memberCost * payFrequency.payrollsPerYear).toFixed(ROUND.TWO),
                );
                return annualContributionInCart !== annualContribution.annualContribution;
            }),
        );
        // Disable the add cart button while editing the enrollment view without changing in annual contribution value
        this.disableAddCart$ = this.annualContribution$.pipe(
            withLatestFrom(this.payFrequency$, this.annualContribution$),
            map(([annualContributionState, payFrequency]) => {
                if (!annualContributionState.isValid) {
                    return true;
                }
                return (
                    payFrequency.payrollsPerYear * this.planPanel?.enrollment?.memberCostPerPayPeriod ===
                    annualContributionState.annualContribution
                );
            }),
        );

        this.addUpdateCartButton$ = combineLatest([
            this.selectedPlanOfferingWithCartAndEnrollment$,
            this.isShoppingCartLocked$,
            this.disableAddCart$,
            this.isCartDataChanged$,
        ]).pipe(
            map(([planOfferingWithCartAndEnrollment, isShoppingCartLocked, disableAddCart, isCartDataChanged]) =>
                this.getAddUpdateCartButtonStatus(
                    planOfferingWithCartAndEnrollment,
                    isShoppingCartLocked,
                    disableAddCart,
                    isCartDataChanged,
                ),
            ),
        );
    }

    /**
     * Returns the status of add update cart button
     *
     * @param planOfferingWithCartAndEnrollment selected plan cart and enrollment info
     * @param isShoppingCartLocked flag to check if shopping cart is locked
     * @param disableAddCart flag to check if add/update cart is disabled
     * @param isCartDataChanged flag to check if the plan settings in-cart is changed to display update button
     *
     * @returns {AddUpdateCartButton} indicating the state of the add update cart button
     */
    getAddUpdateCartButtonStatus(
        planOfferingWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment,
        isShoppingCartLocked: boolean,
        disableAddCart: boolean,
        isCartDataChanged: boolean,
    ): AddUpdateCartButton {
        // When the plan is not added to cart display ADD TO CART button
        if (!planOfferingWithCartAndEnrollment.cartItemInfo) {
            return {
                addUpdateCartButtonState: this.addUpdateCartButtonStateEnum.ADD_TO_CART,
                isDisabled: isShoppingCartLocked ?? disableAddCart,
                toolTipText: isShoppingCartLocked
                    ? this.languageStrings["primary.portal.producerShopPage.toolTipText.anotherUserIsUpdatingCart"]
                    : null,
            };
        } else if (!isCartDataChanged) {
            // When plan is added to cart and the same coverageLevel/ Annual contribution is selected display IN CART
            return {
                addUpdateCartButtonState: this.addUpdateCartButtonStateEnum.IN_CART,
                isDisabled: false,
                toolTipText: null,
            };
        }

        // If none of the above conditions are true
        // Then the plan is added to cart and there are changes done to the plan settings
        // Hence display UPDATE CART
        return {
            addUpdateCartButtonState: this.addUpdateCartButtonStateEnum.UPDATE_CART,
            isDisabled: isShoppingCartLocked ?? disableAddCart,
            toolTipText: isShoppingCartLocked
                ? this.languageStrings["primary.portal.producerShopPage.toolTipText.anotherUserIsUpdatingCart"]
                : null,
        };
    }

    /**
     * triggers update/ add item to cart logic
     */
    addUpdateCart(): void {
        this.addUpdateCartSubject$.next();
    }

    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues(["primary.portal.producerShopPage.toolTipText.anotherUserIsUpdatingCart"]);
    }

    /**
     * Clean up rxjs subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
