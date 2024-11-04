import { Name } from "./name.model";

export interface AccountLock {
    admins: { id: number; name: Name }[];
    firstCheckoutDate: string;
    lastCheckinDate: string;
}
