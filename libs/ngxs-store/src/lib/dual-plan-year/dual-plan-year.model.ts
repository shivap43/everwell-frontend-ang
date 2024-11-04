import { MemberQualifyingEvent, PlanYear } from "@empowered/constants";

export interface QleOeShopModel {
    isQleEnrollmentWindow?: boolean;
    isOpenEnrollmentWindow?: boolean;
    selectedShop?: string;
    isDualPlanYear?: boolean;
    isQleDuringOeEnrollment?: boolean;
    isQleAfterOeEnrollment?: boolean;
    planYearsData?: PlanYear[];
    qleEventData?: MemberQualifyingEvent[];
    qleYear?: string;
    oeYear?: string;
    qleCoverageStartDate?: string;
    oeCoverageStartDate?: string;
    oePlanYear?: PlanYear;
    qlePlanYear?: PlanYear;
    isSameYearForPYs?: boolean;
    oeDualPlanYear?: PlanYear[];
    qleDualPlanYear?: PlanYear[];
    oePlanYearData?: PlanYear[];
}

export interface ActiveEnrollment {
    sameProductActiveEnrollment: boolean;
    replacePlan?: boolean;
    planEdit?: boolean;
}
