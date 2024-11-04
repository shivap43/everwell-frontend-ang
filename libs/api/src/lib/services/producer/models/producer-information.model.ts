import { CarrierAppointment } from "./carrier-appointment.model";
import { License } from "./license.model";

export interface ProducerInformation {
    licenses: License[];
    carrierAppointments: CarrierAppointment[];
}
