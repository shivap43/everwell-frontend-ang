export interface Paymetric {
    AccessToken: string;
    MerchantGuid: string;
    FormFields: FormField[];
}
export interface FormField {
    Name: string;
    Value: string;
    IsToTokenize: boolean;
}
