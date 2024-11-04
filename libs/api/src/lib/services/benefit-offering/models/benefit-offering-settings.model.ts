import { ThirdPartyPlatform, ThirdPartyPlatforms } from "../../account";
import { CountryState } from "@empowered/constants";

export interface BenefitOfferingSettingsInfo {
    thirdPartyPlatformRequired?: boolean;
    expectedThirdPartyPlatform?: ThirdPartyPlatform;
    expectedThirdPartyPlatformId?: number;
    applicableThirdPartyPlatforms?: ThirdPartyPlatforms[];
    totalEligibleEmployees?: number;
    argusTotalEligibleEmployees?: number;
    states?: CountryState[];
    stateAbbreviations?: string[];
}
