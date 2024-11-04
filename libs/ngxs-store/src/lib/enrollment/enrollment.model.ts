import { KnockoutQuestion } from "@empowered/api";
import { CustomSection, StepData, Question, ApplicationResponse } from "@empowered/constants";
export interface StepDetails {
    stepData?: StepData;
    sectionIndex?: number;
    stepIndex?: number;
}
export interface KnockOutData {
    knockoutQuestions: KnockoutQuestion[];
    responseAnswers: ApplicationResponse[];
    planId: number;
    coverageLevel: number;
    disable: boolean;
}

export enum AccountTypes {
    LIST_BILL_ACCOUNT = "is_listbill_partner_account_type",
    ACH_ACCOUNT = "is_ach_partner_account_type",
    EBS_ACCOUNT = "ebs_indicator",
}
export interface SkippedStepData {
    responses: ApplicationResponse;
    planId: number;
}
export interface SpouseKnockout {
    question: Question[];
    type: string;
}
export interface RiderSectionData {
    riderSections: CustomSection[];
    riderAttributeName: string;
}
export interface RiskClassId {
    riskClassId: number;
}
