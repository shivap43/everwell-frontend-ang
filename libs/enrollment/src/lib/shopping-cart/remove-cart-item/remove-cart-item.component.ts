import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ShopCartService, SetPlanStatus, AppFlowService } from "@empowered/ngxs-store";

import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { RemovePlan } from "@empowered/constants";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

const PLAN_NAME_LENGTH_LIMIT = 8;

@Component({
    selector: "empowered-remove-cart-item",
    templateUrl: "./remove-cart-item.component.html",
    styleUrls: ["./remove-cart-item.component.scss"],
})
export class RemoveCartItemComponent implements OnInit, OnDestroy {
    message: string;
    removePlan: RemovePlan;
    truncatePlanName: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
    ]);
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly removeDialogRef: MatDialogRef<RemoveCartItemComponent>,
        @Inject(MAT_DIALOG_DATA)
        private readonly modalData: {
            planName: string;
            cartId?: number;
        },
        private readonly shopCartService: ShopCartService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly appFlowService: AppFlowService,
    ) {}

    /**
     * Function to set the planName in the modal
     */
    ngOnInit(): void {
        const lowerLimit = 16;
        const upperLimit = this.modalData.planName.length - PLAN_NAME_LENGTH_LIMIT;
        this.truncatePlanName = `${this.modalData.planName.substr(0, lowerLimit)}...${this.modalData.planName.substr(
            upperLimit,
            this.modalData.planName.length,
        )}`;
    }

    /**
     * Function to close the modal after plan Removal
     */
    closeAfterRemove(): void {
        if (this.appFlowService.checkTpi()) {
            this.appFlowService.discardApplication(this.modalData.cartId);
        }
        this.shopCartService.currentRemoveItem.pipe(takeUntil(this.unsubscribe$)).subscribe((res: RemovePlan) => {
            this.removePlan = res;
            this.store.dispatch(new SetPlanStatus(res.removeProductId, res.removePlanId));
        });
        this.removeDialogRef.close({ type: "Remove" });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
