import { takeUntil, filter, map, tap, switchMap } from "rxjs/operators";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { ShoppingCartDisplayService, ShoppingService, CoreService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";

import {
    EnrollmentState,
    UpdateApplicationResponse,
    UpdateCartData,
    AccountInfoState,
    DualPlanYearState,
    AppFlowService,
    UtilService,
} from "@empowered/ngxs-store";

import { FormBuilder, FormControl, Validators, FormGroup } from "@angular/forms";

import { forkJoin, Subject, Observable } from "rxjs";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { HttpErrorResponse } from "@angular/common/http";
import {
    ClientErrorResponseCode,
    CarrierId,
    ResponseItem,
    MemberData,
    TobaccoStatusObject,
    AppSettings,
    DualPlanYearSettings,
    EnrollmentMethod,
    RatingCode,
    RiderCart,
    AddCartItem,
    CoverageLevel,
    Section,
    GetCartItems,
    ApplicationResponse,
    PlanOfferingPricing,
    TobaccoStatus,
    MemberDependent,
    MoreSettings,
    MemberQualifyingEvent,
    StepType,
    Relation,
    StepTitle,
} from "@empowered/constants";
import { DateService } from "@empowered/date";

const CREDENTIAL_MEMBER_ID = "memberId";
const YES_VALUE = "yes";
const NO_VALUE = "no";

@Component({
    selector: "empowered-tobacco",
    templateUrl: "./tobacco.component.html",
    styleUrls: ["./tobacco.component.scss"],
})
export class TobaccoComponent implements OnInit, OnDestroy {
    @Input() planObject;
    @Input() currentSectionIndex: number;
    @Input() currentStepIndex: number;
    planFlowId: number;
    planFlowStepId: number;
    isNotProduction$: Observable<boolean>;
    planId: number;
    applications = [];
    tobaccoForm: FormGroup;
    itemId: number;
    question: FormControl;
    resultValue = [" "];
    steps = [];
    tobaccoQuestion: string;
    tobaccoResponse: string;
    nonTobaccoResponse: string;
    showError = false;
    response: ApplicationResponse;
    currentStep = 0;
    stepsData = [];
    hasError = false;
    errorMessage: string;
    tobaccoDirection: string;
    previousResponse = [];
    previousResponseValue: any;
    appResponses: any;
    stepData: any;
    mpGroup;
    memberId;
    hasAflacAlways = false;
    fromDirect = false;
    hasEBSPayment = false;
    cartData: GetCartItems;
    riderCartData: RiderCart;
    showComponent = false;
    loadSpinner: boolean;
    tobaccoCostValues: PlanOfferingPricing[];
    nonTobaccoCostValues: PlanOfferingPricing[];
    benefitAmount: number;
    coverageLevelId: number;
    tobaccoSettings: MoreSettings;
    costData;
    memberData;
    isTobaccoUser: boolean;
    appSettings = AppSettings;
    initialResponse: string;
    finalResponse: string;
    spouseData: MemberDependent;
    tpiAssistingAdminId: number;
    private readonly unsubscribe$ = new Subject<void>();
    currentQleId: number;
    @Select(EnrollmentState.GetCurrentQLE) currentQLE$: Observable<MemberQualifyingEvent>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.applicationFlow.planOption.next",
        "primary.portal.applicationFlow.planOption.nextAflacAlways",
        "primary.portal.applicationFlow.planOption.nextBilling",
        "primary.portal.applicationFlow.planOption.nextApplications",
        "primary.portal.applicationFlow.debug.planFlow",
        "primary.portal.applicationFlow.debug.planFlowStep",
        "primary.portal.applicationFlow.planOption.spouseAgeMinimum",
    ]);
    languageSecondStringsArray: Record<string, string> = this.language.fetchSecondaryLanguageValues([
        "secondary.portal.applicationFlow.question.selectionRequired",
    ]);
    isMemberLoggedIn = false;
    isSpouseTobaccoUser: boolean;
    isSpouseTobaccoQuestion: boolean;
    familyBasedTobaccoStatusPricing: boolean;
    spouseCovered: boolean;
    isSpouseTobaccoStatusUndefined: boolean;

    constructor(
        private readonly store: Store,
        private readonly fb: FormBuilder,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly appFlowService: AppFlowService,
        private readonly utilService: UtilService,
        private readonly shoppingService: ShoppingService,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly coreService: CoreService,
        private readonly dateService: DateService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * This method is used to fetch memberId, mpGroup from store
     * This method is used to fetch @var tpiAssistingAdminId, @var isNotProduction$ from app-flow service
     * used to call @method getTobaccoSettings()
     * used to call @method serviceCalls()
     * used to call @method subscribeToCartData()
     * used to call @method checkLoggedInUser()
     */
    ngOnInit(): void {
        this.loadSpinner = true;
        this.mpGroup = this.store.selectSnapshot(EnrollmentState.GetMPGroup);
        this.memberId = this.store.selectSnapshot(EnrollmentState.GetMemberId);
        const dualPlanYearData = this.store.selectSnapshot(DualPlanYearState);
        const isOeShop = dualPlanYearData.isDualPlanYear && dualPlanYearData.selectedShop === DualPlanYearSettings.OE_SHOP;
        if (!isOeShop || (isOeShop && dualPlanYearData.isQleAfterOeEnrollment)) {
            this.currentQLE$.pipe(takeUntil(this.unsubscribe$)).subscribe((qle) => (this.currentQleId = qle ? qle.id : null));
        }
        this.tpiAssistingAdminId = this.appFlowService.getTpiAssistingAdminId();
        this.planId = this.planObject.application.appData.planId;
        this.cartData = this.planObject.application.cartData;
        this.riderCartData = this.getRiderCartDataFromCart();
        this.getCartValues();
        this.spouseData = this.getSpouseData();
        this.isSpouseTobaccoStatusUndefined =
            this.spouseData && this.spouseData.profile && this.spouseData.profile.tobaccoStatus === TobaccoStatus.UNDEFINED;

        this.memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        this.isSpouseTobaccoQuestion = this.planObject.steps[0].title === StepTitle.SPOUSE_TOBACCO;
        this.tobaccoSettings = this.getTobaccoSettings(
            this.planObject.application.cartData.coverageEffectiveDate,
            this.memberData,
            this.spouseData,
        );
        this.serviceCalls();
        this.planFlowId = this.planObject.application.appData.id;
        this.planFlowStepId = this.planObject.steps[0].id;
        this.isNotProduction$ = this.appFlowService.isNotProduction();
        this.subscribeToCartData();
        this.checkLoggedInUser();
    }
    /**
     * This method is used to check whether the logged in user is member or not
     * This method will fetch credential and will set @var isMemberLoggedIn to true if memberId exists
     */
    checkLoggedInUser(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential) => {
            if (CREDENTIAL_MEMBER_ID in credential) {
                this.isMemberLoggedIn = true;
            }
        });
    }
    /**
     * gets more settings required for pricing api based on member data
     *
     * @param coverageDate coverage effective date of product
     * @param memberData member's profile and address info
     * @param spouseData spouse's profile
     * @returns more settings required for pricing api
     */
    getTobaccoSettings(coverageDate: string, memberData: MemberData, spouseData: MemberDependent): MoreSettings {
        let age, addressInfo;
        const payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        const salary = this.appFlowService.getMemberSalary(coverageDate);

        if (memberData && memberData.info) {
            age = this.getAge(memberData.info.birthDate, coverageDate);
            this.appFlowService
                .getLatestTobaccoStatus()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((latestTobaccoStatus) => {
                    this.isTobaccoUser =
                        latestTobaccoStatus && latestTobaccoStatus.employeeTobaccoUpdated
                            ? latestTobaccoStatus.tobaccoUser
                            : memberData.info.profile &&
                              memberData.info.profile.tobaccoStatus &&
                              memberData.info.profile.tobaccoStatus === TobaccoStatus.TOBACCO;
                });
        }

        if (memberData.contactInfo && memberData.contactInfo.length) {
            addressInfo = memberData.contactInfo.find((contact) => !!contact.address);
        }

        const settings = {
            age,
            gender: memberData.info.gender,
            tobaccoUser: true,
            state: addressInfo?.state,
            payrollFrequencyId: payFrequency.id.toString(),
            spouseAge: spouseData && this.getAge(spouseData.birthDate).toString(),
            spouseGender: spouseData && spouseData.gender,
            annualSalary: salary,
        };

        if (this.isSpouseTobaccoQuestion) {
            // if this is the 'spouse tobacco use' question, set 'spouseTobaccoUser' to true
            // and set 'tobaccoUser' according to the user's response to the tobacco question
            return {
                ...settings,
                tobaccoUser: this.appFlowService.getTobaccoStatus(),
                spouseTobaccoUser: true,
            };
        }

        return settings;
    }

    /**
     * Method to update cartData on change of data in store
     */
    subscribeToCartData(): void {
        this.store
            .select((store) => store.enrollment.cartItems)
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((cartItems) => cartItems && cartItems.length > 0),
                map((cartItems) => cartItems.filter((cartItem) => cartItem.id === this.planObject.application.cartData.id).pop()),
                filter((cartData) => cartData),
            )
            .subscribe((cartData: GetCartItems) => {
                const changeInRiskClass: boolean = cartData.riskClassOverrideId !== this.cartData.riskClassOverrideId;
                if (changeInRiskClass) {
                    this.serviceCalls();
                }
                this.cartData = this.utilService.copy(cartData);
                this.riderCartData = this.getRiderCartDataFromCart();
                this.getCartValues();
            });
    }

    /**
     * Get member's spouse's data if it exists
     * @returns spouse's profile
     */
    getSpouseData(): MemberDependent {
        const dependentsData = this.store.selectSnapshot(EnrollmentState.GetMemberDependents);
        const memberRelations = this.store.selectSnapshot(EnrollmentState.GetMemberDependentsRelation);

        if (dependentsData && dependentsData.length && memberRelations && memberRelations.length) {
            const spouseRelation = memberRelations.find((relation) => relation.relationType === Relation.SPOUSE);
            return spouseRelation && dependentsData.find((dependent) => dependent.dependentRelationId === spouseRelation.id);
        }
        return null;
    }

    getCartValues(): void {
        this.benefitAmount = this.planObject.rider ? this.riderCartData.benefitAmount : this.cartData.benefitAmount;
        this.coverageLevelId = this.planObject.rider ? this.riderCartData.coverageLevelId : this.cartData.coverageLevelId;
    }

    /**
     * Gets tobacco and non-tobacco pricing
     */
    serviceCalls(): void {
        this.loadSpinner = true;
        // if this is the 'spouse tobacco use' question, change the 'spouseTobaccoUser' property
        // else change 'tobaccoUser'
        const nonTobaccoSettings = { ...this.tobaccoSettings };
        nonTobaccoSettings[this.isSpouseTobaccoQuestion ? "spouseTobaccoUser" : "tobaccoUser"] = false;
        forkJoin([this.getCoverageLevelObject(), this.shoppingService.getCartItems(this.memberId, this.mpGroup)])
            .pipe(
                tap(([coverageLevelObject, cartItems]) => {
                    // set spouseCovered base on response from coverage level request
                    this.spouseCovered = coverageLevelObject.spouseCovered;
                    // set familyBasedTobaccoStatusPricing base cart item
                    this.familyBasedTobaccoStatusPricing = cartItems.some(
                        (cartItem) => cartItem.planOffering.familyBasedTobaccoStatusPricing,
                    );
                    if (this.familyBasedTobaccoStatusPricing && this.spouseCovered) {
                        this.tobaccoSettings["spouseTobaccoUser"] = true;
                    }
                    nonTobaccoSettings["spouseTobaccoUser"] = false;
                }),
                switchMap(() =>
                    forkJoin([this.getPlanOfferingPricing(this.tobaccoSettings), this.getPlanOfferingPricing(nonTobaccoSettings)]),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (response) => {
                    this.tobaccoCostValues = response[0];
                    this.nonTobaccoCostValues = response[1];
                    this.createTobaccoData();
                    this.createTobaccoForm();
                    this.addFormListner();
                    this.checkAflacAlways();

                    this.loadSpinner = false;
                    this.showComponent = true;
                },
                (error) => {
                    this.loadSpinner = false;
                    this.hasError = true;
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                    if (error.error.status === ClientErrorResponseCode.RESP_404) {
                        this.errorMessage = this.languageStrings["primary.portal.applicationFlow.planOption.spouseAgeMinimum"];
                    }
                },
            );
    }

    /**
     * Method to get spouseCovered value from coverage level object.
     * @returns {Observable<CoverageLevel>}
     */
    getCoverageLevelObject(): Observable<CoverageLevel> {
        if (!this.coverageLevelId) {
            this.getCartValues();
        }
        return this.coreService.getCoverageLevel(this.coverageLevelId.toString());
    }

    /**
     * Method to invoke getPlanOfferingPricing based on tobacco question
     * @param tobaccoSettings
     * @returns {Observable<PlanOfferingPricing[]>}
     */
    getPlanOfferingPricing(tobaccoSettings: MoreSettings): Observable<PlanOfferingPricing[]> {
        const coverageEffectiveDate = this.planObject.application.cartData.coverageEffectiveDate;
        let basePlanId: number;
        if (this.planObject.rider && this.riderCartData.baseRiderId) {
            basePlanId = this.riderCartData.baseRiderId;
        } else {
            basePlanId = this.planObject.basePlanId;
        }
        let riskClassOverrideId: number;
        if (this.cartData.riskClassOverrideId) {
            riskClassOverrideId = this.cartData.riskClassOverrideId;
        } else if (this.planObject.application.carrierId === CarrierId.AFLAC) {
            const currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
            if (currentAccount && currentAccount.ratingCode === RatingCode.DUAL) {
                riskClassOverrideId = this.appFlowService.getDualAccountRiskClassId(this.planObject.application.productId);
            } else {
                riskClassOverrideId = this.store.selectSnapshot(EnrollmentState.GetMemberData).riskClassId;
            }
        }
        return this.shoppingService.getPlanOfferingPricing(
            this.retrievePlanOfferingId(),
            this.cartData.enrollmentState,
            tobaccoSettings,
            this.memberId,
            this.mpGroup,
            this.planObject.rider ? basePlanId : null,
            this.planObject.rider ? this.planObject.application.cartData.coverageLevelId : null,
            null,
            null,
            coverageEffectiveDate ? coverageEffectiveDate : null,
            riskClassOverrideId,
            true,
            this.cartData.id,
        );
    }

    /**
     * Method to return the planOfferingId
     * planOfferingId
     * @returns planOfferingId is being returned
     */
    retrievePlanOfferingId(): string {
        if (this.planObject && this.planObject.rider) {
            return this.riderCartData?.planOfferingId.toString();
        }
        return (this.cartData.planOffering?.id || this.cartData.planOfferingId).toString();
    }

    getRiderCartDataFromCart(): RiderCart {
        return this.cartData.riders
            ? this.cartData.riders.length > 0
                ? this.cartData.riders.filter((rider) => rider.planId === this.planId).pop()
                : null
            : null;
    }
    checkAflacAlways(): void {
        this.fromDirect = !!this.store.selectSnapshot(EnrollmentState.GetDirectPayment).length;
        this.hasAflacAlways = !!this.store.selectSnapshot(EnrollmentState.GetAflacAlways)?.length;
        this.hasEBSPayment = this.store.selectSnapshot(EnrollmentState.GetEBSPayment)?.isEBSAccount;
    }
    createTobaccoData(): void {
        this.stepData = this.planObject.steps[0];
        this.itemId = this.planObject.application.cartData ? this.planObject.application.cartData.id : null;
        this.tobaccoDirection = this.stepData.directions;
        this.tobaccoQuestion = this.stepData.question;
        this.tobaccoResponse = this.stepData.tobaccoResponse;
        this.nonTobaccoResponse = this.stepData.nontobaccoResponse;
    }
    /**
     * Initialize the tobacco form with previous selected option and calculate the price based on selection
     * @returns void
     */
    createTobaccoForm(): void {
        this.appResponses = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .filter(
                (resp) =>
                    resp.application.planId === this.planId &&
                    (resp.application.cartItemId === this.cartData.id || this.planObject.reinstate),
            )
            .pop();
        let previousPlanTobaccoResponse;
        const appPreviousPlan = this.utilService.copy(this.store.selectSnapshot(EnrollmentState.GetResponseItems));
        const previousPlanData = appPreviousPlan.filter((item) => item.application.cartItemId !== this.cartData.id);
        const matchedData: ResponseItem[] = previousPlanData.filter((prevPlan: ResponseItem) =>
            prevPlan.application.sections.some((section: Section) => section.title === this.planObject.currentSection.title),
        );

        for (const previousPlan of matchedData) {
            previousPlanTobaccoResponse = previousPlan.response
                .filter((value) => value.type === StepType.TOBACCO)
                .map((response) => response.value[0])
                .pop();
            if (previousPlanTobaccoResponse) {
                break;
            }
        }
        if (this.appResponses !== undefined) {
            this.previousResponse = this.appResponses.response;
            this.previousResponseValue = this.previousResponse
                .filter((response) => response.type === StepType.TOBACCO)
                .map((res) => res.value[0]);
        }
        if (this.previousResponseValue && this.previousResponseValue.length > 0) {
            this.getInitialValues(this.previousResponseValue[0]);
            this.tobaccoForm = this.fb.group({
                question: [this.previousResponseValue[0], Validators.required],
            });
        } else if (previousPlanTobaccoResponse) {
            this.getInitialValues(previousPlanTobaccoResponse);
            this.tobaccoForm = this.fb.group({
                question: [previousPlanTobaccoResponse, Validators.required],
            });
            this.updateError();
        } else {
            this.setTobaccoQuestionValuesBasedOnProfile();
        }
    }

    /**
     * Set the tobacco form values based on tobacco status in member/spouse profile.
     */
    setTobaccoQuestionValuesBasedOnProfile(): void {
        let latestTobaccoStatusObject: TobaccoStatusObject;

        this.appFlowService
            .getLatestTobaccoStatus()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((latestTobaccoStatus) => {
                latestTobaccoStatusObject = latestTobaccoStatus;
                this.isSpouseTobaccoUser =
                    latestTobaccoStatusObject && latestTobaccoStatusObject.spouseTobaccoUpdated
                        ? latestTobaccoStatusObject.spouseTobaccoUser
                        : this.spouseData &&
                          this.spouseData.profile &&
                          this.spouseData.profile.tobaccoStatus &&
                          this.spouseData.profile.tobaccoStatus === TobaccoStatus.TOBACCO;
            });

        let tobaccoStatus;
        if (this.familyBasedTobaccoStatusPricing) {
            // spouseCovered will true for "Named Insured / Spouse Only" and "Two Parent Family".
            // if spouseCovered is true in coverageLevel then set tobaccoStatus based on spouse and user tobacco status
            // or else use only user tobaccoStatus
            tobaccoStatus = this.spouseCovered ? this.isSpouseTobaccoUser || this.isTobaccoUser : this.isTobaccoUser;
        } else {
            tobaccoStatus = this.isSpouseTobaccoQuestion ? this.isSpouseTobaccoUser : this.isTobaccoUser;
        }
        const value: string = tobaccoStatus ? YES_VALUE : NO_VALUE;
        this.getInitialValues(value);

        if (this.isSpouseTobaccoQuestion) {
            this.setTobaccoFormForSpouse(latestTobaccoStatusObject);
        } else {
            this.setTobaccoFormForMember(latestTobaccoStatusObject);
        }
    }

    /**
     * Set the tobacco form values for member(question in enrollment flow) based on tobacco status in member profile.
     * @param latestTobaccoStatusObject latest value of member/spouse tobacco status
     */
    setTobaccoFormForMember(latestTobaccoStatusObject: TobaccoStatusObject): void {
        const isEmployeeTobaccoStatusUndefined: boolean =
            this.memberData &&
            this.memberData.info.profile &&
            this.memberData.info.profile.tobaccoStatus === TobaccoStatus.UNDEFINED &&
            !latestTobaccoStatusObject.employeeTobaccoUpdated;

        if (isEmployeeTobaccoStatusUndefined) {
            const spouseTobaccoStatus: boolean = this.isSpouseTobaccoStatusUndefined && !latestTobaccoStatusObject.spouseTobaccoUpdated;
            // If plan has family based tobacco status pricing then
            // check for both employee and spouse tobacco status to pre-populate tobacco form answer
            // if both employee and spouse tobacco status are undefined then set to null.
            if (this.familyBasedTobaccoStatusPricing && this.spouseCovered && !spouseTobaccoStatus) {
                this.tobaccoForm = this.fb.group({
                    question: [this.initialResponse, Validators.required],
                });
            } else {
                this.tobaccoForm = this.fb.group({
                    question: [null, Validators.required],
                });
            }
        } else {
            this.tobaccoForm = this.fb.group({
                question: [this.initialResponse, Validators.required],
            });
        }

        this.appFlowService.setLatestTobaccoStatus({
            ...latestTobaccoStatusObject,
            employeeTobaccoUpdated: false,
        });
    }

    /**
     * Set the tobacco form values for spouse(question in enrollment flow) based on tobacco status in spouse profile.
     * @param latestTobaccoStatusObject latest value of member/spouse tobacco status
     */
    setTobaccoFormForSpouse(latestTobaccoStatusObject: TobaccoStatusObject): void {
        if (this.isSpouseTobaccoQuestion && this.isSpouseTobaccoStatusUndefined && !latestTobaccoStatusObject.spouseTobaccoUpdated) {
            this.tobaccoForm = this.fb.group({
                question: [null, Validators.required],
            });
        } else {
            this.tobaccoForm = this.fb.group({
                question: [this.initialResponse, Validators.required],
            });
        }
        this.appFlowService.setLatestTobaccoStatus({
            ...latestTobaccoStatusObject,
            spouseTobaccoUpdated: false,
        });
    }

    addFormListner(): void {
        this.tobaccoForm.valueChanges.pipe(takeUntil(this.unsubscribe$)).subscribe((change) => {
            if (
                this.tobaccoForm.dirty &&
                !this.planObject.rider &&
                (this.planObject.currentSection.sectionId !== this.currentSectionIndex ||
                    this.planObject.currentStep !== this.currentStepIndex)
            ) {
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
            }
        });
    }

    getInitialValues(value: string): void {
        this.initialResponse = value;
    }
    /**
     * updates cost based on tobacco response
     * @param tobaccoResponse tobacco response
     */
    updateCost(tobaccoResponse: string): void {
        let costValues: PlanOfferingPricing[];
        this.finalResponse = tobaccoResponse;
        if (tobaccoResponse === AppSettings.YES) {
            costValues = this.tobaccoCostValues;
        }
        if (tobaccoResponse === AppSettings.NO) {
            costValues = this.nonTobaccoCostValues;
        }
        if (costValues) {
            this.costData = costValues.filter(
                (costData) =>
                    costData.coverageLevelId === this.coverageLevelId &&
                    (costData.benefitAmount === this.benefitAmount || !this.benefitAmount),
            );
        }

        if (this.costData && this.costData.length) {
            let riderCost = 0;
            if (this.planObject.rider) {
                const filteredRiders: RiderCart[] = this.cartData.riders.filter(
                    (rider) => rider.planOfferingId !== this.riderCartData.planOfferingId,
                );
                if (filteredRiders.length > 0) {
                    filteredRiders.forEach((rider) => {
                        riderCost += rider.totalCost;
                    });
                }
                riderCost += this.costData[0].totalCost;
                this.appFlowService.updateCost$.next(this.cartData.memberCost + riderCost);
            } else {
                if (this.cartData.riders.length > 0) {
                    this.cartData.riders.forEach((rider) => {
                        if (rider.totalCost) {
                            riderCost += rider.totalCost;
                        }
                    });
                }
                if (!this.planObject.reinstate) {
                    this.appFlowService.updateCost$.next(this.costData[0].totalCost + riderCost);
                }
            }
        }
    }

    updateError(): void {
        this.updateCost(this.tobaccoForm.controls.question.value);
        this.showError = false;
    }

    /**
     * Saves application responses and updates cart items on next
     */
    onNext(): void {
        const values: string[] = [];
        const responseOfTobacco: ApplicationResponse[] = [];
        if (this.tobaccoForm.controls.question.value !== " ") {
            values.push(this.tobaccoForm.controls.question.value);
            if (this.tobaccoForm.valid) {
                this.response = {
                    stepId: this.stepData.id,
                    value: values,
                    type: this.stepData.type,
                };
                this.loadSpinner = true;
                this.showError = false;
                responseOfTobacco.push(this.response);
                const cartItemId: number = this.planObject.rider ? this.riderCartData.cartItemId : this.cartData.id;
                this.shoppingCartService
                    .saveApplicationResponse(this.memberId, cartItemId, this.mpGroup, responseOfTobacco)
                    .pipe(
                        takeUntil(this.unsubscribe$),
                        switchMap((response) => {
                            const apiList: Observable<unknown>[] = [];
                            if (this.initialResponse !== this.finalResponse) {
                                const cartData: AddCartItem = this.getCartData();
                                apiList.push(this.shoppingService.updateCartItem(this.memberId, this.mpGroup, cartItemId, cartData));
                            }
                            apiList.push(this.store.dispatch(new UpdateApplicationResponse(this.memberId, cartItemId, this.mpGroup)));
                            return forkJoin(apiList);
                        }),
                        tap((resp) => {
                            if (this.initialResponse === this.finalResponse) {
                                this.goToNextStep();
                            }
                        }),
                        filter((resp) => this.initialResponse !== this.finalResponse),
                        switchMap((res) =>
                            this.store.dispatch(
                                new UpdateCartData(this.cartData.id, this.cartData.planOffering?.id || this.cartData.planOfferingId),
                            ),
                        ),
                    )
                    .subscribe(
                        (res) => {
                            this.goToNextStep();
                        },
                        (error) => {
                            this.handleGenericSecondaryErrorMessage(error);
                        },
                    );
            } else {
                this.loadSpinner = false;
                this.showError = true;
            }
        }
    }
    /**
     * handles generic secondary errors
     * @param error error response
     */
    handleGenericSecondaryErrorMessage(error: HttpErrorResponse): void {
        this.loadSpinner = false;
        this.hasError = true;
        this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.error.status}.${error.error.code}`);
    }

    goToNextStep(): void {
        this.initialResponse = this.finalResponse;
        this.loadSpinner = false;
        this.appFlowService.onNextClick(this.planObject, this.planObject.currentStep, this.planObject.currentSection.title);
    }
    /**
     * Function to set all the values for cartData Object
     * @returns cartData Object of type AddCartItem
     */
    /* eslint-disable-next-line complexity */
    getCartData(): AddCartItem {
        let cartData: AddCartItem;
        if (this.planObject.rider) {
            cartData = {
                benefitAmount: this.benefitAmount,
                coverageLevelId: this.coverageLevelId,
                memberCost: this.costData && this.costData.length > 0 ? this.costData[0].totalCost : this.riderCartData.totalCost,
                totalCost: this.costData && this.costData.length > 0 ? this.costData[0].totalCost : this.riderCartData.totalCost,
                dependentAge: this.cartData.dependentAge ? this.cartData.dependentAge : null,
                planOfferingId: this.riderCartData.planOfferingId,
                enrollmentMethod: this.cartData.enrollmentMethod,
                enrollmentState: this.cartData.enrollmentState,
                enrollmentCity: this.cartData.enrollmentCity,
                assistingAdminId: this.appFlowService.mapAssistingAdminId(this.cartData.assistingAdminId),
                parentCartItemId: this.cartData.id,
                baseRiderId: this.riderCartData.baseRiderId,
                subscriberQualifyingEventId:
                    this.cartData.planOffering && this.cartData.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
            };
        } else {
            cartData = {
                benefitAmount: this.benefitAmount,
                memberCost: this.costData && this.costData.length > 0 ? this.costData[0].totalCost : this.cartData.memberCost,
                totalCost: this.costData && this.costData.length > 0 ? this.costData[0].totalCost : this.cartData.totalCost,
                dependentAge: this.cartData.dependentAge ? this.cartData.dependentAge : null,
                enrollmentMethod: this.cartData.enrollmentMethod,
                enrollmentState: this.cartData.enrollmentState,
                enrollmentCity: this.cartData.enrollmentCity,
                planOfferingId: this.cartData.planOffering?.id || this.cartData.planOfferingId,
                coverageLevelId: this.coverageLevelId,
                riders: this.cartData.riders,
                assistingAdminId: this.appFlowService.mapAssistingAdminId(this.cartData.assistingAdminId),
                coverageEffectiveDate: this.cartData.coverageEffectiveDate
                    ? this.appFlowService.getCoverageDateToUpdateCart(this.cartData.coverageEffectiveDate)
                    : null,
                subscriberQualifyingEventId:
                    this.cartData.planOffering && this.cartData.planOffering.planYearId && this.currentQleId ? this.currentQleId : null,
            };
            if (this.cartData.enrollmentMethod !== EnrollmentMethod.SELF_SERVICE) {
                cartData.riskClassOverrideId =
                    this.cartData.riskClassOverrideId && !this.isMemberLoggedIn ? this.cartData.riskClassOverrideId : null;
            }
        }
        return cartData;
    }

    /**
     * Get difference in years from a date (e.g. birth date) to some specified (or current) date
     *
     * @param from birth date / some date in the past
     * @param to (optional) date from where the difference is to be calculated. If undefined, assumes current date
     * @returns difference in years
     */
    getAge(from: Date | string, to?: Date | string): number {
        return this.dateService.getDifferenceInYears(this.dateService.toDate(from), to ? this.dateService.toDate(to) : undefined);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
