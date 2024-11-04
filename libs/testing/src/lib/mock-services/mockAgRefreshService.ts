import { HttpErrorResponse } from "@angular/common/http";
import { AccountDetails } from "@empowered/api";
import { RefreshEligibleInfo } from "@empowered/constants";
import { of } from "rxjs";

export const mockAgRefreshService = {
    refreshAgOffering: (currentAccount: AccountDetails, refreshEligibleInfo: RefreshEligibleInfo, isRefreshInfo?: boolean) =>
        of({} as RefreshEligibleInfo),
    checkCarrierStatus: () => of({} as [] | null),
    getServerErrorMessageForAg: (error: HttpErrorResponse) => String,
    getDefaultErrorMessageForAg: (error: HttpErrorResponse) => String,
    onRefreshAccount: () => void {},
};
