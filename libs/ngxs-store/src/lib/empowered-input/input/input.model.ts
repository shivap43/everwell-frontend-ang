export interface InputField {
    id: string;
    error: boolean;
    domOrder: string;
}

export interface InputForm {
    fields: InputField[];
    formName: string;
}

export interface InputModel {
    forms: InputForm[];
}
