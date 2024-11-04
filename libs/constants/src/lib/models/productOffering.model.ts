import { Product } from "./api";

export interface ProductOffering {
    id: number;
    product: Product;
    disableSTDProductForVCC?: boolean;
}
