import { takeUntil, tap, switchMap, filter, catchError } from "rxjs/operators";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { Subject, forkJoin, combineLatest, Observable, of } from "rxjs";

import {
    EnrollmentState,
    UpdateSkippedStepResponses,
    UpdateCartData,
    SharedState,
    AppFlowService,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";

import { Store } from "@ngxs/store";
import {
    CoreService,
    AccountProfileService,
    MemberService,
    RiderCartItem,
    ShoppingService,
    ShoppingCartDisplayService,
    AflacService,
    AccountService,
    DualPeoRiskClassIds,
} from "@empowered/api";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";

import {
    ConfigName,
    IndustryCodes,
    PortalType,
    RiskClasses,
    BasePlanApplicationPanel,
    StepData,
    RiskClass,
    ProductId,
    GroupAttribute,
    RatingCode,
    AddCartItem,
    Step,
    GetCartItems,
    ApplicationResponse,
    PlanOfferingPricing,
    MemberProfile,
    MoreSettings,
    StepType,
} from "@empowered/constants";

interface PriceRiskClassMapping {
    riskClassId: number;
    planOfferingId: number;
    pricingData?: PlanOfferingPricing[];
}

const QUESTION = "question";
const REQUIRED = "required";
const INDUSTRY_CODE = "IndustryCode";
interface Job {
    title: string;
    duties: string;
}

@Component({
    selector: "empowered-occupation-class",
    templateUrl: "./occupation-class.component.html",
    styleUrls: ["./occupation-class.component.scss"],
})
export class OccupationClassComponent implements OnInit, OnDestroy {
    @Input() planObject: StepData;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    mpGroup: number;
    memberId: number;
    hasAflacAlways = false;
    hasEBSBilling = false;
    fromDirect = false;
    loadSpinner = false;
    hasApiError = false;
    errorMessage: string;
    hasError = false;
    showComponent = false;
    stepData: Step;
    riskClassForm: FormGroup;
    riskClasses: RiskClass[] = [];
    memberProfile: MemberProfile;
    occupationDescription: string;
    priceObservables: Observable<PlanOfferingPricing[]>[] = [];
    moreSettings: MoreSettings;
    cartData: GetCartItems;
    priceRiskClassMapping: PriceRiskClassMapping[] = [];
    enrollmentState: string;
    cartItemsToUpdate: AddCartItem[] = [];
    private readonly unsubscribe$ = new Subject<void>();
    defaultRiskClass: RiskClass;
    jobDuties = "--";
    displayJobTitleDuties = false;
    jobs: Job[] = [];
    jobTitleDutiesEnabled: boolean;
    jobsStringArray: string[] = [];
    updatedMemberProfile: MemberProfile;
    updatedOccupationClass = false;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.planOption.next",
        "primary.portal.applicationFlow.planOption.nextAflacAlways",
        "primary.portal.applicationFlow.planOption.nextBilling",
        "primary.portal.applicationFlow.planOption.nextApplications",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.policyChangeRequest.transactions..changeOccupation.jobTitle",
        "primary.portal.policyChangeRequest.transactions..changeOccupation.jobDuties",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.question.selectionRequired",
    ]);
    formError = false;

    constructor(
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly appFlowService: AppFlowService,
        private readonly fb: FormBuilder,
        private readonly accountProfileService: AccountProfileService,
        private readonly memberService: MemberService,
        private readonly shoppingService: ShoppingService,
        private readonly shoppingCartDisplayService: ShoppingCartDisplayService,
        private readonly coreService: CoreService,
        private readonly utilService: UtilService,
        private readonly aflacService: AflacService,
        private readonly accountService: AccountService,
        private readonly staticService: StaticUtilService,
    ) {}
    /**
     * Function to execute logic on initialisation
     */
    ngOnInit(): void {
        if (this.store.selectSnapshot(SharedState.portal) === PortalType.MEMBER) {
            this.appFlowService.demographicsStepSkipped$.next({
                planObject: this.planObject,
                currentStep: this.planObject.currentStep,
                sectionId: this.planObject.currentSection.sectionId,
            });
        } else {
            this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
            this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
            this.getStepData();
            this.checkAflacAlways();
            this.serviceCalls();
            this.subscribeToCartData();
        }
    }

    /**
     * Method to get updated cartData whenever the store value changes
     */
    subscribeToCartData(): void {
        this.store
            .select((store) => store.enrollment.cartItems)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((cartItems) => cartItems && cartItems.length > 0),
            )
            .subscribe((cartItems: GetCartItems[]) => {
                this.cartData = this.utilService
                    .copy(cartItems)
                    .filter((cartItem) => cartItem.id === this.planObject.application.cartData.id)
                    .pop();
            });
    }
    /**
     * Gets step data
     */
    getStepData(): void {
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.cartData = this.utilService.copy(this.planObject.application.cartData);
        this.isNotProduction$ = this.appFlowService.isNotProduction();
        this.stepData = this.planObject.steps[0];
    }
    /**
     * Creates form data
     */
    createFormData(): void {
        this.riskClassForm = this.fb.group({
            question: [this.planObject.application.cartData.riskClassOverrideId, Validators.required],
        });
        if (this.planObject.application.isAdditionalUnit) {
            this.riskClassForm.controls.question.disable();
        }
        this.hideNextSectionsOnChangeOfForm();
        this.showComponent = true;
        if (this.riskClasses.length === 1) {
            this.riskClassForm.get(QUESTION).patchValue(this.riskClasses[0].id);
        }
        if (!this.planObject.application.cartData.riskClassOverrideId && this.defaultRiskClass) {
            this.riskClassForm.controls.question.patchValue(this.defaultRiskClass.id);
        } else if (!this.planObject.application.cartData.riskClassOverrideId && this.stepData.ratingCode === RatingCode.DUAL) {
            const riskClassOverrideId = this.appFlowService.getDualAccountRiskClassId(this.planObject.application.productId);
            this.riskClassForm.controls.question.patchValue(riskClassOverrideId);
        }
    }
    /**
     * Hides next section on form data changes.
     */
    hideNextSectionsOnChangeOfForm(): void {
        this.riskClassForm.valueChanges
            .pipe(
                takeUntil(this.unsubscribe$),
                filter(
                    () =>
                        this.riskClassForm.dirty &&
                        !this.planObject.rider &&
                        (this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                            this.planObject.currentStep !== this.currentStepIndex),
                ),
            )
            .subscribe(() => {
                if (this.planObject.reinstate) {
                    this.appFlowService.updateReinstateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                    });
                } else {
                    this.appFlowService.updateActiveStepDetails$.next({
                        currentSectionIndex: this.planObject.currentSection.sectionId,
                        currentStepIndex: this.planObject.currentStep,
                        planObject: this.planObject,
                    });
                }
            });
    }

    /**
     * Makes service calls to get risk classes and occupation description
     */
    serviceCalls(): void {
        this.loadSpinner = true;
        combineLatest([
            this.getRiskClassObservable(),
            this.getDualRiskClasses(),
            this.memberService.getMember(this.memberId, true, this.mpGroup.toString()),
            this.planObject.application.cartData.riskClassOverrideId ? of(null) : this.getDefaultRiskClass(),
            this.staticService.cacheConfigEnabled(ConfigName.ENFORCE_JOB_DUTIES_FOR_A_RATE_CODE),
            this.staticService.cacheConfigValue("group.member.A_rated_job_duties"),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                tap(
                    ([riskClasses, dualRiskClass, memberProfile, defaultRiskClasses, configEnabled, jobsDB]: [
                        RiskClass[],
                        DualPeoRiskClassIds,
                        HttpResponse<MemberProfile>,
                        RiskClass[] | DualPeoRiskClassIds | GroupAttribute[] | null,
                        boolean,
                        string,
                    ]) => {
                        this.loadRiskClasses(riskClasses, dualRiskClass);
                        this.memberProfile = memberProfile.body;
                        if (!this.planObject.application.cartData.riskClassOverrideId && defaultRiskClasses) {
                            this.loadDefaultRiskClass(defaultRiskClasses);
                        }
                        this.occupationDescription = this.memberProfile.workInformation.occupationDescription;
                        this.createFormData();
                        this.jobTitleDutiesEnabled = configEnabled;
                        this.jobsStringArray = jobsDB.split(/,(?=\w)/);
                        this.jobsStringArray.forEach((jobDutiesString) => {
                            const jobDuty = jobDutiesString.split("=");
                            this.jobs.push({ title: jobDuty[0], duties: jobDuty[1] });
                        });
                        this.updatedMemberProfile = memberProfile.body;
                    },
                    (error) => {
                        this.handleApiError(error);
                    },
                ),
                switchMap((resp) => {
                    this.getPricingObservables();
                    return forkJoin(this.priceObservables);
                }),
            )
            .subscribe(
                (res) => {
                    this.loadSpinner = false;
                    res.forEach((priceArray, i) => {
                        this.priceRiskClassMapping[i].pricingData = priceArray;
                    });
                    if (this.riskClassForm.controls.question.value) {
                        this.onRiskClassChange();
                    }
                },
                (error) => {
                    this.handleApiError(error);
                },
            );
    }
    /**
     * loads default Risk class based on ratingCode and api responses
     * @param riskClassData default risk class data based on rating code
     */
    loadDefaultRiskClass(riskClassData: RiskClass[] | DualPeoRiskClassIds | GroupAttribute[]): void {
        switch (this.stepData.ratingCode) {
            case RatingCode.STANDARD:
                this.defaultRiskClass = this.riskClasses.find(
                    (jobClass) => (riskClassData as GroupAttribute[]).length && jobClass.name === riskClassData[0].value,
                );
                break;
            case RatingCode.PEO:
                this.defaultRiskClass = this.riskClasses.find(
                    (jobClass) => (riskClassData as RiskClass[]).length && jobClass.name === riskClassData[0].name,
                );
                break;
            case RatingCode.DUAL:
                this.defaultRiskClass = this.riskClasses.find(
                    (riskClass) => riskClass.id === +riskClassData[this.planObject.application.productId],
                );
                break;
        }
    }
    /**
     * gets the observable to be used for getting the default risk class based on api responses
     * @returns observable based on rating code
     */
    getDefaultRiskClass(): Observable<GroupAttribute[]> | Observable<RiskClass[]> | Observable<DualPeoRiskClassIds> {
        switch (this.stepData.ratingCode) {
            case RatingCode.STANDARD:
                return this.accountService.getGroupAttributesByName([INDUSTRY_CODE], this.mpGroup);
            case RatingCode.PEO:
                return this.memberService.getMemberCarrierRiskClasses(this.memberId, null, this.mpGroup.toString());
            case RatingCode.DUAL:
                return this.aflacService.getDualPeoSelection(this.mpGroup.toString());
            default:
                return of(null);
        }
    }
    /**
     * Loads Risk classes based on account rating code type and product type
     * @param riskClasses list of all risk classes
     * @param dualPeo data of Dual risk classes
     * @returns nothing
     */
    loadRiskClasses(riskClasses: RiskClass[], dualPeo: DualPeoRiskClassIds): void {
        if (this.stepData.ratingCode === RatingCode.STANDARD || this.stepData.ratingCode === RatingCode.PEO) {
            this.riskClasses = riskClasses;
        } else if (this.stepData.ratingCode === RatingCode.DUAL) {
            if (this.planObject.application.productId === ProductId.ACCIDENT) {
                this.riskClasses = riskClasses.filter((riskClass) => dualPeo[ProductId.ACCIDENT].some((rClass) => rClass === riskClass.id));
            } else if (this.planObject.application.productId === ProductId.SHORT_TERM_DISABILITY) {
                this.riskClasses = riskClasses.filter((riskClass) =>
                    dualPeo[ProductId.SHORT_TERM_DISABILITY].some((rClass) => rClass === riskClass.id),
                );
            }
        }
    }
    /**
     * Checks the account rating code and returns respective Observable
     * @returns Observable<RiskClass[]> observable to get risk classes
     */
    getRiskClassObservable(): Observable<RiskClass[]> {
        let riskClassObservable: Observable<RiskClass[]>;
        if (this.stepData.ratingCode === RatingCode.STANDARD) {
            riskClassObservable = this.accountProfileService.getAccountCarrierRiskClasses(
                this.planObject.application.carrierId,
                this.mpGroup,
            );
        } else if (this.stepData.ratingCode === RatingCode.PEO) {
            riskClassObservable = this.memberService.getMemberCarrierRiskClasses(
                this.memberId,
                this.planObject.application.carrierId,
                this.mpGroup.toString(),
            );
        } else if (this.stepData.ratingCode === RatingCode.DUAL) {
            riskClassObservable = this.coreService.getCarrierRiskClasses(this.planObject.application.carrierId.toString());
        }
        return riskClassObservable;
    }
    /**
     * Gets dual peo risk class observable if account is "DUAL" or return dummy Observable
     * @returns dual peo risk class observable if account is "DUAL" or return dummy Observable
     */
    getDualRiskClasses(): Observable<DualPeoRiskClassIds> {
        if (this.stepData.ratingCode === RatingCode.DUAL) {
            return this.aflacService.getDualPeoSelection(this.mpGroup.toString(), this.planObject.application.carrierId);
        }

        return of({
            [ProductId.ACCIDENT]: [],
            [ProductId.SHORT_TERM_DISABILITY]: [],
        });
    }
    /**
     * Function to get tobacco status based on rider/ plan
     * @param application application of plan
     * @param isRider indicates riders or not
     * @param riderPlanId planId of rider in case of rider
     * @returns boolean indicating Tobacco response for respective rider/ Plan
     */
    getTobaccoResponse(application: BasePlanApplicationPanel, isRider: boolean, riderPlanId: number): boolean {
        let applicationData: BasePlanApplicationPanel = application;
        if (isRider && riderPlanId) {
            applicationData = application.riders.filter((app) => app.appData.planId === riderPlanId).pop();
        }

        const planObject: StepData = {
            application: applicationData,
            basePlanId: application.planId,
            isRider: isRider,
        };
        return this.appFlowService.getTobaccoResponse(planObject);
    }
    /**
     * Called to load all pricing observables related to plan and riders
     */
    getPricingObservables(): void {
        const isTobaccoUser: boolean = this.appFlowService.getTobaccoStatus();
        this.moreSettings = this.appFlowService.getTobaccoSettings(isTobaccoUser, this.cartData.coverageEffectiveDate, this.cartData);
        this.riskClasses.forEach((riskClass) => {
            this.priceRiskClassMapping.push({
                riskClassId: riskClass.id,
                planOfferingId: this.cartData.planOffering.id,
            });
            this.enrollmentState = this.cartData.enrollmentState;
            this.moreSettings.tobaccoUser = this.getTobaccoResponse(this.planObject.application, false, null);
            this.priceObservables.push(
                this.getPlanOfferingPricing(this.moreSettings, this.cartData.planOffering.id.toString(), this.cartData, riskClass.id),
            );
            if (this.cartData.riders && this.cartData.riders.length) {
                this.cartData.riders.forEach((rider) => {
                    this.priceRiskClassMapping.push({
                        riskClassId: riskClass.id,
                        planOfferingId: rider.planOfferingId,
                    });
                    this.moreSettings.tobaccoUser = this.getTobaccoResponse(this.planObject.application, true, rider.planId);
                    this.priceObservables.push(
                        this.getPlanOfferingPricing(
                            this.moreSettings,
                            rider.planOfferingId.toString(),
                            this.cartData,
                            riskClass.id,
                            rider,
                            this.planObject.application,
                        ),
                    );
                });
            }
        });
    }
    /**
     * Called to get Observable of getPlanOfferingPricing
     * @param tobaccoSettings pricing settings to be passed to api
     * @param planOfferingId plan offering id of current plan
     * @param cartData cartData of plan
     * @param riskClassOverrideId risk class id for which prices are needed
     * @param riderCartItem rider cart item
     * @param application application of base application
     * @returns Observable<PlanOfferingPricing[]>
     */
    getPlanOfferingPricing(
        tobaccoSettings: MoreSettings,
        planOfferingId: string,
        cartData: GetCartItems,
        riskClassOverrideId: number,
        riderCartItem?: RiderCartItem,
        application?: BasePlanApplicationPanel,
    ): Observable<PlanOfferingPricing[]> {
        let basePlanId: number;
        if (riderCartItem && riderCartItem.baseRiderId) {
            basePlanId = riderCartItem.baseRiderId;
        } else if (application) {
            basePlanId = application.planId;
        }

        return this.shoppingService.getPlanOfferingPricing(
            planOfferingId,
            this.enrollmentState,
            tobaccoSettings,
            this.memberId,
            this.mpGroup,
            riderCartItem ? basePlanId : null,
            riderCartItem ? application.cartData.coverageLevelId : null,
            null,
            null,
            cartData.coverageEffectiveDate,
            riskClassOverrideId,
            true,
            application ? application.cartData.id : cartData.id,
        );
    }
    /**
     * Method to check next step
     */
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSBilling = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    /**
     * Called on change of risk class in UI
     * Loads the updated cost and cart items
     */
    onRiskClassChange(): void {
        this.cartItemsToUpdate = [];
        this.loadSpinner = true;
        const riskClassSelected: number = this.riskClassForm.controls.question.value;
        this.displayJobTitleDuties =
            riskClassSelected === RiskClasses.RISK_CLASS_A &&
            this.planObject.application.cartData.riskClassOverrideId !== RiskClasses.RISK_CLASS_A;
        if (riskClassSelected !== RiskClasses.RISK_CLASS_A) {
            this.updatedOccupationClass = false;
        }
        const priceData = this.priceRiskClassMapping.filter((priceArray) => priceArray.riskClassId === riskClassSelected);
        const cartItems: GetCartItems[] = [];
        cartItems.push(this.cartData);
        this.cartItemsToUpdate = this.appFlowService.getUpdatedCartItems(
            priceData.map((priceArray) => priceArray.planOfferingId),
            priceData.map((priceArray) => priceArray.pricingData),
            cartItems,
            this.cartData.coverageEffectiveDate,
        );
        this.cartItemsToUpdate.forEach((cartItem) => {
            cartItem.riskClassOverrideId = riskClassSelected;
        });
        this.calculateCost();
        this.loadSpinner = false;
    }

    /**
     * Display job duties for selected job title
     * @param jobTitle title to check against list of jobs
     */
    onJobTitleChange(jobTitle: string): void {
        this.jobs.forEach((job) => {
            if (job.title === jobTitle) {
                this.jobDuties = job.duties;
                this.updatedOccupationClass = true;
                this.updatedMemberProfile.workInformation.industryCode = IndustryCodes.INDUSTRY_CODE_A;
                this.updatedMemberProfile.workInformation.occupation = job.title;
                this.updatedMemberProfile.workInformation.occupationDescription = job.duties;
            }
        });
    }

    /**
     * Updates cost from CartItems
     */
    calculateCost(): void {
        let totalCost = 0;
        this.cartItemsToUpdate.forEach((cartData) => {
            totalCost += cartData.memberCost;
            if (cartData.riders && cartData.riders.length) {
                cartData.riders.forEach((riderData) => {
                    totalCost += riderData.memberCost;
                });
            }
        });
        this.appFlowService.updateCost$.next(totalCost);
    }
    /**
     * Called on form Submit/ Next click
     */
    onNext(): void {
        this.hasApiError = false;
        this.formError = this.riskClassForm.controls[QUESTION].hasError(REQUIRED);
        if (!this.formError) {
            if (
                this.cartItemsToUpdate.length &&
                (this.cartData.riskClassOverrideId !== this.riskClassForm.controls.question.value ||
                    this.cartData.totalCost !== this.cartItemsToUpdate[0].totalCost)
            ) {
                this.cartData.riskClassOverrideId = this.riskClassForm.controls.question.value;
                this.loadSpinner = true;
                this.shoppingService
                    .updateCartItem(this.memberId, this.mpGroup, this.cartData.id, this.cartItemsToUpdate[0])
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        catchError((error: HttpErrorResponse) => {
                            this.handleApiError(error);
                            return of(null);
                        }),
                        switchMap((res) => {
                            this.store.dispatch([new UpdateCartData(this.cartData.id, this.cartData.planOffering.id)]);
                            return this.saveStepResponse();
                        }),
                    )
                    .subscribe();
                if (this.updatedOccupationClass) {
                    this.memberService
                        .updateMember(this.updatedMemberProfile, this.mpGroup.toString(), this.memberId.toString())
                        .pipe(
                            takeUntil(this.unsubscribe$),
                            catchError((error: HttpErrorResponse) => {
                                this.handleApiError(error);
                                return of(null);
                            }),
                        )
                        .subscribe();
                }
            } else {
                this.saveStepResponse()
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        catchError((error: HttpErrorResponse) => {
                            this.handleApiError(error);
                            return of(null);
                        }),
                    )
                    .subscribe();
            }
        }
    }
    /**
     * Handles Http error and displays error message.
     * @param error type of Http error occurred
     */
    handleApiError(error: HttpErrorResponse): void {
        this.hasApiError = true;
        this.loadSpinner = false;
        if (error && error.error) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
        }
    }
    /**
     * Called to save application responses
     * @returns Observable<ApplicationResponse> observable for saving application responses
     */
    saveStepResponse(): Observable<ApplicationResponse> {
        this.loadSpinner = true;
        const responses: ApplicationResponse[] = [];
        const stepResponse: ApplicationResponse = { stepId: this.stepData.id, value: [], type: StepType.GENERICSTEP };
        responses.push(stepResponse);
        this.store.dispatch(new UpdateSkippedStepResponses({ responses: stepResponse, planId: this.planObject.application.planId }));
        return this.shoppingCartDisplayService.saveApplicationResponse(this.memberId, this.cartData.id, this.mpGroup, responses).pipe(
            tap((res) => {
                this.loadSpinner = false;
                this.goToNextSection();
            }),
        );
    }
    /**
     * Called to go to next section
     */
    goToNextSection(): void {
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    /**
     * To unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
