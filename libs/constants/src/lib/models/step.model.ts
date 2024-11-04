import { ConstraintAggregates } from "./constraint-aggregates.model";
import { Demographics } from "./demographics.model";
import { Question } from "./question.model";

export interface Step {
    id: number;
    type: string;
    title: string;
    directions: string;
    body: string;
    constraintAggregates: ConstraintAggregates;
    deniedText?: string;
    includePolicyImport?: boolean;
    policyNumberText?: string;
    importRequired?: boolean;
    member?: Demographics;
    spouse?: Demographics;
    child?: Demographics;
    amountContributed?: number;
    payrollsRemainingInYear?: number;
    nextPayrollDate?: string;
    coverageLevelLabel?: string;
    benefitAmountLabel?: string;
    showCoverageDescriptions?: boolean;
    retainCurrentAmount?: boolean;
    benefitAmountOrderDesc?: boolean;
    min?: number;
    max?: number;
    maxPrimary?: number;
    maxSecondary?: number;
    question?: Question;
    tobaccoResponse?: string;
    nontobaccoResponse?: string;
    prepopulate?: boolean;
    tobaccoResponseShownFirst?: boolean;
    showStep?: boolean;
    readOnly?: boolean;
    completed?: boolean;
    headlineLast?: string;
    directionsLast?: string;
    currentJobLabel?: string;
    riskClassLabel?: string;
    ratingCode?: string;
    writingNumberApplicable?: boolean;
    deductionFrequencyApplicable?: boolean;
    aflacGroupLocationApplicable?: boolean;
    resendOtpText?: string;
}
