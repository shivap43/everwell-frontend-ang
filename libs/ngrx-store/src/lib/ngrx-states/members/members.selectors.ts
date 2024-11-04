import { createFeatureSelector, createSelector, MemoizedSelector } from "@ngrx/store";
import { CrossBorderRule } from "@empowered/api";

import {
    combineAsyncDatas,
    flattenAsyncData,
    getAsyncDataFromEntitiesState,
    getIdleAsyncData,
    mapAsyncData,
} from "../../ngrx.store.helpers";
import { AccountsSelectors } from "../accounts";
import {
    MemberContactsEntities,
    CrossBorderRulesEntities,
    MemberDependentsEntities,
    getMemberProfileEntityId,
    MemberFlexDollarsEntities,
    MemberRiskClassesEntities,
    MemberProfileEntities,
    QualifyingEventsEntities,
    SalariesEntities,
    State,
} from "./members.state";
import { MEMBERS_FEATURE_KEY } from "./members.reducer";
import { MemberRiskClasses } from "./members.model";
import { SharedSelectors } from "../shared";

import {
    AsyncData,
    AsyncStatus,
    DependentRelationsId,
    EnrollmentMethod,
    IncomeRate,
    SalarySummary,
    WEEKS_PER_YEAR,
    PayFrequency,
    RiskClass,
    Salary,
    RatingCode,
    CountryState,
    MemberProfile,
    MemberDependent,
    MemberFlexDollar,
    MemberContact,
    MemberQualifyingEvent,
} from "@empowered/constants";

// Lookup the 'Members' feature state managed by NgRx
export const getMembersFeatureState = createFeatureSelector<State>(MEMBERS_FEATURE_KEY);

export const getSelectedMemberId = createSelector(getMembersFeatureState, (state: State) => state.selectedMemberId);

// #region Members Selectors
export const getMemberProfileEntities = createSelector(getMembersFeatureState, (state: State) => state.membersEntities);

export const getSelectedMemberProfile: MemoizedSelector<object, AsyncData<MemberProfile>> = createSelector(
    getMemberProfileEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: MemberProfileEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<MemberProfile> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region payFrequency

export const getSelectedMemberPayFrequency: MemoizedSelector<object, AsyncData<PayFrequency | null>> = createSelector(
    getSelectedMemberProfile,
    AccountsSelectors.getSelectedPayFrequencies,
    (selectedMemberProfileData, payFrequenciesData) => {
        const combinedAsyncDatas = combineAsyncDatas([selectedMemberProfileData, payFrequenciesData]);

        return mapAsyncData(combinedAsyncDatas, ({ value: [member, payFrequencies] }) => {
            const memberPayFrequencyId = member.workInformation?.payrollFrequencyId;

            if (memberPayFrequencyId != null) {
                return payFrequencies.find((payFrequency) => payFrequency.id === memberPayFrequencyId) ?? null;
            }

            return null;
        });
    },
);

// Get selected pay frequency based on member > account > first pay frequency (in that order)
export const getSelectedPayFrequency: MemoizedSelector<object, AsyncData<PayFrequency | null>> = createSelector(
    getSelectedMemberPayFrequency,
    AccountsSelectors.getSelectedAccountPayFrequency,
    AccountsSelectors.getSelectedPayFrequencies,
    (memberPayFrequencyData, accountPayFrequencyData, payFrequenciesData): AsyncData<PayFrequency | null> => {
        const combinedAsyncDatas = combineAsyncDatas([memberPayFrequencyData, accountPayFrequencyData, payFrequenciesData]);

        return mapAsyncData(
            combinedAsyncDatas,
            ({ value: [membmemberPayFrequency, accountPayFrequency, payFrequencies] }) =>
                membmemberPayFrequency ?? accountPayFrequency ?? payFrequencies[0] ?? null,
        );
    },
);

// #endRegion

// #region Salaries Selectors
export const getSalariesEntities = createSelector(getMembersFeatureState, (state: State) => state.salariesEntities);

export const getSelectedSalaries: MemoizedSelector<object, AsyncData<Salary[]>> = createSelector(
    getSalariesEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: SalariesEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<Salary[]> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getLastSalary = (salaries: Salary[]): Salary | undefined => salaries[salaries.length - 1];

export const getSelectedSalarySummary: MemoizedSelector<object, AsyncData<SalarySummary>> = createSelector(
    getSelectedSalaries,
    (salariesData: AsyncData<Salary[]>): AsyncData<SalarySummary> =>
        mapAsyncData(salariesData, ({ value: salaries }) => {
            const latestSalary = getLastSalary(salaries);

            const annualTotal = latestSalary?.annualSalary ?? null;

            const hoursPerWeek = latestSalary?.hoursPerYear ? latestSalary.hoursPerYear / WEEKS_PER_YEAR : null;

            const hourlyWage = latestSalary?.hourlyWage;

            const incomeRate = latestSalary?.hourlyWage ? IncomeRate.HOURLY : IncomeRate.ANNUAL;

            return {
                incomeRate,
                annualTotal,
                hourlyTotal: annualTotal,
                hoursPerWeek,
                hourlyWage,
            };
        }),
);
// #endregion

// #region Member Dependents Selectors
export const getMemberDependentsEntities = createSelector(getMembersFeatureState, (state: State) => state.memberDependentsEntities);

export const getSelectedMemberDependents: MemoizedSelector<object, AsyncData<MemberDependent[]>> = createSelector(
    getMemberDependentsEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: MemberDependentsEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<MemberDependent[]> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getSelectedSpouseDependent: MemoizedSelector<object, AsyncData<MemberDependent | null>> = createSelector(
    getSelectedMemberDependents,
    (dependentsData: AsyncData<MemberDependent[]>): AsyncData<MemberDependent | null> =>
        mapAsyncData(
            dependentsData,
            ({ value: dependents }) =>
                dependents.find((dependent) => dependent.dependentRelationId === DependentRelationsId.SPOUSE_ID) ?? null,
        ),
);

export const getSelectedChildDependents: MemoizedSelector<object, AsyncData<MemberDependent[]>> = createSelector(
    getSelectedMemberDependents,
    (dependentsData: AsyncData<MemberDependent[]>): AsyncData<MemberDependent[]> =>
        mapAsyncData(dependentsData, ({ value: dependents }) =>
            dependents.filter((dependent) => dependent.dependentRelationId === DependentRelationsId.CHILD_ID),
        ),
);
// #endregion

// #region RiskClasses Selectors
export const getRiskClassesEntities = createSelector(getMembersFeatureState, (state: State) => state.riskClassesEntities);

export const getSelectedMemberRiskClassesSet: MemoizedSelector<object, AsyncData<MemberRiskClasses>> = createSelector(
    getRiskClassesEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: MemberRiskClassesEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<MemberRiskClasses> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);

export const getSelectedMemberRiskClasses: MemoizedSelector<object, AsyncData<RiskClass[]>> = createSelector(
    getSelectedMemberRiskClassesSet,
    (riskClassesSet: AsyncData<MemberRiskClasses>) => mapAsyncData(riskClassesSet, ({ value }) => value.memberRiskClasses),
);

export const getSelectedPossiblePeoRiskClasses: MemoizedSelector<object, AsyncData<RiskClass[]>> = createSelector(
    getSelectedMemberRiskClassesSet,
    (riskClassesSet: AsyncData<MemberRiskClasses>) => mapAsyncData(riskClassesSet, ({ value }) => value.aflacCarrierRiskClasses),
);

export const getSelectedPeoRiskClasses: MemoizedSelector<object, AsyncData<RiskClass>> = createSelector(
    getSelectedPossiblePeoRiskClasses,
    getSelectedMemberRiskClasses,
    (riskClassesData: AsyncData<RiskClass[]>, memberRiskClassesData: AsyncData<RiskClass[]>) => {
        const combinedAsyncDatas = combineAsyncDatas([riskClassesData, memberRiskClassesData]);

        return mapAsyncData(combinedAsyncDatas, ({ value }) => {
            const [riskClasses, memberRiskClasses] = value;

            // Check first Member RiskClasses that aren't related to any CarrierId
            const firstMemberRiskClass = memberRiskClasses[0];

            // Check set of riskClasses for match
            // Fallback to first RiskClass of riskClasses if no match was found
            return riskClasses.find(({ id }) => id === firstMemberRiskClass?.id) ?? riskClasses[0];
        });
    },
);
// #endregion

// #region QualifyEvents Selectors
export const getQualifyEventsEntities = createSelector(getMembersFeatureState, (state: State) => state.qualifyingEventsEntities);

export const getSelectedQualifyEvents: MemoizedSelector<object, AsyncData<MemberQualifyingEvent[]>> = createSelector(
    getQualifyEventsEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: QualifyingEventsEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<MemberQualifyingEvent[]> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region Member Contacts Selectors
export const getMemberContactsEntities = createSelector(getMembersFeatureState, (state: State) => state.memberContactsEntities);

export const getSelectedMemberContacts: MemoizedSelector<object, AsyncData<MemberContact[]>> = createSelector(
    getMemberContactsEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: MemberContactsEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<MemberContact[]> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region Member selected CountryState

export const getSelectedMemberContactStateAndCity: MemoizedSelector<
    object,
AsyncData<{ countryState?: CountryState | null; city?: string | null } | null>
> = createSelector(
    getSelectedMemberContacts,
    SharedSelectors.getSelectedHeadsetStateAndCity,
    SharedSelectors.getAllCountryStates,
    (
        memberContactsData,
        selectedHeadsetStateAndCity,
        countryStatesData,
    ): AsyncData<{ countryState?: CountryState | null; city?: string | null } | null> => {
        const combinedAsyncDatas = combineAsyncDatas([memberContactsData, countryStatesData]);

        return mapAsyncData(combinedAsyncDatas, ({ value: [memberContacts, countryStates] }) => {
            const { countryState: headsetCountryState, city: headsetCity } = selectedHeadsetStateAndCity;

            if (headsetCountryState && headsetCity) {
                return { countryState: headsetCountryState, city: headsetCity };
            }

            const memberAddress = memberContacts[0]?.address;

            if (!memberAddress) {
                return null;
            }

            const memberState =
                countryStates.find((possibleCountryState) => possibleCountryState.abbreviation === memberAddress.state) ?? null;
            const memberCity = memberAddress.city ?? null;

            return {
                countryState: memberState,
                city: memberCity,
            };
        });
    },
);

export const getSelectedMemberEnrollmentCountryStateAndCity: MemoizedSelector<
    object,
AsyncData<{ countryState?: CountryState | null; city?: string | null } | null>
> = createSelector(
    SharedSelectors.getSelectedEnrollmentMethodState,
    getSelectedMemberContactStateAndCity,
    (enrollmentMethodState, headsetStateAndCityData): AsyncData<{ countryState?: CountryState | null; city?: string | null } | null> => {
        const combinedAsyncDatas = combineAsyncDatas([headsetStateAndCityData]);

        return mapAsyncData(combinedAsyncDatas, ({ value: [headsetStateAndCity] }) => {
            const { enrollmentMethod, countryState, city } = enrollmentMethodState;

            if (enrollmentMethod === EnrollmentMethod.FACE_TO_FACE) {
                return { countryState, city };
            }

            return headsetStateAndCity;
        });
    },
);

export const getSelectedMemberEnrollmentState: MemoizedSelector<object, AsyncData<CountryState | null>> = createSelector(
    getSelectedMemberEnrollmentCountryStateAndCity,
    (memberStateAndCityData): AsyncData<CountryState | null> =>
        mapAsyncData(memberStateAndCityData, ({ value: memberStateAndCity }) => memberStateAndCity?.countryState ?? null),
);

export const getSelectedMemberEnrollmentStateAbbreviation: MemoizedSelector<object, AsyncData<string | null>> = createSelector(
    getSelectedMemberEnrollmentState,
    (memberStateData): AsyncData<string | null> =>
        mapAsyncData(memberStateData, ({ value: memberState }) => memberState?.abbreviation ?? null),
);
// #endregion

export const getSelectedPossibleRiskClassSets: MemoizedSelector<object, AsyncData<RiskClass[][]>> = createSelector(
    AccountsSelectors.getSelectedRatingCode,
    AccountsSelectors.getSelectedPossibleStandardRiskClasses,
    getSelectedPossiblePeoRiskClasses,
    AccountsSelectors.getSelectedPossibleDualRiskClassSets,
    (
        possibleRatingCodeData: AsyncData<RatingCode | null>,
        standardRiskClassesData: AsyncData<RiskClass[]>,
        peoRiskClassesData: AsyncData<RiskClass[]>,
        dualRiskClassSetsData: AsyncData<RiskClass[][]>,
    ): AsyncData<RiskClass[][]> =>
        flattenAsyncData(
            mapAsyncData(possibleRatingCodeData, ({ value: possibleRatingCode }) => {
                if (possibleRatingCode === RatingCode.STANDARD) {
                    // Return a array with a single set of RiskClasses since we only expect one set when RatingCode is RatingCode.STANDARD
                    return mapAsyncData(standardRiskClassesData, ({ value }) => [value]);
                }

                if (possibleRatingCode === RatingCode.PEO) {
                    // Return a array with a single set of RiskClasses since we only expect one set when RatingCode is RatingCode.PEO
                    return mapAsyncData(peoRiskClassesData, ({ value }) => [value]);
                }

                if (possibleRatingCode === RatingCode.DUAL) {
                    return dualRiskClassSetsData;
                }

                return { status: AsyncStatus.SUCCEEDED, value: [], error: null };
            }),
        ),
);

export const getSelectedRiskClasses: MemoizedSelector<object, AsyncData<RiskClass[]>> = createSelector(
    AccountsSelectors.getSelectedRatingCode,
    AccountsSelectors.getSelectedStandardRiskClass,
    getSelectedPeoRiskClasses,
    AccountsSelectors.getSelectedDualRiskClasses,
    (
        possibleRatingCodeData: AsyncData<RatingCode | null>,
        standardRiskClassesData: AsyncData<RiskClass>,
        peoRiskClassesData: AsyncData<RiskClass>,
        dualRiskClassesData: AsyncData<[RiskClass, RiskClass]>,
    ): AsyncData<RiskClass[]> =>
        flattenAsyncData(
            mapAsyncData(possibleRatingCodeData, ({ value: possibleRatingCode }) => {
                if (possibleRatingCode === RatingCode.STANDARD) {
                    // Return a array with a single set of RiskClasses since we only expect one set when RatingCode is RatingCode.STANDARD
                    return mapAsyncData(standardRiskClassesData, ({ value }) => [value]);
                }

                if (possibleRatingCode === RatingCode.PEO) {
                    // Return a array with a single set of RiskClasses since we only expect one set when RatingCode is RatingCode.PEO
                    return mapAsyncData(peoRiskClassesData, ({ value }) => [value]);
                }

                if (possibleRatingCode === RatingCode.DUAL) {
                    return dualRiskClassesData;
                }

                // Fallback to no RiskClasses if there isn't a valid RatingCode
                return { status: AsyncStatus.SUCCEEDED, value: [], error: null };
            }),
        ),
);

// #region Member Flex Dollars Selectors
export const getMemberFlexDollarsEntities = createSelector(getMembersFeatureState, (state: State) => state.memberFlexDollarsEntities);

export const getSelectedMemberFlexDollars: MemoizedSelector<object, AsyncData<MemberFlexDollar[]>> = createSelector(
    getMemberFlexDollarsEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: MemberFlexDollarsEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<MemberFlexDollar[]> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion

// #region CrossBorderRules Selectors
export const getCrossBorderRulesEntities = createSelector(getMembersFeatureState, (state: State) => state.crossBorderRulesEntities);

export const getSelectedCrossBorderRules: MemoizedSelector<object, AsyncData<CrossBorderRule[]>> = createSelector(
    getCrossBorderRulesEntities,
    getSelectedMemberId,
    AccountsSelectors.getSelectedMPGroup,
    (entitiesState: CrossBorderRulesEntities, memberId?: number | null, mpGroup?: number | null): AsyncData<CrossBorderRule[]> => {
        if (!memberId || !mpGroup) {
            return getIdleAsyncData();
        }

        const id = getMemberProfileEntityId({ memberId, mpGroup });

        return getAsyncDataFromEntitiesState(entitiesState, id);
    },
);
// #endregion
