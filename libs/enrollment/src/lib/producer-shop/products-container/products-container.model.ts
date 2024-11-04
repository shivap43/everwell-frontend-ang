import { ApplicationStatusTypes } from "@empowered/api";

// Model for product details
export interface ProductDetails {
    name: string;
    id: number;
    isDeclined: boolean;
    enrollmentStatus: ApplicationStatusTypes;
    productInCart: boolean;
}
