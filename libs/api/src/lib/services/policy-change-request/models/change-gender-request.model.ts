export interface ChangeGenderRequestModel {
    changeFor: string;
    gender: string;
    genderChangeDate: string;
    documentationType: string;
    documentIds: number[];
}
