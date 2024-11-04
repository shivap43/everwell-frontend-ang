import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { combineLatest, fromEvent, Observable, Subject } from "rxjs";
import { map, takeUntil, tap, withLatestFrom } from "rxjs/operators";
import { select } from "@ngrx/store";
import { MatDialog } from "@angular/material/dialog";
import { CountryState, Plan, PlanOffering, CarrierId } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { PlanOfferingService } from "../../services/plan-offering/plan-offering.service";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { RXJSService } from "@empowered/ngrx-store/services/rxjs/rxjs.service";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanDetailsComponent } from "@empowered/ui";
import { ProductOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/product-offerings";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";

const Q60_PLAN_SERIES = "Q60";

@Component({
    selector: "empowered-plan-details-link",
    templateUrl: "./plan-details-link.component.html",
    styleUrls: ["./plan-details-link.component.scss"],
})
export class PlanDetailsLinkComponent implements OnInit, OnDestroy {
    // We can put static flag here since anchor is not wrapped with any structural directives (such as *ngIf or *ngFor)
    // By using the static flag, we can access anchor on ngOnInit instead of having to wait for ngAfterViewInit
    @ViewChild("anchor", { static: true }) anchor!: ElementRef<HTMLAnchorElement>;

    @Input() planOffering!: PlanOffering;

    // Translations
    readonly languageStrings = this.getLanguageStrings();

    // Gets selected CountryState
    private readonly selectedCountryState$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedMemberEnrollmentState));

    // Gets mpGroup
    private readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));

    private readonly unsubscriber$ = new Subject<void>();

    private readonly selectedRiders$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingRiders)).pipe(
        // Since PlanOffering riders api calls are made frequently, onAsyncValue for selected PlanOffering riders
        // will emit multiple times for each api call,
        // to prevent this, we can check if the array of PlanOffering riders change using their ids
        this.rxjsService.distinctArrayUntilChanged(),
    );
    // current account details observable from ngrx store
    private readonly selectedAccount$ = this.ngrxStore.onAsyncValue(select(AccountsSelectors.getSelectedAccount));
    // Gets referenceDate observable based on dual plan year service logic
    private readonly referenceDate$ = this.ngrxStore.pipe(select(ProductOfferingsSelectors.getSelectedReferenceDate));

    // Get all ids of rider of broker selected from config
    private readonly riderBrokerPlanIds$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getRiderBrokerPlanIds));

    constructor(
        private readonly languageService: LanguageService,
        private readonly ngrxStore: NGRXStore,
        private readonly dialog: MatDialog,
        private readonly planOfferingService: PlanOfferingService,
        private readonly rxjsService: RXJSService,
    ) {}

    ngOnInit(): void {
        let riderPlanIds$ = this.selectedRiders$.pipe(map((riders) => riders.map((rider) => rider.plan.id)));

        // Filter the rider ids not selected by broker in carrier form for Q60
        if (this.planOffering?.plan?.policySeries?.toUpperCase().includes(Q60_PLAN_SERIES)) {
            riderPlanIds$ = this.getFilterRiderPlanIdObservables();
        }
        // extract situs state
        const situsState$ = this.selectedAccount$.pipe(map((account) => account.situs?.state?.abbreviation));

        // Open Plan Details when anchor is clicked
        fromEvent(this.anchor.nativeElement, "click")
            .pipe(
                withLatestFrom(this.selectedCountryState$, this.mpGroup$, riderPlanIds$, situsState$, this.referenceDate$),
                tap(([_, countryState, mpGroup, riderPlanIds, situsState, referenceDate]) => {
                    this.displayPlanDocuments(mpGroup, countryState, riderPlanIds, situsState, referenceDate);
                }),
                takeUntil(this.unsubscriber$),
            )
            .subscribe();
    }

    /**
     * Get a Record of translations using LanguageService
     * @returns {Record<string, string>} Record of translations
     */
    getLanguageStrings(): Record<string, string> {
        return this.languageService.fetchPrimaryLanguageValues(["primary.portal.shoppingExperience.planDetails"]);
    }

    /**
     * Displays plan documents pop up based on mpGroup, selected CountryState
     *
     * @param mpGroup - selected mpGroup
     * @param countryState - selected CountryState
     */

    /**
     * Displays plan documents pop up based on mpGroup, selected CountryState
     *
     * @param mpGroup - selected mpGroup
     * @param countryState - selected CountryState
     * @param riderPlanIds - Array of RIDER PlanOffering Plan ids related to current PlanOffering
     * @param situsState - Situs state belongs to the current selected account
     * @param referenceDate -Reference date based on dual plan year logic
     */
    displayPlanDocuments(
        mpGroup: number,
        countryState: CountryState,
        riderPlanIds: number[],
        situsState: string,
        referenceDate: string,
    ): void {
        const plan: Plan = this.planOfferingService.getPlan(this.planOffering);
        // TODO [TYPE]: DialogData from PlanDetailsComponent should
        // be migrated to types in some way so that it can be imported here for type safety
        const planDetails = {
            planOfferingId: this.planOffering.id,
            planId: plan.id,
            planName: plan.name,
            states: [countryState],
            mpGroup,
            // Although property says riderIds, it actually wants the rider's Plan id
            riderIds: riderPlanIds,
            isCarrierOfADV: this.planOffering.plan.carrierId === CarrierId.ADV,
            productId: this.planOffering.plan?.product.id,
            situsState,
            referenceDate,
        };

        this.dialog.open(PlanDetailsComponent, {
            hasBackdrop: true,
            data: planDetails,
            width: "600px",
        });
    }

    /**
     * Function to return the Observable of array of rider id excluding not selected by broker in carrier form
     * @return Observable<number[]>
     */
    getFilterRiderPlanIdObservables(): Observable<number[]> {
        return combineLatest([this.selectedRiders$, this.riderBrokerPlanIds$]).pipe(
            map(([selectedRiders, riderBrokerPlanIds]) => this.getFilterRiderPlanId(selectedRiders, riderBrokerPlanIds)),
        );
    }

    /**
     * Filter rider plan ids
     * @param {PlanOffering[]} selectedRiders available riders for plan offering
     * @param {number[]} riderBrokerPlanIds config value of broker rider ids
     * @return {number[]} array of number
     */
    getFilterRiderPlanId(selectedRiders: PlanOffering[], riderBrokerPlanIds: number[]): number[] {
        return (
            selectedRiders
                // excluding ids not selected by broker while filling carrier form and present in broker rider array
                .filter((selectedRider) => !(riderBrokerPlanIds.includes(selectedRider.plan.id) && !selectedRider.brokerSelected))
                // mapping id from rider plan object
                .map((selectedRider) => selectedRider.plan.id)
        );
    }

    ngOnDestroy(): void {
        this.unsubscriber$.next();
        this.unsubscriber$.complete();
    }
}
