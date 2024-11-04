import { Injectable } from "@angular/core";
import { TinyColor } from "@ctrl/tinycolor";
import { BrandingModel, RGBRatio, BrandingColorFormat } from "@empowered/api";

const LUMINANCE_OFFSET = 0.05;
const AA_LUMINANCE_RATIO = 4.5;
const R_POSITION = 0;
const G_POSITION = 1;
const B_POSITION = 2;
@Injectable({
    providedIn: "root",
})
export class ColorControlService {
    constructor() {}

    /**
     * Convert R, G, and B values into a single hexadecimal equivalent
     * @param rgbRatio The RGB ratios
     */
    rgbToHex(rgbRatio: RGBRatio): string {
        return new TinyColor(rgbRatio).toHexString().replace("#", "");
    }

    rgbStringToHex(rgbRatio: string): string {
        return new TinyColor(rgbRatio).toHexString().replace("#", "");
    }

    hexToRGB(hexString: string): RGBRatio {
        return new TinyColor(hexString).toRgb();
    }

    /**
     * Helper function to get the luminance value of a hex color string
     * @param hexValue the hex color string
     */
    findLuminanceValue(hexColor: string): number {
        return new TinyColor(hexColor).getLuminance();
    }

    /**
     * Find the luminance ration between two different colors
     * @param hexColorOne the first hex color
     * @param hexColorTwo the second hex color
     */
    findLuminanceRatio(hexColorOne: string, hexColorTwo: string): number {
        const luminanceValueOne: number = this.findLuminanceValue(hexColorOne) + LUMINANCE_OFFSET;
        const luminanceValueTwo: number = this.findLuminanceValue(hexColorTwo) + LUMINANCE_OFFSET;

        return luminanceValueOne > luminanceValueTwo ? luminanceValueOne / luminanceValueTwo : luminanceValueTwo / luminanceValueOne;
    }

    /**
     * Compares two hex colors to determine if they are about the requested AA Contrast ratio
     * @param hexColorOne the first hex color
     * @param hexColorTwo the second hex color
     */
    isAAContrastCompliant(hexColorOne: string, hexColorTwo: string): boolean {
        return this.findLuminanceRatio(hexColorOne, hexColorTwo) > AA_LUMINANCE_RATIO;
    }

    /**
     * Transforms an accountBranding object from the API into a hex displayable color
     * @param accountBranding the input branding
     * @returns the hex value of the color
     */
    accountBrandingToHex(accountBranding: BrandingModel): string {
        return this.brandingToHex(accountBranding.colorFormat, accountBranding.colorCode);
    }

    /**
     * Transforms the color parameters into a standard hex value
     *
     * @param colorFormat the qualifier of the color
     * @param colorCode the quantifier of the color
     * @returns the hex value
     */
    brandingToHex(colorFormat: BrandingColorFormat, colorCode: string): string | undefined {
        switch (colorFormat) {
            case BrandingColorFormat.HEX:
                return colorCode;
            case BrandingColorFormat.RGB: {
                const rawRGB: string[] = colorCode.split(",");
                return this.rgbToHex({
                    r: Number(rawRGB[R_POSITION]),
                    g: Number(rawRGB[G_POSITION]),
                    b: Number(rawRGB[B_POSITION]),
                });
            }
        }
    }
}
