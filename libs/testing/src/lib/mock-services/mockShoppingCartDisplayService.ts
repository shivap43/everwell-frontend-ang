import { ApplicationResponseBaseType, FlexDollar, PendingReasonForPdaCompletion, SendReminderMode } from "@empowered/api";
import { of } from "rxjs";
import { ApplicationResponse } from "@empowered/constants";

export const mockShoppingCartDisplayService = {
    saveApplicationResponse: (
        memberId: number,
        itemId: number,
        mpGroup: number,
        applicationResponse: ApplicationResponse[],
        applicationResponseBaseType?: ApplicationResponseBaseType,
    ) => of({}),
    getAppliedFlexDollarOrIncentivesForCart: (memberId: number, mpGroup: string, cartItemId?: number) => of({} as FlexDollar),
    requestShoppingCartSignature: (
        mpGroup: number,
        memberId: number,
        contactInfo: SendReminderMode,
        signatureFor: PendingReasonForPdaCompletion,
    ) => of({}),
};
