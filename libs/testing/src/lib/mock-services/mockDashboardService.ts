import { AccountDetails } from "@empowered/api";
import { of } from "rxjs";
export const mockDashboardService = {
    getAccount: (mpGroup: string) => of({} as AccountDetails),
};
