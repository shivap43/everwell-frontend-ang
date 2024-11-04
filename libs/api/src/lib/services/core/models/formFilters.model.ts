import { Product } from "@empowered/constants";

export interface FormFilters {
    formType: string[];
    channels: FormChannel[];
    products: Product[];
    policySeries: string[];
    states: string[];
}
export interface FormChannel {
    name: string;
    value: string;
}
