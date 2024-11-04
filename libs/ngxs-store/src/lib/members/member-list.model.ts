import { SearchMembers } from "@empowered/api";
import { MemberListItem } from "@empowered/constants";

export interface MembersListModel {
    list: MemberListItem[];
    fullResponse: SearchMembers;
    activeCount: string;
    activeMemberId: number;
    errorMessage: string;
}
// SearchHeaderModel created
export interface SearchHeaderModel {
    filter: string;
    size: number;
    page: number;
}
