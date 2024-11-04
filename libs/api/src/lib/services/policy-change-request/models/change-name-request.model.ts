export interface ChangeNameRequestModel {
    title: string;
    firstName: string;
    middleName: string;
    lastName: string;
    suffix: string;
    effectiveDate: string;
    reasonForChange: string;
    documentIds: number[];
}
