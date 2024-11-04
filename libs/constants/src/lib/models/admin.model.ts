import { HighestLevel } from "../enums";
import { AdminRoles } from "./adminRoles.model";
import { Name } from "./name.model";
import { WritingNumber } from "./writing-number.model";

export interface Admin {
    id: number;
    name: Name;
    type?: string;
    emailAddress?: string;
    phoneNumber?: string;
    reportsToId?: number;
    reportsTo?: Admin;
    title?: string;
    npn?: string;
    writingNumbers?: WritingNumber[];
    roleId?: number;
    role?: AdminRoles;
    tpa?: boolean;
    subordinates?: boolean;
    highestLevel: HighestLevel;
    active?: boolean;
}
