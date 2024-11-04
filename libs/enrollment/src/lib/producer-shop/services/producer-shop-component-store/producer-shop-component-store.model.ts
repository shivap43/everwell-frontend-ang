import { KnockoutQuestion } from "@empowered/api";

import {
    AddToCartItem,
    AsyncData,
    ProductId,
    SalarySummary,
    TobaccoInformation,
    UpdateCartItem,
    PayFrequency,
    RiskClass,
    KnockoutType,
    CoverageLevel,
    EnrollmentRider,
    AgAppResponse,
    Gender,
} from "@empowered/constants";
import { EliminationPeriod } from "@empowered/ngrx-store/ngrx-states/plan-offerings/plan-offerings.model";
import { EntityState } from "@ngrx/entity";
import { RiderState, RiderStateValidationOptions } from "../rider-state/rider-state.model";

export interface PanelIdentifiers {
    planOfferingId: number;
    enrollmentId?: number | null;
    cartId?: number | null;
}

export interface RiderPanelIdentifiers extends PanelIdentifiers {
    riderPlanOfferingId: number;
}

export interface MoreSettings extends SalarySummary {
    payFrequency: PayFrequency;
    memberGender: Gender;
    memberAge: number;
    spouseGender?: Gender | null;
    spouseAge?: number | null;
    numberOfDependentsExcludingSpouse: number;
}

export interface ApplicantDetails {
    memberGender: Gender;
    memberAge: number;
}

export interface SpouseDetails {
    spouseGender: Gender;
    spouseAge: number;
}

export interface ProductCoverageDate {
    productId: ProductId;
    productName: string;
    // TODO [Types]: Add comment explaining format for date string (there's two expected variations, one for moment and one for DatePipe)
    date: string;
}

export interface ProducerShopState {
    riskClasses: AsyncData<RiskClass[]>;
    moreSettings: AsyncData<MoreSettings>;
    applicantDetails: AsyncData<ApplicantDetails>;
    spouseDetails: AsyncData<SpouseDetails>;
    tobaccoInformation: AsyncData<TobaccoInformation>;
    productCoverageDates: AsyncData<ProductCoverageDate[]>;
    enrollmentDetailsStates: AsyncData<Record<number, EnrollmentDetailsState>>;
    answeredKnockoutQuestions: AnsweredKnockoutQuestions;
    knockoutDialogResponse: KnockoutDialogResponse[];
    riderStates: EntityState<RiderState>;
    planKnockoutEligibility: PlanKnockoutEligibilities;
    eliminationPeriodStates: EntityState<EliminationPeriodState>;
    benefitAmountStates: EntityState<BenefitAmountState>;
    coverageLevelStates: EntityState<CoverageLevelState>;
    dependentAgeStates: EntityState<DependentAgeState>;
    annualContributionStates: EntityState<AnnualContributionState>;
}

export interface PlanKnockoutEligibility {
    /** plan offering id */
    planOfferingId: number;
    /** knockout Type, indicating plan knockout type */
    knockoutType: KnockoutType;
    /** list of knockout questions */
    questions?: KnockoutQuestion[];
    /** cart item data that was tried to add with knockout response */
    cartObject?: AddToCartItem | UpdateCartItem;
}

export type PlanKnockoutEligibilities = EntityState<PlanKnockoutEligibility>;

// TODO [Knockout Questions]: Have to confirm possible enum values for RADIO questions
export enum AnswerKnockoutQuestionValue {
    YES = "yes",
    NO = "no",
    NA = "n/a",
}

// Use key instead of id to compare knockout questions, allowing several knockoutTypes to be compared in within KnockoutQuestions epic code
export interface AnsweredKnockoutQuestion {
    id: number;
    key: string;
    answer: AnswerKnockoutQuestionValue | string | AgAppResponse | { [key: string]: string | number };
}
export type AnsweredKnockoutQuestions = EntityState<AnsweredKnockoutQuestion>;

export interface EnrollmentDetailsState {
    edit: boolean;
}

export interface KnockoutDialogResponse {
    key: string;
    planQuestionId: number;
    stepId: number;
    type: string;
    value: string[];
}

/**
 * Contains important identifiers and values related to a `Elimination Period`
 */
export interface EliminationPeriodState {
    /** Selected `Elimination Period` */
    eliminationPeriod: EliminationPeriod;
    /** `PlanOffering id` + `Enrollment id` + `CartItem id` associated with `Elimination Period` */
    panelIdentifiers: PanelIdentifiers;
}

/**
 * Used to populate RiderStates.
 * The following `RiderStateValidationOptions` properties are required to determine default disabled/checked state.
 */
export interface AddRiderOptions extends RiderStateValidationOptions {
    /**
     * RiderStates that are expected to be added to ComponentStore
     */
    riderStates: RiderState[];
}

/**
 * Used to toggle checked/unchecked state of RiderStates.
 * The following `RiderStateValidationOptions` properties are required to determine default disabled/checked state.
 */
export interface UpdateRiderOptions extends RiderStateValidationOptions {
    /**
     * PanelIdentifiers to filter RiderStates by
     */
    panelIdentifiers: PanelIdentifiers[];
    /**
     * selectedPanelEnrollment riders for updating or un checking riders based on enrollment riders
     */
    selectedPanelEnrollmentRiders: EnrollmentRider[];
}

/**
 * Contains important identifiers and values related to a `Benefit Amount`.
 */
export interface BenefitAmountState {
    /** Selected `Benefit Amount` */
    benefitAmount: number;
    /** /** `PlanOffering id` + `Enrollment id` + `CartItem id` associated with `Benefit Amount` */
    panelIdentifiers: PanelIdentifiers;
}

export interface CoverageLevelState {
    /** Selected `Coverage Level` */
    coverageLevel: CoverageLevel;
    /** /** `PlanOffering id` + `Enrollment id` + `CartItem id` associated with `Coverage Level` */
    panelIdentifiers: PanelIdentifiers;
}

/**
 * Contains important identifiers and values related to a `Dependent Age`
 */
export interface DependentAgeState {
    /** Selected `Dependent Age` */
    dependentAge: number;
    /** /** `PlanOffering id` + `Enrollment id` + `CartItem id` associated with `Dependent Age` */
    panelIdentifiers: PanelIdentifiers;
}

/**
 * Contains identifiers and values related to the `Contribution amount`
 */
export interface AnnualContributionState {
    /** Entered `Contribution amount` */
    annualContribution: number;
    /** /** `PlanOffering id` + `Enrollment id` + `CartItem id` associated with `Contribution amount` */
    panelIdentifiers: PanelIdentifiers;
    /** Is valid contribution */
    isValid?: boolean;
}
