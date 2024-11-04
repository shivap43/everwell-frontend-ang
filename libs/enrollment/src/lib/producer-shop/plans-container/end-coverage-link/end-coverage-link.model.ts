import { TaxStatus, Enrollments, MemberProfile } from "@empowered/constants";

/**
 * Interface modal for required field needed for end coverage request
 */
export interface EnrolledDetailData {
    mpGroup: number;
    memberId: number;
    selectedEnrolledData: Enrollments | null;
    memberDetail: MemberProfile;
}

/**
 * Interface modal for end coverage dialog input
 */
export interface EndCoverageModalInput {
    memberId: number;
    mpGroup: number;
    enrollmentId: number;
    enrollmentTaxStatus: TaxStatus;
    coverageStartDate: string | Date;
    expiresAfter: string | Date;
    planName: string;
    employeeName: string;
    isShop: boolean;
    isArgus?: boolean;
}
