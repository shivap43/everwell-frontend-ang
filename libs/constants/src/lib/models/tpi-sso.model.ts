import { TpiUserDetail } from "./tpi-user-detail.model";

export interface TpiSSOModel {
    user: TpiUserDetail;
    modal: boolean;
    coverageStartDate?: string;
    npn?: number;
    planId?: number;
    productId?: number;
    callback?: string;
    keepalive?: string;
}
