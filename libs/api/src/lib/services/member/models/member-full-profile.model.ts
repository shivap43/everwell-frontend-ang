import { Name, Gender, WorkInformation, MemberContact } from "@empowered/constants";
import { Profile } from "./profile.model";

export interface MemberFullProfile {
    name: Name;
    birthDate: string;
    gender: Gender;
    profile: Profile;
    workInformation: WorkInformation;
    ssn: string;
    ssnConfirmed?: boolean;
    hireDate: string;
    employeeId: string;
    organizationId: number;
    id: number;
    username: string;
    memberId: number;
    groupId: number;
    contact: MemberContact;
}
