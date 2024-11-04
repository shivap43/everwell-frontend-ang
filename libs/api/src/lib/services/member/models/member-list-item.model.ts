import { MemberListItem } from "@empowered/constants";

export interface MemberListDisplayItem extends MemberListItem {
    totalCost?: number;
    hasPending?: boolean;
    coverageNameList?: string[];
    fullName?: string;
    hireDate?: string;
    showShopButton?: boolean;
}

export interface RouteStateModel {
    navigationId?: number;
    rehireDate?: string;
    editMode?: string;
    terminateDate?: string;
    editReason?: string;
    partnerServiceResult?: string;
    comments?: string;
    futureDate: string;
    isCoverageDateChanged?: boolean;
    terminationDate?: string;
    editReasonFurtherAction?: string;
    editFutureTerminationDate?: string;
    editTerminationDate?: string;
    cifError?: string;
    productId?: number;
}
