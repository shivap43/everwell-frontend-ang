import { Name, CountryState } from "@empowered/constants";
import { ReportsTo } from "../../static";
import { CarrierAppointment } from "./carrier-appointment.model";
import { License } from "./license.model";

export interface SearchProducer {
    id: number;
    name: Name;
    fullName?: string;
    email?: string;
    associatedProducer?: boolean;
    role?: string;
    reportsTo?: ReportsTo;
    pendingInvite?: boolean;
    declinedInvite?: boolean;
    npn: string;
    intersectedState?: License[];
    writingNumbers: string[];
    licensedStates: string[];
    licenses?: License[];
    carrierAppointments?: CarrierAppointment[];
    states?: CountryState;
    carriers?: any;
    appointedCarrierIds: number[];
    hqSupport?: boolean;
    isUnauthorized?: boolean;
}
