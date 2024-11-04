import { ProducerDetails, AddressResult } from "@empowered/constants";
import { of } from "rxjs";
export const mockSharedService = {
    getPrivacyConfigforEnroller: (pageName: string) => true,
    setEnrollmentValuesForShop: (addressResult: AddressResult, currentEnrollmentObj: Record<string, unknown>) => void {},
    getPrimaryProducer: (groupId: string) => of({} as ProducerDetails),
    getStateZipFlag: () => of(true),
    fetchWebexConfig: () => of(""),
    getStandardDemographicChangesConfig: () => of(true),
    changeProducerNotLicensedInCustomerState: (newProducerNotLicensedInCustomerState: boolean) => void {},
    checkAgentSelfEnrolled: () => of(true),
    setStateZipFlag: (value: boolean) => void {},
    getIsDefaultOccupationClassA: () => true,
    userPortal$: of({ type: "some type" }),
};
