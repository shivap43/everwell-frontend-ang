export interface ApplicationResponse {
    stepId: number;
    value: string[] | AgAppResponse[] | { [key: string]: string | number }[];
    type?: string;
    key?: string;
    planQuestionId?: number;
}
export interface AgAppResponse {
    writingNumber?: string;
    aflacGroupLocation?: string;
    deductionFrequency?: string;
}
