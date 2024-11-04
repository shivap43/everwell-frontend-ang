export interface CustomErrorResponse {
    status: number;
    code: string;
    message: string;
    // TODO - Ask Kevin when / how this details property is provided
    details?: ErrorDetail[];
}

export interface ErrorDetail {
    objectId: number;
    field: string;
    message: string;
}
