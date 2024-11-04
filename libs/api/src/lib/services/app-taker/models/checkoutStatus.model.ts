import { ProducerCheckoutDetails } from "./producerCheckoutDetails.model";

export interface CheckoutStatus {
    id: number;
    status: string;
    producer: ProducerCheckoutDetails;
    checkoutDate: string;
    enrollmentWindowStartDate: string;
}
