import { MemberProfile } from "@empowered/constants";

export interface ValidateMemberProfile extends Omit<MemberProfile, "birthDate"> {
    birthDate: Date | string;
    phoneNumber?: string;
    email?: string;
}
