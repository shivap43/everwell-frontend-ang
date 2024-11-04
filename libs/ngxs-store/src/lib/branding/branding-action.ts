/* eslint-disable max-classes-per-file */

import { BrandingColorFormat } from "@empowered/api";
import { BrandingDomainType } from "./branding-state";

/**
 * Action to get the branding for an account by group number
 */
export class GetBranding {
    static readonly type: string = "[Branding] getBranding";

    constructor(public domainType: BrandingDomainType, public identifier?: number, public forceRefresh = false) {}
}

/**
 * Get the standard logo data for a given group, color, and color format
 */
export class LoadStandardLogoData {
    static readonly type: string = "[Branding] getStandardLogoData";

    constructor(
        public domainType: BrandingDomainType,
        public colorFormat: BrandingColorFormat,
        public colorCode: string,
        public identifier?: number,
    ) {}
}

/**
 * Action for deleting Account branding using group
 */
export class ResetBranding {
    static readonly type: string = "[Branding] resetBranding";
    constructor(public domainType: BrandingDomainType, public group: number) {}
}
