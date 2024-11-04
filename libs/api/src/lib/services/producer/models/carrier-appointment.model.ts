import { Carrier } from "../../core";
import { Validity, CountryState } from "@empowered/constants";

export interface CarrierAppointment {
    carrier: Carrier;
    state: CountryState;
    validity: Validity;
}
