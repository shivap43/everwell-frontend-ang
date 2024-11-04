export interface CarrierContactDetails {
    id: number;
    contactType: string;
    name: string;
    phoneNumber: string;
    type?: string;
    state?: string;
    rank?: number;
    website: {
        link: string;
    };
}
