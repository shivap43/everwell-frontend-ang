import { Plan, Product } from "@empowered/constants";

export interface Incentive {
    id: number;
    name: string;
    description: string;
    amount: number;
    audienceGroupingId: number;
    audienceGrouping: AudienceGrouping;
    applicableProductIds: number[];
    applicableProducts: Product[];
    type: string;
    applicablePlanId: number;
    applicablePlan: Plan;
}

export interface AudienceGrouping {
    id?: number;
    audiences?: Audience[];
}

export interface Audience {
    id?: number;
    type?: string;
    orgId?: number;
    name?: string;
    classTypeId?: number;
    classId?: number;
    regionId?: number;
}
