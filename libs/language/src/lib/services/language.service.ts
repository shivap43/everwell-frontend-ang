import { Injectable } from "@angular/core";
import { Store } from "@ngxs/store";
import { LanguageState } from "../state/language.state";

@Injectable({
    providedIn: "root",
})
export class LanguageService {
    constructor(private store: Store) {}

    fetchPrimaryLanguageValue(tagName: string): string {
        return this.store.selectSnapshot(LanguageState.FetchPrimaryValueForTagName(tagName));
    }

    fetchPrimaryLanguageValues(tagNames: string[]): Record<string, string> {
        return tagNames.reduce<Record<string, string>>((languageValues, tagName) => {
            languageValues[tagName] = this.store.selectSnapshot(LanguageState.FetchPrimaryValueForTagName(tagName));
            return languageValues;
        }, {});
    }

    fetchSecondaryLanguageValue(tagName: string): string {
        return this.store.selectSnapshot(LanguageState.FetchSecondaryValueForTagName(tagName));
    }

    fetchSecondaryLanguageValues(tagNames: string[]): Record<string, string> {
        return tagNames.reduce<Record<string, string>>((languageValues, tagName) => {
            languageValues[tagName] = this.store.selectSnapshot(LanguageState.FetchSecondaryValueForTagName(tagName));
            return languageValues;
        }, {});
    }
}
