import { Validity } from "@empowered/constants";

export interface AddException {
    id?: number;
    type?: string;
    planId?: number;
    validity: Validity;
    states?: Array<string>;
}
