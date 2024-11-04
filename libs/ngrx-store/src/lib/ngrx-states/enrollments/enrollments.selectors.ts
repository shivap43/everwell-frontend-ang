import { CarrierStatus, EnrollmentMethodDetail, EnrollmentStatusType } from "@empowered/api";
import {
    AsyncData,
    AsyncStatus,
    EnrollmentMethod,
    Characteristics,
    EnrollmentRider,
    EnrollmentDependent,
    EnrollmentBeneficiary,
    Enrollments,
    StatusType,
    MemberQualifyingEvent,
} from "@empowered/constants";
import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";

import { combineAsyncDatas, getAsyncDataFromEntitiesState, getIdleAsyncData, mapAsyncData } from "../../ngrx.store.helpers";
import { AccountsSelectors } from "../accounts";
import { MembersSelectors } from "../members";
import { SharedSelectors } from "../shared";
import { ENROLLMENTS_FEATURE_KEY } from "./enrollments.reducer";
import {
    State,
    getEnrollmentsEntityId,
    getEnrollmentMethodDetailsEntityId,
    EnrollmentsEntities,
    EnrollmentMethodDetailsEntities,
    getEnrollmentBeneficiariesEntityId,
    ImportPolicyEntities,
    getImportPolicyEntityId,
    EnrollmentRidersEntities,
    getEnrollmentRidersEntityId,
    getEnrollmentDependentsEntityId,
    EnrollmentDependentsEntities,
    getDownloadPreliminaryFormEntityId,
    getEmailPreliminaryFormEntityId,
} from "./enrollments.state";
import { ShoppingCartsSelectors } from "../shopping-carts";
import { EnrollmentRidersEntity } from "./enrollments.model";
import { getDifferenceInDays, isPastDate, toDateObj } from "../../services/dates/dates.service";
import { HttpResponse } from "@angular/common/http";

// Lookup the 'Enrollments' feature state managed by NgRx
export const getEnrollmentsFeatureState = createFeatureSelector<State>(ENROLLMENTS_FEATURE_KEY);

export const getSelectedEnrollmentId = createSelector(getEnrollmentsFeatureState, (state: State) => state.selectedEnrollmentId);

// #region EnrollmentSets selectors
export const getEnrollmentsEntities = createSelector(getEnrollmentsFeatureState, (state: State) => state.enrollmentsEntities);

export const getSelectedEnrollments: MemoizedSelector<object, AsyncData<Enrollments[]>> = createSelector(
    getEnrollmentsEntities,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    (entitiesState: EnrollmentsEntities, mpGroup, memberId) => {
        if (!mpGroup || !memberId) {
            return getIdleAsyncData();
        }

        const id = getEnrollmentsEntityId({ mpGroup, memberId });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region EnrollmentRiders selectors
export const getEnrollmentRidersEntities = createSelector(getEnrollmentsFeatureState, (state: State) => state.enrollmentRidersEntities);

export const getEnrollmentRidersData = (
    entitiesState: EnrollmentRidersEntities,
    mpGroup?: number | null,
    memberId?: number | null,
    enrollmentId?: number | null,
): AsyncData<EnrollmentRider[]> => {
    if (!mpGroup || !memberId || !enrollmentId) {
        return getIdleAsyncData();
    }

    const id = getEnrollmentRidersEntityId({ mpGroup, memberId, enrollmentId });

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getEnrollmentRiders = (enrollmentId?: number | null): MemoizedSelector<object, AsyncData<EnrollmentRider[]>> =>
    createSelector(
        getEnrollmentRidersEntities,
        AccountsSelectors.getSelectedMPGroup,
        MembersSelectors.getSelectedMemberId,
        (entitiesState: EnrollmentRidersEntities, mpGroup, memberId) =>
            getEnrollmentRidersData(entitiesState, mpGroup, memberId, enrollmentId),
    );

export const getSelectedEnrollmentRiders: MemoizedSelector<object, AsyncData<EnrollmentRider[]>> = createSelector(
    getEnrollmentRidersEntities,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    getSelectedEnrollmentId,
    (entitiesState: EnrollmentRidersEntities, mpGroup, memberId, enrollmentId) =>
        getEnrollmentRidersData(entitiesState, mpGroup, memberId, enrollmentId),
);

export const getAllSelectedEnrollmentRiders: MemoizedSelector<object, AsyncData<EnrollmentRider[]>> = createSelector(
    getEnrollmentRidersEntities,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    (entitiesState: EnrollmentRidersEntities, mpGroup, memberId) => {
        if (!mpGroup || !memberId) {
            return getIdleAsyncData();
        }

        // Filter all EnrollmentRiderEntities by mpGroup and memberId
        // Then map to their AsyncDatas
        const allEnrollmentRidersDatas: AsyncData<EnrollmentRider[]>[] = entitiesState.ids
            .map((id) => entitiesState.entities[id])
            .filter((entity): entity is EnrollmentRidersEntity<AsyncData<EnrollmentRider[]>> => {
                // Filter out nullish to validate type guard
                if (!entity) {
                    return false;
                }

                // Filter by mpGroup and memberId
                if (entity.identifiers.mpGroup === mpGroup && entity.identifiers.memberId === memberId) {
                    return true;
                }

                return false;
            })
            .map((entity) => entity.data);

        // Combine the array of AsyncDatas into a single AsyncData with an array of their values (which are an array of EnrollmentRider[])
        const combinedEnrollmentRidersData = combineAsyncDatas(allEnrollmentRidersDatas);

        // Then flatten the arrays of values (EnrollmentRider[][]) into a single array (EnrollmentRider[])
        return mapAsyncData(combinedEnrollmentRidersData, ({ value: enrollmentRidersData }) =>
            // Flatten array of arrays to a single array:
            // EnrollmentRider[][] -> EnrollmentRider[]
            enrollmentRidersData.flat(),
        );
    },
);
// #endregion

// #region EnrollmentMethodDetails selectors
export const getEnrollmentMethodDetailsEntities = createSelector(
    getEnrollmentsFeatureState,
    (state: State) => state.enrollmentMethodDetailsEntities,
);

export const getSelectedEnrollmentMethodDetails: MemoizedSelector<object, AsyncData<EnrollmentMethodDetail[]>> = createSelector(
    getEnrollmentMethodDetailsEntities,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: EnrollmentMethodDetailsEntities, mpGroup) => {
        if (!mpGroup) {
            return getIdleAsyncData();
        }

        const id = getEnrollmentMethodDetailsEntityId({ mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getSelectedEnrollmentMethodDetail: MemoizedSelector<object, AsyncData<EnrollmentMethodDetail | null>> = createSelector(
    getSelectedEnrollmentMethodDetails,
    SharedSelectors.getSelectedEnrollmentMethod,
    (
        enrollmentMethodDetailsData: AsyncData<EnrollmentMethodDetail[]>,
        enrollmentMethod: EnrollmentMethod,
    ): AsyncData<EnrollmentMethodDetail | null> =>
        mapAsyncData(
            enrollmentMethodDetailsData,
            ({ value: enrollmentMethodDetails }) =>
                enrollmentMethodDetails.find((enrollmentMethodDetail) => enrollmentMethodDetail.name === enrollmentMethod) ?? null,
        ),
);
// #endregion

// #region selector for beneficiary data of existing coverage
export const getEnrollmentBeneficiariesEntities = createSelector(
    getEnrollmentsFeatureState,
    (state: State) => state.enrollmentBeneficiariesEntities,
);

export const getEnrollmentBeneficiaries: MemoizedSelector<object, AsyncData<EnrollmentBeneficiary[]>> = createSelector(
    getEnrollmentBeneficiariesEntities,
    MembersSelectors.getSelectedMemberId,
    getSelectedEnrollmentId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, enrollmentId, mpGroup) => {
        if (!memberId || !enrollmentId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getEnrollmentBeneficiariesEntityId({ memberId, enrollmentId, mpGroup });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

// #region selector for dependent data of existing coverage
export const getEnrollmentDependentsEntities = createSelector(
    getEnrollmentsFeatureState,
    (state: State) => state.enrollmentDependentsEntities,
);

export const getEnrollmentDependentsData = (
    entitiesState: EnrollmentDependentsEntities,
    memberId?: number | null,
    enrollmentId?: number | null,
    mpGroup?: number | null,
): AsyncData<EnrollmentDependent[]> => {
    if (!mpGroup || !memberId) {
        return getIdleAsyncData();
    }

    if (!enrollmentId) {
        return { value: [], error: null, status: AsyncStatus.SUCCEEDED };
    }

    const id = getEnrollmentDependentsEntityId({ memberId, enrollmentId, mpGroup });

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getEnrollmentDependents = (enrollmentId?: number | null): MemoizedSelector<object, AsyncData<EnrollmentDependent[]>> =>
    createSelector(
        getEnrollmentDependentsEntities,
        MembersSelectors.getSelectedMemberId,
        AccountsSelectors.getSelectedMPGroup,
        (entitiesState: EnrollmentDependentsEntities, memberId, mpGroup) =>
            getEnrollmentDependentsData(entitiesState, memberId, enrollmentId, mpGroup),
    );

export const getSelectedEnrollmentDependents: MemoizedSelector<object, AsyncData<EnrollmentDependent[]>> = createSelector(
    getEnrollmentDependentsEntities,
    MembersSelectors.getSelectedMemberId,
    getSelectedEnrollmentId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState, memberId, enrollmentId, mpGroup) => getEnrollmentDependentsData(entitiesState, memberId, enrollmentId, mpGroup),
);
// #endregion

// #region selector to get declined product Ids
export const getDeclineProductOfferingIds: MemoizedSelector<object, AsyncData<number[]>> = createSelector(
    getSelectedEnrollments,
    ShoppingCartsSelectors.getCartItemsProductIds,
    (selectedEnrollmentsData, cartItemsData): AsyncData<number[]> => {
        //  Combine selected enrollments and cart items data
        const combineData = combineAsyncDatas([selectedEnrollmentsData, cartItemsData]);
        return mapAsyncData(combineData, ({ value: [selectedEnrollments, cartItemProductIds] }) => {
            const declinedProductIds = selectedEnrollments
                .filter((selectedEnrollment) => selectedEnrollment.plan.characteristics?.includes(Characteristics.DECLINE))
                .map((product) => product.plan.productId)
                .filter((productId): productId is number => productId != null);

            // Removes product from decline product array if product is in cart.
            return declinedProductIds.filter((productId) => cartItemProductIds.indexOf(productId) < 0);
        });
    },
);
// #endregion

/* Grandfather enrollments are the enrollments associated with a plan that has a sunset date and the sunset date must be less than today.
 * When there is a sunset date on a plan, it means that plan will not be offered by the carrier post that sunset date.
 * But however the member can still continue to avail the benefits of the policy
 * if already enrolled in it and such enrollments will not be editable as well.
 * This selector will check if the selected enrollment is grandfather enrollment or not.
 */
export const checkForGrandfatherEnrollment: MemoizedSelector<object, AsyncData<boolean>> = createSelector(
    getSelectedEnrollments,
    getSelectedEnrollmentId,
    (enrollmentDatas, enrollmentId) => {
        if (!enrollmentId) {
            return getIdleAsyncData();
        }

        return mapAsyncData(enrollmentDatas, ({ value: enrollments }) => {
            const filteredEnrollments = enrollments
                .filter(
                    (enrollment) =>
                        enrollment.status === EnrollmentStatusType.APPROVED && enrollment.plan.sunsetDate && enrollment.id === enrollmentId,
                )
                .map((enrollment) => {
                    const today = new Date().setHours(0, 0, 0, 0);
                    const daysLeft = getDifferenceInDays(new Date(toDateObj(enrollment.plan.sunsetDate)), today);
                    return daysLeft < 0 ? true : false;
                })[0];

            return filteredEnrollments ? filteredEnrollments : false;
        });
    },
);

// Once the producer ends their coverage then along with the enrollment object qualifyingEventId gets created
// with same Id one entry pushed in QLE for same member.
// This selector is used to get the active MemberQualifyingEvent from QLE API
// MemberQualifyingEvent should consist with enrollment carrier status as
// Approved or Active with presence of either of requestedCoverageEndDate or endPlanRequestStatus
export const getQLEForEndedCoverage = (
    enrollment?: Enrollments | null,
): MemoizedSelector<object, AsyncData<MemberQualifyingEvent | null>> =>
    createSelector(MembersSelectors.getSelectedQualifyEvents, (qualifyingEventDataSet) =>
        mapAsyncData(
            qualifyingEventDataSet,
            ({ value: qualifyingEventArray }) =>
                qualifyingEventArray?.find(
                    (qualifyingEvent) =>
                        qualifyingEvent.id === enrollment?.qualifyingEventId &&
                        (qualifyingEvent.endPlanRequestStatus || qualifyingEvent.requestedCoverageEndDate) &&
                        (enrollment?.status === CarrierStatus.ACTIVE || enrollment?.status === StatusType.APPROVED),
                ) ?? null,
        ),
    );

// #region to confirm the aflac policies are finished loading at the backend
export const getImportPolicyEntities = createSelector(getEnrollmentsFeatureState, (state: State) => state.importPolicyEntities);

export const getImportPolicy: MemoizedSelector<object, AsyncData<string | null>> = createSelector(
    getImportPolicyEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: ImportPolicyEntities, memberId, mpGroup) => {
        if (!mpGroup || !memberId) {
            return getIdleAsyncData();
        }

        const id = getImportPolicyEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const reinstatementCheckForEnrollment = (selectedEnrollment?: AsyncData<Enrollments | null>): AsyncData<Enrollments | null> =>
    mapAsyncData(selectedEnrollment, ({ value: enrollment }) =>
        // reinstatement flag should be there
        // doesn't depend on expires after
        // either reinstatement end date or reinstatement period end date should not be a past date
        enrollment?.reinstatement && (!isPastDate(enrollment?.reinstatementEndDate) || !isPastDate(enrollment?.reinstatementPeriodEndDate))
            ? enrollment
            : null,
    );

// Check if the selected enrollment is eligible for reinstatement
export const enrollmentEligibilityForReinstatement = (
    basePlanEnrollmentId: number,
): MemoizedSelector<object, AsyncData<Enrollments | null>> =>
    createSelector(getSelectedEnrollments, (enrollmentsData) => {
        const selectedEnrollment = mapAsyncData(
            enrollmentsData,
            ({ value: enrollments }) => enrollments.find((enrollment) => enrollment.id === basePlanEnrollmentId) ?? null,
        );

        return reinstatementCheckForEnrollment(selectedEnrollment);
    });
// #endregion

// #region DownloadPreliminaryFormResponse selector
export const getDownloadPreliminaryFormEntities = createSelector(
    getEnrollmentsFeatureState,
    (state: State) => state.downloadPreliminaryFormEntities,
);

export const getDownloadPreliminaryFormResponse = (
    memberId: number,
    preliminaryFormPath: string,
    cartItemId: number,
    mpGroupId: number,
): MemoizedSelector<object, AsyncData<string>> =>
    createSelector(getDownloadPreliminaryFormEntities, (entitiesState) => {
        const id = getDownloadPreliminaryFormEntityId({
            memberId,
            preliminaryFormPath,
            cartItemId,
            mpGroupId,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });
// #end region

// #region EmailPreliminaryFormResponse selector
export const getEmailPreliminaryFormEntities = createSelector(
    getEnrollmentsFeatureState,
    (state: State) => state.emailPreliminaryFormEntities,
);

export const getEmailPreliminaryFormResponse = (
    memberId: number,
    email: string,
    mpGroupId: number,
): MemoizedSelector<object, AsyncData<HttpResponse<unknown>>> =>
    createSelector(getEmailPreliminaryFormEntities, (entitiesState) => {
        const id = getEmailPreliminaryFormEntityId({
            memberId,
            email,
            mpGroupId,
        });
        return getAsyncDataFromEntitiesState(entitiesState, id);
    });
// #end region
