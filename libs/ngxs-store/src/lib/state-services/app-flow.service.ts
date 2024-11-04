import { EnrollmentService, MemberService, AccountService, StaticService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { Subject, BehaviorSubject, forkJoin, Observable, combineLatest } from "rxjs";
import { takeUntil, map } from "rxjs/operators";
import { DatePipe } from "@angular/common";
import { Router } from "@angular/router";
// TODO:CD - remove tpi lib dependency
import { TPIState } from "../tpi/tpi.state";
import {
    EnrollmentMethod,
    CarrierId,
    ProductId,
    ConfigName,
    ResponsePanel,
    ReinstateResponse,
    PlanOptionResponse,
    BasePlanApplicationPanel,
    ResponseItem,
    StepConstraints,
    DirectPaymentCost,
    StepData,
    Cost,
    StepChangeDetails,
    ActiveStepDetails,
    TobaccoStatusObject,
    AllConstraint,
    StaticStep,
    RiskClass,
    Contraints,
    BenefitAmountType,
    Operation,
    Question,
    Salary,
    AppSettings,
    CoverageLevelNames,
    Portals,
    Characteristics,
    RatingCode,
    RiderCart,
    AddCartItem,
    ConstraintAggregates,
    TaxStatus,
    CoverageLevel,
    ApplicationEnrollmentRequirements,
    GetCartItems,
    Enrollments,
    PlanOfferingPricing,
    Relations,
    MemberDependent,
    MoreSettings,
    StepType,
    ContraintsType,
    GetAncillary,
    Relation,
    PdaAccount,
    APPLICATION_STEPTYPE,
    MemberCoverageDetails,
    StepTitle,
    DateFormats,
    PaymentType,
} from "@empowered/constants";
import { StaticUtilService } from "../state-services/static-util.service";
import { DateService } from "@empowered/date";
import { AccountInfoState } from "../dashboard";
import { DiscardCartItem, DiscardRiderCartItem, EnrollmentState, UpdateConstraintValues } from "../enrollment";
import { SharedState } from "../shared";

enum StepEligible {
    ADDITION = "addition",
    ADDITION_ELIGIBLE = "additionEligible",
    CONVERSION = "conversion",
    CONVERSION_ELIGIBLE = "conversionEligible",
    BENEFIT_AMOUNT = "currentBenefitAmount",
    DOWNGRADE = "downgrade",
    DOWNGRADE_BENEFIT_ELIGIBLE = "downgradeByBenefitEligible",
    DOWNGRADE_ELIGIBLE = "downgradeEligible",
    REINSTATEMENT = "reinstatement",
    REINSTATEMENT_ELIGIBLE = "reinstatementEligible",
    GUARANTEE_ISSUE = "guaranteeIssue",
    GUARANTEE_ISSUE_ELIGIBLE = "guaranteeIssueEligible",
    CURRENT_POLICY_NUMBER = "currentPolicyNumber",
}

enum DependencyType {
    REQUIRES_BROKERS_PLAN_SELECTION = "REQUIRES_BROKERS_PLAN_SELECTION",
    REQUIRES_NON_GI_PARENT_ENROLLMENT = "REQUIRES_NON_GI_PARENT_ENROLLMENT",
    REQUIRES_GI_PARENT_ENROLLMENT = "REQUIRES_GI_PARENT_ENROLLMENT",
    REQUIRES_ELIGIBLE_CHILD = "REQUIRES_ELIGIBLE_CHILD",
    REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN = "REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN",
    REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN = "REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN",
    REQUIRES_ELIGIBLE_SPOUSE = "REQUIRES_ELIGIBLE_SPOUSE",
    REQUIRES_NONSELECTION_IN_ANOTHER_PLAN = "REQUIRES_NONSELECTION_IN_ANOTHER_PLAN",
    REQUIRES_SELECTION_IN_ANOTHER_PLAN = "REQUIRES_SELECTION_IN_ANOTHER_PLAN",
}

interface SpouseDetails {
    spouseData: MemberDependent;
    spouseAge: string;
}

interface RiderApplicationToValidate {
    planId: number;
    cartData: RiderCart;
}

const YES_VALUE = "yes";
const NO_VALUE = "No";
const ADDITIONAL_CONTRIBUTION_RESET_VALUE = "0";
const REINSTATEMENT_FLOW = "REINSTATEMENT";
const DAY_GRANULARITY = "day";

@Injectable({
    providedIn: "root",
})
export class AppFlowService {
    private readonly vf2fSubSteps$ = new Subject<number>();
    getVf2fSubSteps$: Observable<number> = this.vf2fSubSteps$.asObservable();
    private readonly vf2fSubStepChange$ = new Subject<number>();
    onVf2fSubStepChange$: Observable<number> = this.vf2fSubStepChange$.asObservable();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public hideBackButton$: Subject<boolean> = new Subject();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public sectionChanged$ = new Subject<any>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public planChanged$ = new Subject<{ nextClicked: boolean; discard: boolean }>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public handleSameSection$ = new Subject<any>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public removeApplication$ = new Subject<any>();
    paymentStepNext$ = new Subject<number>();
    private readonly additionalContributionAmountSubject$ = new Subject<string>();
    getAdditionalContributionAmount$: Observable<string> = this.additionalContributionAmountSubject$.asObservable();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public stepChanged$ = new Subject<StepChangeDetails>();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public scrolledIndex$ = new Subject<any>();
    showStaticStep = new Subject<any>();
    CustomSectionChanged$ = new Subject<any>();
    loadSpinner$ = new Subject<any>();
    ridersScroll$ = new Subject<any>();
    paymentStepPosition = new Subject<any>();
    lastCompletedSectionIndex$ = new Subject<{ index: number; unblur: boolean }>();
    lastCompletedPaymentIndex = new Subject<number>();
    lastCompleteStaticStep = new Subject<number>();
    planAndCart = new BehaviorSubject<any>(0);
    showNextProductFooter$ = new Subject<{ nextClick: boolean; data: string }>();
    planAndCartReview = new BehaviorSubject<any>(0);
    riderDiscard$ = new Subject<{
        planObject: StepData;
        riderIndex: number;
        riderCartId: number;
        parentCartId: number;
    }>();
    updateActiveStepDetails$ = new Subject<ActiveStepDetails>();
    updateCost$ = new Subject<any>();
    updateBucketCoverageLevel$ = new Subject<string>();
    updateRiderActiveStepDetails$ = new Subject<ActiveStepDetails>();
    private readonly knockoutTrigger$: Subject<string> = new BehaviorSubject<string>(null);
    getKnockoutTrigger: Observable<string> = this.knockoutTrigger$.asObservable();
    private readonly UpdateRiderDetails$: Subject<boolean> = new Subject<boolean>();
    getUpdateRiderDetails: Observable<boolean> = this.UpdateRiderDetails$.asObservable();
    private readonly exitStatus$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
    private isAdditionalContribution = false;
    initializeBilling = false;
    selectedPaymentMethod = PaymentType.BANKDRAFT;
    selectedPaymentIndex = 0;
    getExitStatus: Observable<boolean> = this.exitStatus$.asObservable();
    reinstateScrolledIndex$ = new Subject<any>();
    reinstateStepChanged$ = new Subject<any>();
    reinstateLastCompletedPaymentIndex$ = new Subject<number>();
    reinstateLastCompleteStaticStep$ = new Subject<number>();
    updateReinstateActiveStepDetails$ = new Subject<ActiveStepDetails>();
    lastCompletedBillingIndex = new Subject<number>();
    reinstateLastCompletedBillingIndex$ = new Subject<number>();
    planValuesChanged$ = new Subject<any>();
    private disabledSecondarySheRider: boolean;
    private selectedPaymentId: number;
    private retainRider: boolean;
    private employerContributionPlans: string[];
    private readonly readHipaaConsentForm$: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([null]);
    readHipaaConsentForm: Observable<string[]> = this.readHipaaConsentForm$.asObservable();

    private pinDetails$ = new BehaviorSubject<any>({
        pin: null,
        date: null,
        signature: null,
    });
    currentPlanDetails = this.pinDetails$.asObservable();
    requestForSignatureSent$ = new Subject<any>();
    demographicsStepSkipped$ = new Subject<any>();
    reinstateDemographicsStepSkipped$ = new Subject<any>();
    updateCoveredDependentDetails$ = new BehaviorSubject<string>(null);
    updateCoveredDependentID$ = new BehaviorSubject<number>(null);
    updateReturnToShop$ = new Subject<boolean>();
    memberEnrollments: Enrollments[];
    private unsubscribe$ = new Subject<void>();
    private updateAncillary$: Subject<number> = new Subject<number>();
    getAncillarySubject: Observable<number> = this.updateAncillary$.asObservable();
    private readonly updateAncillaryOnStepChange$: Subject<number> = new Subject<number>();
    updateAncillaryOnstepChange: Observable<number> = this.updateAncillaryOnStepChange$.asObservable();
    private readonly coverageLevelName$: Subject<string> = new Subject<string>();
    updateCoverageLevel: Observable<string> = this.coverageLevelName$.asObservable();

    dependentRelations: Relations[];
    dependents: MemberDependent[];
    declinedCoverageLevelId = 2;
    private callCenterPin: string;
    tpiProducerId: number;
    tpiAssistingAdminId: number;
    // behavior subject to keep the age limit data for child
    private readonly ageLimitForChild$ = new BehaviorSubject<{ minAge: number; maxAge: number }>({
        minAge: null,
        maxAge: null,
    });
    getAgeLimitForChild$: Observable<{ minAge: number; maxAge: number }> = this.ageLimitForChild$.asObservable();
    // eslint-disable-next-line @typescript-eslint/explicit-member-accessibility
    public latestTobaccoStatus$ = new BehaviorSubject<TobaccoStatusObject>({
        tobaccoUser: undefined,
        spouseTobaccoUser: undefined,
        employeeTobaccoUpdated: false,
        spouseTobaccoUpdated: false,
    });
    showPreliminaryStatementStep$ = new BehaviorSubject<boolean>(null);
    emailPreliminaryForms$ = new BehaviorSubject<boolean>(null);
    hidePreliminaryStatementStepTPI$ = new BehaviorSubject<boolean>(null);
    // Behavior subject to hold AflacAlways payment method
    paymentMethod$ = new BehaviorSubject<string>(null);
    // Behavior subject to retain value of aflac always review status
    reviewAflacAlwaysStatus$ = new BehaviorSubject<string>(null);
    // Behavior subject to retain value of aflac always initials
    reviewAflacAlwaysInitial$ = new BehaviorSubject<string>(null);
    // Behavior subject to retrigger AA re-evaluation
    reevaluateReviewAflacAlways$ = new BehaviorSubject<boolean>(true);

    constructor(
        readonly store: Store,
        readonly staticUtilService: StaticUtilService,
        readonly enrollmentService: EnrollmentService,
        readonly memberService: MemberService,
        readonly accountService: AccountService,
        readonly datepipe: DatePipe,
        readonly router: Router,
        private readonly staticService: StaticService,
        private readonly dateService: DateService,
    ) {}

    /**
     * Updates the coverage level name
     * @param coverageLevelName Name of coverage level
     */
    updateCoverageLevelName(coverageLevelName: string): void {
        this.coverageLevelName$.next(coverageLevelName);
    }

    changePlanDetails(planDetails: any): void {
        this.pinDetails$.next(planDetails);
    }
    updateAncillary(coverageLevelId: number): void {
        this.updateAncillary$.next(coverageLevelId);
    }
    knockoutTrigger(type: string): void {
        this.knockoutTrigger$.next(type);
    }
    UpdateRiderDetails(type: boolean): void {
        this.UpdateRiderDetails$.next(type);
    }
    /**
     * function is used to update exit status for mmp shop page
     */
    exitStatus(type: boolean): void {
        this.exitStatus$.next(type);
    }

    /**
     * This method emits vf2f step index.
     * @param stepIndex index of step
     * @returns void
     */
    emitVf2fStep(stepIndex: number): void {
        this.vf2fSubSteps$.next(stepIndex);
    }

    /**
     * called on change of Vf2f sub step change
     * @param nextSubStep index of next sub step
     * @returns void
     */
    onVf2fSubStepChange(nextSubStep: number): void {
        this.vf2fSubStepChange$.next(nextSubStep);
    }
    /**
     * @description This method emits additional contribution amount
     * @param nextAmount {string} The new amount value
     */
    emitAdditionalContributionAmount(nextAmount: string): void {
        this.additionalContributionAmountSubject$.next(nextAmount);
    }
    /**
     * To get coverage details data
     * @param memberId Member id of employee
     * @param cartId Cart Id
     * @param enrollmentId Enrollment Id
     * @param mpGroup MpGroup
     * @returns Observable<MemberCoverageDetails>
     */
    getMemberCoverageDetailsAPI(
        memberId: number,
        cartId: number,
        enrollmentId: number,
        mpGroup: number,
    ): Observable<MemberCoverageDetails> {
        return this.enrollmentService.getMemberCoverageDetails(memberId, cartId, enrollmentId, mpGroup);
    }

    /**
     * @description sets the value for payment Id for Aflac Always modal
     * @param value {number} the value of the paymentId selected in the payment method step of AA
     */
    setPaymentIdForAflacAlwaysQuasiModal(value: number): void {
        this.selectedPaymentId = value;
    }

    /**
     * @description get the value of selected payment Id in Aflac Always
     * @returns value {number} the value of the paymentId selected in the payment method step of AA
     */
    getPaymentIdForAflacAlwaysQuasiModal(): number {
        return this.selectedPaymentId;
    }

    /**
     * function used to update ancillary in plan options based on section Index
     * @param sectionIndex - Section Index of current loading section
     */
    updateAncillaryOnStepChange(sectionIndex: number): void {
        this.updateAncillaryOnStepChange$.next(sectionIndex);
    }
    /**
     * @description sets the value for secondary she rider to disable or enable based on value passed
     * @param val {boolean} the value that disables or enables the she rider
     */
    setSheRiderDisableVal(val: boolean): void {
        this.disabledSecondarySheRider = val;
    }

    /**
     * @description returns the status of the secondary she rider radio-group
     * @returns {boolean} the status of the secondary she rider radio-group
     */
    getSheRiderDisableVal(): boolean {
        return this.disabledSecondarySheRider;
    }
    /**
     * @description sets the value for retain rider label
     * @param val {boolean} the value that sets retain rider or increase rider value
     */
    setRetainRiderVal(val: boolean): void {
        this.retainRider = val;
    }
    /**
     * @description returns the value for retain rider label for radio group
     * @returns {boolean} the value that sets retain rider or increase rider value radio-group
     */
    getRetainRiderVal(): boolean {
        return this.retainRider;
    }
    /**
     * @description sets the value of all employer contribution plans
     * @param val the value that has all employer contribution plans
     */
    setEmployerContributionPlans(value: string[]): void {
        this.employerContributionPlans = value;
    }
    /**
     * @description returns the employer contribution plan array
     * @returns the value that has all employer contribution plans
     */
    getEmployerContributionPlans(): string[] {
        return this.employerContributionPlans;
    }
    /**
     * Function to get responses of base plan and related riders
     * @param planId - plan id for which responses are needed
     * @param cartItem - cart item used to extract riders id.
     * @returns ResponsePanel - array of combined response of app response [rider + base plan]
     */
    getResponseItemsByPlanId(planId: number, cartItem: GetCartItems): ResponsePanel[] {
        const responseItems: ResponseItem[] = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        let appResponses: ResponseItem;
        if (!cartItem.id || cartItem.applicationType === REINSTATEMENT_FLOW) {
            appResponses = responseItems.find((resp) => resp.application.planId === planId);
        } else {
            appResponses = responseItems.find((resp) => resp.application.planId === planId && resp.application.cartItemId === cartItem.id);
        }
        let riderResponses: ResponseItem[] = [];
        if (
            appResponses &&
            appResponses.application &&
            appResponses.application.riderApplicationIds &&
            cartItem.riders &&
            cartItem.riders.length
        ) {
            const riderCartIds = cartItem.riders.map((rider) => rider.cartItemId);
            riderResponses = responseItems.filter(
                (resp) =>
                    appResponses.application.riderApplicationIds.indexOf(resp.application.id) >= 0 &&
                    riderCartIds.indexOf(resp.application.cartItemId) >= 0,
            );
        }
        let allResponses: ResponsePanel[] = [];
        if (appResponses && appResponses.response) {
            allResponses = appResponses.response;
        }
        riderResponses.forEach((responses) => {
            if (responses.response) {
                allResponses = allResponses.concat(allResponses, responses.response);
            }
        });
        return allResponses;
    }
    /**
     * @description sets if the current step is additional contribution step
     * @param val {boolean} the value to set for the additional contribution step is in consideration
     */
    additionalContributionSet(val: boolean): void {
        this.isAdditionalContribution = val;
    }
    /**
     * @description this method is mostly used in aflac always quasi modal to set initializeBilling,
     * a flag that controls the display of billing setp
     * @param isBillingStep {boolean} the value to set for the initializeBilling flag
     */
    initalizeBillingStep(isBillingStep: boolean): void {
        this.initializeBilling = isBillingStep;
    }
    /**
     * @description this method is mostly used in aflac always quasi modal to set selectedPaymentMethod,
     * to record the payment method selected
     * @param paymentType {PaymentType} the value to set for the selectedPaymentMethod
     */
    setSelectedPaymentType(paymentType: PaymentType): void {
        this.selectedPaymentMethod = paymentType;
    }
    // eslint-disable-next-line complexity
    /**
     * @description the function to determine whether to skip on constraints
     * @param constraint the constraint in consideration
     * @param planId the id of the plan in consideration
     * @param planObject the step data of the plan
     * @param cartData the data of cart items
     * @param baseApplicationId the id of the base plan
     * @param sheRiderIds an array of ids of two she Riders
     * @returns {boolean} returns whether to skip on constraint
     */
    skipOnConstraints(
        constraint: ConstraintAggregates,
        planId: number,
        planObject: StepData,
        cartData: GetCartItems | RiderCart,
        baseApplicationId?: number,
        sheRiderIds?: number[],
    ): boolean {
        if (constraint.skip.and || constraint.show.and) {
            let skipAndConstraintValue,
                skipOrConstraintValue,
                showAndConstraintValue,
                showOrConstraintValue = true;
            const cartItems = cartData as GetCartItems;
            const allResponses: ResponsePanel[] = this.getResponseItemsByPlanId(planId, cartItems);
            if (constraint.skip.and) {
                const andConstraints = constraint.skip.and.constraints;
                if (andConstraints.length) {
                    skipAndConstraintValue = this.checkAndOrConstraints(
                        andConstraints,
                        allResponses.length ? allResponses : null,
                        AppSettings.AND,
                        cartData,
                        planObject,
                        baseApplicationId,
                        sheRiderIds,
                    );
                } else {
                    skipAndConstraintValue = true;
                }
                const orConstraints = constraint.skip.and.or.constraints;
                if (orConstraints.length) {
                    skipOrConstraintValue = this.checkAndOrConstraints(
                        orConstraints,
                        allResponses.length ? allResponses : null,
                        AppSettings.OR,
                        cartData,
                        planObject,
                        baseApplicationId,
                        sheRiderIds,
                    );
                } else {
                    skipOrConstraintValue = true;
                }
                if (skipAndConstraintValue && skipOrConstraintValue && (orConstraints.length || andConstraints.length)) {
                    return true;
                }
            }
            if (constraint.show.and) {
                if (this.isAdditionalContribution) {
                    return this.handleForAdditionalContributionStep(allResponses);
                }
                const andConstraints = constraint.show.and.constraints;
                if (andConstraints.length) {
                    showAndConstraintValue = this.checkAndOrConstraints(
                        andConstraints,
                        allResponses.length ? allResponses : null,
                        AppSettings.AND,
                        cartData,
                        planObject,
                        baseApplicationId,
                        sheRiderIds,
                    );
                    if (!showAndConstraintValue) {
                        return true;
                    }
                }
                const orConstraints = constraint.show.and.or.constraints;
                if (orConstraints.length) {
                    showOrConstraintValue = this.checkAndOrConstraints(
                        orConstraints,
                        allResponses.length ? allResponses : null,
                        AppSettings.OR,
                        cartData,
                        planObject,
                        baseApplicationId,
                        sheRiderIds,
                    );
                    if (!showOrConstraintValue) {
                        return true;
                    }
                }
            }
            return false;
        }
        return false;
    }
    /**
     * @description handles the constraint check for the additional contribution step
     * @param allResponses {ResponsePanel[]} the responses of the user in the flow
     * @return boolean to skip the additional contribution step or not
     */
    handleForAdditionalContributionStep(allResponses: ResponsePanel[]): boolean {
        this.additionalContributionSet(false);
        if (allResponses.length) {
            const bucketStep = allResponses.find((response) => response.type === StepType.BUCKET);
            if (bucketStep && bucketStep.value.length && (bucketStep.value[0] as ReinstateResponse).question === NO_VALUE) {
                this.additionalContributionAmountSubject$.next(ADDITIONAL_CONTRIBUTION_RESET_VALUE);
                return true;
            }
        }
        return false;
    }
    /**
     * @description checks the And Or constraints
     * @param constraints the constraints object
     * @param response the response from the response panel
     * @param type the type of constraint
     * @param cartData the data of cart items
     * @param baseApplicationId the id of the base plan
     * @param sheRiderIds an array of ids of two she Riders
     * @returns {boolean} returns if constraint passes or fails
     */
    checkAndOrConstraints(
        constraints: Contraints[],
        response: ResponsePanel[],
        type: string,
        cartData: GetCartItems | RiderCart,
        planObject: StepData,
        baseApplicationId?: number,
        sheRiderIds?: number[],
    ): boolean {
        const constraintValues = this.store
            .selectSnapshot(EnrollmentState.GetConstraint)
            .filter((constraintData) => constraintData.flowId === planObject.application.appData.id)
            .pop();
        const riskClassData = this.store
            .selectSnapshot(EnrollmentState.GetRiskClasses)
            .filter((riskClass) => riskClass.carrierId === planObject.application.carrierId)
            .pop();
        let riskClasses: RiskClass[];
        if (riskClassData && riskClassData.data && riskClassData.data.length) {
            riskClasses = riskClassData.data;
        }
        let constraintPass = false;
        for (const constraint of constraints) {
            constraintPass = this.checkConstraint(
                constraint,
                response,
                planObject,
                constraintValues,
                riskClasses,
                cartData,
                baseApplicationId,
                sheRiderIds,
            );
            if (type === AppSettings.OR && constraintPass) {
                return true;
            }
            if (type === AppSettings.AND && !constraintPass) {
                return false;
            }
        }
        return constraintPass;
    }
    /**
     * checks and validates constraint
     * @param constraint costraint data
     * @param responses list of reponses
     * @param planObject plan object data
     * @param constraintValues constraint values
     * @param riskClasses risk classes
     * @param cartData cart data
     * @param baseApplicationId base application id
     * @param sheRiderIds the She rider Ids from config
     * @returns if constraint is passed or failed
     */
    // eslint-disable-next-line complexity
    checkConstraint(
        constraint: Contraints,
        responses: ResponsePanel[],
        planObject: StepData,
        constraintValues: StepConstraints,
        riskClasses: RiskClass[],
        cartData: GetCartItems | RiderCart,
        baseApplicationId?: number,
        sheRiderIds?: number[],
    ): boolean {
        let baseConstraintValues: StepConstraints;
        if (baseApplicationId) {
            baseConstraintValues = this.store
                .selectSnapshot(EnrollmentState.GetConstraint)
                .filter((constraintData) => constraintData.flowId === baseApplicationId)
                .pop();
        } else {
            baseConstraintValues = constraintValues;
        }
        const baseCartData: GetCartItems = cartData as GetCartItems;
        if (planObject.rider) {
            cartData = (cartData as GetCartItems).riders.filter((data) => data.planId === planObject.application.appData.planId).pop();
        }
        let selectedValue: string | number | string[] | number[] | boolean;
        switch (constraint.type) {
            case ContraintsType.QUESTION:
                selectedValue = this.getQuestionConstraintValue(responses, constraint);
                break;
            case ContraintsType.BENEFIT_AMOUNT:
            case ContraintsType.AG_BENEFIT_AMOUNT:
                if (constraint.value !== "") {
                    selectedValue = this.getBenefitConstraintValue(
                        responses,
                        constraint,
                        baseCartData,
                        cartData,
                        planObject,
                        baseConstraintValues,
                        constraintValues,
                    );
                }
                break;
            case ContraintsType.COVERAGE_LEVEL:
                selectedValue = this.getCoverageConstraintValue(responses, constraint, baseCartData, cartData, planObject);
                break;
            case ContraintsType.PLAN_CURRENTLY_ENROLLING:
                selectedValue = this.getPlanCurrentlyEnrolling(planObject, baseCartData, sheRiderIds);
                break;
            case ContraintsType.RISK_CLASS:
                selectedValue = this.getRiskClassValue(riskClasses, planObject, baseCartData);
                break;
            case ContraintsType.IS_CONVERSION:
                selectedValue = this.getConversionValue(baseConstraintValues, constraintValues, ContraintsType.IS_CONVERSION);
                break;
            case ContraintsType.IS_DOWNGRADE:
            case ContraintsType.IS_ADDITION:
            case ContraintsType.IS_REINSTATEMENT:
            case ContraintsType.REINSTATEMENT_IS_REQUIRED:
            case ContraintsType.IS_GI:
            case ContraintsType.IS_Q60_ELIGIBLE_FOR_GI:
            case ContraintsType.TOBACCO_RESPONSE:
            case ContraintsType.IS_ADDITION_ELIGIBLE:
            case ContraintsType.IS_CONVERSION_ELIGIBLE:
            case ContraintsType.IS_DOWNGRADE_ELIGIBLE:
            case ContraintsType.IS_REINSTATEMENT_ELIGIBLE:
            case ContraintsType.CHILD_AGE: {
                if (constraintValues && constraintValues[constraint.type]) {
                    selectedValue = constraintValues[constraint.type];
                } else {
                    selectedValue = false;
                }
                break;
            }
            case ContraintsType.IS_CONVERSION_AND_ANY_RIDER_DECLINED: {
                selectedValue =
                    this.getConversionValue(baseConstraintValues, constraintValues, ContraintsType.IS_CONVERSION) &&
                    baseCartData.riders.some((riderCartItem) => riderCartItem.coverageLevelId === this.declinedCoverageLevelId);
            }
        }
        if (selectedValue === undefined || constraint.value === undefined || selectedValue === null) {
            return false;
        }
        return this.checkOperation(selectedValue, constraint.value, constraint.operation);
    }
    /**
     * get values of constraint type question
     * @param responses list of responses
     * @param constraint constraint data
     * @returns selected value
     */
    getQuestionConstraintValue(responses: ResponsePanel[], constraint: Contraints): string | number | string[] | number[] {
        let selectedValue: string | number | string[] | number[];
        let savedResponse: ResponsePanel;
        if (responses) {
            savedResponse = responses
                .filter((response) => response.type === StepType.QUESTION && response.planQuestionId === constraint.questionId)
                .pop();
            if (savedResponse && savedResponse.value.length) {
                selectedValue = savedResponse.value[0] as string | number | string[] | number[];
            }
        }
        return selectedValue;
    }
    /**
     * get value of constraint type benefit amount
     * @param responses list of responses
     * @param constraint constraint data
     * @param baseCartData base cart data
     * @param cartData cart data of rider
     * @param planObject plan object data
     * @param baseConstraintValues list of base constraint values
     * @param constraintValues list of constraint values
     * @returns benefit amount
     */
    getBenefitConstraintValue(
        responses: ResponsePanel[],
        constraint: Contraints,
        baseCartData: GetCartItems,
        cartData: GetCartItems | RiderCart,
        planObject: StepData,
        baseConstraintValues: StepConstraints,
        constraintValues: StepConstraints,
    ): number {
        let selectedValue: number;
        let savedResponse: ResponsePanel;
        if (responses) {
            savedResponse = responses.filter((response) => response.type === StepType.PLANOPTIONS).pop();
        }
        if (cartData && constraint.planId) {
            selectedValue = constraint.planId === planObject.application.planId ? cartData.benefitAmount : null;
            if (!selectedValue) {
                selectedValue = baseCartData.riders
                    .filter((cartItem) => cartItem.planId === constraint.planId)
                    .map((cartItem) => cartItem.benefitAmount)[0];
            }
        } else if (cartData) {
            if (
                !constraint.benefitAmountType ||
                (constraint.benefitAmountType &&
                    (constraint.benefitAmountType === BenefitAmountType.NONE ||
                        (constraint.benefitAmountType === BenefitAmountType.NEW_BUSINESS_GI_AMOUNT &&
                            !this.getConversionValue(baseConstraintValues, constraintValues, ContraintsType.IS_CONVERSION)) ||
                        (constraint.benefitAmountType === BenefitAmountType.CONVERSION_GI_AMOUNT &&
                            this.getConversionValue(baseConstraintValues, constraintValues, ContraintsType.IS_CONVERSION))))
            ) {
                selectedValue = cartData.benefitAmount;
                // eslint-disable-next-line no-prototype-builtins
                if (planObject.application.isAdditionalUnit && cartData.hasOwnProperty("riders")) {
                    (cartData as GetCartItems).riders
                        .filter(
                            (riderCartItem) =>
                                riderCartItem.benefitAmount && riderCartItem.coverageLevelId !== this.declinedCoverageLevelId,
                        )
                        .forEach((riderCartItem) => {
                            selectedValue += riderCartItem.benefitAmount;
                        });
                }
            }
        } else if (savedResponse && savedResponse.value.length) {
            selectedValue = (savedResponse.value[0] as PlanOptionResponse).benefitAmount;
        }
        return selectedValue;
    }
    /**
     * get value of constraint type coverage level id
     * @param responses list of responses
     * @param constraint constraint data
     * @param baseCartData base cart data
     * @param cartData cart data of rider
     * @param planObject plan object data
     * @returns coverage level id
     */
    getCoverageConstraintValue(
        responses: ResponsePanel[],
        constraint: Contraints,
        baseCartData: GetCartItems,
        cartData: GetCartItems | RiderCart,
        planObject: StepData,
    ): number {
        let selectedValue: number;
        let savedResponse: ResponsePanel;
        if (responses) {
            savedResponse = responses.filter((response) => response.type === StepType.PLANOPTIONS).pop();
        }
        if (cartData && constraint.planId) {
            selectedValue = constraint.planId === planObject.application.planId ? cartData.coverageLevelId : null;
            if (!selectedValue) {
                selectedValue = baseCartData.riders
                    .filter((cartItem) => cartItem.planId === constraint.planId)
                    .map((cartItem) => cartItem.coverageLevelId)[0];
            }
        } else if (cartData) {
            selectedValue = cartData.coverageLevelId;
        } else if (savedResponse && savedResponse.value.length) {
            selectedValue = (savedResponse.value[0] as PlanOptionResponse).coverageLevelId;
        }
        return selectedValue;
    }
    /**
     * gets list of plans currently enrolling
     * @param planObject plan object data
     * @param baseCartData base cart data
     * @param sheRiderIds the She Rider Ids from config
     * @returns list of plans currently enrolling
     */
    getPlanCurrentlyEnrolling(planObject: StepData, baseCartData: GetCartItems, sheRiderIds?: number[]): string[] {
        const plans: number[] = [];
        if (planObject.rider) {
            plans.push(planObject.basePlanId);
        } else {
            plans.push(planObject.application.planId);
        }
        const updatedApplicationPanel = this.store
            .selectSnapshot(EnrollmentState.GetApplicationPanel)
            .filter((application) => application.planId === plans[0]);
        if (updatedApplicationPanel && updatedApplicationPanel.length > 0 && updatedApplicationPanel[0].riders) {
            updatedApplicationPanel[0].riders.forEach((rider) => {
                const riderCartData = baseCartData.riders.filter((data) => data.planId === rider.appData.planId).pop();
                if (
                    riderCartData &&
                    riderCartData.coverageLevelId !== this.declinedCoverageLevelId &&
                    (!sheRiderIds ||
                        !sheRiderIds.length ||
                        (sheRiderIds.length && !sheRiderIds.some((riderId) => riderId === rider.planId)))
                ) {
                    plans.push(rider.planId);
                }
            });
        }
        return plans.map((plan) => plan.toString());
    }
    /**
     * checks if flow is conversion or not
     * @param baseConstraintValues base constraint values
     * @param constraintValues constraint values
     * @param constraintType constraint type
     * @returns if conversion or not
     */
    getConversionValue(baseConstraintValues: StepConstraints, constraintValues: StepConstraints, constraintType: string): boolean {
        let selectedValue = false;
        if (baseConstraintValues && baseConstraintValues[constraintType]) {
            selectedValue = baseConstraintValues[constraintType];
        } else if (constraintValues && constraintValues[constraintType]) {
            selectedValue = constraintValues[constraintType];
        }
        return selectedValue;
    }
    /**
     * gets risk class id value
     * @param riskClasses list of risk classes
     * @param planObject plan object data
     * @param baseCartData base cart data
     * @returns risk class id
     */
    getRiskClassValue(riskClasses: RiskClass[], planObject: StepData, baseCartData: GetCartItems): number {
        let selectedValue: number;
        const currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
        if (currentAccount && currentAccount.ratingCode === RatingCode.DUAL) {
            selectedValue = this.getDualAccountRiskClassId(planObject.application.productId);
        } else if (riskClasses && riskClasses.length && baseCartData && baseCartData.riskClassOverrideId) {
            const riskClassData = riskClasses
                .filter((riskClass) => riskClass.id === this.getRiskClassByCartId(planObject.application.cartData.id))
                .pop();
            if (riskClassData) {
                selectedValue = riskClassData.id;
            }
        } else if (Portals.MEMBER && planObject.application.carrierId === CarrierId.AFLAC) {
            selectedValue = this.store.selectSnapshot(EnrollmentState.GetMemberData).riskClassId;
        }
        return selectedValue;
    }

    // eslint-disable-next-line complexity
    checkOperation(selectedValue: any, constraintValue: any, operation: Operation): boolean {
        let returnValue = false;
        switch (operation) {
            case Operation.EQUALS:
                if (
                    selectedValue.toString().toUpperCase() === constraintValue.toString().toUpperCase() ||
                    typeof selectedValue === "object"
                ) {
                    if (typeof selectedValue === "object" && selectedValue.indexOf(constraintValue.toString()) >= 0) {
                        returnValue = true;
                    } else if (!(typeof selectedValue === "object")) {
                        returnValue = true;
                    } else {
                        returnValue = false;
                    }
                }
                break;
            case Operation.NOT_EQUALS:
                if (
                    (typeof selectedValue !== "object" &&
                        selectedValue.toString().toUpperCase() !== constraintValue.toString().toUpperCase()) ||
                    typeof selectedValue === "object"
                ) {
                    if (typeof selectedValue === "object" && selectedValue.indexOf(constraintValue.toString()) < 0) {
                        returnValue = true;
                    } else if (!(typeof selectedValue === "object")) {
                        returnValue = true;
                    } else {
                        returnValue = false;
                    }
                }
                break;
            case Operation.LESS_THAN:
                if (+selectedValue < +constraintValue && constraintValue !== "") {
                    returnValue = true;
                }
                break;
            case Operation.GREATER_THAN:
                if (+selectedValue > +constraintValue && constraintValue !== "") {
                    returnValue = true;
                }
                break;
            case Operation.LESS_THAN_OR_EQUALS:
                if (+selectedValue <= +constraintValue && constraintValue !== "") {
                    returnValue = true;
                }
                break;
            case Operation.GREATER_THAN_OR_EQUALS:
                if (+selectedValue >= +constraintValue && constraintValue !== "") {
                    returnValue = true;
                }
                break;
            default:
                returnValue = true;
        }
        return returnValue;
    }
    onNextClick(planObject: StepData, currentStepIndex: number, sectionTitle: string, riders?: string): void {
        if (planObject.rider) {
            this.stepChanged$.next({
                planObject: planObject,
                sectionIndex: planObject.rider.riderSequenceId,
                stepIndex: 0,
            });
        } else if (planObject.reinstate) {
            this.reinstateStepChanged$.next({
                planObject: planObject,
                sectionIndex: planObject.currentSection.sectionId,
                stepIndex: currentStepIndex,
            });
        } else {
            this.stepChanged$.next({
                planObject: planObject,
                sectionIndex: planObject.currentSection.sectionId,
                stepIndex: currentStepIndex,
            });
        }
    }
    getRenderedText(text: string): string {
        let renderedText = null;
        if (text) {
            renderedText = text.replace(/{glossary}/g, "");
        }
        return renderedText;
    }
    discardApplication(cartId: number, planObject?: StepData, riderCartId?: number): void {
        if (planObject && planObject.rider) {
            // method to remove rider from cart.
            this.store.dispatch(
                new DiscardRiderCartItem(
                    planObject.rider.riderIndex,
                    planObject.basePlanId,
                    riderCartId,
                    planObject.application.cartData.id,
                    planObject.application.cartData.planOffering.id,
                ),
            );
            this.riderDiscard$.next({
                planObject: planObject,
                riderIndex: planObject.rider.riderIndex,
                riderCartId: riderCartId,
                parentCartId: planObject.application.cartData.id,
            });
        } else {
            this.store.dispatch(new DiscardCartItem(cartId, false, false)).subscribe((response) => {
                this.planChanged$.next({
                    discard: true,
                    nextClicked: true,
                });
            });
        }

        // ActionDispatch to store to remove
    }
    patchConstraint(flowId: number, step: string, dataObject: GetAncillary): void {
        const constraints = AllConstraint;
        Object.entries(dataObject).forEach((data) => {
            switch (data[0]) {
                case StepEligible.ADDITION: {
                    const addition = step === data[0] ? true : data[1];
                    this.store.dispatch(new UpdateConstraintValues(constraints.ADDITION, addition, flowId));
                    break;
                }
                case StepEligible.ADDITION_ELIGIBLE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.ADDITION_ELIGIBLE, data[1], flowId));
                    break;
                case StepEligible.CONVERSION: {
                    const conversion = step === data[0] ? true : data[1];
                    this.store.dispatch(new UpdateConstraintValues(constraints.CONVERSION, conversion, flowId));
                    break;
                }
                case StepEligible.CONVERSION_ELIGIBLE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.CONVERSION_ELIGIBLE, data[1], flowId));
                    break;
                case StepEligible.DOWNGRADE: {
                    const downgrade = step === data[0] ? true : data[1];
                    this.store.dispatch(new UpdateConstraintValues(constraints.DOWNGRADE, downgrade, flowId));
                    break;
                }
                case StepEligible.DOWNGRADE_ELIGIBLE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.DOWNGRADE_ELIGIBLE, data[1], flowId));
                    break;
                case StepEligible.REINSTATEMENT: {
                    const reinstatement = step === data[0] ? true : data[1];
                    this.store.dispatch(new UpdateConstraintValues(constraints.REINSTATEMENT, reinstatement, flowId));
                    break;
                }
                case StepEligible.REINSTATEMENT_ELIGIBLE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.REINSTATEMENT_ELIGIBLE, data[1], flowId));
                    break;
                case StepEligible.BENEFIT_AMOUNT:
                    this.store.dispatch(new UpdateConstraintValues(constraints.BENEFIT_AMOUNT, data[1], flowId));
                    break;
                case StepEligible.DOWNGRADE_BENEFIT_ELIGIBLE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.DOWNGRADE_BENEFIT_ELIGIBLE, data[1], flowId));
                    break;
                case StepEligible.GUARANTEE_ISSUE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.IS_GI, data[1], flowId));
                    break;
                case StepEligible.GUARANTEE_ISSUE_ELIGIBLE:
                    this.store.dispatch(new UpdateConstraintValues(constraints.IS_Q60_ELIGIBLE_FOR_GI, data[1], flowId));
                    break;
                case StepEligible.CURRENT_POLICY_NUMBER:
                    this.store.dispatch(new UpdateConstraintValues(constraints.CURRENT_POLICY_NUMBER, data[1], flowId));
                    break;
            }
        });
    }
    /**
     * gets more settings required for pricing api based on member data
     * @param tobaccoStatus indicates tobacco status of the employee
     * @param coverageDate coverage effective date of product
     * @param cartData cartData
     * @returns more settings required for pricing api
     */
    getTobaccoSettings(tobaccoStatus: boolean, coverageDate: string, cartData: GetCartItems): MoreSettings {
        let effectiveDate;
        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        const birthdate = memberData.info.birthDate;
        if (coverageDate) {
            effectiveDate = this.dateService.toDate(coverageDate).getTime();
        } else {
            effectiveDate = Date.now;
        }
        const timeDiff = Math.abs(effectiveDate - this.dateService.toDate(birthdate).getTime());
        const memberAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
        const payFrequency = this.store.selectSnapshot(EnrollmentState.GetPayFrequency);
        const payFrequencyId = payFrequency.id;
        const salary: number = this.getMemberSalary(coverageDate);
        let addressInfo;
        if (memberData.contactInfo && memberData.contactInfo.length) {
            addressInfo = memberData.contactInfo.filter((contact) => contact.address).pop();
        }
        const spouseDetails = this.getSpouseData();
        return {
            age: memberAge,
            gender: memberData.info.gender,
            tobaccoUser: tobaccoStatus,
            state: addressInfo ? addressInfo.state : null,
            payrollFrequencyId: payFrequencyId.toString(),
            spouseAge: spouseDetails ? (spouseDetails.spouseAge ? spouseDetails.spouseAge : null) : null,
            spouseGender: spouseDetails ? (spouseDetails.spouseData ? spouseDetails.spouseData.gender : null) : null,
            annualSalary: salary ? salary : null,
            spouseTobaccoUser: this.getSpouseTobaccoUseAnswer(),
        };
    }
    getSpouseData(): SpouseDetails {
        let returnVal: SpouseDetails;
        const dependentsData = this.store.selectSnapshot(EnrollmentState.GetMemberDependents);
        const memberRelations = this.store.selectSnapshot(EnrollmentState.GetMemberDependentsRelation);
        if (dependentsData.length && memberRelations.length) {
            const spouseRelation = memberRelations.filter((relation) => relation.relationType === Relation.SPOUSE).pop();
            const spouseDependent = dependentsData.filter((dependent) => dependent.dependentRelationId === spouseRelation.id);
            if (spouseDependent && spouseDependent.length) {
                const spouseData = spouseDependent[0];
                const timeDiff = Math.abs(Date.now() - this.dateService.toDate(spouseData.birthDate).getTime());
                const spouseAge = Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25).toString();
                returnVal = { spouseData, spouseAge };
            }
        }
        return returnVal;
    }

    /**
     * Function to check if its TPI flow
     * @returns It's TPI flow or not
     */
    checkTpi(): boolean {
        return this.router.url.indexOf(AppSettings.TPI) >= 0;
    }

    /**
     * To get the assisting admin id in TPI flow
     * @returns TPI assisting admin id
     */
    getTpiAssistingAdminId(): number {
        if (this.checkTpi()) {
            this.tpiProducerId =
                this.store.selectSnapshot(TPIState.tpiSsoDetail).user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId);
            if (this.tpiProducerId) {
                this.tpiAssistingAdminId = this.tpiProducerId;
            }
        }
        return this.tpiAssistingAdminId;
    }

    /**
     * Function to update the cart item object
     * @param priceMappingIds array of price mapping ids, will either plan offering id's or cart item ids
     * @param priceList plan offering price array
     * @param cartData Cart item array
     * @param coverageEffectiveDate coverage effective date
     * @param isMappingWithCart indicates if price mapping id's are cart ids
     * @returns cartItem object array
     */
    getUpdatedCartItems(
        priceMappingIds: number[],
        priceList: PlanOfferingPricing[][],
        cartData: GetCartItems[],
        coverageEffectiveDate: string,
        isMappingWithCart?: boolean,
    ): AddCartItem[] {
        const portal = this.store.selectSnapshot(SharedState.portal);
        return cartData
            .filter((cart) => cart.coverageLevelId !== this.declinedCoverageLevelId)
            .map((cartItem) => {
                const planOfferingId = cartItem?.planOffering?.id || cartItem.planOfferingId;
                const priceData = priceList[priceMappingIds.indexOf(isMappingWithCart ? cartItem.id : planOfferingId)];
                return {
                    benefitAmount: cartItem.benefitAmount,
                    memberCost: this.getPrice(cartItem.benefitAmount, cartItem.coverageLevelId, priceData).memberCost,
                    totalCost: this.getPrice(cartItem.benefitAmount, cartItem.coverageLevelId, priceData).totalCost,
                    enrollmentMethod: cartItem.enrollmentMethod,
                    enrollmentState: cartItem.enrollmentState,
                    enrollmentCity: cartItem.enrollmentCity,
                    planOfferingId: planOfferingId,
                    coverageLevelId: cartItem.coverageLevelId,
                    coverageEffectiveDate: coverageEffectiveDate,
                    riders:
                        cartItem.riders && cartItem.riders.length
                            ? this.mapRiders(priceList, cartItem, priceMappingIds, isMappingWithCart)
                            : [],
                    assistingAdminId: this.mapAssistingAdminId(cartItem.assistingAdminId),
                    riskClassOverrideId: portal !== Portals.MEMBER ? cartItem.riskClassOverrideId : null,
                    subscriberQualifyingEventId:
                        cartItem.planOffering && cartItem.planOffering.planYearId ? cartItem.subscriberQualifyingEventId : null,
                    dependentAge: cartItem.dependentAge,
                };
            });
    }

    /**
     * Function to get the assisting admin id based on different business scenarios
     * @param assistingAdminIdValue Value of assisting admin id
     * @returns Assisting admin id
     */
    mapAssistingAdminId(assistingAdminIdValue: number): number {
        let assistingAdminId: number = null;
        if (this.tpiAssistingAdminId) {
            assistingAdminId = this.tpiAssistingAdminId;
        } else if (assistingAdminIdValue) {
            assistingAdminId = assistingAdminIdValue;
        }
        return assistingAdminId;
    }
    /**
     * Getting price based on covegareLevelId and benefitAmout
     * @param benefitAmount
     * @param coverageLevelId
     * @param priceData
     * @returns {total}
     */
    getPrice(benefitAmount: number, coverageLevelId: number, priceData: PlanOfferingPricing[]): Cost {
        let costData: PlanOfferingPricing;
        const cost: Cost = { memberCost: 0.0, totalCost: 0.0 };
        if (coverageLevelId && benefitAmount) {
            costData = priceData.find((price) => price.benefitAmount === benefitAmount && price.coverageLevelId === coverageLevelId);
        } else if (coverageLevelId) {
            costData = priceData.find((price) => price.coverageLevelId === coverageLevelId);
        }
        if (costData) {
            cost.memberCost = costData.memberCost;
            cost.totalCost = costData.totalCost;
        }
        return cost;
    }

    /**
     * Getting price based on covegareLevelId and benefitAmout
     * @param benefitAmount
     * @param coverageLevelId
     * @param priceData
     * @returns {memberCost} member cost
     */
    getMemberPrice(benefitAmount: number, coverageLevelId: number, priceData: PlanOfferingPricing[]): number {
        let costData: PlanOfferingPricing;
        if (coverageLevelId && benefitAmount) {
            costData = priceData.find((price) => price.benefitAmount === benefitAmount && price.coverageLevelId === coverageLevelId);
        } else if (coverageLevelId) {
            costData = priceData.find((price) => price.coverageLevelId === coverageLevelId);
        }
        return costData ? costData.totalCost : 0.0;
    }
    /**
     * Method to map the riders to the cartItems
     * @param priceList pricingResponse of the riders
     * @param cartItem cart items in the cart
     * @param priceMappingIds array of price mapping ids, will either plan offering id's or cart item ids
     * @param isMappingWithCart indicates if price mapping id's are cart ids
     * @returns { Ridercart[]} Rider cart items mapped to pricing
     */
    mapRiders(
        priceList: PlanOfferingPricing[][],
        cartItem: GetCartItems,
        priceMappingIds: number[],
        isMappingWithCart: boolean,
    ): RiderCart[] {
        const riders: RiderCart[] = JSON.parse(JSON.stringify(cartItem.riders));
        riders.forEach((rider) => {
            const priceData = priceList[priceMappingIds.indexOf(isMappingWithCart ? rider.cartItemId : rider.planOfferingId)];
            rider.totalCost = this.getPrice(rider.benefitAmount, rider.coverageLevelId, priceData).totalCost;
            rider.memberCost = this.getPrice(rider.benefitAmount, rider.coverageLevelId, priceData).memberCost;
        });
        return riders;
    }
    /**
     * Method to calculate the final premium cost
     * @param cartItems
     * @returns { DirectPaymentCost}
     */
    getPremiumCostDetails(cartItems: AddCartItem[]): DirectPaymentCost {
        let totalCost = 0;
        cartItems.forEach((cartData) => {
            if (cartData && cartData.totalCost) {
                totalCost += cartData.totalCost;
            }

            if (cartData.riders && cartData.riders.length) {
                cartData.riders.forEach((riderData) => {
                    totalCost += riderData.totalCost;
                });
            }
        });
        const payrollsPerYear = this.store.selectSnapshot(EnrollmentState.GetPayFrequency).payrollsPerYear;
        const directPaymentCost: DirectPaymentCost = {
            monthly: (totalCost * (payrollsPerYear / 12)).toFixed(2),
            quarterly: (totalCost * (payrollsPerYear / 4)).toFixed(2),
            semiAnnually: (totalCost * (payrollsPerYear / 2)).toFixed(2),
            annually: (totalCost * payrollsPerYear).toFixed(2),
        };
        return directPaymentCost;
    }
    getTobaccoStatus(): boolean {
        let returnValue = false;
        const appResponse = this.store.selectSnapshot(EnrollmentState.GetResponseItems);
        const tobaccoResponses = appResponse
            .map((responseData) => responseData.response.filter((responseItem) => responseItem.type === StepType.TOBACCO))
            .filter((responses) => responses.length)
            .map((responses) => responses[0])
            .filter(
                (tobaccoResponse) =>
                    tobaccoResponse &&
                    tobaccoResponse.value &&
                    tobaccoResponse.value.length > 0 &&
                    tobaccoResponse.value[0] === AppSettings.YES,
            );
        if (tobaccoResponses && tobaccoResponses.length) {
            returnValue = true;
        }
        return returnValue;
    }

    /**
     * Returns answer to the 'spouse tobacco use' question, if it is present and has been answered
     *
     * @returns true if it was answered as 'yes', false if 'no',
     * and undefined if it does not exist or has not been answered
     */
    getSpouseTobaccoUseAnswer(): boolean {
        const applicationResponses = this.store.selectSnapshot(EnrollmentState.GetApplicationResponses);
        const applications = this.store.selectSnapshot(EnrollmentState.GetApplications);

        // get all application responses
        const allApplicationResponses = applicationResponses.reduce(
            (responses, applicationResponse) => [...responses, ...applicationResponse.response],
            [],
        );

        // get the spouse tobacco use section if it exists
        const spouseTobaccoSection = applications
            .reduce((sections, application) => [...sections, ...application.sections], [])
            .find((section) => section.title === StepTitle.SPOUSE_TOBACCO);

        // find the spouse tobacco use step if it exists and get it's id
        const spouseTobaccoStep =
            spouseTobaccoSection &&
            spouseTobaccoSection.steps &&
            spouseTobaccoSection.steps.find((step) => step.title === StepTitle.SPOUSE_TOBACCO);
        const spouseTobaccoStepId = spouseTobaccoStep && spouseTobaccoStep.id;

        // use the id to find the response to that question if it has been previously answered
        const spouseTobaccoResponse =
            spouseTobaccoStepId && allApplicationResponses.find((response) => response.stepId === spouseTobaccoStepId);

        // return true if the value is "yes", false if it is "no", and undefined if it does not exist
        return spouseTobaccoResponse && spouseTobaccoResponse.value && spouseTobaccoResponse.value.length
            ? spouseTobaccoResponse.value[0] === YES_VALUE
            : undefined;
    }

    /**
     * Function to check environment is production or not
     * @returns boolean
     */
    isNotProduction(): Observable<boolean> {
        return this.staticUtilService
            .cacheConfigValue("general.environment.name")
            .pipe(map((env) => !(env === "prod" || env === "preprod")));
    }
    fetchEnrollments(mpGroup: number, memberId: number): void {
        this.enrollmentService
            .getEnrollments(memberId, mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.memberEnrollments = resp;
            });
    }
    /**
     * @description checks the enrollment restrictions and validates
     * @param enrollmentRequirements the enrollment requirements
     * @param sheRiderIds array containing id of SHE riders
     * @param cartId current plan cart id
     */
    checkEnrollmentRestrictions(
        enrollmentRequirements: ApplicationEnrollmentRequirements[],
        sheRiderIds?: number[],
        cartId?: number,
    ): boolean {
        const applicationsCurrentlyInEnrollment = this.store.selectSnapshot(EnrollmentState.GetApplicationPanel);
        const riderApplicationsCurrentlyInEnrollment = this.getRidersCurrentlyInEnrollment(applicationsCurrentlyInEnrollment);
        let valueToReturn = true;
        const children = this.dependents.filter(
            (dependent) =>
                dependent.dependentRelationId === this.dependentRelations.filter((relation) => relation.code === "CHILD").pop().id,
        );
        const spouse = this.dependents
            .filter(
                (dependent) =>
                    dependent.dependentRelationId === this.dependentRelations.filter((relation) => relation.code === "SPOUSE").pop().id,
            )
            .pop();
        const uniqueRequirementDependencyType = Array.from(
            new Set(enrollmentRequirements.map((requirements) => requirements.dependencyType)),
        );
        for (const dependencyType of uniqueRequirementDependencyType) {
            let validatedDependencyTypeFalg = false;
            for (const enrollmentRequirement of enrollmentRequirements.filter(
                (requirement) => requirement.dependencyType === dependencyType,
            )) {
                let validatedRequirementFlag = false;
                if (
                    enrollmentRequirement.dependencyType === DependencyType.REQUIRES_BROKERS_PLAN_SELECTION ||
                    enrollmentRequirement.dependencyType === DependencyType.REQUIRES_NON_GI_PARENT_ENROLLMENT ||
                    enrollmentRequirement.dependencyType === DependencyType.REQUIRES_GI_PARENT_ENROLLMENT
                ) {
                    validatedRequirementFlag = true;
                } else {
                    validatedRequirementFlag = this.validateRequirement(
                        enrollmentRequirement,
                        applicationsCurrentlyInEnrollment,
                        riderApplicationsCurrentlyInEnrollment,
                        children,
                        spouse,
                        sheRiderIds,
                        cartId,
                    );
                }
                if (
                    enrollmentRequirement.dependencyType === DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN &&
                    !validatedRequirementFlag
                ) {
                    validatedDependencyTypeFalg = false;
                    break;
                }
                validatedDependencyTypeFalg = validatedDependencyTypeFalg || validatedRequirementFlag;
            }

            if (!validatedDependencyTypeFalg) {
                valueToReturn = false;
                break;
            }
            valueToReturn = valueToReturn && validatedDependencyTypeFalg;
        }
        return !valueToReturn;
    }
    fetchMemberDependents(memberId: number, mpGroup: number): void {
        forkJoin(this.accountService.getDependentRelations(mpGroup), this.memberService.getMemberDependents(memberId, true, mpGroup))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                this.dependentRelations = response[0];
                this.dependents = response[1];
            });
    }

    /**
     * @description: Function to determine if the requirement is valid
     * @param enrollmentRequirement: Array of enrollment requirements that have plan dependencies
     * @param applicationsCurrentlyInEnrollment: the plans that are currently under enrollment
     * @param riderApplicationsCurrentlyInEnrollment: Rider applications currently under enrollment
     * @param children: dependent children member details
     * @param spouse: dependent spouse member details
     * @param sheRiderIds array containing id of SHE riders
     * @param cartId current plan cart id
     * @returns a boolean that determines if the requirement holds true
     */
    validateRequirement(
        enrollmentRequirement: ApplicationEnrollmentRequirements,
        applicationsCurrentlyInEnrollment: BasePlanApplicationPanel[],
        riderApplicationsCurrentlyInEnrollment: RiderApplicationToValidate[],
        children: MemberDependent[],
        spouse: MemberDependent,
        sheRiderIds?: number[],
        cartId?: number,
    ): boolean {
        let filteredEnrollments = this.memberEnrollments.filter(
            (enrollment) =>
                enrollmentRequirement.relatedPlanId === enrollment.planId &&
                (enrollmentRequirement.coverageLevels?.length
                    ? enrollmentRequirement.coverageLevels.find((coverage) => coverage.id === enrollment.coverageLevel?.id) !== undefined
                    : enrollment.coverageLevel?.id !== this.declinedCoverageLevelId),
        );
        let filteredPlansCurrentlyInEnrollment = [];
        if (enrollmentRequirement.relatedPlanType === "BASE") {
            filteredPlansCurrentlyInEnrollment = applicationsCurrentlyInEnrollment.filter(
                (currentEnrollment) =>
                    enrollmentRequirement.relatedPlanId === currentEnrollment.planId &&
                    (enrollmentRequirement.coverageLevels?.length
                        ? enrollmentRequirement.coverageLevels.find(
                              (coverage) => coverage.id === currentEnrollment.cartData.coverageLevelId,
                          ) !== undefined
                        : currentEnrollment.cartData.coverageLevelId !== this.declinedCoverageLevelId),
            );
            const isStackablePlan =
                filteredPlansCurrentlyInEnrollment.length > 1 &&
                filteredPlansCurrentlyInEnrollment.some((plans) => plans.characteristics.includes(Characteristics.STACKABLE));
            if (isStackablePlan) {
                filteredPlansCurrentlyInEnrollment = filteredPlansCurrentlyInEnrollment.filter((plan) => plan.cartData.id === cartId);
            }
        }
        let filteredRiderApplicationsCurrentlyInEnrollment = [];
        if (enrollmentRequirement.relatedPlanType === "RIDER") {
            filteredRiderApplicationsCurrentlyInEnrollment = riderApplicationsCurrentlyInEnrollment.filter(
                (riderApplication) =>
                    enrollmentRequirement.relatedPlanId === riderApplication.planId &&
                    (enrollmentRequirement.coverageLevels?.length
                        ? enrollmentRequirement.coverageLevels.find(
                              (coverage) => coverage.id === riderApplication.cartData.coverageLevelId,
                          ) !== undefined
                        : riderApplication.cartData.coverageLevelId !== this.declinedCoverageLevelId),
            );
        }
        if (enrollmentRequirement.benefitAmountModifier) {
            if (enrollmentRequirement.benefitAmountModifier === "EQUAL_TO") {
                filteredPlansCurrentlyInEnrollment = filteredPlansCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount === enrollmentRequirement.benefitAmount,
                );
                filteredEnrollments = filteredEnrollments.filter((plans) => plans.benefitAmount === enrollmentRequirement.benefitAmount);
                filteredRiderApplicationsCurrentlyInEnrollment = filteredRiderApplicationsCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount === enrollmentRequirement.benefitAmount,
                );
            } else if (enrollmentRequirement.benefitAmountModifier === "GREATER_THAN") {
                filteredPlansCurrentlyInEnrollment = filteredPlansCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount > enrollmentRequirement.benefitAmount,
                );
                filteredEnrollments = filteredEnrollments.filter((plans) => plans.benefitAmount > enrollmentRequirement.benefitAmount);
                filteredRiderApplicationsCurrentlyInEnrollment = filteredRiderApplicationsCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount > enrollmentRequirement.benefitAmount,
                );
            } else if (enrollmentRequirement.benefitAmountModifier === "GREATER_THAN_EQUAL_TO") {
                filteredPlansCurrentlyInEnrollment = filteredPlansCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount >= enrollmentRequirement.benefitAmount,
                );
                filteredEnrollments = filteredEnrollments.filter((plans) => plans.benefitAmount >= enrollmentRequirement.benefitAmount);
                filteredRiderApplicationsCurrentlyInEnrollment = filteredRiderApplicationsCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount >= enrollmentRequirement.benefitAmount,
                );
            } else if (enrollmentRequirement.benefitAmountModifier === "LESS_THAN") {
                filteredPlansCurrentlyInEnrollment = filteredPlansCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount < enrollmentRequirement.benefitAmount,
                );
                filteredEnrollments = filteredEnrollments.filter((plans) => plans.benefitAmount < enrollmentRequirement.benefitAmount);
                filteredRiderApplicationsCurrentlyInEnrollment = filteredRiderApplicationsCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount < enrollmentRequirement.benefitAmount,
                );
            } else if (enrollmentRequirement.benefitAmountModifier === "LESS_THAN_EQUAL_TO") {
                filteredPlansCurrentlyInEnrollment = filteredPlansCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount <= enrollmentRequirement.benefitAmount,
                );
                filteredEnrollments = filteredEnrollments.filter((plans) => plans.benefitAmount <= enrollmentRequirement.benefitAmount);
                filteredRiderApplicationsCurrentlyInEnrollment = filteredRiderApplicationsCurrentlyInEnrollment.filter(
                    (plans) => plans.cartData.benefitAmount <= enrollmentRequirement.benefitAmount,
                );
            }
        }

        return this.validateDependencyTypes(
            enrollmentRequirement,
            filteredPlansCurrentlyInEnrollment,
            filteredRiderApplicationsCurrentlyInEnrollment,
            filteredEnrollments,
            spouse,
            children,
            sheRiderIds,
        );
    }
    /**
     * @description computes the value for non-selection dependency type
     * @param enrollmentRequirement takes in the enrollment requirement to be validated
     * @param filteredRiderApplicationsCurrentlyInEnrollment takes in the filtered rider plans that are currently in enrollment
     * @param primarySheRiderId the id of the primary she rider
     * @param secondarySheRiderId the id of the secondary she rider
     * @returns {boolean} the computed value
     */
    nonSelectionDependency(
        enrollmentRequirement: ApplicationEnrollmentRequirements,
        filteredRiderApplicationsCurrentlyInEnrollment: RiderApplicationToValidate[],
        primarySheRiderId: number,
        secondarySheRiderId: number,
    ): boolean {
        let validatedRequirementFlag = true;
        const riderPlanIdsInEnrollment = filteredRiderApplicationsCurrentlyInEnrollment.map((riderPlan) => riderPlan.planId);
        const primarySheRiderPresent = riderPlanIdsInEnrollment.includes(+primarySheRiderId);
        const secondarySheRiderPresent = riderPlanIdsInEnrollment.includes(+secondarySheRiderId);
        if (!secondarySheRiderPresent) {
            validatedRequirementFlag = !riderPlanIdsInEnrollment.includes(enrollmentRequirement.relatedPlanId);
        }
        if (!primarySheRiderPresent && validatedRequirementFlag) {
            this.setSheRiderDisableVal(false);
        }
        return validatedRequirementFlag;
    }
    /**
     * this function will validate the dependency type and will return a boolean flag
     * based on the validation of dependency type for enrollment requirement of riders
     * @param enrollmentRequirement takes in the enrollment requirement to be validated
     * @param filteredPlansCurrentlyInEnrollment takes in the filteredPlansCurrentlyInEnrollment
     * based on coverage level and benefit amount requirement to  validate the dependency type
     * @param filteredRiderApplicationsCurrentlyInEnrollment takes in the filtered rider plans that are currently in enrollment
     * @param filteredEnrollments takes in the filteredEnrollments based on coverage
     * level and benefit amount requirement to validate the dependency type
     * @param spouse spouse details of the member enrolling
     * @param children children details of the member enrolling
     * @param sheRiderIds array containing id of SHE riders
     * @returns boolean flag which states if the requirement is validated or not
     */
    validateDependencyTypes(
        enrollmentRequirement: ApplicationEnrollmentRequirements,
        filteredPlansCurrentlyInEnrollment: BasePlanApplicationPanel[],
        filteredRiderApplicationsCurrentlyInEnrollment: RiderApplicationToValidate[],
        filteredEnrollments: Enrollments[],
        spouse: MemberDependent,
        children: MemberDependent[],
        sheRiderIds?: number[],
    ): boolean {
        let validatedRequirementFlag = false;
        const [primarySheRiderId, secondarySheRiderId] = sheRiderIds;
        if (
            (enrollmentRequirement.dependencyType === DependencyType.REQUIRES_ENROLLMENT_IN_ANOTHER_PLAN ||
                enrollmentRequirement.dependencyType === DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN ||
                enrollmentRequirement.dependencyType === DependencyType.REQUIRES_SELECTION_IN_ANOTHER_PLAN) &&
            ((filteredEnrollments &&
                filteredEnrollments.map((filteredEnrollment) => filteredEnrollment.planId).indexOf(enrollmentRequirement.relatedPlanId) >=
                    0) ||
                (enrollmentRequirement.relatedPlanType === "BASE" &&
                    filteredPlansCurrentlyInEnrollment &&
                    filteredPlansCurrentlyInEnrollment
                        .map((currentEnrollment) => currentEnrollment.planId)
                        .indexOf(enrollmentRequirement.relatedPlanId) >= 0) ||
                (enrollmentRequirement.relatedPlanType === "RIDER" &&
                    filteredRiderApplicationsCurrentlyInEnrollment
                        .map((riderPlan) => riderPlan.planId)
                        .indexOf(enrollmentRequirement.relatedPlanId) >= 0))
        ) {
            validatedRequirementFlag = true;
        }
        if (
            enrollmentRequirement.dependencyType === DependencyType.REQUIRES_NONSELECTION_IN_ANOTHER_PLAN &&
            enrollmentRequirement.relatedPlanType === "RIDER"
        ) {
            validatedRequirementFlag = this.nonSelectionDependency(
                enrollmentRequirement,
                filteredRiderApplicationsCurrentlyInEnrollment,
                primarySheRiderId,
                secondarySheRiderId,
            );
        }
        if (enrollmentRequirement.dependencyType === DependencyType.REQUIRES_NONENROLLMENT_IN_ANOTHER_PLAN) {
            {
                validatedRequirementFlag = !validatedRequirementFlag;
            }
        } else if (enrollmentRequirement.dependencyType === DependencyType.REQUIRES_ELIGIBLE_CHILD && children && children.length > 0) {
            validatedRequirementFlag = true;
        } else if (enrollmentRequirement.dependencyType === DependencyType.REQUIRES_ELIGIBLE_SPOUSE && spouse && spouse.gender) {
            validatedRequirementFlag = true;
        }
        return validatedRequirementFlag;
    }
    getRidersCurrentlyInEnrollment(basePlanApplications: BasePlanApplicationPanel[]): RiderApplicationToValidate[] {
        const riderApplicationsToReturn = [];
        basePlanApplications.forEach((application) => {
            if (application.riders && application.riders.length > 0) {
                application.riders.forEach((rider) => {
                    riderApplicationsToReturn.push({
                        planId: rider.planId,
                        cartData: rider.cartData.riders.filter((data) => data.planId === rider.planId).pop(),
                    });
                });
            }
        });
        return riderApplicationsToReturn;
    }
    getTobaccoResponse(planObject: StepData): boolean {
        let returnVal = false;
        let tobaccoStepId: number;
        let application: BasePlanApplicationPanel;
        let planId: number;
        let cartId = planObject.application.cartData.id;
        if (planObject.rider || planObject.isRider) {
            tobaccoStepId = this.getTobaccoStep(planObject.application);
            planId = planObject.application.planId;
            if (!tobaccoStepId) {
                application = this.store
                    .selectSnapshot(EnrollmentState.GetApplicationPanel)
                    .filter((panel) => panel.planId === planObject.basePlanId)
                    .pop();
                tobaccoStepId = this.getTobaccoStep(application);
                planId = planObject.basePlanId;
            }
            const rider =
                planObject &&
                planObject.application &&
                planObject.application.cartData &&
                planObject.application.cartData.riders &&
                planObject.application.cartData.riders.find((cartDataRider) => cartDataRider.planId === planId);

            cartId = rider ? rider.cartItemId : cartId;
        } else {
            planId = planObject.application.planId;
            tobaccoStepId = this.getTobaccoStep(planObject.application);
        }
        if (tobaccoStepId) {
            returnVal = this.getTobaccoResponseByPlan(planId, tobaccoStepId, cartId);
        }
        return returnVal;
    }

    getTobaccoStep(application: BasePlanApplicationPanel): number {
        let stepId = 0;
        application.appData.sections.forEach((section) => {
            section.steps.forEach((stepList) =>
                stepList.step.forEach((step) => {
                    if (step.type === StepType.TOBACCO) {
                        stepId = step.id;
                    }
                }),
            );
        });
        return stepId;
    }

    /**
     * Returns answer to the tobacco question in the enrollment flow for a specific plan
     *
     * @param planId plan's id
     * @param tobaccoStepId step id of the tobacco question
     * @param cartId cart's id
     * @returns true if the question was answered as 'yes', false otherwise
     */
    getTobaccoResponseByPlan(planId: number, tobaccoStepId: number, cartId: number): boolean {
        let returnVal = false;
        let tobaccoStepResponse;

        const appResponses = this.store
            .selectSnapshot(EnrollmentState.GetResponseItems)
            .find((appResponse) => appResponse.planId === planId && appResponse.cartId === cartId);

        if (appResponses && appResponses.response && appResponses.response.length) {
            const tobaccoResponse = appResponses.response.find((response) => response.stepId === tobaccoStepId);
            tobaccoStepResponse = tobaccoResponse && tobaccoResponse.value;
        }
        if (tobaccoStepResponse && tobaccoStepResponse.length && tobaccoStepResponse[0] === YES_VALUE) {
            returnVal = true;
        }
        return returnVal;
    }
    /**
     * gets member salary based on coverage effective date
     * @param coverageEffectiveDate coverage effective date
     * @returns salary
     */
    getMemberSalary(coverageEffectiveDate: string): number {
        let salary = 0;
        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        if (memberData.salaryInfo && memberData.salaryInfo.length) {
            const salaryInfo: Salary | undefined = memberData.salaryInfo.find(
                (salInfo) =>
                    (this.dateService.getIsAfterOrIsEqual(
                        this.dateService.toDate(coverageEffectiveDate),
                        this.dateService.toDate(salInfo.validity.effectiveStarting),
                    ) &&
                        this.dateService.isBeforeOrIsEqual(
                            this.dateService.toDate(coverageEffectiveDate),
                            this.dateService.toDate(salInfo.validity.expiresAfter),
                        )) ||
                    !salInfo.validity.expiresAfter,
            );
            if (salaryInfo) {
                if (salaryInfo.annualSalary) {
                    salary = +salaryInfo.annualSalary;
                } else if (salaryInfo.hourlyWage) {
                    salary = +salaryInfo.hourlyWage * salaryInfo.hoursPerYear;
                }
            }
        }
        return salary;
    }
    /**
     * Get coverage start date to update the item in cart
     * @param {string} currentCoverageDate
     * @returns {string}
     * @memberof AppFlowService
     */
    getCoverageDateToUpdateCart(currentCoverageDate: string): string {
        const coverageDateToCompare = this.dateService.toDate(currentCoverageDate);
        const todaysDate = new Date();
        todaysDate.setHours(0, 0, 0, 0);
        coverageDateToCompare.setHours(0, 0, 0, 0);
        if (coverageDateToCompare < todaysDate) {
            return this.datepipe.transform(this.dateService.addDays(todaysDate, 1), DateFormats.YEAR_MONTH_DAY);
        }
        return currentCoverageDate;
    }
    /**
     * gets updated risk class for cartItems from store
     * @param cartId cart id for which risk class is required
     * @returns number updated riskClassOverrideId
     */
    getRiskClassByCartId(cartId: number): number {
        let riskClassOverrideId: number;
        const updatedCartItem: GetCartItems = this.store
            .selectSnapshot(EnrollmentState.GetCartItem)
            .filter((cartItem) => cartItem.id === cartId)
            .pop();
        if (updatedCartItem) {
            riskClassOverrideId = updatedCartItem.riskClassOverrideId;
        }
        return riskClassOverrideId;
    }
    /**
     * the below method is used to fetch parent plan tax status based on cartItemId
     * @param cartItemId
     * @returns tax status response saved in parent plan step
     */
    getParentPlanTaxStatus(cartItemId: number): TaxStatus {
        let valueToReturn: TaxStatus = null;
        const parentAppResponses = this.store
            .selectSnapshot(EnrollmentState.GetApplicationResponses)
            .filter((resp) => resp.cartId === cartItemId)
            .pop();
        if (parentAppResponses && parentAppResponses.response.length > 0) {
            const taxStatusResponse = parentAppResponses.response
                .filter((response) => response.type === APPLICATION_STEPTYPE.TAX_STATUS)
                .pop();
            if (taxStatusResponse && taxStatusResponse.value.length > 0) {
                valueToReturn = taxStatusResponse.value[0];
            }
        }
        return valueToReturn;
    }
    /**
     * method will return the call center pin
     */
    getcallCenterPin(): string {
        return this.callCenterPin;
    }
    /**
     * @param pin will set the callCenterPin variable with pin param
     * method will set the call center pin
     */
    setcallCenterPin(pin: string): void {
        this.callCenterPin = pin;
    }
    /**
     * gets all questionId's in the application
     * @param application application data
     * @returns array of numbers with question id's
     */
    getApplicationQuestionIds(application: BasePlanApplicationPanel): number[] {
        const questionIds: number[] = [];
        application.appData.sections.forEach((section) => {
            section.steps.forEach((stepList) => {
                stepList.step.forEach((step) => {
                    if (step.type === StepType.QUESTION) {
                        questionIds.push((step.question as Question).id);
                    }
                });
            });
        });
        return questionIds;
    }
    /**
     * generic method is used to iterate PdaAccount
     * @param account - account used for enrollment
     * @param enrollmentMethod - method of enrollment
     * @param enrollmentState - state of enrollment
     * @returns state for pda to show or not
     */
    iteratePdaAccount(account: string, enrollmentMethod: string, enrollmentState: string): boolean {
        let returnFlag = false;
        const enrollmentMethods = [
            EnrollmentMethod.FACE_TO_FACE,
            EnrollmentMethod.HEADSET,
            EnrollmentMethod.CALL_CENTER,
            EnrollmentMethod.VIRTUAL_FACE_TO_FACE,
        ];
        if (
            PdaAccount.PAYROLL === account &&
            enrollmentMethods.includes(enrollmentMethod as EnrollmentMethod) &&
            enrollmentState === AppSettings.PR
        ) {
            returnFlag = true;
        }
        return returnFlag;
    }
    /** To get the next button name in the TPI footer
     * @param lastStep - A boolean value which depicts if the application is in the last step
     * @param nextProduct - String value which depicts the next product if any
     * @param hasAflacAlways - A boolean value which depicts if the application has aflac always
     * @param fromDirect - A boolean value which depicts if it is a direct payment
     * @param hasEBSBilling - A boolean value which depicts if it is has EBS billing
     * @returns name of the button
     */
    onNextTPIButton(lastStep: boolean, nextProduct: string, hasAflacAlways: boolean, fromDirect: boolean, hasEBSBilling: boolean): string {
        let nextButtonName: string;
        if (lastStep && nextProduct) {
            nextButtonName = nextProduct;
        } else if (lastStep && !nextProduct && hasAflacAlways && !fromDirect && !hasEBSBilling) {
            nextButtonName = StaticStep.AFLAC_ALWAYS;
        } else if (lastStep && !nextProduct && (fromDirect || hasEBSBilling)) {
            nextButtonName = StaticStep.BILLING;
        } else if (lastStep && !nextProduct && !hasAflacAlways && !fromDirect && !hasEBSBilling) {
            nextButtonName = StaticStep.ONE_SIGNATURE;
        }
        return nextButtonName;
    }
    /**
     * gets coverage summary url based
     * @param baseUrl base Url of application flow
     * @param mpGroup mp group
     * @param memberId member id
     * @return coverage summary url
     */
    getCoverageSummaryUrl(baseUrl: string, mpGroup: number, memberId: number): string {
        const portal: string = this.store.selectSnapshot(SharedState.portal);
        const isMember: boolean = portal === Portals.MEMBER;
        const isDirectAcc = this.store.selectSnapshot(EnrollmentState.IsDirect);
        let isTpi: boolean;
        if (baseUrl.indexOf(AppSettings.TPI) >= 0) {
            isTpi = true;
        }
        let url = "";
        if (isMember && !isTpi) {
            url = "member/coverage/enrollment/benefit-summary/coverage-summary";
        } else if (isTpi) {
            url = "tpi/coverage-summary";
        } else {
            url = isDirectAcc
                ? `producer/direct/customers/${mpGroup}/${memberId}/coverage-summary`
                : `producer/payroll/${mpGroup}/member/${memberId}/enrollment/benefit-summary/coverage-summary`;
        }
        return url;
    }
    /**
     * Restricts coverage level availability as per the matrix below:
     * 'Individual' CL - No spouse/No Dependent
     * 'Individual'/'Named Insured/Spouse Only' CLs- Spouse/No Dependent
     * 'Individual'/'One Parent Family' CLs - No Spouse/Dependent
     * Any CLS - Spouse/Dependent
     * @param dependents member's dependents
     * @param dependentRelations dependent relation model
     * @param coverageLevels all applicable coverage levels
     * @returns restricted coverage levels
     */
    restrictCoverageLevelsBasedOnDependents(
        dependents: MemberDependent[],
        dependentRelations: Relations[],
        coverageLevels: CoverageLevel[],
    ): CoverageLevel[] {
        const hasSpouse = this.memberHasRelation(dependents, dependentRelations, Relation.SPOUSE);
        const hasChild = this.memberHasRelation(dependents, dependentRelations, Relation.CHILD);
        if (hasSpouse && !hasChild) {
            return coverageLevels.filter(
                (coverageLevel) =>
                    [CoverageLevelNames.INDIVIDUAL_COVERAGE, CoverageLevelNames.NAME_INSURED_SPOUSE_ONLY_COVERAGE].includes(
                        coverageLevel.name as CoverageLevelNames,
                    ) || CoverageLevelNames.ENROLLED_COVERAGE === (coverageLevel.name as CoverageLevelNames),
            );
        }
        if (!hasSpouse && hasChild) {
            return coverageLevels.filter(
                (coverageLevel) =>
                    [CoverageLevelNames.INDIVIDUAL_COVERAGE, CoverageLevelNames.ONE_PARENT_FAMILY_COVERAGE].includes(
                        coverageLevel.name as CoverageLevelNames,
                    ) || CoverageLevelNames.ENROLLED_COVERAGE === (coverageLevel.name as CoverageLevelNames),
            );
        }
        if (!hasSpouse && !hasChild) {
            return coverageLevels.filter(
                (coverageLevel) =>
                    CoverageLevelNames.INDIVIDUAL_COVERAGE === (coverageLevel.name as CoverageLevelNames) ||
                    CoverageLevelNames.ENROLLED_COVERAGE === (coverageLevel.name as CoverageLevelNames),
            );
        }
        return coverageLevels;
    }
    /**
     * Helper function that returns whether member has a dependent with the specified relation
     * @param dependents member's dependents
     * @param dependentRelations the dependent relations models
     * @param relationType whether the dependent is spouse / child / grandchild
     * @returns whether member has a dependent with the specified relation
     */
    memberHasRelation(dependents: MemberDependent[], dependentRelations: Relations[], relationType: Relation): boolean {
        return !!dependents.find(
            (dependent) =>
                dependent.dependentRelationId === dependentRelations.find((relation) => relation.relationType === relationType).id,
        );
    }
    /**
     * Helper function to filter array of coverage level objects based on the given names
     * @param coverageLevels coverage levels to be filtered
     * @param levels coverage level names
     * @returns filtered coverage level array
     */
    filterCoverageLevels(coverageLevels: CoverageLevel[], levels: CoverageLevelNames[]): CoverageLevel[] {
        return coverageLevels.filter((coverageLevel) => levels.includes(coverageLevel.name as CoverageLevelNames));
    }
    /**
     * Helper function to get the risk class ID for dual account
     * @param productId selected product ID
     * @returns risk class ID for selected product
     */
    getDualAccountRiskClassId(productId: number): number {
        const memberData = this.store.selectSnapshot(EnrollmentState.GetMemberData);
        let riskClassId = NaN;
        if (productId === ProductId.ACCIDENT || productId === ProductId.SHORT_TERM_DISABILITY) {
            const productRiskClass = memberData.dualRiskClasses.find((riskClass) => riskClass.productId === productId);
            if (productRiskClass) {
                riskClassId = productRiskClass.id;
            }
        }
        return riskClassId;
    }

    /**
     * Determines whether self-service enrollment is banned in member portal
     * @returns observable of whether self-service enrollment is banned
     */
    isSelfServiceEnrollmentBanned(mpGroup?: number): Observable<boolean> {
        return combineLatest([
            this.store.select(SharedState.portal),
            this.store.select(EnrollmentState.GetEnrollmentState),
            this.staticService.getConfigurations(ConfigName.STATES_BANNED_FROM_SELF_SERVICE_ENROLLMENT, mpGroup),
        ]).pipe(
            map(
                ([portal, enrollmentState, bannedStates]) =>
                    (portal === Portals.MEMBER || (this.checkTpi() && !this.getTpiAssistingAdminId())) &&
                    bannedStates &&
                    bannedStates.length &&
                    bannedStates[0].value.split(",").includes(enrollmentState),
            ),
        );
    }

    /**
     * Get latest tobacco status for employee/spouse
     */
    getLatestTobaccoStatus(): BehaviorSubject<TobaccoStatusObject> {
        return this.latestTobaccoStatus$;
    }

    /**
     * Set latest tobacco status for employee/spouse
     * @param tobaccoStatus latest tobacco status object
     */
    setLatestTobaccoStatus(tobaccoStatus: TobaccoStatusObject): void {
        this.latestTobaccoStatus$.next(tobaccoStatus);
    }

    /**
     * update list of members visited Hipaa consent form
     * @employeeList list of updated employee Ids
     */
    updateHipaaConsentCheckbox(employeeList: string[]): void {
        this.readHipaaConsentForm$.next(Object.assign([], employeeList));
    }

    /**
     * This method emits age limit for child in life product
     * @param ageLimit to get min and max age limit
     * @returns void
     */
    emitAgeLimitForChild(ageLimit: { minAge: number; maxAge: number }): void {
        this.ageLimitForChild$.next(ageLimit);
    }

    /**
     * @description This method emits the value to the planChanged$ subject and will use default option
     * @param value
     */
    nextPlanChanged(value?: { nextClicked: boolean; discard: false }): void {
        const options = value ?? { nextClicked: true, discard: false };

        this.planChanged$.next(options);
    }

    /**
     * @description This method emits the value to the planChanged$ subject for step 3
     * @param offset
     */
    nextLastCompleteStaticStep(offset: number = 0): void {
        this.lastCompleteStaticStep.next(3 + offset);
    }

    /**
     * @description This method emits the value to the planChanged$ subject for step 2
     * @param offset
     */
    nextLastCompleteEBSAccountStaticStep(offset: number = 0): void {
        this.lastCompleteStaticStep.next(2 + offset);
    }

    /**
     * @description This method emits the value to the reinstateLastCompleteStaticStep$ subject for step 2
     * @param offset
     */
    nextReinstateLastCompleteStaticStep(offset: number = 0): void {
        this.reinstateLastCompleteStaticStep$.next(2 + offset);
    }

    /**
     * Get review aflac always status
     */
    getReviewAflacAlwaysStatus(): BehaviorSubject<string> {
        return this.reviewAflacAlwaysStatus$;
    }

    /**
     * Set review aflac always status
     * @param reviewAflacAlwaysStatus review aflac always status variable
     */
    setReviewAflacStatus(reviewAflacAlwaysStatus: string): void {
        this.reviewAflacAlwaysStatus$.next(reviewAflacAlwaysStatus);
    }

    /**
     * Get review aflac always initial
     */
    getReviewAflacAlwaysInitial(): BehaviorSubject<string> {
        return this.reviewAflacAlwaysInitial$;
    }

    /**
     * Set review aflac always initial
     * @param reviewAflacAlwaysInitial aflac always initial
     */
    setReviewAflacInitial(reviewAflacAlwaysInitial: string): void {
        this.reviewAflacAlwaysInitial$.next(reviewAflacAlwaysInitial);
    }

    /**
     * Get trigger to reevaluate AA review modal
     */
    getReevaluateReviewAflacAlways(): BehaviorSubject<boolean> {
        return this.reevaluateReviewAflacAlways$;
    }

    /**
     * Set status to trigger reevaluate
     * @param reevaluateReviewAflacAlways
     */
    setReevaluateReviewAflacAlways(reevaluateReviewAflacAlways: boolean): void {
        this.reevaluateReviewAflacAlways$.next(reevaluateReviewAflacAlways);
    }
}
