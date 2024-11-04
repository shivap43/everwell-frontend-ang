export interface RiderInfo {
    plan?: Map<number, Riders[]>;
}
export interface Riders {
    rider?: Map<number, RiderDetails[]>;
}
export interface RiderDetails {
    coverageLevel?: CoverageInfo[];
    price?: number;
    benefitAmount?: number;
    eliminationPeriod?: boolean;
}
export interface CoverageInfo {
    id?: number;
    name?: string;
    displayOrder?: number;
    icon?: string;
}
