import { EmpStepperService } from "@empowered/emp-stepper";
import { Component, OnInit, ViewChild, HostListener, OnDestroy, Input } from "@angular/core";
import { Subject, Subscription, BehaviorSubject, combineLatest, Observable } from "rxjs";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { BenefitsOfferingService, Carrier, Proposal } from "@empowered/api";
import { PayFrequency, CountryState, ConfigName } from "@empowered/constants";
import { MPGroupAccountService, SharedService } from "@empowered/common-services";
import { takeUntil, tap } from "rxjs/operators";
import { ProposalsState, StaticUtilService } from "@empowered/ngxs-store";
import { AbstractComponentStep, PanelModel, PlanPanelModel } from "@empowered/constants";
import { FormGroup, FormBuilder } from "@angular/forms";
import { Router } from "@angular/router";
import { BenefitsOfferingState } from "@empowered/ngxs-store";

const PROSPECT = "prospect";

@Component({
    selector: "empowered-review-complete-proposal",
    templateUrl: "./review-complete-proposal.component.html",
    styleUrls: ["./review-complete-proposal.component.scss"],
})
export class ReviewCompleteProposalComponent extends AbstractComponentStep implements OnInit, OnDestroy {
    form: FormGroup = this.fb.group({});
    statesList: any[] = [];
    stateValues: any[] = [];
    state = "";
    mpGroup: any;
    panelProducts: PanelModel[] = [];
    isLoading: boolean;
    enableIndividualPlan = false;
    productChoices: any[];
    displayedProduct: PanelModel[] = [];
    planChoiceLength: number;
    planChoiceLengthArray: number[] = [];
    plansPanelList: any[] = [];
    plansPanelListSubject$ = new BehaviorSubject<any[]>([]);
    displayedColumns: string[] = ["plan", "state"];
    panelOpenState = false;
    languageStrings = {
        submitOffering: this.language.fetchPrimaryLanguageValue("primary.portal.reviewSubmit.submitOffering"),
        ariaEdit: this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
        ariaBack: this.language.fetchPrimaryLanguageValue("primary.portal.common.back"),
    };
    languageString: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.reviewSubmit.continousPlan",
        "primary.portal.reviewSubmit.plan",
        "primary.portal.common.gotIt",
        "primary.portal.common.edit",
        "primary.portal.reviewSubmit.submitToHR.title",
        "primary.portal.reviewSubmit.submitToHR.subTitle",
        "primary.portal.proposals.reviewComplete.settings",
        "primary.portal.proposals.reviewComplete.mainHRTitle",
        "primary.portal.reviewSubmit.benefitsOffered",
        "primary.portal.reviewSubmit.benefitsOffered.products",
        "primary.portal.reviewSubmit.benefitsOffered.plans",
        "primary.portal.previewProposal.employerFlyerUnavailable",
        "primary.portal.previewProposal.ratesIncluded",
    ]);
    planYearDatesTooltip: any;
    planYearDatesTooltipContinuous: any;
    alertFlag = true;
    isAlert: boolean;
    stepNumber: number;
    isAlertEnabled: boolean;
    coverageStartDateOptions = [];
    carrierFormStatus: any[] = [];
    errorResponse = false;
    errorMessage: string[] = [];
    private unsubscribe$ = new Subject<void>();
    @ViewChild("submit") submitToHR;
    enableEditPrice = false;
    subscriptions: Subscription[] = [];

    name: string;
    coverageStartDate: string | Date;
    payrollFrequencyId: number;
    censusEstimate: number;
    situsState: string;
    products: any[];
    @Input() proposalId: number;
    @Input() productPlanIdMap: Map<number, number[]>;
    selectedDeductionFrequency: string;
    missingFlyerFeatureEnable$: Observable<boolean>;
    missingFlyerPlanNames$ = new BehaviorSubject<string[]>([]);

    constructor(
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly benefits: BenefitsOfferingService,
        private readonly fb: FormBuilder,
        private readonly stepperService: EmpStepperService,
        private readonly mpGroupAccountService: MPGroupAccountService,
        private readonly router: Router,
        private readonly sharedService: SharedService,
        private readonly staticUtilService: StaticUtilService,
    ) {
        super();
    }

    ngOnInit(): void {
        this.isLoading = true;
        this.isAlertEnabled = true;
        this.subscriptions.push(
            this.mpGroupAccountService.mpGroupAccount$.subscribe((account) => {
                const mpGroupObj = account.id;
                this.situsState = account.situs.state.abbreviation;
                if (mpGroupObj) {
                    this.mpGroup = mpGroupObj;
                    this.errorResponse = false;
                    this.arrangeData();
                }
                this.isLoading = false;
            }),
        );
        this.selectedDeductionFrequency = this.getDeductionFrequencyName();
        this.isTouched.emit(false);
        this.missingFlyerFeatureEnable$ = this.staticUtilService.cacheConfigEnabled(ConfigName.MISSING_FLYER_FEATURE_ENABLE);
    }

    // Arrange set of data
    arrangeData(): void {
        this.subscriptions.push(
            this.benefits
                .getPlanYears(this.mpGroup, true)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => {
                        this.getValuesFromStore();
                        this.setCensusEstimate();
                        this.panelProducts = this.store
                            .selectSnapshot(BenefitsOfferingState.getpanelProducts)
                            .filter((pannel) => pannel.productChoice != null || pannel.product.valueAddedService);
                        this.setProductInformation();
                    },
                    (error) => {
                        this.errorMessage.push(
                            this.language.fetchPrimaryLanguageValue("primary.portal.benefitsOffering.reviewSubmit.unableToLoadPlan"),
                        );
                        this.errorResponse = true;
                        this.isLoading = false;
                    },
                ),
        );
    }

    // get state list from store
    getValuesFromStore(): void {
        this.statesList = this.store.selectSnapshot(BenefitsOfferingState.getBenefitOfferingStates);
        this.statesList = this.statesList.length > 0 ? this.statesList : [this.situsState];
        this.statesList.forEach((state) => {
            if (this.state === "") {
                this.state = state.name;
            } else {
                this.state = this.state + ", " + state.name;
            }
        });
    }

    // Set Product Information
    setProductInformation(): void {
        this.panelProducts.forEach((productPannelItem) => {
            productPannelItem.carrier.forEach((specificCarrier) => {
                const carrierSpecificPlans = productPannelItem.plans
                    .filter((plan) => plan.plan.carrierId === specificCarrier.id)
                    .filter((filteredPlan) => {
                        if (this.productPlanIdMap && this.productPlanIdMap.get(productPannelItem.product.id)) {
                            for (const planId of this.productPlanIdMap.get(productPannelItem.product.id)) {
                                if (filteredPlan.plan.id === planId) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    });
                this.planYearDatesTooltip = [];
                if (carrierSpecificPlans.length !== 0) {
                    this.setSpecificPlans(carrierSpecificPlans, specificCarrier, productPannelItem);
                }
            });
        });
    }

    /**
     * Method to set selected plans
     * @param carrierSpecificPRPlans {PlanPanelModel[]}
     * @param specificCarrier {Carrier}
     * @param productPanelItem {PanelModel}
     */
    setSpecificPlans(carrierSpecificPRPlans: PlanPanelModel[], specificCarrier: Carrier, productPanelItem: PanelModel): void {
        this.plansPanelList.push({
            carrier: specificCarrier,
            plans: carrierSpecificPRPlans,
            product: productPanelItem.product,
        });
        carrierSpecificPRPlans.forEach((carrierSpecificPRPlan) => {
            if (carrierSpecificPRPlan?.plan.missingEmployerFlyer) {
                this.missingFlyerPlanNames$.next([...this.missingFlyerPlanNames$.getValue(), carrierSpecificPRPlan.plan.adminName]);
            }
        });
        this.plansPanelList.forEach((planObject) => {
            this.sharedService.sortPlans(planObject.plans);
        });
        // sort similar products by ascending order of carriers
        this.plansPanelList.sort((previousProduct, nextProduct) => {
            if (previousProduct && nextProduct && previousProduct.product?.displayOrder === nextProduct.product?.displayOrder) {
                return previousProduct.carrier?.name.localeCompare(nextProduct.carrier?.name, "en", { numeric: true });
            }
            return undefined;
        });
        this.plansPanelListSubject$.next(this.plansPanelList);
    }

    // Set census estimate
    setCensusEstimate(): void {
        let currentProposal: Proposal;
        this.store.selectSnapshot(ProposalsState.proposals).forEach((proposal) => {
            if (proposal.id === this.proposalId) {
                currentProposal = proposal;
                this.censusEstimate = currentProposal.eligibleEmployeeEstimate;
            }
        });
    }

    /**
     * Method to set deduction frequency for displaying deduction frequency on review complete page
     *
     * @returns name of the selected deduction frequency
     */
    getDeductionFrequencyName(): string {
        return this.store
            .selectSnapshot(ProposalsState.getDeductionFrequencies)
            ?.find((deductionFrequency: PayFrequency) => deductionFrequency.id === this.payrollFrequencyId)?.name;
    }

    // Checking whether user reloading or closing the tab
    @HostListener("window:beforeunload", ["$event"])
    beforeunloadHandler(event: any): boolean {
        event.preventDefault();
        event.stopPropagation();
        return false;
    }

    /**
     * Method to Setting up states in accordion
     * @param values refers to array of states
     * @returns string
     */
    displayValues(values: CountryState[]): string {
        this.stateValues = [];
        let displayValue = "";
        values.forEach((eachState) => {
            if (
                this.statesList.filter((storeState) => storeState.abbreviation === eachState.abbreviation).length > 0 &&
                !this.router.url.includes(PROSPECT)
            ) {
                this.statesList
                    .filter((storeState) => storeState.abbreviation === eachState.abbreviation)
                    .forEach((stateKey) => {
                        this.stateValues.push(stateKey);
                    });
            } else {
                this.stateValues.push(eachState);
            }
        });
        if (this.stateValues.length < 5) {
            this.stateValues.forEach((value) => {
                if (displayValue === "") {
                    displayValue = value.abbreviation;
                } else {
                    displayValue = displayValue + ", " + value.abbreviation;
                }
            });
        } else {
            displayValue =
                this.stateValues.length + this.language.fetchPrimaryLanguageValue("primary.portal.proposals.reviewComplete.states");
        }
        return displayValue;
    }

    // Step returning an object when we click on edit
    stepChangeOnEdit(stepNumber: number): any {
        const stepChange = {
            step: stepNumber,
            state: "edit",
        };
        return stepChange;
    }

    // Edit settings redirects to settings step
    editSettings(): void {
        this.stepperService.previousStep(0);
    }

    // Edit products redirects to products step
    editProducts(): void {
        this.stepperService.previousStep(1);
    }

    // Edit plans redirects to plans step
    editPlans(): void {
        this.stepperService.previousStep(2);
    }

    // unsubscribe
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
