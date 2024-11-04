import { ProductId } from "@empowered/constants";

export interface DualPeoRiskClassIds {
    [ProductId.ACCIDENT]: number[];
    [ProductId.SHORT_TERM_DISABILITY]: number[];
}

export interface DualPeoRiskSaveRequest {
    [ProductId.ACCIDENT]: string;
    [ProductId.SHORT_TERM_DISABILITY]: string;
}
