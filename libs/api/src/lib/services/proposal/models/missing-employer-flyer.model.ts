import { State } from "../../dashboard";

export interface MissingEmployerFlyer {
    planId: number;
    planName: string;
    missingEmployerFlyer: boolean;
    states: State[];
}
