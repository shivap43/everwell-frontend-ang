import { AccountProducer } from "./account-producer.model";

export interface AdminRoles {
    id: number;
    name: string;
    isReportingManager?: boolean;
    reportingManagerOf?: AccountProducer[];
    isRMOfPrimaryProducer?: boolean;
}
