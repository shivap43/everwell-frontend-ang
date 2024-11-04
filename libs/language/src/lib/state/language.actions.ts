/* eslint-disable max-classes-per-file */

import { LanguageModel } from "@empowered/api";
import { BreakpointSizes, Vocabulary } from "@empowered/constants";

export class LoadLanguage {
    static readonly type = "[Language] LoadLanguage";

    constructor(public key: string) {}
}

export class LoadLandingLanguage {
    static readonly type = "[Language] LoadLandingLanguage";

    constructor(public language: LanguageModel[]) {}
}

export class LoadSecondaryLandingLanguage {
    static readonly type = "[Language] LoadSecondaryLandingLanguage";

    constructor(public key: string) {}
}
export class FetchErrorMessageLanguage {
    static readonly type = "[Language] FetchErrorMessageLanguage";

    constructor(public key: string, public displayMessage?: string) {}
}
export class ResetErrorMessageLanguage {
    static readonly type = "[Language] LoadSecondaryLandingLanguage";

    constructor() {}
}

export class FetchLanguage {
    static readonly type = "[Language] FetchLanguage";

    constructor(
        public tagName: string,
        public vocabulary: Vocabulary = Vocabulary.ENGLISH,
        public date?: string,
        public partnerId?: number,
        public breakpointSize?: BreakpointSizes,
    ) {}
}
