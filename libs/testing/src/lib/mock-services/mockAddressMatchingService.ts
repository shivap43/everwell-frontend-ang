import { PersonalAddress } from "@empowered/constants";
import { of } from "rxjs";

export const mockAddressMatchingService = {
    saveAccountContactOrAccountProducerConfirmation: (mpGroupId: number, memberId: number, isAccountContactOrAccountProducer: boolean) =>
        of(),
    validateAccountContactOrAccountProducerMatch: (mpGroupId: number, memberId: number, personalAddress: PersonalAddress) => of(false),
};
