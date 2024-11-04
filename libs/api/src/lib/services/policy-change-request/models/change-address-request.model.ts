export interface ChangeAddressRequestModel {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    ext: string;
    phoneNumber: string;
    documentIds: number[];
    type?: string;
}
