import { PostalCodeRange } from "./postal-code-range.model";

export interface RegionNames {
    id: number;
    name: string;
    description: string;
    payFrequency: number;
    riskClass: string;
    default: boolean;
    numberOfMembers: number;
    composition?: Composition;
}

export interface Composition {
    states?: string[];
    ranges?: PostalCodeRange[];
}
