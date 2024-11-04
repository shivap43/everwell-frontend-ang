import { Name } from "@empowered/constants";

export interface ProducerCheckoutDetails {
    id: number;
    type: string;
    name: Name;
    emailAddress: string;
    phoneNumber: string;
    reportsToId: number;
    highestLevel: number;
    highestLevelDescription: string;
    title: string;
    npn: string;

    brokerageId: number;
}
