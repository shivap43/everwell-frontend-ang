import { RegionByState } from "./region-by-state.model";
import { RegionByPostalRange } from "./region-by-postal-range.model";

export interface Region {
    readonly id?: number;
    name: string;
    description?: string;
    composition: RegionByState | RegionByPostalRange;
    readonly default?: boolean;
    readonly numberOfMembers?: number;
}
