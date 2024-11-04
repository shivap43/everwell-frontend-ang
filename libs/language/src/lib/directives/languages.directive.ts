import { Directive, ElementRef, Input, OnDestroy } from "@angular/core";
import { LanguageModel } from "@empowered/api";
import { Select, Store } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { LanguageState } from "../state/language.state";

const MAT_ERROR = "mat-error";

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[language]",
})
export class LanguageDirective implements OnDestroy {
    @Select(LanguageState.languageList) value$: Observable<any>;
    subscription: Subscription;
    languageObject: LanguageModel[];

    constructor(private er: ElementRef, private store: Store) {}

    @Input()
    set language(language: string) {
        if (language) {
            if (language.startsWith("primary")) {
                this.languageObject = this.store.selectSnapshot(LanguageState.languageList);
            } else {
                this.languageObject = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
            }

            if (this.languageObject) {
                this.transform(this.languageObject, language);
            } else {
                // If the language doesn't exist in the state and we're not authenticated, go get it from the API
                // this.store.dispatch(new LoadLandingLanguage(language));

                this.subscription = this.value$.subscribe((values) => {
                    this.languageObject = values[language];
                    if (this.languageObject) {
                        this.transform(this.languageObject, language);
                    }
                });
            }
        }
    }

    transform(items: any[], searchText: string): string | undefined {
        if (!items) {
            return "";
        }
        if (!searchText) {
            return "";
        }
        let value = "";

        if (Array.isArray(items)) {
            items.forEach((element) => {
                if (element.tagName === searchText) {
                    value = element.value;
                }
            });
        }
        this.er.nativeElement.innerHTML =
            this.er.nativeElement?.localName === MAT_ERROR ? `<span class="sr-only">Error</span> ${value}` : value;
        return undefined;
    }

    ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }
}
