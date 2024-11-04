import { CountryState } from "@empowered/constants";

export interface LocationOverlay {
    isCloseOverlay: boolean;
    selectedState: CountryState;
    selectedCity: string;
}
