import {
    LogoDocument,
    CustomBrandingModel,
    StandardBrandingModel,
    BrandingColorFormat,
    BrandingType,
    FIELD_CUSTOM_LOGO,
} from "@empowered/api";
import { SafeUrl } from "@angular/platform-browser";
import { BrandingDomainType } from "./branding-state";

/**
 * Defining additional data models on top of the API models to account for
 * dereferenced documents
 */
export interface DereferencedLogoDocument extends LogoDocument {
    logoData?: SafeUrl | string;
}

export interface DereferencedCustomBrandingModel extends CustomBrandingModel {
    customLogo: DereferencedLogoDocument;
}

export interface DereferencedStandardBrandingModel extends StandardBrandingModel {
    standardLogos: {
        smallLogo: DereferencedLogoDocument;
        largeLogo: DereferencedLogoDocument;
    };
}

export type DereferencedBrandingModel = DereferencedCustomBrandingModel | DereferencedStandardBrandingModel;

/**
 * Used in the state to prevent duplicate standard logo requests
 */
export interface StandardLogoData {
    domainType: BrandingDomainType;
    identifier?: number;
    colorFormat: BrandingColorFormat;
    colorCode: string;
    smallLogoData: SafeUrl;
    largeLogoData: SafeUrl;
}

/**
 * State model to keep track of all the brandings for a group
 */
export interface AccountBranding {
    type: BrandingDomainType;
    mpGroup?: number;
    brandings: DereferencedBrandingModel[];
}

/**
 * State model interface used by the feature state
 */
export interface BrandingStateModel {
    dereferencedBrandings: AccountBranding[];
    standardLogos: StandardLogoData[];
}

/**
 * Compares two branding models and determines if they are the same or now
 * @param b1 Base branding model
 * @param b2 Comparand branding model
 */
export function COMPARE_BRANDING_DATA(b1: DereferencedBrandingModel, b2: DereferencedBrandingModel): boolean {
    return (
        (!b1 && !b2) ||
        (b1 &&
            b2 &&
            b1.type === b2.type &&
            b1.colorFormat === b2.colorFormat &&
            b1.colorCode === b2.colorCode &&
            ((b1.type === BrandingType.CUSTOM && typeof b1[FIELD_CUSTOM_LOGO].logoData === typeof b2[FIELD_CUSTOM_LOGO].logoData) ||
                (b1.type === BrandingType.STANDARD && b2.type === BrandingType.STANDARD)))
    );
}
