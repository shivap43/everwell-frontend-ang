import { Name } from "./name.model";

export interface TpiUserDetail {
    id: number;
    username: string;
    name: Name;
    partnerId: number;
    consented: boolean;
    memberId: number;
    groupId: number;
    modal: boolean;
    producerId: number;
    callCenterId?: number;
}
