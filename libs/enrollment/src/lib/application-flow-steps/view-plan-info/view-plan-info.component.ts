import { Component, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogConfig } from "@angular/material/dialog";
import { EmpoweredModalService } from "@empowered/common-services";
import { AppSettings, Characteristics, FooterAction } from "@empowered/constants";
import { RemoveCartItemComponent } from "../../shopping-cart/remove-cart-item/remove-cart-item.component";
import { Subject } from "rxjs";
import { ViewPlanInfoModel } from "@empowered/api";
import { filter, takeUntil, tap } from "rxjs/operators";

const REMOVE = "Remove";

@Component({
    selector: "empowered-view-plan-info",
    templateUrl: "./view-plan-info.component.html",
    styleUrls: ["./view-plan-info.component.scss"],
})
export class ViewPlanInfoComponent implements OnDestroy {
    characteristics = Characteristics;
    private readonly unsubscribe$ = new Subject<void>();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.planInfo.title",
        "primary.portal.common.close",
        "primary.portal.applicationFlow.planInfo.coverageLevel",
        "primary.portal.applicationFlow.planInfo.riders",
        "primary.portal.applicationFlow.planInfo.taxStatus",
        "primary.portal.applicationFlow.planInfo.yourCost",
        "primary.portal.tpiEnrollment.removeThisPlan",
        "primary.portal.applicationFlow.planInfo.currency",
        "primary.portal.applicationFlow.planInfo.baseCost",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly dialogRef: MatDialogRef<ViewPlanInfoComponent>,
        @Inject(MAT_DIALOG_DATA)
        readonly viewPlanInfoDetail: ViewPlanInfoModel,
    ) {}

    /**
     * Function to close the modal
     */

    closeModal(): void {
        this.dialogRef.close({ type: AppSettings.CANCEL });
    }

    /**
     * Function to open remove cart dialog and remove the plan from cart
     */

    discard(): void {
        const dialogConfig = new MatDialogConfig();
        const modalData = {
            planName: this.viewPlanInfoDetail.planName,
            cartId: this.viewPlanInfoDetail.cartId,
        };
        dialogConfig.data = modalData;
        this.empoweredModalService
            .openDialog(RemoveCartItemComponent, dialogConfig)
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((afterClosedResult) => afterClosedResult?.type === FooterAction.REMOVE),
            )
            .subscribe(() => this.closeModal());
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
