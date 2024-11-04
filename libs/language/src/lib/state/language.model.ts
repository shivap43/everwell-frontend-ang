import { LanguageModel } from "@empowered/api";
import { ApiError, BreakpointSizes, Vocabulary } from "@empowered/constants";

export interface LanguageRequest {
    tagName: string;
    partnerId?: number;
    vocabulary?: Vocabulary;
    breakpointSize?: BreakpointSizes;
}

export interface ReducedLanguage {
    tagName: string;
    languageMetas: LanguageMeta[];
}

export interface LanguageMeta {
    value: string;
    carrierId: number;
    productId: number;
    toneOfVoice: string;
    breakpointSize: BreakpointSizes;
    partnerId?: number;
    vocabulary?: string;
}

export interface LanguageModelResponse extends LanguageModel {
    partnerId?: number;
    vocabulary?: Vocabulary;
}

export interface LanguageStateModel {
    values: LanguageModel[];
    secondaryValues: LanguageModel[];
    errorMessage: string;
    requests: LanguageRequest[];
    languages: ReducedLanguage[];
    apiError?: ApiError;
}
