import { Component, EventEmitter, Input, Output } from "@angular/core";
import { AddUpdateCartButtonState } from "../add-update-cart-button-wrapper.model";

@Component({
    selector: "empowered-add-update-cart-button",
    templateUrl: "./add-update-cart-button.component.html",
    styleUrls: ["./add-update-cart-button.component.scss"],
})
export class AddUpdateCartButtonComponent {
    @Input() addUpdateCartButtonState!: AddUpdateCartButtonState;
    @Input() disableAddCart = false;
    @Input() toolTipText?: string;

    @Output() addToCartHandler = new EventEmitter<void>();

    readonly addUpdateCartButtonStateEnum = AddUpdateCartButtonState;

    readonly languageMap: Record<AddUpdateCartButtonState, string> = {
        [AddUpdateCartButtonState.ADD_TO_CART]: "primary.portal.shoppingCart.planOfferings.button.addToCart",
        [AddUpdateCartButtonState.IN_CART]: "primary.portal.shoppingCart.planOfferings.inCart",
        [AddUpdateCartButtonState.UPDATE_CART]: "primary.portal.qouteShop.update",
    };

    /**
     * Emits event to be handled in the container component
     */
    onAddToCartHandler(): void {
        this.addToCartHandler.emit();
    }
}
