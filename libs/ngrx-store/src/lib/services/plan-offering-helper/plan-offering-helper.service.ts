import { Injectable } from "@angular/core";
import { CarrierStatus, CrossBorderRule, EnrollmentStateRelation, EnrollmentStatusType, ReinstatementType, STATUS } from "@empowered/api";
import {
    CombinedOfferingWithCartAndEnrollment,
    CrossBorderAlertType,
    EnrollmentMethod,
    PlanOfferingWithCartAndEnrollment,
    Characteristics,
    TaxStatus,
    PlanOffering,
    GetCartItems,
    Enrollments,
    VasFunding,
} from "@empowered/constants";
import { ProductId } from "./plan-offering-helper.constants";
import { isPastDate } from "../dates/dates.service";

/**
 * Checks if a member has cross border restriction based on cross border rules and selected state and enrollment method
 * @param crossBorderRules cross border rules
 * @param selectedStateAbbreviation selected state
 * @param selectedEnrollmentMethod selected enrollment method
 * @returns CrossBorderAlertType indicating error type
 */
export const checkCrossBorderRestriction = (
    crossBorderRules: CrossBorderRule[],
    selectedStateAbbreviation: string,
    selectedEnrollmentMethod?: EnrollmentMethod | null,
): CrossBorderAlertType => {
    if (selectedEnrollmentMethod && selectedEnrollmentMethod !== EnrollmentMethod.FACE_TO_FACE) {
        return CrossBorderAlertType.NONE;
    }

    const rule =
        crossBorderRules &&
        crossBorderRules.find((crossBorderRule) => crossBorderRule.allowEnrollment === false || crossBorderRule.releaseBusiness === false);
    if (
        rule &&
        ((rule.enrollmentStateRelation === EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT &&
            rule.residentState !== selectedStateAbbreviation) ||
            (rule.enrollmentStateRelation === EnrollmentStateRelation.SAME_AS_RESIDENT && rule.residentState === selectedStateAbbreviation))
    ) {
        if (rule.allowEnrollment && !rule.releaseBusiness) {
            return CrossBorderAlertType.WARNING;
        }
        if (!rule.allowEnrollment) {
            return CrossBorderAlertType.ERROR;
        }
    }
    return CrossBorderAlertType.NONE;
};

/**
 * match enrollments with plan offerings and return only those enrollments which match with plan offerings
 * @param planOfferings plan offerings data
 * @param enrollments enrollments data
 * @returns enrollments that match with planOfferings
 */
export const matchEnrollmentWithPlanOffering = (planOfferings: PlanOffering[], enrollments: Enrollments[]): Enrollments[] =>
    enrollments.filter((enrollment) => planOfferings?.some((planOffering) => planOffering.plan.plan?.id === enrollment.plan.plan?.id));

/**
 * Indicates if auto enrolled plan is still in cart or not
 * @param existingCoverage existing coverage
 * @param planOffering plan offering
 * @param cartItem cart item data
 * @returns boolean indicating if it is auto enrolled and is in cart
 */
export const autoEnrolledAndInCart = (existingCoverage: Enrollments, planOffering: PlanOffering, cartItem: GetCartItems): boolean =>
    cartItem?.enrollmentId === existingCoverage.id && !!planOffering.plan.characteristics?.includes(Characteristics.AUTOENROLLABLE);

/**
 * Indicates if plan is hq and enrollment is of same plan offering id
 * @param existingCoverage existing coverage
 * @param planOffering plan offering
 * @returns boolean indicating if it is auto enrolled and is in cart
 */
export const hQAndNotSameOffering = (existingCoverage: Enrollments, planOffering: PlanOffering): boolean =>
    existingCoverage?.planOfferingId !== planOffering?.id && planOffering.plan?.vasFunding === VasFunding.HQ;

/**
 * Indicates if existing coverage is auto enrollable
 * @param planOffering {PlanOffering} PlanOffering
 * @returns {boolean} true if Planoffering is auto enrollable
 */
export const isAutoEnrollable = (planOffering: PlanOffering): boolean =>
    planOffering?.plan?.characteristics?.includes(Characteristics.AUTOENROLLABLE) ?? false;

/**
 * gets stacked plan offering panel data based on enrollments and cart items
 * @param planOffering plan offering
 * @param enrollments enrollments for same plan offering
 * @param cartItems cart items for same plan offering
 * @returns {PlanOfferingWithCartAndEnrollment[]} list of PlanOfferingWithCartAndEnrollment
 */
export const getStackedPlanOfferingData = (
    planOffering: PlanOffering,
    enrollments: Enrollments[],
    cartItems: GetCartItems[],
): PlanOfferingWithCartAndEnrollment[] => {
    // getting list cart items related to existing enrollments
    const enrollmentCartItems = cartItems.filter((cartItem) => enrollments.some((enrollment) => enrollment.id === cartItem.enrollmentId));

    return [
        // For stackable plans we have to create multiple PlanOfferingWithCartAndEnrollment for same plan offering
        // create as many panels based on enrollments and cart items present for same plan offering

        // For the list of enrollments, have to check if cart item exists for each enrollment
        ...enrollments.map((enrollment) => {
            // get the cart item created from an existing enrollment
            const enrollmentCartItem = enrollmentCartItems.find((cartItem) => cartItem.enrollmentId === enrollment.id);

            // Add both enrollment and matching cart item related to enrollment in same panel
            return { planOffering, enrollment, cartItemInfo: enrollmentCartItem };
        }),

        // creating panels for remaining cart items, which are not part of enrollment cart items
        ...cartItems
            .filter((cartItem) => !enrollmentCartItems.some((enrollmentCartItem) => enrollmentCartItem.id === cartItem.id))
            .map((cartItemInfo) => ({ planOffering, cartItemInfo })),

        // Default panel without cart and enrollment
        { planOffering },
    ];
};

/**
 * Filter plan offerings for supplementary plans
 * @param planOfferings plan offerings
 * @param enrollments enrolled plans details
 * @param productOfferingId selected product id
 * @returns plan offerings
 */
export const filteredPlanOfferings = (
    planOfferings: PlanOffering[],
    enrollments: Enrollments[],
    productOfferingId: number,
): PlanOffering[] =>
    planOfferings.filter((planOffering) => {
        // filter plans of selected product
        if (planOffering.productOfferingId !== productOfferingId) {
            return false;
        }

        if (!planOffering.plan.characteristics?.includes(Characteristics.SUPPLEMENTARY)) {
            return true;
        }

        // include supplementary / additional units plans if base plan is enrolled
        if (
            planOffering.plan.characteristics?.includes(Characteristics.SUPPLEMENTARY) &&
            enrollments.some(
                (enrolledPlan) =>
                    enrolledPlan.plan.dependentPlanIds?.includes(planOffering.plan.id) &&
                    enrolledPlan.status === EnrollmentStatusType.APPROVED &&
                    enrolledPlan.policyNumber,
            )
        ) {
            return true;
        }

        return false;
    });

/**
 * Filter for supplement plans and map enrollments and cart items to plan offering
 * @param productOfferingId selected product id
 * @param planOfferings plan offerings
 * @param enrollments enrolled plans details
 * @param cartItems plans in cart
 * @returns plan offerings along with cart and enrollment details
 */
export const mapCartAndEnrollmentToPlanOffering = (
    productOfferingId: number,
    planOfferings: PlanOffering[],
    enrollments: Enrollments[],
    cartItems: GetCartItems[],
): PlanOfferingWithCartAndEnrollment[] => {
    const selectedProductPlanOfferings = planOfferings.filter((planOffering) => planOffering.productOfferingId === productOfferingId);

    const filteredPlanOfferingList = filteredPlanOfferings(planOfferings, enrollments, productOfferingId);

    const planOfferingsWithCartAndEnrollment: PlanOfferingWithCartAndEnrollment[] = [];
    filteredPlanOfferingList.forEach((planOffering) => {
        const filteredCartItems = cartItems.filter((item) => item.planOffering?.plan.id === planOffering.plan.id);
        // In cart auto enrollments should not be filtered
        const filteredEnrollments = enrollments.filter(
            (enrollment) =>
                planOffering.plan.id === enrollment.plan.id && !autoEnrolledAndInCart(enrollment, planOffering, filteredCartItems[0]),
        );

        const previousHQEnrollment = filteredEnrollments[0] && hQAndNotSameOffering(filteredEnrollments[0], planOffering);

        // Check if optional reinstatement eligible
        const isOptionalReinstate = filteredEnrollments.length && filteredEnrollments[0]?.reinstatement === ReinstatementType.OPTIONAL;

        // For stackable plans, we get multiple planOfferingsWithCartAndEnrollment for same plan offering
        if (planOffering.plan.characteristics?.includes(Characteristics.STACKABLE)) {
            planOfferingsWithCartAndEnrollment.push(...getStackedPlanOfferingData(planOffering, filteredEnrollments, filteredCartItems));
        } else {
            planOfferingsWithCartAndEnrollment.push({
                planOffering,
                ...(filteredEnrollments.length && { enrollment: filteredEnrollments[0] }),
                ...(filteredCartItems.length && !isOptionalReinstate && !previousHQEnrollment && { cartItemInfo: filteredCartItems[0] }),
            });
        }

        // If its optional reinstatement or previous HQ enrollment, we have to add an extra plan panel without enrollment
        if (isOptionalReinstate || previousHQEnrollment) {
            planOfferingsWithCartAndEnrollment.push({
                planOffering,
                ...(filteredCartItems.length && { cartItemInfo: filteredCartItems[0] }),
            });
        }
    });

    // Gets list of enrollments not in current Plan offering list
    // Should be considered valid, if we have at least one plan offering for that product else should not display
    const enrollmentsNotInPlanOfferings = filteredPlanOfferingList.length
        ? enrollments.filter(
              (enrollment) => !selectedProductPlanOfferings.map((planOffering) => planOffering.plan.id).includes(enrollment.plan.id),
          )
        : [];

    // For enrollments not in current plan offering list, we are creating a dummy plan offering out of enrollment data
    if (enrollmentsNotInPlanOfferings.length) {
        enrollmentsNotInPlanOfferings
            // TODO [Types]: Enrollments doesn't show that planOfferingId is optional property,
            // we should update the Enrollments type to not make it optional and ping Java team if it's a mistake
            // https://api-contracts-nonprod.empoweredbenefits.com/redoc.html?api=enrollment#tag/enrollment_model
            // (?) Maybe this has to do with importing policies from Aflac (never offered through Everwell)
            .filter((enrollment): enrollment is Enrollments & { planOfferingId: number } => !!enrollment.planOfferingId)
            .forEach((enrollment) => {
                planOfferingsWithCartAndEnrollment.push({
                    planOffering: {
                        id: enrollment.planOfferingId,
                        plan: enrollment.plan,
                        taxStatus: enrollment.taxStatus,
                        // This value only matters on Member Shop Page
                        // On Member's Shop Page, if `agentAssistanceRequired` is true,
                        // then they need additional help to enroll
                        //
                        // On Producer Shop Page, this is never a concern.
                        // We should be able to assume true (or false) as long as we're never updating this value
                        // for the PlanOffering given enrollment.planOfferingId
                        agentAssistanceRequired: true,
                        validity: enrollment.validity,
                    },
                    enrollment: enrollment,
                });
            });
    }

    // planOfferingsWithCartAndEnrollment has to be sorted, one with enrollment data should come on top
    planOfferingsWithCartAndEnrollment.sort((planOfferingWithCartAndEnrollmentA, planOfferingWithCartAndEnrollmentB) => {
        const enrollmentA = planOfferingWithCartAndEnrollmentA.enrollment;
        const enrollmentB = planOfferingWithCartAndEnrollmentB.enrollment;
        const activeA = enrollmentA?.carrierStatus === STATUS.ACTIVE;
        const activeB = enrollmentB?.carrierStatus === STATUS.ACTIVE;
        // If both PlanOfferings have Enrollments, active plan should be displayed on top or ignore moving them in the list
        if (enrollmentA && enrollmentB) {
            if (activeA) {
                return -1;
            }
            if (activeB) {
                return 1;
            }
            return 0;
        }

        // If neither PlanOfferings have Enrollments, ignore moving them in the list
        if (!enrollmentA && !enrollmentB) {
            return 0;
        }

        // If the first PlanOffering has Enrollment, move it up
        if (enrollmentA) {
            return -1;
        }

        // second PlanOffering must have Enrollment, move it up
        return 1;
    });

    // supplementary plans should always follow base plans, hence to ordering in that way
    planOfferingsWithCartAndEnrollment.forEach((planOfferingWithEnrollment, index, planOfferingWithEnrollments) => {
        if (!planOfferingWithEnrollment?.enrollment || !planOfferingWithEnrollment.planOffering?.plan.dependentPlanIds?.length) {
            return;
        }
        if (planOfferingWithEnrollment?.enrollment && planOfferingWithEnrollment.planOffering?.plan.dependentPlanIds?.length) {
            // to find index of supplementary plan if base plan is enrolled
            const childPlanIndex = planOfferingWithEnrollments.findIndex(
                (planOfferingAndEnrollment) =>
                    planOfferingWithEnrollment?.planOffering?.plan.dependentPlanIds?.includes(
                        planOfferingAndEnrollment?.planOffering.plan.id,
                    ) && planOfferingAndEnrollment?.planOffering.plan.characteristics?.includes(Characteristics.SUPPLEMENTARY),
            );
            if (childPlanIndex > -1) {
                planOfferingsWithCartAndEnrollment.splice(index + 1, 0, planOfferingsWithCartAndEnrollment[childPlanIndex]);
                if (!(childPlanIndex < index)) {
                    planOfferingsWithCartAndEnrollment.splice(childPlanIndex + 1, 1);
                } else {
                    planOfferingsWithCartAndEnrollment.splice(childPlanIndex, 1);
                }
            }
        }
    });
    return planOfferingsWithCartAndEnrollment;
};

/**
 * Indicates if plan is a life plan
 * @param productId number
 * @returns boolean indicating if it is a life plan
 */
export const isLifePlan = (productId: number): boolean =>
    productId === ProductId.JUVENILE_TERM_LIFE ||
    productId === ProductId.JUVENILE_WHOLE_LIFE ||
    productId === ProductId.WHOLE_LIFE ||
    productId === ProductId.TERM_LIFE;

/**
 * Indicates if existing coverage is re-enrollable
 * @param planOffering PlanOffering
 * @param enrollments Enrollments array
 * @returns boolean indicating if it is re enrolled
 */
export const isReEnrollable = (planOffering: PlanOffering, enrollments: Enrollments[]): boolean => {
    const autoEnrollable = isAutoEnrollable(planOffering);

    return enrollments.some(
        (enrollment) =>
            enrollment.validity.expiresAfter && // enrollment or policy is not valid after validity expiresAfter date
            enrollment.carrierStatus === CarrierStatus.ACTIVE &&
            !autoEnrollable &&
            enrollment.taxStatus === TaxStatus.PRETAX &&
            enrollment.plan.plan?.id === planOffering.plan.plan?.id,
    );
};

/**
 * Remove productOfferings without planOffering from the combineOfferingsData.
 * @param combinedOfferingsData combinedOffering with cart and enrollment
 * @returns CombinedOfferingWithCartAndEnrollment[]
 */
export const removeProductOfferingsWithoutPlanOffering = (
    combinedOfferingsData: CombinedOfferingWithCartAndEnrollment[],
): CombinedOfferingWithCartAndEnrollment[] =>
    combinedOfferingsData.filter((combinedOffering) => combinedOffering.planOfferingsWithCartAndEnrollment.length);

@Injectable({
    providedIn: "root",
})
export class PlanOfferingHelperService {
    /**
     * Indicates if existing coverage is auto enrollable
     * @param planOffering {PlanOffering} PlanOffering
     * @returns {boolean} true if Planoffering is auto enrollable
     */
    isAutoEnrollable(planOffering: PlanOffering): boolean {
        return isAutoEnrollable(planOffering);
    }

    /**
     * Indicates if plan is a life plan
     * @param productId number
     * @returns boolean indicating if it is a life plan
     */
    isLifePlan(productId: number): boolean {
        return isLifePlan(productId);
    }

    /**
     * Checks if a member has cross border restriction based on cross border rules and selected state and enrollment method
     * @param crossBorderRules cross border rules
     * @param selectedStateAbbreviation selected state
     * @param selectedEnrollmentMethod selected enrollment method
     * @returns CrossBorderAlertType enum indication cross border restriction error type
     */
    checkCrossBorderRestriction(
        crossBorderRules: CrossBorderRule[],
        selectedStateAbbreviation: string,
        selectedEnrollmentMethod: EnrollmentMethod,
    ): CrossBorderAlertType {
        return checkCrossBorderRestriction(crossBorderRules, selectedStateAbbreviation, selectedEnrollmentMethod);
    }

    /**
     * Remove productOfferings without planOffering from the combineOfferingsData.
     * @param combinedOfferingsData combinedOffering with cart and enrollment
     * @returns CombinedOfferingWithCartAndEnrollment[]
     */
    removeProductOfferingsWithoutPlanOffering(
        combinedOfferingsData: CombinedOfferingWithCartAndEnrollment[],
    ): CombinedOfferingWithCartAndEnrollment[] {
        return removeProductOfferingsWithoutPlanOffering(combinedOfferingsData);
    }
}
