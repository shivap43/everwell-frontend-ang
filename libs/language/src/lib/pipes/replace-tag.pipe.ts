import { Pipe, PipeTransform } from "@angular/core";
import { LanguageModel } from "@empowered/api";
import { Store } from "@ngxs/store";
import { LanguageState } from "../state/language.state";

@Pipe({
    name: "replaceTag",
})
export class ReplaceTagPipe implements PipeTransform {
    languageObject: LanguageModel[];

    constructor(private readonly store: Store) {}

    /**
     * To replace the key in language with the data passed
     * @param value: has the language
     * @param mapObj: has the object to be mapped with
     * @returns the value to matched key
     */
    transform(value: any, mapObj: any): any {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions, no-unused-expressions
        value.startsWith("primary")
            ? (this.languageObject = this.store.selectSnapshot(LanguageState.languageList))
            : (this.languageObject = this.store.selectSnapshot(LanguageState.secondaryLanguageList));
        let tagValue = "";
        if (this.languageObject) {
            tagValue = this.transformValue(this.languageObject, value);
        }
        const re = new RegExp(Object.keys(mapObj).join("|"), "gi");
        if (tagValue) {
            return tagValue.replace(re, (matched) => mapObj[matched.toLowerCase()]);
        }
        return value.replace(re, (matched) => mapObj[matched.toLowerCase()]);
    }

    /**
     * Get the language string from the given key
     * @param items: language objects array
     * @param searchText: language key
     * @returns string value of the language key passed
     */
    transformValue(items: LanguageModel[], searchText: string): string {
        if (!items || !searchText) {
            return "";
        }
        const tag = items.find((element) => element.tagName === searchText);
        return tag ? tag.value : "";
    }
}
