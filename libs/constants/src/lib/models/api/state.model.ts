import { CoveragePeriod } from "./plan.model";

export interface CountryState {
    abbreviation: string;
    name: string;
}

export interface AllowedState {
    state: CountryState;
    validity: CoveragePeriod;
}
