import { Name } from "@empowered/constants";
import { Profile } from "./profile.model";
import { Work } from "./work.model";

export interface PersonalInfo {
    id: number;
    name: Name;
    birthDate: Date;
    gender: string;
    profile?: Profile;
    workInformation: Work;
    ssn: string;
    hireDate?: Date;
    employeeId?: string;
    organizationId?: number;
}
