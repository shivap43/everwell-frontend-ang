import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AflacAlwaysStoreService } from "@empowered/aflac-always";
import { TpiServices } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { TPIState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { take, takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-tpi-aflac-always-container",
    templateUrl: "./tpi-aflac-always-container.component.html",
    styleUrls: ["./tpi-aflac-always-container.component.scss"],
})
export class TpiAflacAlwaysContainerComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.reinstate.aflacAlways",
        "primary.portal.aflacAlways.backToCoverageSummary",
        "primary.portal.aflacAlways.viewCoverageSummary",
    ]);

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    isTpi = true;
    isSelfAssisted: boolean;
    isFlowFromTpiShopPage = false;
    constructor(
        private readonly languageService: LanguageService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly tpiService: TpiServices,
        private readonly aflacAlwaysStoreService: AflacAlwaysStoreService,
    ) {}

    ngOnInit(): void {
        this.store
            .select(TPIState.tpiSsoDetail)
            .pipe(take(1))
            .subscribe((ssoData) => {
                this.isSelfAssisted = !ssoData.user.producerId;
            });
        this.tpiService.isShopPageFlow$
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((isFlowFromTpiShopPage) => (this.isFlowFromTpiShopPage = isFlowFromTpiShopPage));
    }

    /**
     * Function to redirect user back to the confirmation page
     */
    backToConfirmation(): void {
        // TODO: Implement function to redirect to confirmation page
    }

    /**
     * Function to redirect user back to coverage page
     */
    backToCoverageSummary(): void {
        this.aflacAlwaysStoreService.resetAflacAlwaysData();
        this.router.navigate(["tpi/coverage-summary"]);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
