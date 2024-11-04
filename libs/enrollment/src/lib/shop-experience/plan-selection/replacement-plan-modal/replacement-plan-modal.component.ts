import { Component, OnInit, OnDestroy, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ShoppingCartDisplayService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Subscription } from "rxjs";

@Component({
    selector: "empowered-replacement-plan-modal",
    templateUrl: "./replacement-plan-modal.component.html",
    styleUrls: ["./replacement-plan-modal.component.scss"],
})
export class ReplacementPlanModalComponent implements OnInit, OnDestroy {
    message: string;
    previousPlanSource: string;
    currentPlanSource: string;
    subscriptions: Subscription[] = [];
    languageStrings = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.common.close",
        "primary.portal.common.cancel",
        "primary.portal.common.replace",
        "primary.portal.shoppingCart.planSourceMessage",
        "primary.portal.replacingPlan.addAndReplace",
        "primary.portal.replacingPlan.planSettings",
        "primary.portal.replacingPlan.previousSelection",
        "primary.portal.members.replacingPlan.replacePlanSettings",
    ]);

    constructor(
        private readonly removeDialogRef: MatDialogRef<ReplacementPlanModalComponent>,
        private readonly shoppingCartDisplay: ShoppingCartDisplayService,
        private readonly languageService: LanguageService,
        @Inject(MAT_DIALOG_DATA)
        readonly data: {
            productName: string;
            cartItem: boolean;
            updatePlan: boolean;
        }
    ) {}

    /**
     * Angular life-cycle hook: OnInit
     * Get previous plan and selected plan names while replacing a cart item
     */
    ngOnInit(): void {
        if (this.data.cartItem) {
            this.subscriptions.push(
                this.shoppingCartDisplay.previousPlan.subscribe((message) => (this.previousPlanSource = message))
            );
            this.subscriptions.push(
                this.shoppingCartDisplay.currentPlan.subscribe((message) => (this.currentPlanSource = message))
            );
        }
    }

    closeModal(): void {
        this.removeDialogRef.close({ type: "Cancel" });
    }
    closeAfterReplace(): void {
        this.removeDialogRef.close({ type: "Replace" });
    }
    ngOnDestroy(): void {
        this.subscriptions.forEach((x) => x.unsubscribe());
    }
}
