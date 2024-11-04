import { Validity } from "@empowered/constants";
import { ThirdPartyPlatform } from "./third-party-platform.model";

export interface ThirdPartyPlatforms {
    // TODO : Check when full response from API
    id?: number;
    validity: Validity;
    thirdPartyPlatformId?: number;
    thirdPartyPlatform?: ThirdPartyPlatform;
    type?: string;
    isActive?: boolean;
}
export interface ThirdPartyPlatformRequirement {
    thirdPartyPlatformRequired: boolean;
    expectedThirdPartyPlatformId?: number;
    expectedThirdPartyPlatform?: ThirdPartyPlatform;
    applicableThirdPartyPlatforms?: ThirdPartyPlatforms[];
}
export interface ThirdPartyPlatformPreview {
    id: number;
    name: string;
    affectsBenefitOffering?: boolean;
    plansToRemove?: string[];
    multipleEnrollmentStartDates?: boolean;
    earliestEnrollmentStartDate?: string | Date;
    productsRequiringSelfService?: string[];
}
