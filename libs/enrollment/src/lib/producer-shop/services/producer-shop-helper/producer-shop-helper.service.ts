import { Injectable } from "@angular/core";
import { CarrierStatus, MemberQLETypes } from "@empowered/api";
import {
    DateFormat,
    PlanOfferingWithCartAndEnrollment,
    ShopPageType,
    TaxStatus,
    PlanOffering,
    Enrollments,
    StatusType,
    PlanYear,
} from "@empowered/constants";
import { DateService } from "@empowered/date";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { EnrollmentsSelectors } from "@empowered/ngrx-store/ngrx-states/enrollments";
import { GlobalActions } from "@empowered/ngrx-store/ngrx-states/global";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { select } from "@ngrx/store";
import { of } from "rxjs";
import { Observable } from "rxjs/internal/Observable";
import { map } from "rxjs/operators";
import { PlanOfferingService } from "../plan-offering/plan-offering.service";
import { PlanPanelService } from "../plan-panel/plan-panel.service";

@Injectable({
    providedIn: "root",
})
export class ProducerShopHelperService {
    private readonly selectedPlanOfferingData$ = this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferingData));

    constructor(
        private readonly ngrxStore: NGRXStore,
        private readonly dateService: DateService,
        private readonly planOfferingService: PlanOfferingService,
        private readonly planPanelService: PlanPanelService,
    ) {}

    /**
     * Function to return selected enrolled plan observable
     * @param planOffering plan offering object for selected enrolled plan
     * @returns Observable of selected enrolled plan
     */
    getSelectedEnrollment(planOffering: PlanOffering): Observable<Enrollments | null> {
        return this.ngrxStore.onAsyncValue(select(EnrollmentsSelectors.getSelectedEnrollments)).pipe(
            map((enrollments) => {
                const planId = this.planOfferingService.getPlanId(planOffering);
                return enrollments.find((enrollment) => enrollment?.plan?.id === planId) ?? null;
            }),
        );
    }

    /**
     * Function to check whether the group is in open enrollment or not
     * @returns Observable of boolean
     */
    inOpenEnrollment(): Observable<boolean> {
        // Check whether group is in open enrollment based on shop page type selected
        return this.ngrxStore.pipe(select(PlanOfferingsSelectors.getSelectedShopPageType)).pipe(
            map(
                (shopPageType) =>
                    // considered as open enrollment if shop period type is either Single or Dual OE shop
                    shopPageType === ShopPageType.SINGLE_OE_SHOP || shopPageType === ShopPageType.DUAL_OE_SHOP,
            ),
        );
    }

    /**
     * Function to check whether the enrollment has an expiration date
     * If enrollment is due to expire and OE is ongoing then the enrollment
     * could be eligible for re-enrollment
     * @param enrollment enrollment data
     * @param inOpenEnrollment indicated if in open enrollment or not
     * @returns boolean
     */
    isOEAndEnrollmentDueToExpire(enrollment: Enrollments, inOpenEnrollment: boolean): boolean {
        // Check whether group is in open enrollment based on plan year set of current group
        return (
            enrollment.validity.expiresAfter && // enrollment or policy is not valid after validity expiresAfter date
            !this.dateService.isBefore(this.dateService.toDate(enrollment.validity.expiresAfter).setHours(0, 0, 0, 0)) &&
            // enrollment's effective start must be in past
            this.dateService.isBefore(this.dateService.toDate(enrollment.validity.effectiveStarting).setHours(0, 0, 0, 0)) &&
            enrollment.taxStatus === TaxStatus.PRETAX &&
            enrollment.carrierStatus === CarrierStatus.ACTIVE &&
            inOpenEnrollment
        );
    }

    /**
     * Function to return true if current ongoing coverage PY end date matches with enrollment end date
     * @params enrollments the current enrollment
     * @params planYears plan years
     * @returns boolean
     */
    isEligibleForReEnrollForRenewalPlan(enrollment: Enrollments, planYears: PlanYear[]): boolean {
        const ongoingCoveragePlanYear = planYears.find((planYear) => {
            const coverageStartDate = planYear.coveragePeriod.effectiveStarting;
            const coverageEndDate = planYear.coveragePeriod.expiresAfter;

            // When plan year is in open enrollment as of today
            return this.dateService.isBetween(
                this.dateService.toDate(coverageStartDate),
                this.dateService.toDate(coverageEndDate),
                new Date().setHours(0, 0, 0, 0),
            );
        });
        return ongoingCoveragePlanYear.coveragePeriod.expiresAfter === enrollment.validity.expiresAfter;
    }

    /**
     * Sets selected plan id, plan offering id and cart item id to store
     * @param planPanel selected planPanel
     */
    setSelectedPlanDataToStore(planPanel: PlanOfferingWithCartAndEnrollment): void {
        this.ngrxStore.dispatch(
            GlobalActions.setSelectedPlanPanelIdentifiers({
                planId: planPanel.planOffering.plan.id,
                planOfferingId: planPanel.planOffering.id,
                cartItemId: planPanel.cartItemInfo?.id,
                enrollmentId: planPanel.enrollment?.id,
            }),
        );
    }

    /**
     * Function to check whether the enrolled plan is present in plan offerings response or not by comparing plan id
     * @returns Observable of boolean
     */
    isEnrolledPlanInPlanOfferings(planPanel: PlanOfferingWithCartAndEnrollment): Observable<boolean> {
        // Exit early in case of no enrollment present for selected plan panel
        if (!planPanel.enrollment) {
            return of(false);
        }

        // Comparing plan id from plan offerings with enrolled plan id
        return this.ngrxStore
            .onAsyncValue(select(PlanOfferingsSelectors.getSelectedPlanOfferings))
            .pipe(
                map((selectedCombinedOfferings) =>
                    selectedCombinedOfferings.some((planOffering) => planOffering.plan.id === planPanel.enrollment.plan.id),
                ),
            );
    }

    /**
     * Check if a PlanOfferingWithCartAndEnrollment has matching identifiers with the currently selected PlanOfferingWithCartAndEnrollment
     *
     * @param planPanel {PlanOfferingWithCartAndEnrollment}
     * @returns {Observable<boolean>}
     */
    isSelectedPlanPanel(planPanel: PlanOfferingWithCartAndEnrollment): Observable<boolean> {
        return this.selectedPlanOfferingData$.pipe(
            map((selectedPlanPanel) => {
                // If there is no selected PlanOffering,
                // all panels should be closed (not expanded)
                if (!selectedPlanPanel) {
                    return false;
                }

                const currentPanelIdentifiers = this.planPanelService.getPanelIdentifiers(planPanel);
                const selectedPanelIdentifiers = this.planPanelService.getPanelIdentifiers(selectedPlanPanel);
                // Check if current plan panel and selected plan panel are same
                return this.planPanelService.isSamePlanPanel(currentPanelIdentifiers, selectedPanelIdentifiers);
            }),
        );
    }

    /**
     * Function to check whether the member has active QLE or not
     * @returns Observable of boolean
     */
    isActiveQLE(): Observable<boolean> {
        // Check whether member has active QLE
        return this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedQualifyEvents)).pipe(
            map((qualifyingEvents) =>
                qualifyingEvents.some(
                    (lifeEvents) =>
                        this.dateService.getIsAfterOrIsEqual(
                            new Date(),
                            this.dateService.toDate(lifeEvents.enrollmentValidity?.effectiveStarting).setHours(0, 0, 0, 0),
                        ) &&
                        this.dateService.isBeforeOrIsEqual(
                            new Date(),
                            this.dateService.toDate(lifeEvents.enrollmentValidity?.expiresAfter).setHours(0, 0, 0, 0),
                        ) &&
                        // Filter out the all By request QLEs as they are not actual life events
                        lifeEvents.type?.code !== MemberQLETypes.BY_REQUEST &&
                        // Only IN-Progress QLEs must be considered
                        lifeEvents.status === StatusType.INPROGRESS,
                ),
            ),
        );
    }
}
