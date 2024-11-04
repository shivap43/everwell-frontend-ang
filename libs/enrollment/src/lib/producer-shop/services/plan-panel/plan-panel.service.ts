import { Injectable } from "@angular/core";
import { PlanOfferingWithCartAndEnrollment, PlanOffering, Enrollments, Validity, CarrierId } from "@empowered/constants";
import { PlanOfferingHelperService } from "@empowered/ngrx-store/services/plan-offering-helper/plan-offering-helper.service";
import { PlanOfferingService } from "../plan-offering/plan-offering.service";
import { PanelIdentifiers } from "../producer-shop-component-store/producer-shop-component-store.model";
import { DateService } from "@empowered/date";
import { DualPlanYearService } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class PlanPanelService {
    constructor(
        private readonly planOfferingHelperService: PlanOfferingHelperService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly dateService: DateService,
        private readonly dualPlanYear: DualPlanYearService,
    ) {}

    /**
     * Gets PlanOffering from PlanOfferingWithCartAndEnrollment
     *
     * @param planPanel {PlanOfferingWithCartAndEnrollment} PlanPanel with CartItem and Enrollment
     * @returns {PlanOffering} PlanOffering from PlanOfferingWithCartAndEnrollment
     */
    getPlanOffering(planPanel: PlanOfferingWithCartAndEnrollment): PlanOffering {
        return planPanel.planOffering;
    }

    /**
     * Gets panel identifiers based no PlanPanel with CartItem and Enrollment
     *
     * @param planPanel {PlanOfferingWithCartAndEnrollment} PlanPanel with CartItem and Enrollment
     * @returns {PanelIdentifiers} Panel identifiers used by local component store
     */
    getPanelIdentifiers(planPanel: PlanOfferingWithCartAndEnrollment): PanelIdentifiers {
        const planOffering = this.getPlanOffering(planPanel);

        return {
            planOfferingId: planOffering.id,
            cartId: planPanel.cartItemInfo?.id,
            enrollmentId: planPanel.enrollment?.id,
        };
    }

    /**
     * Check if panel identifiers for current panel and selected panel are same or not.
     *
     * @param currentPanelIdentifiers current panel identifiers
     * @param selectedPanelIdentifiers selected panel identifiers
     * @returns {boolean} indicating if both the panel identifiers are matching or not
     */
    isSamePlanPanel(currentPanelIdentifiers: PanelIdentifiers, selectedPanelIdentifiers: PanelIdentifiers): boolean {
        // If plan offering id is not matching, return false
        if (currentPanelIdentifiers.planOfferingId !== selectedPanelIdentifiers.planOfferingId) {
            return false;
        }
        // If cart id exist and not matching, return false
        if (
            (currentPanelIdentifiers.cartId || selectedPanelIdentifiers.cartId) &&
            currentPanelIdentifiers.cartId !== selectedPanelIdentifiers.cartId
        ) {
            return false;
        }
        // If enrollment id exist and not matching, return false
        if (
            (currentPanelIdentifiers.enrollmentId || selectedPanelIdentifiers.enrollmentId) &&
            currentPanelIdentifiers.enrollmentId !== selectedPanelIdentifiers.enrollmentId
        ) {
            return false;
        }
        // if all above data is matching return true
        return true;
    }

    /**
     * Checks if enrollment is editable or not
     *
     * @param planPanel {PlanOfferingWithCartAndEnrollment} PlanOffering with CartItem and Enrollment
     * @returns {boolean} indicating if enrollment is editable or not
     */
    isEnrollmentEditable(planPanel: PlanOfferingWithCartAndEnrollment): boolean {
        let enrollmentActive: boolean;
        const planOffering = this.getPlanOffering(planPanel);
        // Gets OE dates
        const planYearData = this.dualPlanYear.planYearsData.find((plan) => plan.id === planPanel.planOffering.planYearId);
        // Gets QLE dates
        const qleData = this.dualPlanYear.qleEventData?.find((plan) => plan.id === planPanel.planOffering.planYearId);

        if (
            planPanel.planOffering?.plan?.carrierId === CarrierId.ADV &&
            (this.isEnrollmentOpen(planYearData?.enrollmentPeriod) || this.isEnrollmentOpen(qleData?.enrollmentValidity))
        ) {
            enrollmentActive = true;
        }

        // Auto Enrollments and grandfather plans are not editable
        return (
            !!planPanel.enrollment &&
            // reinstatement enrollments are not editable
            !planPanel.enrollment.reinstatement &&
            // Added check of validity for grandfather plans
            !!planOffering.validity &&
            (!this.planOfferingHelperService.isAutoEnrollable(planOffering) ||
                // Can edit if OE or QLE is active
                enrollmentActive)
        );
    }

    /**
     * Return true if PlanOffering has Stackable Plan
     *
     * @param planPanel {PlanOfferingWithCartAndEnrollment} PlanOffering with CartItem and Enrollment
     * @returns {boolean} boolean for if PlanOffering has Stackable Plan
     */
    planOfferingHasStackablePlan(planPanel: PlanOfferingWithCartAndEnrollment): boolean {
        const planOffering = this.getPlanOffering(planPanel);

        return this.planOfferingService.planOfferingHasStackablePlan(planOffering);
    }

    /** Get Enrollment for the Plan that comes with BASE Plan
     *
     * @param planPanel {PlanOfferingWithCartAndEnrollment} PlanPanel represented by standard plan
     * @returns {Enrollments | null} Enrollment for Plan that comes with BASE Plan
     */
    getEnrollmentPlan(planPanel: PlanOfferingWithCartAndEnrollment): Enrollments | null {
        const planId = this.planOfferingService.getPlanId(planPanel.planOffering);

        // If no enrollment is selected, return null
        if (!planPanel?.enrollment) {
            return null;
        }

        if (
            (planId === planPanel.enrollment?.plan?.id && !this.planOfferingHelperService.isAutoEnrollable(planPanel.planOffering)) ||
            this.isEnrollmentEditable(planPanel)
        ) {
            return planPanel.enrollment;
        }

        return null;
    }

    /**
     * Checks if OE or QLE is active
     * @param enrollmentPeriod starting date and expiration date
     * @returns boolean based on if it is active or not
     */
    isEnrollmentOpen(enrollmentPeriod: Validity): boolean {
        return this.dateService.isBetween(
            this.dateService.toDate(enrollmentPeriod?.effectiveStarting),
            this.dateService.toDate(enrollmentPeriod?.expiresAfter),
        );
    }
}
