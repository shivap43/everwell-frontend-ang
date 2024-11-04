import { Injectable } from "@angular/core";
import { PlanType, Plan, PlanOffering, Product, PlanYear } from "@empowered/constants";
import { DateService } from "@empowered/date";
import { PlanService } from "../plan/plan.service";

@Injectable({
    providedIn: "root",
})
export class PlanOfferingService {
    constructor(private readonly planService: PlanService, private readonly dateService: DateService) {}

    /**
     * Get Plan of PlanOffering
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {Plan} Plan of PlanOffering
     */
    getPlan(planOffering: PlanOffering): Plan {
        return planOffering.plan;
    }

    /**
     * Get Plan id of PlanOffering
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {number} Plan id of PlanOffering
     */
    getPlanId(planOffering: PlanOffering): number {
        return this.getPlan(planOffering).id;
    }

    /**
     * Get Plan name of PlanOffering
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {string} Plan name of PlanOffering
     */
    getPlanName(planOffering: PlanOffering): string {
        return this.getPlan(planOffering).name;
    }

    /**
     * Get Product of PlanOffering
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {Product} Product PlanOffering
     */
    getProduct(planOffering: PlanOffering): Product | null {
        return planOffering.plan?.product ?? null;
    }

    /**
     * Get Product id of PlanOffering
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {number} Product id of PlanOffering
     */
    getProductId(planOffering: PlanOffering): number | null {
        const product = this.getProduct(planOffering);

        return product?.id ?? null;
    }

    /**
     * Get ProductOffering id of PlanOffering
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {number} ProductOffering id of PlanOffering
     */
    getProductOfferingId(planOffering: PlanOffering): number | null {
        return planOffering.productOfferingId ?? null;
    }

    /**
     * Return true if PlanOffering has type Redirect
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {boolean} boolean for if PlanOffering has type Redirect
     */
    isRedirectPlanOffering(planOffering: PlanOffering): boolean {
        return planOffering.type === PlanType.REDIRECT;
    }

    /**
     * Return true if PlanOffering has Supplementary Plan
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {boolean} boolean for if PlanOffering has Supplementary Plan
     */
    planOfferingHasSupplementaryPlan(planOffering: PlanOffering): boolean {
        return this.planService.isSupplementaryPlan(planOffering?.plan);
    }

    /**
     * Return true if PlanOffering has Stackable Plan
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {boolean} boolean for if PlanOffering has Stackable Plan
     */
    planOfferingHasStackablePlan(planOffering: PlanOffering): boolean {
        return this.planService.isStackablePlan(planOffering.plan);
    }

    /**
     * Gets open enrollment plan years
     * @param planYears list of all plan years
     * @returns list of open enrollment plan years
     */
    getOpenEnrollmentPlanYears(planYears: PlanYear[]): PlanYear[] {
        // Get current date and remove seconds, milliseconds
        const currentDate = new Date().setHours(0, 0, 0, 0);

        // check for open enrollment
        return planYears.filter((planYear) => {
            const enrollmentStartDate = this.dateService.toDate(planYear.enrollmentPeriod.effectiveStarting);
            const enrollmentEndDate = this.dateService.toDate(planYear.enrollmentPeriod.expiresAfter);

            // When plan year is in open enrollment as of today
            return this.dateService.isBetween(enrollmentStartDate, enrollmentEndDate, currentDate);
        });
    }
}
