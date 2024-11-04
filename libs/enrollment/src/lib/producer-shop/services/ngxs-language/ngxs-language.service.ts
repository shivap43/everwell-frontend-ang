import { Injectable } from "@angular/core";
import { LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";

@Injectable({
    providedIn: "root",
})
export class NGXSLanguageService {
    constructor(private store: Store) {}

    /**
     * Dispatch ngxs action to load secondary language strings. This will manually load them which is required since,
     * unlike primary language strings, application doesn't bootstrap with the api call to load them so they can just be treated as
     * synchronous values available since the start of the Application's life cycle.
     *
     * Secondary languages are still treated as if they are synchronous throughout the application which isn't the case. Be warned!
     */
    loadSecondaryLanguages(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }
}
