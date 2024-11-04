import { Enrollments } from "./enrollments.model";

export interface Reinstate {
    isReinstate?: boolean;
    selectedCartItemIndex?: number;
    enrollments?: Enrollments[];
    policyNumber?: string;
    cartItemId?: number;
}
