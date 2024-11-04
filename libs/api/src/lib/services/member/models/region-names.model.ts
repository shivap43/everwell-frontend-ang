import { PostalCodeRange } from "./postal-code-range.model";

export interface RegionNames {
    id: number;
    name: string;
    description: string;
    payFrequency?: number;
    riskClass?: string;
    default: boolean;
    numberOfMembers: number;
    composition?: Composition;
    isselected: boolean;
}

export interface Composition {
    states?: string[];
    ranges?: PostalCodeRange[];
}
export interface RegionObject {
    type: string;
    regionId: number;
}
