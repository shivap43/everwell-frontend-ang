export interface ContactRequest {
    personalData: PersonalData;
    requestType: any;
    text: string;
}

// eslint-disable-next-line max-classes-per-file
export interface PersonalData {
    email: any;
    mobile: any;
    country: any;
}
