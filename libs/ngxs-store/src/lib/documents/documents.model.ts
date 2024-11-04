import { Document } from "@empowered/constants";
export interface DocumentsStateModel {
    documents: Document[];
    requestStatus: RequestStatusType;
}

export enum RequestStatusType {
    ZERO_STATE = "ZERO_STATE",
    REQUESTING = "REQUESTING",
    COMPLETED = "COMPLETED",
    ERROR = "ERROR",
}
