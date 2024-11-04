import { Component, OnDestroy } from "@angular/core";
import { Store } from "@ngxs/store";
import { AddAccountInfo, SetTPIProducerId } from "@empowered/ngxs-store";
import { AccountService, ShoppingService } from "@empowered/api";
import { TPIState } from "@empowered/ngxs-store";
import { catchError, map, retry, takeUntil } from "rxjs/operators";
import { combineLatest, Observable, of, Subject } from "rxjs";
import { Accounts, TpiSSOModel } from "@empowered/constants";
import { Router } from "@angular/router";
import { TpiServices } from "@empowered/common-services";

const RETRY_LIMIT = 2;

@Component({
    selector: "empowered-tpi-main",
    templateUrl: "./tpi-main.component.html",
    styleUrls: ["./tpi-main.component.scss"],
})
export class TpiMainComponent implements OnDestroy {
    mpGroup: number;
    memberId: number;
    tpiLnlMode = false;
    private readonly unsubscribe$: Subject<void> = new Subject();
    isModalFooterEnabled$: Observable<boolean> = combineLatest([this.tpiService.isAgeError$, this.tpiService.getSSOError()]).pipe(
        map(([isAgeError, isSsoError]) => isAgeError || isSsoError),
    );

    constructor(
        private readonly store: Store,
        private readonly tpiService: TpiServices,
        private readonly shoppingService: ShoppingService,
        private readonly router: Router,
        private readonly accountService: AccountService,
    ) {
        this.store.dispatch(new SetTPIProducerId(0));
        this.tpiLnlMode = this.tpiService.isLinkAndLaunchMode();
        const tpiSsoDetail: TpiSSOModel = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.cacheAccountDetails(tpiSsoDetail);
        this.clearCartItem(tpiSsoDetail);
    }

    /**
     * Function to clear the cart items
     */
    clearCartItem(tpiSsoDetail: TpiSSOModel): void {
        if (tpiSsoDetail.productId || tpiSsoDetail.planId) {
            this.shoppingService
                .clearShoppingCart(tpiSsoDetail.user.memberId, tpiSsoDetail.user.groupId, false)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe();
        }
    }

    /**
     * Caches the data of the group into store
     * @param tpiSsoDetail TPI SSO related details
     */
    cacheAccountDetails(tpiSsoDetail: TpiSSOModel): void {
        const groupId = tpiSsoDetail?.user?.groupId;
        if (!groupId) {
            return;
        }
        this.accountService
            .getAccount(String(groupId))
            .pipe(
                takeUntil(this.unsubscribe$),
                retry(RETRY_LIMIT),
                catchError(() => of(null)),
            )
            .subscribe((res: Accounts) => {
                if (res) {
                    this.store.dispatch(
                        new AddAccountInfo({
                            accountInfo: res,
                            mpGroupId: String(groupId),
                        }),
                    );
                }
            });
    }

    /**
     * Function called on click of 'Exit' button and is used to exit from TPI flow
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * Function to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
