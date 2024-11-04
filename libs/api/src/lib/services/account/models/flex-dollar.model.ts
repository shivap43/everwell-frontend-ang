import { PayFrequency, Product, MemberAudienceGrouping, ContributionType } from "@empowered/constants";
export interface FlexDollar {
    id?: number;
    name: string;
    description?: string;
    amount: number;
    contributionType: ContributionType;
    audienceGroupingId?: number;
    audienceGrouping?: MemberAudienceGrouping;
    applicableProductId?: number;
    applicableProduct?: Product;
    payFrequency?: PayFrequency;
    isApproved?: boolean;
}
export interface PayFrequencyObject {
    payFrequencies: PayFrequency[];
    pfType: string;
    payrollsPerYear: number;
}
export interface ProductFilterObject {
    id: number;
    name: string;
    pendingAction?: PendingActionType;
}

export enum PendingActionType {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
}
