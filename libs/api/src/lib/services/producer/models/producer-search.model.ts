import { CarrierAppointment, License } from ".";
import { Name, WritingNumber, ProducerDetails, Admin } from "@empowered/constants";

interface ReportsTo {
    producerId?: number;
    name?: string;
}

export interface ProducerSearch {
    id?: number;
    name?: Name;
    email?: string;
    associatedProducer?: boolean;
    role?: string;
    reportsTo?: ReportsTo;
    pendingInvite?: boolean;
    declinedInvite?: boolean;
    npn?: string;
    writingNumbers?: WritingNumber[];
    licenses?: License[];
    producer?: Admin | ProducerDetails;
    carrierAppointments?: CarrierAppointment[];
    licensedStates?: string[];
    appointedCarrierIds?: number[];
}
