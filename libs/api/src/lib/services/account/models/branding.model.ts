import { DocumentStatus } from "@empowered/constants";

export const FIELD_CUSTOM_LOGO = "customLogo";
export const FIELD_STANDARD_LOGOS = "standardLogos";
const COLOR_R_INDEX = 0;
const COLOR_G_INDEX = 1;
const COLOR_B_INDEX = 2;
const HEX_PREFIX = "#";
const DOCUMENT_STATUS_COMPLETE: DocumentStatus = "COMPLETE";

export enum BrandingColorFormat {
    HEX = "HEX",
    RGB = "RGB",
}

export enum BrandingType {
    CUSTOM = "CUSTOM",
    STANDARD = "STANDARD",
}

export enum LogoSize {
    SMALL = "SMALL",
    LARGE = "LARGE",
}

export interface BrandingModel {
    id?: number;
    colorFormat: BrandingColorFormat;
    colorCode: string;
    readonly createDate?: string;
    type: BrandingType;
}

export interface LogoDocument {
    logoId?: number;
    status?: {
        status: DocumentStatus;
    };
}

export interface CustomBrandingModel extends BrandingModel {
    type: BrandingType.CUSTOM;
    customLogo: LogoDocument;
}

export interface StandardBrandingModel extends BrandingModel {
    type: BrandingType.STANDARD;
    standardLogos: {
        smallLogo: LogoDocument;
        largeLogo: LogoDocument;
    };
}

export interface BrandingPreviewRequest {
    colorFormat: BrandingColorFormat;
    colorCode: string;
    size: LogoSize;
}

/**
 * Helper object to keep track of RGB ratios
 */
export interface RGBRatio {
    r: number;
    g: number;
    b: number;
}

/**
 * Checks to make sure that the branding has completed uploading
 *
 * @param branding the branding to validate
 * @returns if the upload is complete
 */
export function BRANDING_UPLOAD_COMPLETE(branding: CustomBrandingModel | StandardBrandingModel): boolean {
    switch (branding.type) {
        case BrandingType.CUSTOM:
            return !!(branding[FIELD_CUSTOM_LOGO].logoId && branding[FIELD_CUSTOM_LOGO].status?.status === DOCUMENT_STATUS_COMPLETE);
        case BrandingType.STANDARD:
            return !!(
                branding[FIELD_STANDARD_LOGOS].smallLogo.logoId &&
                branding[FIELD_STANDARD_LOGOS].smallLogo.status?.status === DOCUMENT_STATUS_COMPLETE &&
                branding[FIELD_STANDARD_LOGOS].largeLogo.logoId &&
                branding[FIELD_STANDARD_LOGOS].largeLogo.status?.status === DOCUMENT_STATUS_COMPLETE
            );
        default:
            return false;
    }
}

/**
 * Converts the given type and value into a standardized format
 *
 * @param type The color's format
 * @param value The color's value
 * @returns the standardized color
 */
export function COLOR_TO_STRING(type: BrandingColorFormat, value: string | RGBRatio): string | null {
    switch (type) {
        case BrandingColorFormat.HEX:
            return (value as string).replace(HEX_PREFIX, "");
        case BrandingColorFormat.RGB:
            const valueRatio: RGBRatio = value as RGBRatio;
            return `${valueRatio.r},${valueRatio.g},${valueRatio.b}`;
        default:
            return null;
    }
}

/**
 * Converts the string representation of a value into a formatted value
 *
 * @param type the desired output type
 * @param value the string representation of a value
 * @returns The formatted color
 */
export function STRING_TO_COLOR(type: BrandingColorFormat, value: string): string | RGBRatio | null {
    switch (type) {
        case BrandingColorFormat.HEX:
            return value;
        case BrandingColorFormat.RGB:
            const valueArray: string[] = value.split(",");
            return {
                r: Number(valueArray[COLOR_R_INDEX]),
                g: Number(valueArray[COLOR_G_INDEX]),
                b: Number(valueArray[COLOR_B_INDEX]),
            } as RGBRatio;
        default:
            return null;
    }
}
