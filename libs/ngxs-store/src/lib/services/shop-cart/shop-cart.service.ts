import { LocationOverlay } from "@empowered/api";
import { EditPlan, RemovePlan, ProductOffering } from "@empowered/constants";
import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject } from "rxjs";

export interface CloseOverlay {
    isCartOpen?: boolean;
    isMoreOpen?: boolean;
}
export interface SpinnerType {
    isLoading?: boolean;
    isPlanLoading?: boolean;
}
/**
 * @description Service to communicate between expanded-shopping-cart, shopping-cart-display and specific-payroll
 * @export
 * @class ShopCartService
 */
@Injectable({
    providedIn: "root",
})
export class ShopCartService {
    private readonly editPlanSource$ = new BehaviorSubject<EditPlan>({
        editProductId: null,
        editPlanId: null,
        cartItemId: null,
        isCloseOverlay: false,
    });
    private readonly removeItem$ = new BehaviorSubject<RemovePlan>({
        removeProductId: null,
        removePlanId: null,
        itemId: null,
        isCloseOverlay: false,
    });
    private readonly closeOverlay$ = new BehaviorSubject<CloseOverlay>({
        isCartOpen: false,
        isMoreOpen: false,
    });
    private closeExpandedOverlay$ = new BehaviorSubject<any>({
        isCloseOverlay: false,
    });

    private readonly closeLocationOverlay$ = new BehaviorSubject<LocationOverlay>({
        isCloseOverlay: false,
        selectedState: { abbreviation: "", name: "" },
        selectedCity: "",
    });

    private readonly checkLoader$ = new BehaviorSubject<SpinnerType>({
        isLoading: false,
        isPlanLoading: false,
    });
    reinstateUpdate$ = new Subject<ProductOffering>();
    refreshAfterReinstate$ = new Subject<number>();

    currentEditPlan = this.editPlanSource$.asObservable();

    currentRemoveItem = this.removeItem$.asObservable();

    higlightedOverlay = this.closeOverlay$.asObservable();

    expandedOverlay = this.closeExpandedOverlay$.asObservable();

    currentCloseLocationOverlay = this.closeLocationOverlay$.asObservable();

    checkSpinner = this.checkLoader$.asObservable();

    private reviewKnockoutQuestion$ = new Subject<any>();
    reviewKnockoutQuestion = this.reviewKnockoutQuestion$.asObservable();

    private readonly expandShopCart$ = new Subject<boolean>();
    expandShopCart = this.expandShopCart$.asObservable();

    // No specific type present for plan object passed in the subject
    private readonly planOrderCreateQuote$ = new Subject<any>();
    planOrderCreateQuote = this.planOrderCreateQuote$.asObservable();
    /**
     * @function changeEditPlan
     * @description Function to change the editPlan object.
     * @param {EditPlan} editPlan
     * @memberof ShopCartService
     */
    changeEditPlan(editPlan: EditPlan): void {
        this.editPlanSource$.next(editPlan);
    }

    changeRemoveItem(isRemove: RemovePlan): void {
        this.removeItem$.next(isRemove);
    }
    changeHighlightedOverlay(isOverlay: CloseOverlay): void {
        this.closeOverlay$.next(isOverlay);
    }
    closeExpandedOverlayCart(isExpanded: any): void {
        this.closeExpandedOverlay$.next(isExpanded);
    }

    /**
     * @description Function to change location parameters
     * @param {LocationOverlay} isExpanded
     * @memberof ShopCartService
     */
    changeCloseLocationOverlay(isExpanded: LocationOverlay): void {
        this.closeLocationOverlay$.next(isExpanded);
    }
    displayReviewKnockoutDialog(knockoutData: any): void {
        this.reviewKnockoutQuestion$.next(knockoutData);
    }

    /**
     *
     *@description Subject function to determine the global and plan level spinner status
     * @param {SpinnerType} isLoad
     * @memberof ShopCartService
     */
    displaySpinner(isLoad: SpinnerType): void {
        this.checkLoader$.next(isLoad);
    }
    expandShoppingCart(): void {
        this.expandShopCart$.next(true);
    }

    /**
     *
     *@description Subject to determine customized order plan
     * @param {*} plan
     * @memberof ShopCartService
     */
    reorderPlan(plan: any): void {
        this.planOrderCreateQuote$.next(plan);
    }
}
