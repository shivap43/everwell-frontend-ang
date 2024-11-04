import { CountryState } from "@empowered/constants";
import { CoveragePeriod } from ".";
export interface AllowedState {
    state: CountryState;
    validity: CoveragePeriod;
}
