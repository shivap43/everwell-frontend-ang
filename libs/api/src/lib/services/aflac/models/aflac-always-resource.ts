import { EnrollmentMethod } from "@empowered/constants";

export interface AflacAlwaysResource {
    enrollmentIds: number[];
    enrollmentMethod: EnrollmentMethod;
    payFrequency: string;
    subscriberPaymentId: number;
    firstPaymentDay: number;
    signature: string;
}
