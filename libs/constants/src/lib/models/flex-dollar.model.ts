import { Product } from "./api";
import { PayFrequency } from "./pay-frequency.model";

export interface MemberFlexDollar {
    id: number;
    name: string;
    description: string;
    amount: number;
    contributionType: ContributionType;
    audienceGroupingId: number;
    audienceGrouping: MemberAudienceGrouping;
    applicableProductId: number;
    applicableProduct: Product;
    currentExceptionId: number;
    payFrequency: PayFrequency;
    currentAmount: number;
    isApproved?: boolean;
}

export interface MemberAudienceGrouping {
    id: string;
    audiences: MemberAudience[];
}

export interface MemberAudience {
    id: number;
    type: string;
    orgId: number;
    name: string;
    classId?: number;
    regionId?: number;
}

export enum ContributionType {
    FLAT_AMOUNT = "FLAT_AMOUNT",
    PERCENTAGE = "PERCENTAGE",
}
