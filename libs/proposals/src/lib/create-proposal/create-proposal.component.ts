import { DatePipe, TitleCasePipe } from "@angular/common";
import { ReviewCompleteProposalComponent } from "../review-complete-proposal/review-complete-proposal.component";
import { ProposalPlanDetailsComponent } from "./../proposal-plan-details/proposal-plan-details.component";
import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { EmpStepperService } from "@empowered/emp-stepper";
import { LanguageService } from "@empowered/language";
import { ProposalDetailsComponent } from "../proposal-details/proposal-details.component";
import { FormGroup } from "@angular/forms";
import { ProposalProductDetailsComponent } from "../proposal-product-details/proposal-product-details.component";
import { Store } from "@ngxs/store";
import {
    ProposalProductChoice,
    Proposal,
    ProposalService,
    AccountService,
    ProposalPlanChoices,
    ProductPlans,
    AccountDetails,
} from "@empowered/api";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import { Subscription, BehaviorSubject, Observable, forkJoin, of, iif, EMPTY, Subject } from "rxjs";
import { take, filter, switchMap, tap, delay, flatMap, first } from "rxjs/operators";
import { HttpResponse } from "@angular/common/http";
import {
    ModalDialogAction,
    PanelModel,
    StepModel,
    TabModel,
    ProposalStatus,
    AppSettings,
    GroupAttribute,
    Plan,
    VasFunding,
    PolicyOwnershipType,
} from "@empowered/constants";
import {
    ResetProposalProductChoices,
    ProposalProductChoiceState,
    ProposalsService,
    BenefitsOfferingState,
    GetProductsPanel,
    MapProductChoiceToPanelProduct,
    SetAllProducts,
    SetLandingFlag,
    SetBenefitsStateMPGroup,
    SetPlanEligibility,
    AccountInfoState,
} from "@empowered/ngxs-store";

const SELECTED_PLAN_CHOICES = "selectedPlanChoices";

@Component({
    selector: "empowered-create-proposal",
    templateUrl: "./create-proposal.component.html",
    styleUrls: ["./create-proposal.component.scss"],
})
export class CreateProposalComponent implements OnInit, OnDestroy {
    group: AccountDetails;
    proposal!: Proposal;
    proposalProductChoices!: ProposalProductChoice[];
    proposalPlanChoices!: Map<number, number[]>;
    doDisplayPrevious: boolean;
    doDisplayNext: boolean;
    doDisplayComplete: boolean;
    vasHQProductPlanSelected;
    defaultStepPosition = 1;
    hasError = false;
    initialize = true;

    lastCompletedStep: GroupAttribute;
    isFinishResuming = false;
    COMPLETED_STEP = "completed";
    private readonly showSpinnerOnResumeSubject$: BehaviorSubject<boolean> = new BehaviorSubject(false);
    showSpinnerOnResume$: Observable<boolean> = this.showSpinnerOnResumeSubject$.asObservable();

    saveProductSubscription: Subscription;
    subscriptions: Subscription[] = [];

    panelProductItems: PanelModel[] = [];

    timeouts = [];
    isPendingProducts: boolean;
    private readonly unsubscribe$ = new Subject<void>();

    protected enabledTabIdsSubject$ = new BehaviorSubject<string[]>([""]);
    tabs: TabModel[] = [
        {
            id: "proposalDetailsTab",
            title: this.languageService.fetchPrimaryLanguageValue("primary.portal.proposals.create.tab.details"),
        },
        {
            id: "productDetailsTab",
            title: this.languageService.fetchPrimaryLanguageValue("primary.portal.proposals.create.tab.products"),
        },
        {
            id: "planDetailsTab",
            title: this.languageService.fetchPrimaryLanguageValue("primary.portal.proposals.create.tab.plans"),
        },
        {
            id: "reviewCompleteTab",
            title: this.languageService.fetchPrimaryLanguageValue("primary.portal.proposals.create.tab.reviewComplete"),
        },
    ];

    steps: StepModel[] = [
        {
            id: "proposalDetailsStep",
            stepComponentType: ProposalDetailsComponent,
            tabId: "proposalDetailsTab",
            formId: "proposalForm",
            inputData: new Map(),
            nextStep(form?: FormGroup): string {
                return "productDetailsStep";
            },
        },
        {
            id: "productDetailsStep",
            stepComponentType: ProposalProductDetailsComponent,
            tabId: "productDetailsTab",
            formId: "proposalProductsForm",
            inputData: new Map()
                .set("proposalId", this.proposal ? this.proposal.id : undefined)
                .set("cachedProducts", this.proposalProductChoices),
            evaluateNextStep: true,
        },
        {
            id: "reviewCompleteStep",
            stepComponentType: ReviewCompleteProposalComponent,
            tabId: "reviewCompleteTab",
            inputData: new Map()
                .set("productPlanIdMap", this.proposalPlanChoices)
                .set("proposalId", this.proposal ? this.proposal.id : undefined),
            prerequisiteData: [
                { formId: "proposalDetailsStep", controlName: "name" },
                { formId: "proposalDetailsStep", controlName: "coverageStartDate" },
                { formId: "proposalDetailsStep", controlName: "censusEstimate" },
                { formId: "productDetailsStep", controlName: "products" },
                { formId: "proposalDetailsStep", controlName: "payrollFrequencyId" },
            ],
        },
    ];

    tabs$ = new BehaviorSubject<TabModel[]>(this.tabs);
    steps$ = new BehaviorSubject<StepModel[]>(this.steps);

    stepperResult: Map<string, any> = null;

    /**
     * determine what actions to take based on the data I get back from a particular step (ex. saving data or generating dynamic steps)
     * also determine which buttons to show in the stepper
     */
    onStepperNextSubscription: Subscription = this.stepperService.getStepperResultStream().subscribe((stepperResults: Map<string, any>) => {
        this.doDisplayPrevious = false;
        stepperResults.forEach((value, key) => {
            if (Object.keys(value).length) {
                if (key === "proposalForm") {
                    this.constructProposal(value);
                    this.incrementStep();
                }
                if (key === "proposalProductsForm") {
                    this.constructProposalProductDetails(value);
                    if (this.steps[1].evaluateNextStep) {
                        this.subscriptions.push(
                            this.buildPlanSteps()
                                .pipe(delay(0))
                                .subscribe(() => {
                                    if (this.data && this.data.resume && !this.isFinishResuming) {
                                        if (this.steps[this.defaultStepPosition - 1].id === this.lastCompletedStep.value) {
                                            this.showSpinnerOnResumeSubject$.next(false);
                                            this.isFinishResuming = true;
                                        } else {
                                            this.timeouts.push(setTimeout(() => this.stepperService.next(), 1000));
                                        }
                                    }
                                }),
                        );
                        this.incrementStep();
                    } else if (
                        this.data &&
                        this.data.resume &&
                        this.steps[1].id === this.lastCompletedStep.value &&
                        !this.isFinishResuming
                    ) {
                        this.showSpinnerOnResumeSubject$.next(false);
                        this.isFinishResuming = true;
                    }
                }
                if (key.startsWith("proposalPlansForm")) {
                    if (
                        this.data &&
                        this.data.resume &&
                        (!this.steps[this.defaultStepPosition] ||
                            this.steps[this.defaultStepPosition].id !== this.lastCompletedStep.value) &&
                        !this.isFinishResuming
                    ) {
                        this.timeouts.push(setTimeout(() => this.onClickNext(), 1000));
                    } else {
                        this.showSpinnerOnResumeSubject$.next(false);
                        this.isFinishResuming = true;
                        this.constructProposalPlanDetails(key, value);
                        this.steps[this.steps.length - 2].inputData.set("proposalPlanChoices", this.proposalPlanChoices);
                    }
                    this.incrementStep();
                }
            }

            this.determineButtonsState();

            if (this.doDisplayComplete) {
                // make sure getting rid of any cached VAS products and plans before review screen, if VAS is no longer selected
                const panelProducts = this.panelProductItems.map((pp) => pp.product);
                const vasProductIds = panelProducts.filter((product) => product.valueAddedService).map((product) => product.id);
                const selectedVasProductIds = this.proposalProductChoices
                    .map((ppc) => ppc.productId)
                    .filter((productId) => vasProductIds.includes(productId));
                const reviewProposalPlanChoices = new Map<number, number[]>();
                if (!selectedVasProductIds.length) {
                    this.proposalPlanChoices.forEach((v, k) => {
                        if (!vasProductIds.includes(k)) {
                            reviewProposalPlanChoices.set(k, v);
                        }
                    });
                }
                this.steps[this.steps.length - 1].inputData.set(
                    "productPlanIdMap",
                    reviewProposalPlanChoices && reviewProposalPlanChoices.size ? reviewProposalPlanChoices : this.proposalPlanChoices,
                );
            }
        });
        this.stepperResult = stepperResults;
    });

    // set appropriate variables when I go back a step
    previousStepSubscription: Subscription = this.stepperService.getStepperPreviousStepStream().subscribe((stepIndex) => {
        this.defaultStepPosition = stepIndex + 1;
        this.doDisplayPrevious = this.defaultStepPosition > 1;
        this.doDisplayNext = true;
        this.doDisplayComplete = false;
    });
    // sets loading status of products component
    productsScreenLoaded: Subscription = this.proposalFacade.onProductsLoad.subscribe((loaded) => {
        if (loaded && this.isPendingProducts) {
            this.isPendingProducts = false;
            this.stepperService.next();
        }
    });

    languageStrings: Record<string, string> = this.languageService.fetchPrimaryLanguageValues([
        "primary.portal.proposals.create.complete",
        "primary.portal.proposals.create.next",
        "primary.portal.proposals.create.saveClose",
        "primary.portal.proposals.create.back",
        "primary.portal.proposals.create.header",
        "primary.portal.proposals.edit.header",
        "primary.portal.common.cancel",
    ]);

    constructor(
        private readonly bottomSheetRef: MatBottomSheetRef<CreateProposalComponent>,
        @Inject(MAT_BOTTOM_SHEET_DATA) private readonly data: any,
        private readonly languageService: LanguageService,
        private readonly stepperService: EmpStepperService,
        private readonly proposalFacade: ProposalsService,
        private readonly proposalService: ProposalService,
        private readonly accountService: AccountService,
        private readonly store: Store,
        private readonly datePipe: DatePipe,
        private readonly titleCasePipe: TitleCasePipe,
    ) {}

    /**
     * populate data for existing proposal
     */
    ngOnInit(): void {
        this.group = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        const existingMpGroup = this.store.selectSnapshot(BenefitsOfferingState.getMPGroup);
        this.store.dispatch(new ResetProposalProductChoices());
        const mpGroup: number = this.group.id;

        // getting data for the states with appropriate products and plans for the group/account
        if (mpGroup !== undefined) {
            this.store.dispatch(new SetBenefitsStateMPGroup(mpGroup));

            if (
                !this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts) ||
                !this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts).length ||
                existingMpGroup !== mpGroup
            ) {
                this.subscriptions.push(
                    forkJoin([this.store.dispatch(new SetBenefitsStateMPGroup(mpGroup)), this.store.dispatch(new SetAllProducts())])
                        .pipe(
                            flatMap(() => this.store.dispatch(new SetLandingFlag()).pipe(take(1))),
                            flatMap(() => this.store.dispatch(new SetPlanEligibility()).pipe(take(1))),
                            flatMap(() => this.store.dispatch(new GetProductsPanel()).pipe(take(1))),
                        )
                        .subscribe(
                            () => {
                                this.panelProductItems = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts);
                            },
                            () => {
                                this.hasError = true;
                            },
                        ),
                );
            } else {
                this.panelProductItems = this.store.selectSnapshot(BenefitsOfferingState.getpanelProducts);
            }
        }

        if (this.data) {
            if (this.data.resume) {
                this.showSpinnerOnResumeSubject$.next(true);
            }
            this.proposal = this.data.proposal;
            this.steps[0] = {
                id: "proposalDetailsStep",
                stepComponentType: ProposalDetailsComponent,
                tabId: "proposalDetailsTab",
                formId: "proposalForm",
                inputData: new Map().set("proposal", this.proposal),
                nextStep(form?: FormGroup): string {
                    return "productDetailsStep";
                },
            };

            // populate data for which products and their plans for existing plans
            // for resume, also make sure we need to trigger logic for going to the right step
            if (this.proposal) {
                this.proposalFacade.getProposalProductChoices(this.proposal.id);
                this.proposalPlanChoices = new Map<number, number[]>();
                this.subscriptions.push(
                    this.accountService
                        .getGroupAttributesByName([`proposal_${this.proposal.id}_last_completed_step`])
                        .pipe(
                            first(),
                            tap((groupAttributes) => (this.lastCompletedStep = groupAttributes.length ? groupAttributes[0] : undefined)),
                            switchMap((groupAttributes) => this.store.select(ProposalProductChoiceState.proposalProductChoices)),
                            filter((proposalProductChoices) => proposalProductChoices !== null),
                            take(1),
                            tap((proposalProductChoices) => {
                                this.proposalProductChoices = proposalProductChoices;
                                if (
                                    this.data &&
                                    this.data.resume &&
                                    this.steps[this.defaultStepPosition - 1].id !== this.lastCompletedStep.value &&
                                    this.proposalProductChoices &&
                                    this.proposalProductChoices.length > 0
                                ) {
                                    this.onClickNext();
                                }
                            }),
                            switchMap((proposalProductChoices) => {
                                if (this.proposalProductChoices.length) {
                                    return this.proposalService.getProposalPlanChoices(this.proposal.id);
                                }
                                if (this.data && this.data.resume) {
                                    this.resumeProposalLastStep();
                                }
                                return EMPTY;
                            }),
                        )
                        .subscribe((proposalPlanChoices) => {
                            if (proposalPlanChoices && proposalPlanChoices.productPlans && proposalPlanChoices.productPlans.length) {
                                proposalPlanChoices.productPlans.forEach((productPlan) => {
                                    this.proposalPlanChoices.set(productPlan.productId, productPlan.planIds);
                                });
                            }
                            if (this.data && this.data.resume) {
                                this.resumeProposalLastStep(true);
                            }
                        }),
                );
            }
            this.subscriptions.push(this.onStepperNextSubscription);
            this.subscriptions.push(this.previousStepSubscription);
            this.subscriptions.push(this.productsScreenLoaded);
        }

        this.doDisplayNext = true;
    }
    /**
     * check last complete step value and resume proposal
     * @param productsLoading indicated if products screen is loading
     */
    resumeProposalLastStep(productsLoading: boolean = false): void {
        if (this.steps[this.defaultStepPosition - 1].id !== this.lastCompletedStep.value) {
            this.resumeProposal(productsLoading);
        } else {
            this.showSpinnerOnResumeSubject$.next(false);
            this.isFinishResuming = true;
        }
    }

    /**
     * determine whether to continue to future steps from product step when resuming
     * @param productsLoading indicated if products screen is loading
     */
    resumeProposal(productsLoading: boolean = false): void {
        if (this.lastCompletedStep.value.includes("plan") || this.lastCompletedStep.value === this.steps[this.steps.length - 1].id) {
            this.onClickNext(productsLoading);
        } else {
            this.showSpinnerOnResumeSubject$.next(false);
            this.isFinishResuming = true;
        }
    }

    /**
     * save proposal details
     * @params value contains name, censusEstimate and coverageStartDate
     */
    constructProposal(value: Map<string, any>): void {
        const selectedDeductionFrequencyId = value["payrollFrequencyId"];
        if (this.proposal === undefined || this.proposal.id === undefined) {
            this.proposal = {
                name: value["name"],
                coverageStartDate: this.datePipe.transform(value["coverageStartDate"], AppSettings.DATE_FORMAT),
                eligibleEmployeeEstimate: value["censusEstimate"],
                payrollFrequencyId: selectedDeductionFrequencyId,
                status: ProposalStatus.IN_PROGRESS,
            };
        } else {
            this.proposal = {
                id: this.proposal.id,
                name: value["name"],
                coverageStartDate: this.datePipe.transform(value["coverageStartDate"], AppSettings.DATE_FORMAT),
                eligibleEmployeeEstimate: value["censusEstimate"],
                payrollFrequencyId: selectedDeductionFrequencyId,
                status: ProposalStatus.IN_PROGRESS,
            };
        }
        this.steps[0].inputData.set("proposal", this.proposal);
    }
    /**
     * save proposal product details and remove any VAS products/plans from proposalPlanChoices if there's VAS product is not selected
     * @param value map of proposal plan choices with product id
     */
    constructProposalProductDetails(value: Map<string, ProposalProductChoice[]>): void {
        this.proposalProductChoices = value["products"].filter((product) => product.individual || product.group);
        const selectedProducts = this.proposalProductChoices.map((productChoice) => ({
            id: productChoice.productId,
            individual: productChoice.individual,
            group: productChoice.group,
            valueAddedService: productChoice.valueAddedService,
        }));
        this.store.dispatch(new MapProductChoiceToPanelProduct(selectedProducts));
    }

    /**
     * Method to save proposal plan details
     * @param key : Name of the Form
     * @param value : Selected Plan Ids
     */
    constructProposalPlanDetails(key: string, value: Map<string, any>): void {
        const vasProducts = this.panelProductItems.filter((productData) => productData.product.valueAddedService);
        const vasPlans = vasProducts.map((vasProduct) => vasProduct.plans);
        if (!key.startsWith("proposalPlansFormVAS")) {
            const planIds = value["plans"].map((plan) => plan.planId);
            // eslint-disable-next-line radix
            const productId = parseInt(key.replace("proposalPlansForm", "").replace("i", "").replace("g", ""));
            if (this.proposalPlanChoices) {
                let sameProductOtherPlanIds: number[] = [];
                if (key.endsWith("i") || key.endsWith("g")) {
                    // find cachedPlans for the other plan (individual or group) form,
                    // make sure we retain that and replace the others with planIds
                    const sameProductOtherStep = this.steps.filter(
                        (step) => step.formId === key.substr(0, key.length - 1) + (key.endsWith("i") ? "g" : "i"),
                    )[0];
                    if (sameProductOtherStep && sameProductOtherStep.inputData.get("cachedPlans")) {
                        sameProductOtherPlanIds = sameProductOtherStep.inputData.get("cachedPlans");
                    }
                }
                this.proposalPlanChoices.set(productId, sameProductOtherPlanIds.length ? planIds.concat(sameProductOtherPlanIds) : planIds);
            } else {
                // eslint-disable-next-line radix
                this.proposalPlanChoices = new Map().set(productId, planIds);
            }
            if (this.steps[this.defaultStepPosition - 1] && this.steps[this.defaultStepPosition - 1].inputData) {
                this.steps[this.defaultStepPosition - 1].inputData.set("cachedPlans", planIds);
            }
            if (this.steps[this.defaultStepPosition] && this.steps[this.defaultStepPosition].inputData) {
                this.steps[this.defaultStepPosition].inputData.set(SELECTED_PLAN_CHOICES, this.proposalPlanChoices);
            }
            // for VAS plans logic to check for Aflac products
            if (this.steps[this.steps.length - 3].id.startsWith("planDetailsStepVAS")) {
                this.steps[this.steps.length - 3].inputData.set("cachedPlansForVAS", this.proposalPlanChoices);
                this.steps[this.steps.length - 2].inputData.set("cachedPlansForVAS", this.proposalPlanChoices);
            }
        } else if (key === "proposalPlansFormVASHQ") {
            const oldVasHQProductPlanSelected = this.vasHQProductPlanSelected;
            const hqFundedPlanList: Plan[] = [];
            vasPlans.forEach((vps) => {
                hqFundedPlanList.push(...vps.map((p) => p.plan).filter((plan) => plan.vasFunding === VasFunding.HQ));
            });

            if (oldVasHQProductPlanSelected) {
                this.proposalProductChoices = this.proposalProductChoices.filter(
                    (ppc) => ppc.productId !== oldVasHQProductPlanSelected.productId,
                );
                this.proposalPlanChoices.delete(oldVasHQProductPlanSelected.productId);
                this.steps[this.steps.length - 2].inputData.set("selectedHQFundedProductPlan", undefined);
                this.steps[this.steps.length - 2].inputData.get("cachedPlansForVAS").delete(oldVasHQProductPlanSelected.productId);
            } else if (hqFundedPlanList.length) {
                this.proposalProductChoices = this.proposalProductChoices.filter(
                    (ppc) => !hqFundedPlanList.map((plan) => plan.id).includes(ppc.productId),
                );
                hqFundedPlanList
                    .map((plan) => plan.productId)
                    .forEach((hqFundedProductId) => {
                        if (
                            this.proposalPlanChoices.get(hqFundedProductId) &&
                            hqFundedPlanList.map((plan) => plan.id).includes(this.proposalPlanChoices.get(hqFundedProductId)[0])
                        ) {
                            this.proposalPlanChoices.delete(hqFundedProductId);

                            if (this.steps[this.steps.length - 2].inputData.get("cachedPlansForVAS")) {
                                this.steps[this.steps.length - 2].inputData.get("cachedPlansForVAS").delete(hqFundedProductId);
                            }
                        }
                    });
                this.steps[this.steps.length - 2].inputData.set("selectedHQFundedProductPlan", undefined);
            }
            if (value["plans"]?.length) {
                this.vasHQProductPlanSelected = value["plans"][0];
                const plans = value["plans"].map((plan) => plan.planId);
                if (this.vasHQProductPlanSelected) {
                    this.proposalPlanChoices.set(this.vasHQProductPlanSelected.productId, plans);
                }
                if (this.steps[this.defaultStepPosition - 1]?.inputData) {
                    this.steps[this.defaultStepPosition - 1].inputData.set("cachedPlans", plans);
                }
            }
            if (this.vasHQProductPlanSelected) {
                this.stepperService.saveSelectedVasHQPlanId(this.vasHQProductPlanSelected.productId);
                this.steps[this.steps.length - 2].inputData.set("selectedHQFundedProductPlan", this.vasHQProductPlanSelected);
                this.proposalProductChoices.push({
                    productId: this.vasHQProductPlanSelected.productId,
                    individual: false,
                    group: true,
                    valueAddedService: true,
                });
            }
        } else {
            // saving proposal plans for VAS Emp Funded
            const cachedVasProductIds = value["plans"].map((plan) => plan.productId);
            const vasHqFundedProductID = this.stepperService.getSelectedVasHQPlanId();
            this.proposalProductChoices = this.proposalProductChoices.filter(
                (ppc) =>
                    this.steps.find((step) => step.id.startsWith("planDetailsStep" + ppc.productId)) !== undefined ||
                    vasHqFundedProductID === ppc.productId,
            );
            cachedVasProductIds.forEach((vasProductId) => {
                this.proposalProductChoices.push({
                    productId: vasProductId,
                    individual: false,
                    group: true,
                    valueAddedService: true,
                });
            });
            const productIdsToBeDeleted = [];
            const productChoiceIds = this.proposalProductChoices.map((ppc) => ppc.productId);
            this.proposalPlanChoices.forEach((v, k) => {
                if (!productChoiceIds.includes(k) && this.vasHQProductPlanSelected && this.vasHQProductPlanSelected.productId !== k) {
                    productIdsToBeDeleted.push(k);
                } else if (!productChoiceIds.includes(k) && !this.vasHQProductPlanSelected) {
                    productIdsToBeDeleted.push(k);
                }
            });
            productIdsToBeDeleted.forEach((productId) => {
                this.proposalPlanChoices.delete(productId);
            });
            value["plans"].forEach((plan) => {
                if (this.proposalPlanChoices) {
                    if (
                        this.proposalPlanChoices.get(plan.productId) &&
                        !this.proposalPlanChoices.get(plan.productId).includes(plan.planId)
                    ) {
                        this.proposalPlanChoices.set(plan.productId, this.proposalPlanChoices.get(plan.productId).concat(plan.planId));
                    }
                    this.proposalPlanChoices.set(
                        plan.productId,
                        this.proposalPlanChoices.get(plan.productId) ? this.proposalPlanChoices.get(plan.productId) : [plan.planId],
                    );
                } else {
                    this.proposalPlanChoices = new Map().set(plan.productId, [plan.planId]);
                }
                this.steps[this.steps.length - 2].inputData.set("cachedPlansForVAS", this.proposalPlanChoices);
            });
        }
        this.proposalService.saveProposalProductChoices(this.proposal.id, this.proposalProductChoices);
    }

    /**
     * @description based on product selected, create the appropriate plan steps and update the steps observable appropriately
     */
    // eslint-disable-next-line complexity
    buildPlanSteps(): Observable<boolean> {
        // get rid of old plan tabs and steps first
        this.tabs = this.tabs.filter((tab) => !tab.parentTab);
        this.steps = this.steps.filter((step) => !step.id.startsWith("planDetailsStep"));
        // rebuild new plan tabs and steps
        const tabs = [];
        const steps = [];
        if (this.proposalProductChoices.some((product) => product.valueAddedService)) {
            this.proposalProductChoices.push(
                this.proposalProductChoices.splice(
                    this.proposalProductChoices.findIndex((product) => product.valueAddedService),
                    1,
                )[0],
            );
        }
        this.proposalProductChoices.sort(
            (firstProduct, secondProduct) => +firstProduct.valueAddedService - +secondProduct.valueAddedService,
        );
        // sorting proposal product choices alphabetically.
        this.proposalProductChoices.sort((previousProduct, nextProduct) =>
            !(previousProduct.valueAddedService || nextProduct.valueAddedService)
                ? +this.panelProductItems?.findIndex((x) => x.product.id === previousProduct?.productId) -
                  +this.panelProductItems?.findIndex((x) => x.product.id === nextProduct?.productId)
                : undefined,
        );
        for (let i = 0; i < this.proposalProductChoices.length; i++) {
            const selectedProduct = this.panelProductItems.filter(
                (product) => product.product.id === this.proposalProductChoices[i].productId,
            )[0];
            let planTab = {};
            let nextStepName = "";
            let planStep: StepModel;
            if (selectedProduct.product.valueAddedService) {
                planTab = {
                    id: "planDetailsTabVAS",
                    title: "VAS",
                    parentTab: "planDetailsTab",
                };
                tabs.push(planTab);
                const planStepHQ = {
                    id: "planDetailsStepVASHQ",
                    stepComponentType: ProposalPlanDetailsComponent,
                    tabId: "planDetailsTabVAS",
                    formId: "proposalPlansFormVASHQ",
                    inputData: new Map()
                        .set("proposalId", this.proposal ? this.proposal.id : undefined)
                        .set("productId", AppSettings.HQ)
                        .set("cachedPlansForVAS", this.proposalPlanChoices),
                    nextStep(form?: FormGroup): string {
                        return "planDetailsStepVASEmpFunded";
                    },
                };
                const planStepEmpFunded = {
                    id: "planDetailsStepVASEmpFunded",
                    stepComponentType: ProposalPlanDetailsComponent,
                    tabId: "planDetailsTabVAS",
                    formId: "proposalPlansFormVASEmpFunded",
                    inputData: new Map()
                        .set("proposalId", this.proposal ? this.proposal.id : undefined)
                        .set("productId", AppSettings.VAS_EMP)
                        .set("cachedPlansForVAS", this.proposalPlanChoices)
                        .set("isLastPlanStep", true)
                        .set("proposalPlanChoices", this.proposalPlanChoices),
                    nextStep(form?: FormGroup): string {
                        return "reviewCompleteStep";
                    },
                };
                steps.push(planStepHQ);
                steps.push(planStepEmpFunded);
            } else if (this.proposalProductChoices[i].group && this.proposalProductChoices[i].individual) {
                const planTabIndividual = {
                    id: "planDetailsTab" + this.proposalProductChoices[i].productId + "i",
                    title: selectedProduct.product.name + " " + this.titleCasePipe.transform(PolicyOwnershipType.INDIVIDUAL),
                    parentTab: "planDetailsTab",
                };
                tabs.push(planTabIndividual);
                const planTabGroup = {
                    id: "planDetailsTab" + this.proposalProductChoices[i].productId + "g",
                    title: selectedProduct.product.name + " " + this.titleCasePipe.transform(PolicyOwnershipType.GROUP),
                    parentTab: "planDetailsTab",
                };
                tabs.push(planTabGroup);
                let selectedNextProductVAS: PanelModel;
                if (i !== this.proposalProductChoices.length - 1) {
                    selectedNextProductVAS = this.panelProductItems.filter(
                        (product) => product.product.id === this.proposalProductChoices[i + 1].productId,
                    )[0];
                }
                const nextStepNameForGroup =
                    i === this.proposalProductChoices.length - 1
                        ? "reviewCompleteStep"
                        : "planDetailsStep" +
                          (selectedNextProductVAS && selectedNextProductVAS.product.valueAddedService
                              ? "VASHQ"
                              : this.proposalProductChoices[i + 1].group && this.proposalProductChoices[i + 1].individual
                                  ? this.proposalProductChoices[i + 1].productId + "i"
                                  : this.proposalProductChoices[i + 1].productId);
                const nextStepNameForIndividual = "planDetailsStep" + this.proposalProductChoices[i].productId + "g";
                const planStepIndividual = {
                    id: "planDetailsStep" + this.proposalProductChoices[i].productId + "i",
                    stepComponentType: ProposalPlanDetailsComponent,
                    tabId: "planDetailsTab" + this.proposalProductChoices[i].productId + "i",
                    formId: "proposalPlansForm" + this.proposalProductChoices[i].productId + "i",
                    inputData: new Map()
                        .set("proposalId", this.proposal ? this.proposal.id : undefined)
                        .set("productId", this.proposalProductChoices[i].productId)
                        .set("individualOrGroup", "individual")
                        .set(SELECTED_PLAN_CHOICES, this.proposalPlanChoices)
                        .set(
                            "cachedPlans",
                            this.proposalPlanChoices ? this.proposalPlanChoices.get(this.proposalProductChoices[i].productId) : undefined,
                        ),
                    nextStep(form?: FormGroup): string {
                        return nextStepNameForIndividual;
                    },
                };
                steps.push(planStepIndividual);
                const planStepGroup = {
                    id: "planDetailsStep" + this.proposalProductChoices[i].productId + "g",
                    stepComponentType: ProposalPlanDetailsComponent,
                    tabId: "planDetailsTab" + this.proposalProductChoices[i].productId + "g",
                    formId: "proposalPlansForm" + this.proposalProductChoices[i].productId + "g",
                    inputData: new Map()
                        .set("proposalId", this.proposal ? this.proposal.id : undefined)
                        .set("productId", this.proposalProductChoices[i].productId)
                        .set("individualOrGroup", "group")
                        .set(SELECTED_PLAN_CHOICES, this.proposalPlanChoices)
                        .set(
                            "cachedPlans",
                            this.proposalPlanChoices ? this.proposalPlanChoices.get(this.proposalProductChoices[i].productId) : undefined,
                        )
                        .set("isLastPlanStep", i === this.proposalProductChoices.length - 1)
                        .set("proposalPlanChoices", this.proposalPlanChoices),
                    nextStep(form?: FormGroup): string {
                        return nextStepNameForGroup;
                    },
                };
                steps.push(planStepGroup);
            } else {
                planTab = {
                    id: "planDetailsTab" + this.proposalProductChoices[i].productId,
                    title: selectedProduct.product.name,
                    parentTab: "planDetailsTab",
                };
                tabs.push(planTab);
                let selectedNextProductVAS: PanelModel;
                if (i !== this.proposalProductChoices.length - 1) {
                    selectedNextProductVAS = this.panelProductItems.filter(
                        (product) => product.product.id === this.proposalProductChoices[i + 1].productId,
                    )[0];
                }
                nextStepName =
                    i === this.proposalProductChoices.length - 1
                        ? "reviewCompleteStep"
                        : "planDetailsStep" +
                          (selectedNextProductVAS && selectedNextProductVAS.product.valueAddedService
                              ? "VASHQ"
                              : this.proposalProductChoices[i + 1].group && this.proposalProductChoices[i + 1].individual
                                  ? this.proposalProductChoices[i + 1].productId + "i"
                                  : this.proposalProductChoices[i + 1].productId);
                planStep = {
                    id: "planDetailsStep" + this.proposalProductChoices[i].productId,
                    stepComponentType: ProposalPlanDetailsComponent,
                    tabId: "planDetailsTab" + this.proposalProductChoices[i].productId,
                    formId: "proposalPlansForm" + this.proposalProductChoices[i].productId,
                    inputData: new Map()
                        .set("proposalId", this.proposal ? this.proposal.id : undefined)
                        .set("productId", this.proposalProductChoices[i].productId)
                        .set(
                            "cachedPlans",
                            this.proposalPlanChoices ? this.proposalPlanChoices.get(this.proposalProductChoices[i].productId) : undefined,
                        )
                        .set("isLastPlanStep", i === this.proposalProductChoices.length - 1)
                        .set("proposalPlanChoices", this.proposalPlanChoices),
                    nextStep(form?: FormGroup): string {
                        return nextStepName;
                    },
                };
                steps.push(planStep);
            }
            if (i === 0 && !selectedProduct.product.valueAddedService) {
                const productId = this.proposalProductChoices[i].productId;
                const nextStepNameForVAS =
                    "planDetailsStep" +
                    (this.proposalProductChoices[0].group && this.proposalProductChoices[0].individual ? productId + "i" : productId);
                this.steps[1].nextStep = function (form?: FormGroup): string {
                    return nextStepNameForVAS;
                };
            } else if (selectedProduct.product.valueAddedService) {
                break;
            }
        }
        if (tabs.length && steps.length) {
            this.tabs.splice(3, 0, ...tabs);
            this.steps.splice(2, 0, ...steps);
        }

        this.steps[1].evaluateNextStep = false;
        this.steps[1].inputData.set("cachedProducts", this.proposalProductChoices);

        this.tabs$.next(this.tabs);
        this.steps$.next(this.steps);
        this.stepperService.next();
        return of(true);
    }

    // click previous logic
    onClickPrevious(): void {
        this.defaultStepPosition--;
        this.doDisplayPrevious = this.defaultStepPosition > 1;
        this.doDisplayNext = this.defaultStepPosition < this.steps.length;
        this.doDisplayComplete = this.defaultStepPosition === this.steps.length;
        this.stepperService.previous();
    }

    /**
     * call API to save proposal and related details
     * @params status represents incomplete or complete status of the proposal
     * @returns observable of http response
     */
    save(status: ProposalStatus): Observable<HttpResponse<unknown>> {
        if (this.proposal.id) {
            return this.updateExistingProposal(status);
        }
        let newProposalId;
        return this.proposalFacade
            .createProposal({
                name: this.proposal.name,
                coverageStartDate: this.proposal.coverageStartDate,
                eligibleEmployeeEstimate: this.proposal.eligibleEmployeeEstimate,
                payrollFrequencyId: this.proposal.payrollFrequencyId,
                status: ProposalStatus.IN_PROGRESS,
            })
            .pipe(
                take(1),
                tap((location) => {
                    newProposalId = parseInt(location.substr(location.lastIndexOf("/") + 1), 10);
                }),
                switchMap((location) =>
                    this.accountService.createGroupAttribute({
                        attribute: `proposal_${newProposalId}_last_completed_step`,
                        value: this.lastCompletedStep ? this.lastCompletedStep.value : this.COMPLETED_STEP,
                    }),
                ),
                filter((attributeLocation) => this.proposalProductChoices && this.proposalProductChoices.length > 0),
                switchMap((attributeLocation) =>
                    this.saveProposalProductPlanChoices(
                        newProposalId,
                        true,
                        status === ProposalStatus.COMPLETE ? ProposalStatus.COMPLETE : undefined,
                    ),
                ),
                switchMap((response) => {
                    this.proposalFacade.showSpinnerOnComplete(false);
                    return EMPTY;
                }),
            );
    }

    /**
     * Function to update the proposal if proposal id exist
     * @param status status of proposal
     * @returns Observable of HttpResponse
     */
    updateExistingProposal(status: ProposalStatus): Observable<HttpResponse<unknown>> {
        return this.accountService.updateGroupAttribute(this.lastCompletedStep.id, this.lastCompletedStep).pipe(
            switchMap(() =>
                this.saveProposalProductPlanChoices(
                    this.proposal.id,
                    false,
                    status === ProposalStatus.COMPLETE ? ProposalStatus.COMPLETE : undefined,
                ),
            ),
            switchMap((productPlanChoices) =>
                this.proposalFacade.updateProposal(this.proposal.id, {
                    name: this.proposal.name,
                    coverageStartDate: this.proposal.coverageStartDate,
                    eligibleEmployeeEstimate: this.proposal.eligibleEmployeeEstimate,
                    payrollFrequencyId: this.proposal.payrollFrequencyId,
                    status: status,
                }),
            ),
            switchMap((result) =>
                iif(
                    () => status === ProposalStatus.COMPLETE,
                    this.proposalFacade.downloadProposal(
                        this.proposal?.id,
                        this.group.situs.state.abbreviation,
                        "FULL",
                        this.group.situs.zip,
                    ),
                    of(result),
                ),
            ),
            take(1),
            switchMap((response) => {
                this.proposalFacade.showSpinnerOnComplete(false);
                return EMPTY;
            }),
        );
    }

    /**
     * save proposal product and plan + download if completed
     * @params proposalId represents id of proposal
     * @params isCreate represents a boolean value
     * @params status represents proposal status
     * @returns observable http response of blobpart
     */
    saveProposalProductPlanChoices(
        proposalId: number,
        isCreate: boolean,
        status?: ProposalStatus,
    ): Observable<HttpResponse<unknown>> | Observable<HttpResponse<BlobPart>> {
        this.proposalProductChoices = this.proposalProductChoices
            .reduce((accumulator, currentValue) => {
                const isUnique = accumulator.map((accumulatorItem) => accumulatorItem.productId).includes(currentValue.productId);
                return isUnique ? accumulator : [...accumulator, currentValue];
            }, [])
            .map(
                (ppc) =>
                    ({
                        individual: ppc.individual ? ppc.individual : false,
                        group: ppc.group ? ppc.group : false,
                        productId: ppc.productId,
                    } as ProposalProductChoice),
            );
        return this.proposalService.saveProposalProductChoices(proposalId, this.proposalProductChoices).pipe(
            take(1),
            switchMap((result) => {
                const proposalPlanChoicesObj: ProposalPlanChoices = {
                    productPlans: new Array<ProductPlans>(),
                };
                this.proposalPlanChoices.forEach((planIds, productId) => {
                    if (this.proposalProductChoices.some((productChoices) => productChoices.productId === productId) && planIds.length) {
                        proposalPlanChoicesObj.productPlans.push({ productId: productId, planIds: planIds });
                    }
                });
                return this.proposalService
                    .saveProposalPlanChoices(proposalId, proposalPlanChoicesObj)
                    .pipe(take(1))
                    .pipe(
                        switchMap((response) =>
                            iif(
                                () => isCreate && status === ProposalStatus.COMPLETE,
                                this.proposalFacade
                                    .updateProposal(proposalId, {
                                        name: this.proposal.name,
                                        coverageStartDate: this.proposal.coverageStartDate,
                                        eligibleEmployeeEstimate: this.proposal.eligibleEmployeeEstimate,
                                        payrollFrequencyId: this.proposal.payrollFrequencyId,
                                        status: ProposalStatus.COMPLETE,
                                    })
                                    .pipe(take(1)),
                                of(response),
                            ),
                        ),
                    );
            }),
            switchMap((result) =>
                iif(
                    () => status === ProposalStatus.COMPLETE && !this.proposal?.id,
                    this.proposalFacade
                        .downloadProposal(proposalId, this.group.situs.state.abbreviation, "FULL", this.group.situs.zip)
                        .pipe(take(1)),
                    of(result),
                ),
            ),
        );
    }

    /**
     *  save and close button logic
     */
    saveAndClose(): void {
        this.stepperService.save();
        this.closeModal(ModalDialogAction.SAVED, this.save(ProposalStatus.IN_PROGRESS));
    }
    /**
     * Next button logic to be executed
     * @param productsLoading indicated if products screen is loading
     */
    onClickNext(productsLoading: boolean = false): void {
        if (this.defaultStepPosition === 2) {
            this.steps[1].evaluateNextStep = true;
        }
        if (productsLoading) {
            this.isPendingProducts = true;
        } else {
            this.stepperService.next();
        }
    }

    /**
     *  complete button logic
     */
    completeProposal(): void {
        this.closeModal(ModalDialogAction.COMPLETED, this.save(ProposalStatus.COMPLETE));
    }

    // close modal when save or complete button is clicked
    closeModal(action: string, obs: Observable<HttpResponse<unknown>>): void {
        this.timeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        const result = {
            action: action,
            proposalObservable: obs,
        };
        if (action === ModalDialogAction.COMPLETED) {
            this.proposalFacade.showSpinnerOnComplete(true);
        }
        this.bottomSheetRef.dismiss(result);
        this.initialize = false;
    }

    /**
     * determining what tabs (in later steps) can be clicked
     */
    isTouchedAction($event: boolean): void {
        this.enabledTabIdsSubject$.next($event ? [""] : ["reviewCompleteTab"]);
    }

    /**
     * setting the step number if the stepper is not going to an adjacent tab
     * @param $event the step number
     */
    determineStepPosition($event: number): void {
        this.defaultStepPosition = $event;
        this.determineButtonsState();
    }

    /**
     * saving what the last saved step is
     * @param $event the step id
     */
    saveLastCompletedStep($event: string): void {
        if (this.lastCompletedStep) {
            this.lastCompletedStep.value = $event;
        } else {
            this.lastCompletedStep = { value: $event };
        }
    }

    /**
     * determining whether previous and next/complete buttons should show
     */
    private determineButtonsState(): void {
        this.doDisplayPrevious = this.defaultStepPosition > 1;
        this.doDisplayNext = this.defaultStepPosition < this.steps.length;
        this.doDisplayComplete = this.defaultStepPosition === this.steps.length;
    }

    /**
     * increment step if applicable
     */
    private incrementStep(): void {
        if (this.defaultStepPosition < this.steps.length) {
            this.defaultStepPosition++;
        }
    }

    /**
     * Life cycle hook to unsubscribe the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
