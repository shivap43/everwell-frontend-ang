import { MemberQualifyingEvent, PlanYear } from "@empowered/constants";

/**
 * model for Enrollment Period Data
 * holds data of plan years, qleEvents and dual plan year data
 */
export interface EnrollmentPeriodData {
    isQleEnrollmentWindow: boolean;
    isOpenEnrollmentWindow: boolean;
    selectedShop: string;
    isDualPlanYear: boolean;
    isQleDuringOeEnrollment: boolean;
    isQleAfterOeEnrollment: boolean;
    planYearsData: PlanYear[];
    qleEventData: MemberQualifyingEvent[];
    qleDualPlanYear?: PlanYear[];
    oeDualPlanYear?: PlanYear[];
}

export enum ShopPeriodType {
    QLE_SHOP = "Qle Shop",
    OE_SHOP = "Oe Shop",
    CONTINUOUS_SHOP = "Continuous Shop",
}
