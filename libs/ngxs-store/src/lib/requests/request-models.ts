export interface RequestStateModel {
    [actionType: string]: ActionRequest[];
}

export type ActionRequest = DatedRequest & ActionParameters;

export interface DatedRequest {
    requestDate: Date;
}

export interface ActionParameters {
    [actionField: string]: any;
}
