import { Injectable } from "@angular/core";
import { EnrollmentMethod } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store";
import { AccountsSelectors } from "@empowered/ngrx-store/ngrx-states/accounts";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { SharedActions, SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { EnrollmentMethodModel } from "@empowered/ngxs-store";
import { select } from "@ngrx/store";
import { Observable } from "rxjs";
import { distinctUntilChanged, map, withLatestFrom } from "rxjs/operators";
import { NGRXEnrollmentState } from "../ngrx-sync.model";

@Injectable({
    providedIn: "root",
})
export class NGRXEnrollmentStateService {
    readonly selectedEnrollmentMethodState$ = this.ngrxStore.pipe(select(SharedSelectors.getSelectedEnrollmentMethodState));
    readonly mpGroup$ = this.ngrxStore.pipe(select(AccountsSelectors.getSelectedMPGroup));
    readonly memberId$ = this.ngrxStore.pipe(select(MembersSelectors.getSelectedMemberId));
    readonly selectedMemberCountryStateAndCity$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberEnrollmentCountryStateAndCity),
    );
    readonly getSelectedMemberContactStateAndCity$ = this.ngrxStore.onAsyncValue(
        select(MembersSelectors.getSelectedMemberContactStateAndCity),
    );

    constructor(private readonly ngrxStore: NGRXStore) {}

    /**
     * Compares two `NGRXEnrollmentState` and returns true if any property is different
     * This includes any property not tracked for syncing NGXS state
     *
     * @param a {NGRXEnrollmentState} some `NGRXEnrollmentState`
     * @param b {NGRXEnrollmentState} another `NGRXEnrollmentState`
     * @returns `true` if a is different from b
     */
    compareState(a: NGRXEnrollmentState, b: NGRXEnrollmentState): boolean {
        const mpGroupA = a.mpGroup ?? null;
        const memberIdA = a.memberId ?? null;

        const mpGroupB = b.mpGroup ?? null;
        const memberIdB = b.memberId ?? null;

        if (mpGroupA !== mpGroupB || memberIdA !== memberIdB) {
            return false;
        }

        return this.compareSyncableState(a, b);
    }

    /**
     * Compares two `NGRXEnrollmentState` and returns true if any property is different
     * This includes only properties tracked for syncing NGXS state
     *
     * @param a {NGRXEnrollmentState} some `NGRXEnrollmentState`
     * @param b {NGRXEnrollmentState} another `NGRXEnrollmentState`
     * @returns `true` if a is different from b for properties that require syncing
     */
    compareSyncableState(a: NGRXEnrollmentState, b: NGRXEnrollmentState): boolean {
        const enrollmentMethodA = a.enrollmentMethod ?? null;
        const headsetCountryStateA = a.headsetCountryState ?? null;
        const selectedCountryStateA = a.selectedCountryState ?? null;
        const selectedCityA = a.selectedCity ?? null;

        const enrollmentMethodB = b.enrollmentMethod ?? null;
        const headsetCountryStateB = b.headsetCountryState ?? null;
        const selectedCountryStateB = b.selectedCountryState ?? null;
        const selectedCityB = b.selectedCity ?? null;

        if (
            enrollmentMethodA !== enrollmentMethodB ||
            headsetCountryStateA?.name !== headsetCountryStateB?.name ||
            headsetCountryStateA?.abbreviation !== headsetCountryStateB?.abbreviation ||
            selectedCityA !== selectedCityB ||
            selectedCountryStateA?.name !== selectedCountryStateB?.name ||
            selectedCountryStateA?.abbreviation !== selectedCountryStateB?.abbreviation
        ) {
            return false;
        }

        return true;
    }

    /**
     * Gets the latest NGRX enrollment state. This includes EnrollmentMethod, CountryState, City
     *
     * @returns {Observable<NGRXEnrollmentState>} latest `NGRXEnrollmentState`
     */
    getLatestState(): Observable<NGRXEnrollmentState> {
        return this.selectedMemberCountryStateAndCity$.pipe(
            withLatestFrom(this.getSelectedMemberContactStateAndCity$, this.selectedEnrollmentMethodState$, this.mpGroup$, this.memberId$),
            map(([, headsetCountryStateAndCity, { enrollmentMethod, countryState, city }, mpGroup, memberId]) => ({
                mpGroup,
                memberId,
                enrollmentMethod,
                headsetCountryState: headsetCountryStateAndCity?.countryState,
                selectedCountryState: countryState,
                selectedCity: city,
            })),
            distinctUntilChanged((a, b) => this.compareSyncableState(a, b)),
        );
    }

    /**
     * Creates an NGRX enrollment state from NGXS enrollment state
     *
     * @param enrollmentMethodModel {EnrollmentMethodModel | undefined | null} NGXS enrollment state
     * @returns {EnrollmentMethodModel} NGRX enrollment state
     */
    getState(enrollmentMethodModel?: EnrollmentMethodModel | null): Omit<NGRXEnrollmentState, "memberCity"> {
        const {
            mpGroup,
            memberId,
            enrollmentMethod,
            enrollmentState,
            enrollmentStateAbbreviation,
            enrollmentCity,
            headSetState,
            headSetStateAbbreviation,
        } = enrollmentMethodModel ?? {};

        return {
            mpGroup: mpGroup ? Number(mpGroup) : null,
            memberId: memberId ? Number(memberId) : null,
            enrollmentMethod: enrollmentMethod as EnrollmentMethod,
            selectedCountryState: {
                name: enrollmentState,
                abbreviation: enrollmentStateAbbreviation,
            },
            selectedCity: enrollmentCity,
            headsetCountryState: { name: headSetState, abbreviation: headSetStateAbbreviation },
        };
    }

    /**
     * Converts NGXS enrollment state to NGRX enrollment state and updates NGRX enrollment state if its current state is different
     *
     * @param ngxsEnrollmentState {EnrollmentMethodModel | undefined | null} NGXS enrollment state used to update NGRX enrollment state
     * @param existingNGRXEnrollmentState {NGRXEnrollmentState | undefined | null} NGRX enrollment state
     * used to prevent redundent updates to NGRX state if no differences would be made. If none is provided,
     * NGRX enrollment state will update no matter what
     */
    setState(ngxsEnrollmentState?: EnrollmentMethodModel | null, existingNGRXEnrollmentState?: NGRXEnrollmentState | null): void {
        const ngrxEnrollmentState = this.getState(ngxsEnrollmentState);

        if (existingNGRXEnrollmentState && this.compareSyncableState(ngrxEnrollmentState, existingNGRXEnrollmentState)) {
            return;
        }

        this.ngrxStore.dispatch(
            SharedActions.setSelectedEnrollmentMethodState({
                enrollmentMethod: ngrxEnrollmentState.enrollmentMethod,
                countryState: ngrxEnrollmentState.selectedCountryState,
                city: ngrxEnrollmentState.selectedCity,
                headsetCountryState: ngrxEnrollmentState.headsetCountryState,
            }),
        );
    }
}
