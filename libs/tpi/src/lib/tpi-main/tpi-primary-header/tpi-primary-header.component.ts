import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialogConfig } from "@angular/material/dialog";
import { map, take, takeUntil } from "rxjs/operators";
import { combineLatest, Observable, Subject, Subscription } from "rxjs";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { ExitPopupModalComponent } from "@empowered/ui";
import { TPIState } from "@empowered/ngxs-store";
import { TpiSSOModel } from "@empowered/constants";
import { SetTPIShopRoute } from "@empowered/ngxs-store";
import { MemberService } from "@empowered/api";
import { TpiServices, EmpoweredModalService, RouteInterceptorService } from "@empowered/common-services";
import { NGRXStore } from "@empowered/ngrx-store";
import { select } from "@ngrx/store";
import { AflacAlwaysSelectors } from "@empowered/ngrx-store/ngrx-states/aflac-always";

const STEP_ONE = 1;
const COVERAGE = "coverage-summary";
const PDA = "pda";
const APP_FLOW = "app-flow";
const TPI_SHOP = "tpi/shop";
const AFLAC_ALWAYS = "aflac-always";
const TPI_APP_FLOW = "tpi/app-flow";
const SHOP = "shop";
const PDA_VIEW = "view";
const PDA_FORM = "form";

@Component({
    selector: "empowered-tpi-primary-header",
    templateUrl: "./tpi-primary-header.component.html",
    styleUrls: ["./tpi-primary-header.component.scss"],
})
export class TpiPrimaryHeaderComponent implements OnInit, OnDestroy {
    @Input() headerContent = false;
    readonly AFLAC_LOGO = "/assets/images/aflac_logo.png";
    readonly LOGO = "/assets/images/logo.png";
    primaryHeader = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.tpiEnrollment.shop",
        "primary.portal.tpiEnrollment.coverageSummary",
        "primary.portal.tpiEnrollment.pdaForms",
        "primary.portal.common.close",
        "primary.portal.brandingModalExit.buttonCancel",
        "primary.portal.brandingModalExit.buttonExit",
        "primary.portal.tpiEnrollment.selectionsNotSaved",
        "primary.portal.tpi.exitTitle",
        "primary.portal.lnlHeader.contactInfo",
    ]);
    private readonly unsubscribe$: Subject<void> = new Subject();
    tpiSsoDetail: TpiSSOModel;
    savedRoute: string;
    tpiModalMode = false;
    currentRoute: string;
    COVERAGE_SUMMARY = COVERAGE;
    SHOP_TAB = SHOP;
    PDA_TAB = PDA;
    aflac_always = AFLAC_ALWAYS;
    employeeTerminated: boolean;
    subscriptions: Subscription[] = [];
    isFlowFromTpiShopPage = false;
    // to hide header if user not eligible for enrollment due to age limit
    isTpiShopEnabled$: Observable<boolean> = combineLatest([this.tpiService.isAgeError$, this.tpiService.getSSOError()]).pipe(
        map(([isAgeError, isSsoError]) => !isAgeError && !isSsoError),
    );
    constructor(
        private readonly language: LanguageService,
        private readonly tpiService: TpiServices,
        private readonly router: Router,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly store: Store,
        private readonly routerInterceptor: RouteInterceptorService,
        private readonly memberService: MemberService,
    ) {}

    /**
     * Implements Angular's OnInit Life Cycle hook
     */
    ngOnInit(): void {
        this.tpiSsoDetail = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.tpiService.step$.pipe(takeUntil(this.unsubscribe$)).subscribe((step) => {
            this.primaryHeader = step === STEP_ONE;
        });
        this.tpiModalMode = this.tpiService.isLinkAndLaunchMode();
        this.subscriptions.push(
            this.memberService
                .getMember(this.tpiSsoDetail.user.memberId, true, this.tpiSsoDetail.user.groupId.toString())
                .subscribe((response) => {
                    const memberInfo = response.body;
                    if (memberInfo.workInformation.termination.terminationDate) {
                        this.employeeTerminated = true;
                    }
                }),
        );
        this.setCurrentRoute();
        this.subscriptions.push(
            this.tpiService.isShopPageFlow$.subscribe((isFlowFromTpiShopPage) => (this.isFlowFromTpiShopPage = isFlowFromTpiShopPage)),
        );
    }

    /**
     * This will get invoked once the close icon gets called
     */
    onClose(): void {
        if (this.router.url.indexOf(TPI_SHOP) >= 0 || this.router.url.indexOf(TPI_APP_FLOW) >= 0) {
            const dialogConfig = new MatDialogConfig();
            const modalData = {
                memberId: this.tpiSsoDetail.user.memberId,
                groupId: this.tpiSsoDetail.user.groupId,
                ssoToShop: !(this.tpiSsoDetail.planId || this.tpiSsoDetail.productId),
            };
            dialogConfig.data = modalData;
            this.empoweredModalService.openDialog(ExitPopupModalComponent, dialogConfig);
        } else {
            this.tpiService.closeTPIModal();
        }
    }
    /**
     * Function to save the current route into a variable before navigating out of shopping experience flow
     */
    setRoute(): void {
        if (!(this.router.url.indexOf(COVERAGE) >= 0 || this.router.url.indexOf(PDA) >= 0 || this.router.url.indexOf(AFLAC_ALWAYS) >= 0)) {
            this.savedRoute = this.router.url;
            this.store.dispatch(new SetTPIShopRoute(this.savedRoute));
        }
    }
    /**
     * Function to route to shopping experience flow
     */
    routeToShop(): void {
        if (this.router.url.indexOf(COVERAGE) >= 0 || this.router.url.indexOf(PDA) >= 0 || this.router.url.indexOf(AFLAC_ALWAYS) >= 0) {
            const nextRouteToNavigate = this.savedRoute ? this.savedRoute : TPI_SHOP;
            this.router.navigate([nextRouteToNavigate]);
        } else if (this.router.url.indexOf(APP_FLOW) >= 0) {
            this.router.navigate(["/tpi/shop"]);
        }
    }
    /**
     * Set the current route to decide which tab will be active
     */
    setCurrentRoute(): void {
        this.routerInterceptor.currentRoute$.pipe(takeUntil(this.unsubscribe$)).subscribe((currentRoute) => {
            if (currentRoute === COVERAGE) {
                this.currentRoute = COVERAGE;
            } else if (currentRoute === PDA_VIEW || currentRoute === PDA_FORM) {
                this.currentRoute = PDA;
            } else if (currentRoute === AFLAC_ALWAYS) {
                this.currentRoute = AFLAC_ALWAYS;
            } else {
                this.currentRoute = SHOP;
            }
        });
    }
    /**
     * To avoid memory leakage this will destroy all the subscription for the component
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subs) => subs.unsubscribe());
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
