/**
 * Used to determine when to provide EnrollmentType to getPlanCoverageDatesMap endpoint.
 * Whenever there is a Dual Plan, we need to provide EnrollmentType.
 * All other cases, no EnrollmentType should  be provided
 *
 * https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=shopping#operation/getPlanCoverageDatesMap
 *
 */
export enum CoverageDatesEnrollmentType {
    SINGLE_PLAN_YEAR = "SINGLE_PLAN_YEAR",
    QUALIFYING_LIFE_EVENT = "QUALIFYING_LIFE_EVENT",
    OPEN_ENROLLMENT = "OPEN_ENROLLMENT",
}
