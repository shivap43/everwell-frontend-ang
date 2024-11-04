import { KnockoutQuestion, MemberQLETypes } from "@empowered/api";

import {
    AsyncData,
    CarrierId,
    CombinedOfferings,
    CombinedOfferingWithCartAndEnrollment,
    CoverageDatesEnrollmentType,
    CoverageLevelId,
    CoverageLevelNames,
    CrossBorderAlertType,
    DateFormat,
    EnrollmentMethod,
    PlanOfferingCostInfo,
    PlanOfferingPricingCoverage,
    PlanOfferingWithCartAndEnrollment,
    PlanOfferingWithCoverageDates,
    ProductId,
    QuestionTitles,
    ShopPageType,
    TobaccoInformation,
    KnockoutType,
    Characteristics,
    RiderCart,
    CoverageLevel,
    PolicyOwnershipType,
    PlanOffering,
    GetCartItems,
    HasCoverageDates,
    CoverageDatesRecord,
    ApplicationResponse,
    PlanOfferingPricing,
    MemberDependent,
    StatusType,
    StepType,
} from "@empowered/constants";
import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { AccountsSelectors } from "../accounts";
import { EnrollmentsSelectors } from "../enrollments";
import { MembersSelectors } from "../members";
import { getSelectedChildDependents } from "../members/members.selectors";
import {
    combineAsyncDatas,
    flattenAsyncData,
    getAsyncDataFromEntitiesState,
    getIdleAsyncData,
    getSucceededAsyncData,
    mapAsyncData,
} from "../../ngrx.store.helpers";
import { ProductOfferingsSelectors } from "../product-offerings";
import { ProductsSelectors } from "../products";
import { getCoverageLevelDisplayName } from "../../services/coverage-level-helper/coverage-level-helper.service";
import { getEarliestDate, isAfterOrEqual, isBeforeOrEqual, toDateObj } from "../../services/dates/dates.service";
import {
    checkCrossBorderRestriction,
    isReEnrollable,
    mapCartAndEnrollmentToPlanOffering,
    matchEnrollmentWithPlanOffering,
    removeProductOfferingsWithoutPlanOffering,
} from "../../services/plan-offering-helper/plan-offering-helper.service";
import { SharedSelectors } from "../shared";
import { ShoppingCartsSelectors } from "../shopping-carts";
import { addUpdateCartItemsEntityId } from "../shopping-carts/shopping-carts.state";
import { EliminationPeriod } from "./plan-offerings.model";
import { PLAN_OFFERINGS_FEATURE_KEY } from "./plan-offerings.reducer";
import {
    CoverageLevelsEntities,
    getCoverageDatesRecordEntityId,
    getCoverageLevelEntityId,
    getKnockoutQuestionsEntityId,
    getKnockoutResponsesEntityId,
    getPlanOfferingPricingsEntityId,
    getPlanOfferingRidersEntityId,
    getPlanOfferingsEntityId,
    PlanOfferingPricingsEntities,
    PlanOfferingRidersEntities,
    State,
} from "./plan-offerings.state";

// Lookup the 'PlanOfferings' feature state managed by NgRx
export const getPlanOfferingsFeatureState = createFeatureSelector<State>(PLAN_OFFERINGS_FEATURE_KEY);

export const getSelectedPlanId = createSelector(getPlanOfferingsFeatureState, (state: State) => state.selectedPlanId);

/**
 * Gets selected plan offering id
 */
export const getSelectedPlanOfferingId = createSelector(getPlanOfferingsFeatureState, (state: State) => state.selectedPlanOfferingId);

// Gets selected shop page type
export const getSelectedShopPageType = createSelector(getPlanOfferingsFeatureState, (state: State) => state.selectedShopPageType);

// Gets CoverageDatesEnrollmentType based on selected shop page type
export const getSelectedCoverageDatesEnrollmentType = createSelector(getPlanOfferingsFeatureState, (state: State) => {
    if (!state.selectedShopPageType) {
        // Return null if shop page type is not present
        return null;
    }
    switch (state.selectedShopPageType) {
        // have to return
        // CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT if its dual OE or DUAL future QLE
        case ShopPageType.DUAL_OE_SHOP:
        case ShopPageType.DUAL_FUTURE_QLE:
            return CoverageDatesEnrollmentType.OPEN_ENROLLMENT;
        // CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT if its dual QLE or DUAL future QLE
        case ShopPageType.DUAL_QLE_SHOP:
        case ShopPageType.DUAL_CURRENT_QLE:
            return CoverageDatesEnrollmentType.QUALIFYING_LIFE_EVENT;
        default:
            return CoverageDatesEnrollmentType.SINGLE_PLAN_YEAR;
    }
});

// #region PlanOfferings
export const getPlanOfferingsState = createSelector(getPlanOfferingsFeatureState, (state: State) => state.planOfferingsEntities);

export const getSelectedPlanOfferings: MemoizedSelector<object, AsyncData<PlanOffering[]>> = createSelector(
    getPlanOfferingsState,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    SharedSelectors.getSelectedEnrollmentMethod,
    MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
    ProductOfferingsSelectors.getSelectedReferenceDate,
    (entitiesState, mpGroup, memberId, enrollmentMethod, stateAbbreviationData, referenceDate): AsyncData<PlanOffering[]> => {
        if (!mpGroup || !memberId || !referenceDate) {
            return getIdleAsyncData();
        }

        return flattenAsyncData(
            mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) => {
                // We are using dual plan year service to handle all scenario's
                const id = getPlanOfferingsEntityId({
                    mpGroup,
                    memberId,
                    enrollmentMethod,
                    stateAbbreviation,
                    // Getting reference date from dual plan year service
                    referenceDate,
                });

                return getAsyncDataFromEntitiesState(entitiesState, id);
            }),
        );
    },
);

export const getSelectedPlanOffering: MemoizedSelector<object, AsyncData<PlanOffering | null>> = createSelector(
    getSelectedPlanOfferings,
    getSelectedPlanOfferingId,
    (planOfferingsData: AsyncData<PlanOffering[]>, planOfferingId?: number | null): AsyncData<PlanOffering | null> => {
        if (!planOfferingId) {
            return getIdleAsyncData();
        }

        return mapAsyncData(
            planOfferingsData,
            ({ value: planOfferings }) => planOfferings.find((planOffering) => planOffering.id === planOfferingId) ?? null,
        );
    },
);

// #endregion

// #region PlanOfferingRiders
export const getPlanOfferingRidersEntities = createSelector(
    getPlanOfferingsFeatureState,
    (state: State) => state.planOfferingRidersEntities,
);

export const getPlanOfferingRidersData = (
    entitiesState: PlanOfferingRidersEntities,
    planOfferingId?: number | null,
    mpGroup?: number | null,
    memberId?: number | null,
    enrollmentMethod?: EnrollmentMethod | null,
    stateAbbreviation?: string | null,
): AsyncData<PlanOffering[]> => {
    if (!planOfferingId || !mpGroup || !memberId || !stateAbbreviation) {
        return getIdleAsyncData();
    }

    const id = getPlanOfferingRidersEntityId({
        planOfferingId,
        mpGroup,
        memberId,
        enrollmentMethod,
        stateAbbreviation,
    });

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getPlanOfferingRiders = (planOfferingId: number | null): MemoizedSelector<object, AsyncData<PlanOffering[]>> =>
    createSelector(
        getPlanOfferingRidersEntities,
        AccountsSelectors.getSelectedMPGroup,
        MembersSelectors.getSelectedMemberId,
        SharedSelectors.getSelectedEnrollmentMethod,
        MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
        (entitiesState, mpGroup, memberId, enrollmentMethod, stateAbbreviationData) =>
            flattenAsyncData(
                mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) =>
                    getPlanOfferingRidersData(entitiesState, planOfferingId, mpGroup, memberId, enrollmentMethod, stateAbbreviation),
                ),
            ),
    );

export const getSelectedPlanOfferingRiders: MemoizedSelector<object, AsyncData<PlanOffering[]>> = createSelector(
    getPlanOfferingRidersEntities,
    getSelectedPlanOfferingId,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    SharedSelectors.getSelectedEnrollmentMethod,
    MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
    (entitiesState, planOfferingId, mpGroup, memberId, enrollmentMethod, stateAbbreviationData) =>
        flattenAsyncData(
            mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) =>
                getPlanOfferingRidersData(entitiesState, planOfferingId, mpGroup, memberId, enrollmentMethod, stateAbbreviation),
            ),
        ),
);
// #endregion

// #region CoverageDatesRecords
export const getCoverageDatesRecordEntities = createSelector(
    getPlanOfferingsFeatureState,
    (state: State) => state.coverageDatesRecordEntities,
);

export const getSelectedCoverageDatesRecord: MemoizedSelector<object, AsyncData<CoverageDatesRecord>> = createSelector(
    getCoverageDatesRecordEntities,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    getSelectedCoverageDatesEnrollmentType,
    ProductOfferingsSelectors.getSelectedReferenceDate,
    (entitiesState, mpGroup, memberId, coverageDatesEnrollmentType, referenceDate) => {
        if (!mpGroup || !memberId || !coverageDatesEnrollmentType || !referenceDate) {
            return getIdleAsyncData();
        }

        const id = getCoverageDatesRecordEntityId({
            mpGroup,
            memberId,
            coverageDatesEnrollmentType,
            // Do not use DateFormat.YEAR_MONTH_DAY like you would for the DatePipe,
            // mm means Day # for DatePipe, but in moment it means Day of Week
            referenceDate,
        });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getSelectedPlanOfferingsWithCoverageDates: MemoizedSelector<
    object,
AsyncData<PlanOfferingWithCoverageDates[]>
> = createSelector(
    getSelectedPlanOfferings,
    getSelectedCoverageDatesRecord,
    (planOfferingsData, coverageDatesRecordData): AsyncData<PlanOfferingWithCoverageDates[]> => {
        const combinedDatas = combineAsyncDatas([planOfferingsData, coverageDatesRecordData]);

        return mapAsyncData(combinedDatas, ({ value: [planOfferings, coverageDatesRecord] }) =>
            planOfferings.map((planOffering) => {
                const coverageDates = coverageDatesRecord[planOffering.id];

                const { defaultCoverageStartDate, earliestCoverageStartDate, latestCoverageStartDate, isContinuous } = coverageDates;

                return {
                    planOffering,
                    defaultCoverageStartDate,
                    earliestCoverageStartDate,
                    latestCoverageStartDate,
                    isContinuous,
                };
            }),
        );
    },
);

export const getSelectedCombinedOfferings: MemoizedSelector<object, AsyncData<CombinedOfferings[]>> = createSelector(
    getSelectedPlanOfferingsWithCoverageDates,
    ProductOfferingsSelectors.getSelectedProductOfferingSet,
    (planOfferingsWithCoverageDatesData, productOfferingsData): AsyncData<CombinedOfferings[]> => {
        const combinedDatas = combineAsyncDatas([planOfferingsWithCoverageDatesData, productOfferingsData]);

        return mapAsyncData(combinedDatas, ({ value: [planOfferingsWithCoverageDates, productOfferings] }) => {
            // Array of all known Aflac CarrierIds
            const aflacCarrierIds = [CarrierId.AFLAC, CarrierId.AFLAC_GROUP];

            const combinedOfferingData = productOfferings.map((productOffering) => {
                const filteredPlanOfferingsWithCoverageDates = planOfferingsWithCoverageDates
                    .filter(({ planOffering }) => planOffering.productOfferingId === productOffering.id)

                    .filter(
                        // Remove supplementary / additional units plans
                        (planOfferingsWithCoverageDate) =>
                            !planOfferingsWithCoverageDate.planOffering.plan.characteristics?.includes(Characteristics.SUPPLEMENTARY),
                    );

                // Filter PlanOfferings for Plans that have an Aflac-related Carrier Id
                // These are used to calculate the coverage starts for a Product
                const aflacPlanOfferingsWithCoverageDates = filteredPlanOfferingsWithCoverageDates.filter(({ planOffering }) =>
                    aflacCarrierIds.includes(planOffering.plan.carrierId),
                );

                return {
                    productOffering,
                    planOfferingsWithCoverageDates: filteredPlanOfferingsWithCoverageDates,
                    earliestCoverageStartDate: getEarliestDate(
                        aflacPlanOfferingsWithCoverageDates.map(({ earliestCoverageStartDate }) => earliestCoverageStartDate),
                    ),
                    latestCoverageStartDate: getEarliestDate(
                        aflacPlanOfferingsWithCoverageDates.map(({ latestCoverageStartDate }) => latestCoverageStartDate),
                    ),
                    defaultCoverageStartDate: getEarliestDate(
                        aflacPlanOfferingsWithCoverageDates.map(({ defaultCoverageStartDate }) => defaultCoverageStartDate),
                    ),
                };
            });

            // Filtering products with out valid plan offering data
            return combinedOfferingData.filter((combinedOffering) => combinedOffering.planOfferingsWithCoverageDates.length);
        });
    },
);

export const getCombinedOfferingsWithCartAndEnrollment: MemoizedSelector<
    object,
AsyncData<CombinedOfferingWithCartAndEnrollment[]>
> = createSelector(
    getSelectedPlanOfferings,
    ProductOfferingsSelectors.getSelectedProductOfferingSet,
    ShoppingCartsSelectors.getCartItemsSet,
    EnrollmentsSelectors.getSelectedEnrollments,
    (planOfferingsData, productOfferingsData, cartItemsData, enrollmentsData): AsyncData<CombinedOfferingWithCartAndEnrollment[]> => {
        const combinedDatas = combineAsyncDatas([planOfferingsData, productOfferingsData, cartItemsData, enrollmentsData]);

        return mapAsyncData(combinedDatas, ({ value: [planOfferings, productOfferings, cartItems, enrollments] }) => {
            // Decline plan enrollments should be ignored and will not be shown on screen
            const validEnrollments = enrollments.filter(
                (enrollment) => !enrollment.plan.characteristics?.includes(Characteristics.DECLINE),
            );

            // Reinstate type cart items should be ignored and will not be shown on screen
            const validCartItems = cartItems.filter((cartItem) => !cartItem.applicationType?.includes(StepType.REINSTATEMENT));

            const combinedOfferingsData = productOfferings.map((productOffering) => {
                // Filter enrollments for a product
                const filteredEnrollments = validEnrollments.filter((coverage) => coverage.plan.productId === productOffering.product.id);

                // Filter for supplement plans and map enrollments and cart items to plan offering
                const planOfferingsWithCartAndEnrollment = mapCartAndEnrollmentToPlanOffering(
                    productOffering.id,
                    planOfferings,
                    filteredEnrollments,
                    validCartItems,
                );

                return {
                    productOffering,
                    planOfferingsWithCartAndEnrollment,
                };
            });

            // If below implementation cause any other issue in shop. Remove from here and use helper service in component.
            // Remove productOfferings without planOffering from combinedOfferingsData.
            return removeProductOfferingsWithoutPlanOffering(combinedOfferingsData);
        });
    },
);

export const getSelectedEarliestCombinedOfferingCoverageDates: MemoizedSelector<object, AsyncData<HasCoverageDates>> = createSelector(
    getSelectedCombinedOfferings,
    (combinedOfferingsAsyncData) =>
        // TODO [Coverage Dates]: Update these types to check for nullish strings
        mapAsyncData(combinedOfferingsAsyncData, ({ value }) => ({
            earliestCoverageStartDate: getEarliestDate(value.map(({ earliestCoverageStartDate }) => earliestCoverageStartDate)) as string,
            latestCoverageStartDate: getEarliestDate(value.map(({ latestCoverageStartDate }) => latestCoverageStartDate)) as string,
            defaultCoverageStartDate: getEarliestDate(value.map(({ defaultCoverageStartDate }) => defaultCoverageStartDate)) as string,
        })),
);

export const getSelectedProductCombinedOfferingWithCartAndEnrollment: MemoizedSelector<
    object,
AsyncData<CombinedOfferingWithCartAndEnrollment | null>
> = createSelector(
    getCombinedOfferingsWithCartAndEnrollment,
    ProductsSelectors.getSelectedProductId,
    (combinedOfferingsData, productId): AsyncData<CombinedOfferingWithCartAndEnrollment | null> => {
        if (!productId) {
            return getIdleAsyncData();
        }

        return mapAsyncData(
            combinedOfferingsData,
            ({ value: combinedOfferings }) =>
                combinedOfferings.find((combinedOffering) => combinedOffering.productOffering.product.id === productId) ?? null,
        );
    },
);
// #endregion

// #region CoverageLevels
export const getCoverageLevelsEntities = createSelector(getPlanOfferingsFeatureState, (state: State) => state.coverageLevelsEntities);

export const getCoverageLevelsAsyncData = (
    coverageLevelsEntitiesState: CoverageLevelsEntities,
    planId?: number | null,
    mpGroup?: number | null,
    fetchRetainRiders?: boolean,
    parentCoverageLevelId?: number | null,
): AsyncData<CoverageLevel[]> => {
    if (!mpGroup || !planId) {
        return getIdleAsyncData();
    }

    const id = getCoverageLevelEntityId({ mpGroup, planId, fetchRetainRiders: !!fetchRetainRiders, parentCoverageLevelId });

    return getAsyncDataFromEntitiesState(coverageLevelsEntitiesState, id);
};

export const getCoverageLevels = (
    planId?: number | null,
    parentCoverageLevelId?: number | null,
    fetchRetainRiders?: boolean,
): MemoizedSelector<object, AsyncData<CoverageLevel[]>> =>
    createSelector(getCoverageLevelsEntities, AccountsSelectors.getSelectedMPGroup, (entitiesState, mpGroup) =>
        getCoverageLevelsAsyncData(entitiesState, planId, mpGroup, fetchRetainRiders, parentCoverageLevelId),
    );

export const getSelectedCoverageLevels: MemoizedSelector<object, AsyncData<CoverageLevel[]>> = createSelector(
    getCoverageLevelsEntities,
    AccountsSelectors.getSelectedMPGroup,
    getSelectedPlanId,
    (entitiesState, mpGroup, planId) => getCoverageLevelsAsyncData(entitiesState, planId, mpGroup, false),
);
// #endregion

// #region KnockoutQuestions
export const getKnockoutQuestionsEntities = createSelector(getPlanOfferingsFeatureState, (state: State) => state.knockoutQuestionsEntities);

export const getSelectedKnockoutQuestions: MemoizedSelector<object, AsyncData<KnockoutQuestion[]>> = createSelector(
    getKnockoutQuestionsEntities,
    getSelectedPlanOfferingId,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
    (entitiesState, planOfferingId, mpGroup, memberId, stateAbbreviationData) => {
        if (!mpGroup || !memberId || !planOfferingId) {
            return getIdleAsyncData();
        }

        return flattenAsyncData(
            mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) => {
                if (!stateAbbreviation) {
                    return getIdleAsyncData();
                }

                const id = getKnockoutQuestionsEntityId({ planOfferingId, mpGroup, memberId, stateAbbreviation });

                return getAsyncDataFromEntitiesState(entitiesState, id);
            }),
        );
    },
);

export const getEligibilityKnockoutQuestions = (
    selectedCoverageLevelId?: number | null,
): MemoizedSelector<object, AsyncData<KnockoutQuestion[]>> =>
    createSelector(getSelectedKnockoutQuestions, getSelectedCoverageLevels, (entitiesState, selectedCoverageLevels) => {
        const combinedData = combineAsyncDatas([entitiesState, selectedCoverageLevels]);
        return mapAsyncData(combinedData, ({ value: [knockoutQuestions, coverageLevels] }) => {
            const isCoverSpouse = coverageLevels.some(
                (coverageLevel) => coverageLevel.id === selectedCoverageLevelId && coverageLevel.rule?.coversSpouse,
            );

            // Filter the eligibility questions from all knockout questions
            let allEligibilityQuestions = knockoutQuestions.filter((knockoutQuestion) =>
                knockoutQuestion.title.toLowerCase().includes(QuestionTitles.ELIGIBILITY_QUESTIONS),
            );

            if (allEligibilityQuestions.length && !isCoverSpouse) {
                allEligibilityQuestions = allEligibilityQuestions.filter((eligibilityQuestion) =>
                    eligibilityQuestion.question?.options?.every((option) => option.knockoutType !== KnockoutType.SPOUSE_KNOCKOUT),
                );
            }

            return allEligibilityQuestions.map((eligibilityQuestion) => {
                const text = eligibilityQuestion.question.text.replace(/{glossary}/g, "");
                return {
                    ...eligibilityQuestion,
                    question: {
                        ...eligibilityQuestion.question,
                        text,
                    },
                };
            });
        });
    });
// #endregion

// #region KnockoutResponses
export const getKnockoutResponsesEntities = createSelector(
    getPlanOfferingsFeatureState,
    (state: State) => state.loadKnockoutResponsesEntities,
);

export const getSelectedKnockoutResponses: MemoizedSelector<object, AsyncData<ApplicationResponse[][]>> = createSelector(
    getKnockoutResponsesEntities,
    AccountsSelectors.getSelectedMPGroup,
    MembersSelectors.getSelectedMemberId,
    (entitiesState, mpGroup, memberId) => {
        if (!mpGroup || !memberId) {
            return getIdleAsyncData();
        }

        const id = getKnockoutResponsesEntityId({ mpGroup, memberId });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region PlanOfferingPricings
export const getPlanOfferingPricingsEntities = createSelector(
    getPlanOfferingsFeatureState,
    (state: State) => state.planOfferingPricingsEntities,
);

export const getPlanOfferingPricingsAsyncData = (
    entitiesState: PlanOfferingPricingsEntities,
    includeFee: boolean,
    memberIsTobaccoUser?: boolean | null,
    spouseIsTobaccoUser?: boolean | null,
    mpGroup?: number | null,
    memberId?: number | null,
    planOfferingId?: number | null,
    stateAbbreviation?: string | null,
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    parentPlanId?: number | null,
    baseBenefitAmount?: number | null,
    parentPlanCoverageLevelId?: number | null,
    shoppingCartItemId?: number | null,
): AsyncData<PlanOfferingPricing[]> => {
    if (!stateAbbreviation || !mpGroup || !memberId || !planOfferingId) {
        return getIdleAsyncData();
    }

    const id = getPlanOfferingPricingsEntityId({
        mpGroup,
        memberId,
        planOfferingId,
        stateAbbreviation,
        riskClassId,
        coverageEffectiveDate,
        parentPlanId,
        baseBenefitAmount,
        parentPlanCoverageLevelId,
        memberIsTobaccoUser,
        spouseIsTobaccoUser,
        shoppingCartItemId,
        includeFee,
    });

    return getAsyncDataFromEntitiesState(entitiesState, id);
};

export const getPlanOfferingPricings = (
    includeFee: boolean,
    memberIsTobaccoUser?: boolean | null,
    spouseIsTobaccoUser?: boolean | null,
    planOfferingId?: number | null,
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    parentPlanId?: number | null,
    baseBenefitAmount?: number | null,
    parentPlanCoverageLevelId?: number | null,
    shoppingCartItemId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingPricing[]>> =>
    createSelector(
        getPlanOfferingPricingsEntities,
        MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
        AccountsSelectors.getSelectedMPGroup,
        MembersSelectors.getSelectedMemberId,
        (
            entitiesState: PlanOfferingPricingsEntities,
            stateAbbreviationData: AsyncData<string | undefined | null>,
            mpGroup?: number | null,
            memberId?: number | null,
        ): AsyncData<PlanOfferingPricing[]> =>
            flattenAsyncData(
                mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) =>
                    getPlanOfferingPricingsAsyncData(
                        entitiesState,
                        includeFee,
                        memberIsTobaccoUser,
                        spouseIsTobaccoUser,
                        mpGroup,
                        memberId,
                        planOfferingId,
                        stateAbbreviation,
                        riskClassId,
                        coverageEffectiveDate,
                        parentPlanId,
                        baseBenefitAmount,
                        parentPlanCoverageLevelId,
                        shoppingCartItemId,
                    ),
                ),
            ),
    );

export const getSelectedPlanOfferingPricings = (
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    riderParentPlanId?: number | null,
    baseBenefitAmount?: number | null,
    parentPlanCoverageLevelId?: number | null,
    tobaccoInformation?: TobaccoInformation | null,
    shoppingCartItemId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingPricing[]>> =>
    createSelector(
        getPlanOfferingPricingsEntities,
        MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
        AccountsSelectors.getSelectedMPGroup,
        MembersSelectors.getSelectedMemberId,
        getSelectedPlanOfferingId,
        (
            entitiesState: PlanOfferingPricingsEntities,
            stateAbbreviationData: AsyncData<string | undefined | null>,
            mpGroup?: number | null,
            memberId?: number | null,
            planOfferingId?: number | null,
        ) =>
            flattenAsyncData(
                mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) =>
                    getPlanOfferingPricingsAsyncData(
                        entitiesState,
                        false,
                        tobaccoInformation?.memberIsTobaccoUser,
                        tobaccoInformation?.spouseIsTobaccoUser,
                        mpGroup,
                        memberId,
                        planOfferingId,
                        stateAbbreviation,
                        riskClassId,
                        coverageEffectiveDate,
                        riderParentPlanId,
                        baseBenefitAmount,
                        parentPlanCoverageLevelId,
                        shoppingCartItemId,
                    ),
                ),
            ),
    );

// plan pricing coverage mapping for standard and non-standard
export const getPlanOfferingPricingCoveragesData = (
    planOfferingPricingsData: AsyncData<PlanOfferingPricing[]>,
    coverageLevelsData: AsyncData<CoverageLevel[]>,
    selectedPlanOfferingData: AsyncData<PlanOffering | null>,
    productId?: number | null,
    benefitAmount?: number | null,
    eliminationPeriodId?: number | null,
    dependentAge?: number | null,
): AsyncData<PlanOfferingPricingCoverage[]> => {
    if (!productId) {
        return getIdleAsyncData();
    }

    // combining data for pricing and coverage level
    const combinedData = combineAsyncDatas([planOfferingPricingsData, coverageLevelsData, selectedPlanOfferingData]);

    return mapAsyncData(combinedData, ({ value: [planOfferingPricings, coverageLevels, planOffering] }) => {
        // check if the selected plan is AG short term disability
        const isAgSTD = planOffering?.plan.carrierId === CarrierId.AFLAC_GROUP && productId === ProductId.SHORT_TERM_DISABILITY;

        // check if product id does not belong to non-standard or AG STD
        if (productId !== ProductId.SHORT_TERM_DISABILITY || isAgSTD) {
            // combining data for pricing and coverage level
            return coverageLevels
                .filter((value) => value.id !== CoverageLevelId.DECLINED)
                .map((coverageLevel) => {
                    const filteredCoveragePricing = planOfferingPricings.find((pricingObject) => {
                        // Return false if pricingObject doesn't have min/max age,
                        // and selectedDependentAge is greater than max age and less then min age.
                        // below check if for Juvenile Plans.
                        if (
                            (productId === ProductId.JUVENILE_TERM_LIFE || productId === ProductId.JUVENILE_WHOLE_LIFE) &&
                            pricingObject.minAge != null &&
                            pricingObject.maxAge != null &&
                            dependentAge != null &&
                            (pricingObject.minAge > dependentAge || dependentAge > pricingObject.maxAge)
                        ) {
                            return false;
                        }
                        // Return false if pricingObject benefitAmount doesn't match with selected benefitAmount
                        if (pricingObject.benefitAmount && pricingObject.benefitAmount !== benefitAmount) {
                            return false;
                        }
                        // return pricingObject with selected coverageLevelId,
                        // also with selected benefitAmount (if available) and selected dependentAge (if available)
                        return pricingObject.coverageLevelId === coverageLevel.id;
                    });

                    return {
                        planOfferingPricing: filteredCoveragePricing ?? null,
                        coverageLevel: {
                            ...coverageLevel,
                            displayName:
                                isAgSTD || productId === ProductId.LTD
                                    ? CoverageLevelNames.INDIVIDUAL_COVERAGE
                                    : getCoverageLevelDisplayName(coverageLevel, productId),
                        },
                    };
                });
        }

        // Non standard coverage level
        return coverageLevels
            .filter((eliminationPeriod) => eliminationPeriod.id === eliminationPeriodId)
            .map((coverageLevel) => {
                const filteredCoveragePricing = planOfferingPricings.find(
                    (pricingObject) =>
                        pricingObject.benefitAmount === benefitAmount && pricingObject.coverageLevelId === eliminationPeriodId,
                );

                return {
                    planOfferingPricing: filteredCoveragePricing ?? null,
                    coverageLevel: {
                        ...coverageLevel,
                        // for std and ltd plans coverage level must be displayed as individual
                        displayName: CoverageLevelNames.INDIVIDUAL_COVERAGE,
                    },
                };
            });
    });
};

export const getPlanOfferingPricingCoverages = (
    tobaccoInformation?: TobaccoInformation | null,
    planOfferingId?: number | null,
    productId?: number | null,
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    selectedBenefitAmount?: number | null,
    selectedEliminationPeriodId?: number | null,
    selectedDependentAge?: number | null,
    shoppingCartItemId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingPricingCoverage[]>> =>
    createSelector(
        getPlanOfferingPricings(
            false,
            tobaccoInformation?.memberIsTobaccoUser,
            tobaccoInformation?.spouseIsTobaccoUser,
            planOfferingId,
            riskClassId,
            coverageEffectiveDate,
            null,
            null,
            null,
            shoppingCartItemId,
        ),
        getSelectedCoverageLevels,
        getSelectedPlanOffering,
        (
            planOfferingPricingsData: AsyncData<PlanOfferingPricing[]>,
            coverageLevelsData: AsyncData<CoverageLevel[]>,
            selectedPlanOffering: AsyncData<PlanOffering | null>,
        ): AsyncData<PlanOfferingPricingCoverage[]> =>
            getPlanOfferingPricingCoveragesData(
                planOfferingPricingsData,
                coverageLevelsData,
                selectedPlanOffering,
                productId,
                selectedBenefitAmount,
                selectedEliminationPeriodId,
                selectedDependentAge,
            ),
    );

export const getSelectedPlanOfferingPricingCoverages = (
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    selectedBenefitAmount?: number | null,
    selectedEliminationPeriodId?: number | null,
    tobaccoInformation?: TobaccoInformation | null,
    selectedDependentAge?: number | null,
    shoppingCartItemId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingPricingCoverage[]>> =>
    createSelector(
        getSelectedPlanOfferingPricings(riskClassId, coverageEffectiveDate, null, null, null, tobaccoInformation, shoppingCartItemId),
        getSelectedCoverageLevels,
        getSelectedPlanOffering,
        ProductsSelectors.getSelectedProductId,
        (
            planOfferingPricingsData: AsyncData<PlanOfferingPricing[]>,
            coverageLevelsData: AsyncData<CoverageLevel[]>,
            selectedPlanOffering: AsyncData<PlanOffering | null>,
            productId?: number | null,
        ): AsyncData<PlanOfferingPricingCoverage[]> =>
            getPlanOfferingPricingCoveragesData(
                planOfferingPricingsData,
                coverageLevelsData,
                selectedPlanOffering,
                productId,
                selectedBenefitAmount,
                selectedEliminationPeriodId,
                selectedDependentAge,
            ),
    );
// #endregion

export const getPlanOfferingPricingsByEliminationPeriodId = (
    planOfferingPricings: PlanOfferingPricing[],
    eliminationPeriodId?: number | null,
): PlanOfferingPricing[] => {
    if (!eliminationPeriodId) {
        return planOfferingPricings;
    }

    return planOfferingPricings.filter((planOfferingPricing) => planOfferingPricing.coverageLevelId === eliminationPeriodId);
};

// Selector to get the benefit amount set
export const getBenefitAmountsData = (
    planOfferingPricingsData: AsyncData<PlanOfferingPricing[]>,
    eliminationPeriodId?: number | null,
): AsyncData<number[]> =>
    mapAsyncData(planOfferingPricingsData, ({ value: planOfferingPricings }) => {
        const filteredPricings = getPlanOfferingPricingsByEliminationPeriodId(planOfferingPricings, eliminationPeriodId);

        if (filteredPricings.some((price) => price.benefitAmount)) {
            return Array.from(new Set(filteredPricings.map((pricing) => pricing.benefitAmount))).sort(
                (benefitAmount1, benefitAmount2) => benefitAmount2 - benefitAmount1,
            );
        }

        return [];
    });

export const getBenefitAmounts = (
    selectedTobaccoInformation?: TobaccoInformation | null,
    planOffering?: number | null,
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    selectedEliminationPeriodId?: number | null,
    shoppingCartItemId?: number | null,
): MemoizedSelector<object, AsyncData<number[]>> =>
    createSelector(
        getPlanOfferingPricings(
            false,
            selectedTobaccoInformation?.memberIsTobaccoUser,
            selectedTobaccoInformation?.spouseIsTobaccoUser,
            planOffering,
            riskClassId,
            coverageEffectiveDate,
            null,
            null,
            null,
            shoppingCartItemId,
        ),
        (planOfferingPricingsData) => getBenefitAmountsData(planOfferingPricingsData, selectedEliminationPeriodId),
    );

// Selector to get the elimination period set
export const getEliminationPeriodsData = (
    coverageLevelsData: AsyncData<CoverageLevel[]>,
    planOfferingData: AsyncData<PlanOffering | null>,
    productId?: number | null,
): AsyncData<EliminationPeriod[]> => {
    if (!productId) {
        return getIdleAsyncData();
    }

    const combinedAsyncDatas = combineAsyncDatas([coverageLevelsData, planOfferingData]);

    return mapAsyncData(combinedAsyncDatas, ({ value: [coverageLevels, planOffering] }) => {
        // check if the selected plan is AG short term disability
        const isAgSTD = planOffering?.plan.carrierId === CarrierId.AFLAC_GROUP && productId === ProductId.SHORT_TERM_DISABILITY;

        // CoverageLevels involving EliminationPeriods only apply for SHORT_TERM_DISABILITY product
        if (productId !== ProductId.SHORT_TERM_DISABILITY || isAgSTD) {
            return [];
        }

        // Reason to do type assertion is elimination periods id, name and eliminationPeriod is not optional in coverage level interface
        return coverageLevels as EliminationPeriod[];
    });
};

// Selector to get elimination periods
export const getEliminationPeriods = (
    planId?: number | null,
    productId?: number | null,
): MemoizedSelector<object, AsyncData<EliminationPeriod[]>> =>
    createSelector(
        getCoverageLevels(planId),
        getSelectedPlanOffering,
        (coverageLevelsData: AsyncData<CoverageLevel[]>, selectedPlanOffering: AsyncData<PlanOffering | null>) =>
            getEliminationPeriodsData(coverageLevelsData, selectedPlanOffering, productId),
    );

// Selector to get selected elimination periods
export const getSelectedEliminationPeriods: MemoizedSelector<object, AsyncData<EliminationPeriod[]>> = createSelector(
    getSelectedCoverageLevels,
    getSelectedPlanOffering,
    ProductsSelectors.getSelectedProductId,
    (coverageLevelsData, selectedPlanOffering: AsyncData<PlanOffering | null>, productId) =>
        getEliminationPeriodsData(coverageLevelsData, selectedPlanOffering, productId),
);

// to get plan offering with cart id
export const getPlanOfferingWithCartId = (
    combinedOfferingsWithCartAndEnrollmentData: AsyncData<CombinedOfferingWithCartAndEnrollment[]>,
    cartId?: number | null,
): AsyncData<PlanOfferingWithCartAndEnrollment | null> => {
    if (!cartId || !combinedOfferingsWithCartAndEnrollmentData) {
        return getIdleAsyncData();
    }
    return mapAsyncData(
        combinedOfferingsWithCartAndEnrollmentData,
        ({ value: combinedOfferingsWithCartAndEnrollment }) =>
            combinedOfferingsWithCartAndEnrollment
                .find((combinedOfferingWithCartAndEnrollment) =>
                    combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.some(
                        (planOfferingWithCartAndEnrollment) => planOfferingWithCartAndEnrollment.cartItemInfo?.id === cartId,
                    ),
                )
                ?.planOfferingsWithCartAndEnrollment.find((planOfferingWithCartAndEnrollment) => {
                    // If cart id is not matching it should not be returned
                    if (planOfferingWithCartAndEnrollment.cartItemInfo?.id !== cartId) {
                        return false;
                    }
                    return true;
                }) ?? null,
    );
};

// #region Selector to get selected PlanPanel data
export const getPlanOfferingWithCartAndEnrollment = (
    combinedOfferingsWithCartAndEnrollmentData: AsyncData<CombinedOfferingWithCartAndEnrollment[]>,
    planOfferingId?: number | null,
    cartId?: number | null,
    enrollmentId?: number | null,
): AsyncData<PlanOfferingWithCartAndEnrollment | null> => {
    if (!planOfferingId) {
        return getIdleAsyncData();
    }

    return mapAsyncData(
        combinedOfferingsWithCartAndEnrollmentData,
        ({ value: combinedOfferingsWithCartAndEnrollment }) =>
            combinedOfferingsWithCartAndEnrollment
                .find((combinedOfferingWithCartAndEnrollment) =>
                    combinedOfferingWithCartAndEnrollment.planOfferingsWithCartAndEnrollment.some(
                        (planOfferingWithCartAndEnrollment) => planOfferingWithCartAndEnrollment.planOffering.id === planOfferingId,
                    ),
                )
                ?.planOfferingsWithCartAndEnrollment.find((planOfferingWithCartAndEnrollment) => {
                    // If plan offering id is not matching it should not be returned
                    if (planOfferingWithCartAndEnrollment.planOffering.id !== planOfferingId) {
                        return false;
                    }
                    // If cart data exists and not matching return false
                    if (
                        (cartId || planOfferingWithCartAndEnrollment.cartItemInfo?.id) &&
                        planOfferingWithCartAndEnrollment.cartItemInfo?.id !== cartId
                    ) {
                        return false;
                    }
                    // If enrollment data exists and not matching return false
                    if (
                        (enrollmentId || planOfferingWithCartAndEnrollment.enrollment) &&
                        planOfferingWithCartAndEnrollment.enrollment?.id !== enrollmentId
                    ) {
                        return false;
                    }

                    // If all above are matching matching return true
                    return true;
                }) ?? null,
    );
};

export const getPlanOfferingCartRiderData = (cartData: AsyncData<GetCartItems[]>, cartId?: number | null): AsyncData<RiderCart[]> => {
    if (!cartData) {
        return getIdleAsyncData();
    }
    return mapAsyncData(cartData, ({ value: cartInfo }) => {
        const riders = cartInfo
            .find((cartItem) => cartItem?.id === cartId)
            ?.riders.filter((rider) => rider.coverageLevelId !== CoverageLevelId.DECLINED);

        if (!riders?.length) {
            return [];
        }

        return riders;
    });
};

export const getPlanOfferingData = (
    planOfferingId?: number | null,
    cartId?: number | null,
    enrollmentId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingWithCartAndEnrollment | null>> =>
    createSelector(
        getCombinedOfferingsWithCartAndEnrollment,
        (combinedOfferingsWithCartAndEnrollment): AsyncData<PlanOfferingWithCartAndEnrollment | null> =>
            getPlanOfferingWithCartAndEnrollment(combinedOfferingsWithCartAndEnrollment, planOfferingId, cartId, enrollmentId),
    );

// selector to get plan offering data with cart item id
export const getPlanOfferingDataWithCartItemId = (
    cartId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingWithCartAndEnrollment | null>> =>
    createSelector(
        getCombinedOfferingsWithCartAndEnrollment,
        (combinedOfferingsWithCartAndEnrollment): AsyncData<PlanOfferingWithCartAndEnrollment | null> =>
            getPlanOfferingWithCartId(combinedOfferingsWithCartAndEnrollment, cartId),
    );

export const getSelectedPlanOfferingData: MemoizedSelector<object, AsyncData<PlanOfferingWithCartAndEnrollment | null>> = createSelector(
    getCombinedOfferingsWithCartAndEnrollment,
    getSelectedPlanOfferingId,
    ShoppingCartsSelectors.getSelectedCartItemId,
    EnrollmentsSelectors.getSelectedEnrollmentId,
    (combinedOfferingsWithCartAndEnrollment, planOfferingId, cartId, enrollmentId): AsyncData<PlanOfferingWithCartAndEnrollment | null> =>
        getPlanOfferingWithCartAndEnrollment(combinedOfferingsWithCartAndEnrollment, planOfferingId, cartId, enrollmentId),
);
// #endregion

export const getSelectedPlanOfferingCartItemRiders = (cartId: number): MemoizedSelector<object, AsyncData<RiderCart[]>> =>
    createSelector(
        ShoppingCartsSelectors.getCartItemsSet,
        (cartItems): AsyncData<RiderCart[]> => getPlanOfferingCartRiderData(cartItems, cartId),
    );

// Moving this to plan offering to state to resolve dependency i.e PlanOfferingsSelector.getSelectedPlanOfferingId
export const getAddedCartItem: MemoizedSelector<object, AsyncData<number | null>> = createSelector(
    ShoppingCartsSelectors.addCartItemEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    SharedSelectors.getSelectedEnrollmentMethod,
    MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
    (entitiesState, memberId, mpGroup, enrollmentMethod, stateAbbreviationData) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        return flattenAsyncData(
            mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) => {
                if (!stateAbbreviation) {
                    return getIdleAsyncData();
                }

                const id = addUpdateCartItemsEntityId({
                    memberId,
                    mpGroup,
                    enrollmentMethod,
                    enrollmentState: stateAbbreviation,
                });

                return getAsyncDataFromEntitiesState(entitiesState, id);
            }),
        );
    },
);

export const getUpdatedCartItem: MemoizedSelector<object, AsyncData<number | null>> = createSelector(
    ShoppingCartsSelectors.updateCartItemEntities,
    MembersSelectors.getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    SharedSelectors.getSelectedEnrollmentMethod,
    MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
    (entitiesState, memberId, mpGroup, enrollmentMethod, stateAbbreviationData) => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        return flattenAsyncData(
            mapAsyncData(stateAbbreviationData, ({ value: stateAbbreviation }) => {
                if (!stateAbbreviation) {
                    return getIdleAsyncData();
                }

                const id = addUpdateCartItemsEntityId({
                    memberId,
                    mpGroup,
                    enrollmentMethod,
                    enrollmentState: stateAbbreviation,
                });

                return getAsyncDataFromEntitiesState(entitiesState, id);
            }),
        );
    },
);

// selector to get the active qualifying event ID
export const getQualifyingEventId = createSelector(
    ProductsSelectors.getSelectedProductId,
    MembersSelectors.getSelectedQualifyEvents,
    (selectedProductId, qualifyingEventsSet) =>
        mapAsyncData(qualifyingEventsSet, ({ value: qualifyingEvents }) => {
            const activeQualifyingEvent = qualifyingEvents.find(
                (lifeEvents) =>
                    lifeEvents.coverageStartDates.some((product) => product.productId === selectedProductId) &&
                    isAfterOrEqual(new Date(), toDateObj(lifeEvents.enrollmentValidity.effectiveStarting)) &&
                    isBeforeOrEqual(new Date(), toDateObj(lifeEvents.enrollmentValidity.expiresAfter)) &&
                    // Filter out the all By request QLEs as they are not actual life events
                    lifeEvents.type?.code !== MemberQLETypes.BY_REQUEST &&
                    // Only IN-Progress QLEs must be considered
                    lifeEvents.status === StatusType.INPROGRESS,
            );

            return activeQualifyingEvent?.id;
        }),
);

// Selector to combine pricing, coverage , benefit amount and qualifying event id
export const getSelectedPlanCostDetails = (
    riskClassId?: number | null,
    coverageEffectiveDate?: string | null,
    selectedCoverageLevelId?: number | null,
    selectedBenefitAmount?: number | null,
    selectedEliminationPeriodId?: number | null,
    tobaccoInformation?: TobaccoInformation | null,
    selectedDependentAge?: number | null,
    shoppingCartItemId?: number | null,
): MemoizedSelector<object, AsyncData<PlanOfferingCostInfo>> =>
    createSelector(
        getSelectedPlanOfferingPricingCoverages(
            riskClassId,
            coverageEffectiveDate,
            selectedBenefitAmount,
            selectedEliminationPeriodId,
            tobaccoInformation,
            selectedDependentAge,
            shoppingCartItemId,
        ),
        getQualifyingEventId,
        (selectedPlanOfferingPricingCoveragesData, qualifyingEventIdData): AsyncData<PlanOfferingCostInfo> => {
            const combinedData = combineAsyncDatas([selectedPlanOfferingPricingCoveragesData, qualifyingEventIdData]);

            return mapAsyncData(combinedData, ({ value: [selectedPlanOfferingPricingCoverage, selectedQualifyingEventId] }) => {
                const selectedPlanOfferingPricing = selectedPlanOfferingPricingCoverage.find(
                    (planPricing) => planPricing.coverageLevel.id === selectedCoverageLevelId,
                );

                return {
                    planOfferingPricingCoverage: selectedPlanOfferingPricing,
                    subscriberQualifyingEventId: selectedQualifyingEventId,
                    selectedBenefitAmount,
                };
            });
        },
    );

// Selector to get cross border restrictions at product level
export const getCrossBorderRestrictions: MemoizedSelector<object, AsyncData<Record<number, CrossBorderAlertType>>> = createSelector(
    getSelectedProductCombinedOfferingWithCartAndEnrollment,
    MembersSelectors.getSelectedCrossBorderRules,
    MembersSelectors.getSelectedMemberEnrollmentStateAbbreviation,
    SharedSelectors.getSelectedEnrollmentMethod,
    (
        combinedOfferingsWithCartAndEnrollmentData,
        crossBorderRulesData,
        stateAbbreviationData,
        enrollmentMethod,
    ): AsyncData<Record<number, CrossBorderAlertType>> => {
        if (!combinedOfferingsWithCartAndEnrollmentData || !crossBorderRulesData) {
            return getIdleAsyncData();
        }

        const combinedDatas = combineAsyncDatas([combinedOfferingsWithCartAndEnrollmentData, crossBorderRulesData, stateAbbreviationData]);

        return flattenAsyncData(
            mapAsyncData(combinedDatas, ({ value: [combinedOfferingsWithCartAndEnrollment, crossBorderRules, stateAbbreviation] }) => {
                if (!stateAbbreviation) {
                    return getIdleAsyncData<Record<number, CrossBorderAlertType>>();
                }

                const crossBorderData = checkCrossBorderRestriction(crossBorderRules, stateAbbreviation, enrollmentMethod);

                // returns empty record for non-F2F enrollment methods
                if (crossBorderData === CrossBorderAlertType.NONE) {
                    return getSucceededAsyncData<Record<number, CrossBorderAlertType>>({});
                }

                return getSucceededAsyncData(
                    combinedOfferingsWithCartAndEnrollment?.planOfferingsWithCartAndEnrollment?.reduce<
                    Record<number, CrossBorderAlertType>
                    >((crossBorderAllowed, planOfferingData) => {
                        if (
                            planOfferingData.planOffering.plan.carrierId === CarrierId.AFLAC &&
                            planOfferingData.planOffering.plan.policyOwnershipType === PolicyOwnershipType.INDIVIDUAL
                        ) {
                            crossBorderAllowed[planOfferingData.planOffering.id] = crossBorderData;
                        } else {
                            crossBorderAllowed[planOfferingData.planOffering.id] = CrossBorderAlertType.NONE;
                        }
                        return crossBorderAllowed;
                    }, {}) ?? [],
                );
            }),
        );
    },
);

/**
 * Gets if a plan offering has cross border restriction error
 * @param planOfferingId plan offering id
 * @returns boolean indicating if a plan offering has cross border restriction or not
 */
export const isCrossBorderRestrictionError = (planOfferingId: number): MemoizedSelector<object, AsyncData<boolean>> =>
    createSelector(getCrossBorderRestrictions, (crossBorderRestrictionsData) =>
        mapAsyncData(
            crossBorderRestrictionsData,
            ({ value: crossBorderRestrictions }) => crossBorderRestrictions[planOfferingId] === CrossBorderAlertType.ERROR,
        ),
    );

// Selector to get re-enrollable plans
export const getReEnrollablePlans: MemoizedSelector<object, AsyncData<Record<number, boolean>>> = createSelector(
    getSelectedPlanOfferings,
    EnrollmentsSelectors.getSelectedEnrollments,
    (combinedOfferingsData, enrollmentsData): AsyncData<Record<number, boolean>> => {
        if (!combinedOfferingsData || !enrollmentsData) {
            return getIdleAsyncData();
        }

        const combinedDatas = combineAsyncDatas([combinedOfferingsData, enrollmentsData]);
        return mapAsyncData(combinedDatas, ({ value: [planOfferings, enrollments] }) => {
            const planOfferingEnrollments = matchEnrollmentWithPlanOffering(planOfferings, enrollments);
            if (!planOfferingEnrollments) {
                // returns empty array if there are no planOffering enrollments
                return [];
            }
            return (
                planOfferings?.reduce<Record<number, boolean>>((reEnrollable, planOfferingData) => {
                    if (isReEnrollable(planOfferingData, planOfferingEnrollments)) {
                        reEnrollable[planOfferingData.plan.id] = true;
                    }
                    return reEnrollable;
                }, {}) ?? []
            );
        });
    },
);

/**
 * Returns true if supplementary plan offering is having missing information
 * @param plan id
 * @param whether the plan is supplementary or not
 * @returns boolean if supplementary plan offering is having missing information
 */
export const isSupplementaryPlanHasMissingInformation = (
    planId: number,
    isSupplementaryPlan: boolean,
): MemoizedSelector<object, AsyncData<boolean | null>> =>
    createSelector(getCombinedOfferingsWithCartAndEnrollment, (combinedOfferingsWithCartAndEnrollmentData) =>
        mapAsyncData(combinedOfferingsWithCartAndEnrollmentData, ({ value: combinedOfferingWithCartAndEnrollment }) => {
            // Exit early if plan is not supplementary
            if (!isSupplementaryPlan) {
                return false;
            }
            return (
                combinedOfferingWithCartAndEnrollment
                    .find((combinedOfferingWithCartAndEnrollmentData) =>
                        combinedOfferingWithCartAndEnrollmentData.planOfferingsWithCartAndEnrollment.some(
                            (planOfferingsWithCartAndEnrollmentData) =>
                                // checking the base plan offering id of supplementary plan
                                planOfferingsWithCartAndEnrollmentData.planOffering.plan.dependentPlanIds?.includes(planId),
                        ),
                    )
                    ?.planOfferingsWithCartAndEnrollment.some(
                        // If base plan offerings has missing information
                        (planOfferingsWithCartAndEnrollment) => planOfferingsWithCartAndEnrollment.planOffering?.missingInformation,
                    ) ?? null
            );
        }),
    );
/**
 * Gets selected member dependent enrolled children data
 * @returns {MemberDependent[]} list of member dependent enrolled children
 */
export const getSelectedMemberEnrolledDependentChildren: MemoizedSelector<object, AsyncData<MemberDependent[]>> = createSelector(
    getSelectedChildDependents,
    EnrollmentsSelectors.getSelectedEnrollmentDependents,
    (selectedDependentsData, selectedEnrolledDependentsData): AsyncData<MemberDependent[]> => {
        const combinedDatas = combineAsyncDatas([selectedDependentsData, selectedEnrolledDependentsData]);

        return mapAsyncData(combinedDatas, ({ value: [memberDependentChildren, selectedEnrolledDependents] }) => {
            // Get enrolledDependent Ids using enrollmentData
            const selectedDependentIdsFromEnrollment = selectedEnrolledDependents.map(
                (selectedEnrolledDependent) => selectedEnrolledDependent.dependentId,
            );
            // Get filter memberDependentChildren for memberDependentEnrolledChildren
            return memberDependentChildren.filter(
                (memberDependentChild) => memberDependentChild.id === selectedDependentIdsFromEnrollment[0],
            );
        });
    },
);
