import { Validity } from "@empowered/constants";

export interface MemberClassType {
    readonly id?: number;
    name?: string;
    validity: Validity;
    manage?: boolean;
}

export type MemberRegion = MemberClassType;
export type MemberClassTypesResponse = Record<string, MemberClassType[]>;
export type MemberRegionTypesResponse = Record<string, MemberRegion[]>;
