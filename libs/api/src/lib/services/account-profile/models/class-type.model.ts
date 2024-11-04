import { ClassNames } from "../../member";

export interface ClassType {
    id?: number;
    name: string;
    description?: string;
    determinesPayFrequency: boolean;
    determinesPlanAvailabilityOrPricing: boolean;
    readonly tiedToPlan?: boolean;
    carrierId?: number;
    readonly visible?: boolean;
    classDetails?: any;
}
export interface ClassTypeDisplay extends ClassType {
    totalNumberOfMembers: number;
    defaultClass: ClassNames;
}
