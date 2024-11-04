import { Injectable } from "@angular/core";
import { MemberDependent } from "@empowered/constants";
import { DateService } from "@empowered/date";

@Injectable({
    providedIn: "root",
})
export class AgeService {
    constructor(private readonly dateService: DateService) {}
    /**
     * Calculate age given a birth date
     *
     * @param birthDate birth date as string or Date.
     *
     * @return {number} current age measured in years from current date
     */
    getAge(birthDate: string | Date): number {
        return this.dateService.getDifferenceInYears(this.dateService.toDate(birthDate));
    }

    /**
     * Calculate age for all member dependent age using memberDependentData
     *
     * @param memberDependentData memberDependentData.
     *
     * @return {number[]} current age measured in years from current date
     */
    getMemberDependentAges(memberDependentData: MemberDependent[]): number[] {
        return memberDependentData.map((memberDependent) => this.getMemberDependentAge(memberDependent)).sort((ageA, ageB) => ageA - ageB);
    }

    /**
     * Calculate age for selected member dependent age using memberDependentData
     *
     * @param selectedMemberDependent selected member dependent.
     *
     * @return {number} current age measured in years from current date
     */
    getMemberDependentAge(memberDependent?: MemberDependent): number {
        // exit if memberDependent age is undefined, as getAge may return negative number if passed an undefined value to it
        if (!memberDependent?.birthDate) {
            return 0;
        }

        return this.getAge(memberDependent.birthDate);
    }
}
