import { MemberBeneficiary } from "@empowered/constants";

export interface MemberBeneficiaryListModel {
    list: MemberBeneficiary[];
    memberId: number;
    groupId: number;
    memberBeneficiaryId: number;
    configurations: any;
}
