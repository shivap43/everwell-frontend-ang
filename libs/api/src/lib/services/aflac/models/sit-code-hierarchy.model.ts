import { ProducerEnrollment } from "./producer-enrollment.model";

export interface SITCodeHierarchy {
    writingNumber: string;
    producer: ProducerEnrollment;
    level: number;
}
