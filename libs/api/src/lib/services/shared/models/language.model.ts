import { BreakpointSizes } from "@empowered/constants";

export enum ToneOfVoice {
    RELAXED = "RELAXED",
    SERIOUS = "SERIOUS",
}

export interface LanguageModel {
    tagName: string;
    value: string;
    carrierId: number;
    productId: number;
    toneOfVoice: ToneOfVoice;
    breakpointSize: BreakpointSizes;
}
