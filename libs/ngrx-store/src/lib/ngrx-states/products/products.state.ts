import { AsyncData, AsyncStatus, Product } from "@empowered/constants";

// By extending EntityState, State will include properties 'entities' and 'ids'
export interface State {
    products: AsyncData<Product[]>;
    selectedProductOfferingId?: number | null; // which ProductsOfferings record has been selected
    selectedProductId?: number | null; // which Products record has been selected
}

export const initialState: State = {
    products: {
        status: AsyncStatus.IDLE,
    },
};
