import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { TpiServices, SharedService } from "@empowered/common-services";

const SHOP = "shop";

@Component({
    selector: "empowered-tpi-secondary-header",
    templateUrl: "./tpi-secondary-header.component.html",
    styleUrls: ["./tpi-secondary-header.component.scss"],
})
export class TpiSecondaryHeaderComponent implements OnInit, OnDestroy {
    isReviewPage = false;
    cartCount = 0;
    totalCost = 0;
    payfrequencyName = "";
    shop = SHOP;
    private readonly unsubscribe$: Subject<void> = new Subject();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpi.shopReview.selectBenefits",
        "primary.portal.tpi.shopReview.reviewyourSelections",
    ]);
    tpiModalMode = false;
    constructor(
        private readonly language: LanguageService,
        private readonly sharedService: SharedService,
        private readonly store: Store,
        private readonly tpiService: TpiServices,
    ) {}

    ngOnInit(): void {
        this.sharedService.currentShopReviewPage.pipe(takeUntil(this.unsubscribe$)).subscribe((shopReviewPage) => {
            if (shopReviewPage && shopReviewPage.isReview) {
                this.isReviewPage = true;
                this.cartCount = shopReviewPage.cartCount;
                this.totalCost = shopReviewPage.totalCost;
                this.payfrequencyName = shopReviewPage.payfrequencyName;
            } else {
                this.isReviewPage = false;
            }
        });
        this.tpiModalMode = this.tpiService.isLinkAndLaunchMode();
    }

    /**
     * To avoid memory leakage this will destroy all the subscription for the component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
