import { Validity, CoverageLevel, PaymentType, EnrollmentBeneficiary, TaxStatus, SummaryTaxStatus } from "@empowered/constants";

export interface PaymentInfo {
    paymentType: PaymentType;
    lastFour: string;
}

export interface MemberEnrollmentCoverage {
    productKey: number;
    productName: string;
    planName: string;
    pendingReason: string;
    status: string;
    carrierName: string;
    carrierStatus?: string;
    coverageLevel: CoverageLevel;
    benefitAmount: number;
    totalCost: number;
    taxStatus: string;
    coverageDates: Validity;
    riderNames: string[];
    policyNumber: string;
    eliminationPeriod: string;
    paymentInformation?: PaymentInfo;
    beneficiaries: EnrollmentBeneficiary[];
    iconPath: string;
    cardColorCode: string;
}

export interface MemberEnrollmentDetail {
    coverages: MemberEnrollmentCoverage[];
    preTaxTotal: number;
    postTaxTotal: number;
}

export interface MemberEnrollmentSummary {
    payFrequencyType: string;
    latestEnrollmentDate: string;
    currentCoverage: MemberEnrollmentDetail;
    updatedAndNewCoverage: MemberEnrollmentDetail;
}
