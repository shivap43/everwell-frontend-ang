import { BrandingType, FIELD_STANDARD_LOGOS, FIELD_CUSTOM_LOGO } from "@empowered/api";
import { DereferencedBrandingModel } from "@empowered/ngxs-store";

/**
 * Performs a deep clone of the branding object to prevent accidental editing of the original object
 *
 * @param branding the branding to clone
 * @returns a new instance that contains the same values
 */
export function DEEP_CLONE_BRANDING(branding: DereferencedBrandingModel): DereferencedBrandingModel {
    const newBranding: Partial<DereferencedBrandingModel> = {
        type: branding.type,
        colorCode: branding.colorCode,
        colorFormat: branding.colorFormat,
    };
    if (branding.type === BrandingType.CUSTOM) {
        newBranding.type = BrandingType.CUSTOM;
        newBranding[FIELD_CUSTOM_LOGO] = {
            logoData: branding[FIELD_CUSTOM_LOGO].logoData,
            logoId: branding[FIELD_CUSTOM_LOGO].logoId,
            status: branding[FIELD_CUSTOM_LOGO].status,
        };
    } else if (branding.type === BrandingType.STANDARD) {
        newBranding.type = BrandingType.STANDARD;
        newBranding[FIELD_STANDARD_LOGOS] = {
            smallLogo:
                branding[FIELD_STANDARD_LOGOS] && branding[FIELD_STANDARD_LOGOS].smallLogo
                    ? {
                        logoData: branding[FIELD_STANDARD_LOGOS].smallLogo.logoData,
                        logoId: branding[FIELD_STANDARD_LOGOS].smallLogo.logoId,
                        status: branding[FIELD_STANDARD_LOGOS].smallLogo.status,
                    }
                    : {},
            largeLogo:
                branding[FIELD_STANDARD_LOGOS] && branding[FIELD_STANDARD_LOGOS].largeLogo
                    ? {
                        logoData: branding[FIELD_STANDARD_LOGOS].largeLogo.logoData,
                        logoId: branding[FIELD_STANDARD_LOGOS].largeLogo.logoId,
                        status: branding[FIELD_STANDARD_LOGOS].largeLogo.status,
                    }
                    : {},
        };
    }

    return { ...newBranding } as DereferencedBrandingModel;
}
