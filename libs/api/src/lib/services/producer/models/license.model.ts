import { Validity, CountryState } from "@empowered/constants";
import { LINES_OF_AUTHORITY } from "../enums";

export interface License {
    state: CountryState;
    // eslint-disable-next-line id-denylist
    number: string;
    validity: Validity;
    linesOfAuthority?: LINES_OF_AUTHORITY;
}
