export interface RegionType {
    readonly id?: number;
    name: string;
    description?: string;
    determinesPlanAvailabilityOrPricing: boolean;
}
export interface RegionTypeDisplay extends RegionType {
    totalNumberOfMembers: number;
}
