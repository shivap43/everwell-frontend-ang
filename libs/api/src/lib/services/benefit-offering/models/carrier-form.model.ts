import { CarrierFormPage } from "./carrier-form-page.model";
import { CarrierSetupStatus } from "./carrier-setup-status.model";

export interface CarrierForm {
    id: number;
    name: string;
    statusId?: number;
    status: CarrierSetupStatus;
    pages: CarrierFormPage[];
}
export interface CarrierFormWithCarrierInfo extends CarrierForm {
    carrierId?: number;
    carrierName?: string;
    formName?: string;
    formStatus?: string;
}
