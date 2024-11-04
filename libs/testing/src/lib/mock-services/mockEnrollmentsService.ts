import { of } from "rxjs";

export const mockEnrollmentsService = {
    getCoverageChangeReasons: (mpGroup: number) => of([]),
    updateEbsPaymentOnFile: (memberId: number, mpGroup: string) => of(),
    getEnrollments: (memberId: number, mpGroup: number, expand?: string) => of([]),
    searchMemberEnrollments: (memberId: number, mpGroup: number) => of([]),
    getMemberEnrollmentSummary: (memberId: number, mpGroup: number) => of({}),
};
