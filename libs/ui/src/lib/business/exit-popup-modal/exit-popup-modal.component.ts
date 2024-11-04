import { Component, Inject, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { ShoppingService } from "@empowered/api";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Subject } from "rxjs";
import { takeUntil, finalize } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { TpiSSOModel } from "@empowered/constants";
import { TpiServices, EmpoweredModalService } from "@empowered/common-services";
import { TPIState } from "@empowered/ngxs-store";

const EXIT = "tpi/exit";

@Component({
    selector: "empowered-exit-popup-modal",
    templateUrl: "./exit-popup-modal.component.html",
    styleUrls: ["./exit-popup-modal.component.scss"],
})
export class ExitPopupModalComponent implements OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.selectionsNotSaved",
        "primary.portal.tpi.exitTitle",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.tpiEnrollment.selectionsSaved",
    ]);
    private readonly unsubscribe$: Subject<void> = new Subject();
    tpiSsoDetail: TpiSSOModel;

    constructor(
        private readonly shoppingService: ShoppingService,
        private readonly language: LanguageService,
        private readonly router: Router,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly store: Store,
        private readonly tpiService: TpiServices,
        @Inject(MAT_DIALOG_DATA)
        readonly modalData: {
            memberId: number;
            groupId: number;
            ssoToShop: boolean;
        },
    ) {
        this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
    }
    /**
     * Function to clear shopping cart when user exits from shop page of TPI flow
     */
    onExitConfirm(): void {
        if (this.modalData.ssoToShop) {
            this.confirmCloseDialog();
        } else {
            this.shoppingService
                .clearShoppingCart(this.modalData.memberId, this.modalData.groupId)
                .pipe(
                    takeUntil(this.unsubscribe$),
                    finalize(() => this.confirmCloseDialog()),
                )
                .subscribe();
        }
    }
    /**
     * Function to close TPI Modal
     */
    confirmCloseDialog(): void {
        this.tpiService.closeTPIModal();
        this.empoweredModalService.closeDialog();
        this.router.navigate([EXIT]);
    }
    /**
     * To avoid memory leakage this will destroy all the subscriptions for the component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
