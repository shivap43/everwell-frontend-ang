import { Injectable } from "@angular/core";
import { PlanOfferingWithCartAndEnrollment } from "@empowered/constants";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { MembersSelectors } from "@empowered/ngrx-store/ngrx-states/members";
import { PlanOfferingsSelectors } from "@empowered/ngrx-store/ngrx-states/plan-offerings";
import { SharedSelectors } from "@empowered/ngrx-store/ngrx-states/shared";
import { select } from "@ngrx/store";
import { Observable } from "rxjs";
import { map, withLatestFrom } from "rxjs/operators";
import { AgeService } from "../age/age.service";

@Injectable({
    providedIn: "root",
})
export class DependentAgeService {
    // Get dependent age range using config
    private readonly dependentAgeRange$ = this.ngrxStore.onAsyncValue(select(SharedSelectors.getDependentAgeRange));
    private readonly selectedMemberDependentChildren$ = this.ngrxStore.onAsyncValue(select(MembersSelectors.getSelectedChildDependents));
    constructor(private readonly ngrxStore: NGRXStore, private readonly ageService: AgeService) {}

    /**
     * Get default child dependent age(lowest) from age-range(config),
     * youngest child dependent age from profile and enrolled child dependent age
     * @param planPanel planPanel Data with cart and enrollment
     * @returns {Observable<number>} child dependent age
     */
    getDefaultMemberDependentChildAge(planPanel: PlanOfferingWithCartAndEnrollment): Observable<number> {
        return this.getMemberDependentChildAgeResetStateValue().pipe(
            map((memberDependentChildAgeResetStateValue) => {
                // Dependent age from cart item
                const cartItemDependentAge = planPanel?.cartItemInfo?.dependentAge;

                return cartItemDependentAge ?? memberDependentChildAgeResetStateValue;
            }),
        );
    }

    /**
     * Get youngest child dependent age from profile or minimum age selection option from age-range(config),
     * or selected member dependent enrolled child age. (used for reset/initial state value)
     * @returns {Observable<number>} child dependent age of selected member
     */
    getMemberDependentChildAgeResetStateValue(): Observable<number> {
        return this.ngrxStore.onAsyncValue(select(PlanOfferingsSelectors.getSelectedMemberEnrolledDependentChildren)).pipe(
            withLatestFrom(this.selectedMemberDependentChildren$, this.dependentAgeRange$),
            map(([selectedMemberEnrolledDependentChildren, selectedMemberDependentChildren, dependentAgeRange]) =>
                this.getDependentChildAgeResetState(
                    selectedMemberEnrolledDependentChildren,
                    selectedMemberDependentChildren,
                    dependentAgeRange,
                ),
            ),
        );
    }

    /**
     * Get youngest child dependent age from profile or minimum age selection option from age-range,
     * or member dependent enrolled child age. (used for reset/initial state value)
     *
     * @param enrolledDependentChildren {MemberDependent[]} enrolled Member Dependents
     * @param memberDependentChildren {MemberDependent[]} Member Dependents
     * @param dependentAgeRange {number[]} range of valid ages
     * @returns {number} child dependent age
     */
    getDependentChildAgeResetState(enrolledDependentChildren, memberDependentChildren, dependentAgeRange): number {
        // If there is no enrolledDependentChildren then select dependent children from memberDependentChildren
        const dependentChildren = enrolledDependentChildren.length ? enrolledDependentChildren : memberDependentChildren;

        // Get member dependent children age
        const memberDependentChildrenAge = this.ageService
            .getMemberDependentAges(dependentChildren)
            .filter((childAge) => dependentAgeRange.includes(childAge));

        // default dependent age is minimum age which is first value from dependentAgeRange array
        const defaultDependentAge = dependentAgeRange[0];

        // If there is more then one dependent child then we need to default value to youngest child age:
        // childAgeUsingDependentData[0]
        const memberDependentYoungestChildAge = memberDependentChildrenAge[0];

        return memberDependentYoungestChildAge ?? defaultDependentAge;
    }
}
