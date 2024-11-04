import { AppTypeIndicator } from "../enums";

export interface PendedBusinessByType {
    transmittalNumber: string;
    pendDate: string;
    processedDate: string;
    accountNumber: string;
    state: string;
    applicantFirstName: string;
    applicantMiddleName: string;
    applicantLastName: string;
    applicationNumber: string;
    billForm: string;
    status: string;
    destinationDescription: string;
    lobCode: string;
    deskCode: string;
    coproducers: string[];
    invoiceIndicator: string;
    appTypeIndicator: AppTypeIndicator;
    company: string;
}
