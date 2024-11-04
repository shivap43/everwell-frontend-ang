import { CrossBorderRule, EnrollmentStateRelation } from "@empowered/api";
import { MemberContact } from "@empowered/constants";

export const mockCrossBorderRules: CrossBorderRule[] = [
    {
        residentState: "same as resident state",
        enrollmentStateRelation: EnrollmentStateRelation.SAME_AS_RESIDENT,
        allowEnrollment: true,
        releaseBusiness: true,
    },
    {
        residentState: "different from resident state",
        enrollmentStateRelation: EnrollmentStateRelation.DIFFERENT_FROM_RESIDENT,
        allowEnrollment: true,
        releaseBusiness: true,
    },
];

export const mockMemberContacts = [
    {
        address: {
            city: "Flagstaff",
            state: "Arizona",
        },
    },
] as MemberContact[];
