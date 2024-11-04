import { Relations, MemberDependent } from "@empowered/constants";

export interface MemberDependentListModel {
    list: MemberDependent[];
    memberId: number;
    groupId: number;
    activeDependentId: number;
    relations: Relations[];
    errorMessage: string;
}
