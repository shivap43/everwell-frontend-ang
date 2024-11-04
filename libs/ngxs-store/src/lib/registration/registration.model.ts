import { Name, MemberProfile, Relations, MemberDependent, MemberContact } from "@empowered/constants";

export class RegistrationStateModel {
    email: string;
    phone: string;
    userName: Name;
    groupId: number;
    memberId: number;
    adminId: number;
    producerId: number;
    userType: string;
    personalForm: MemberProfile;
    contactForm: MemberContact;
    relations: Relations[];
    dependents: MemberDependent[];
    accountUserName: string;
    multipleAccountMode: boolean;
}
