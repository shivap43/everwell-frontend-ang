import { Injectable } from "@angular/core";
import { CommonService, LanguageModel } from "@empowered/api";
import { Store } from "@ngxs/store";
import { EMPTY, Observable } from "rxjs";
import { catchError, tap } from "rxjs/operators";
import { CookieService } from "ngx-cookie-service";
import { PartnerId } from "@empowered/constants";
import { LoadLandingLanguage } from "@empowered/language";

const SAMESITE_NONE = "None";
@Injectable({ providedIn: "root" })
export class InitialLoadLanguageService {
    /**
     * Constructor to set the partnerId cookie
     * @param cookie CookieService instance
     * @param commonService CommonService instance
     * @param store Store instance
     */
    constructor(private cookie: CookieService, private commonService: CommonService, private store: Store) {
        /* TODO - Cookie logic revisit */
        this.cookie.set("partnerId", PartnerId.AFLAC.toString(), 0, "/", null, true, SAMESITE_NONE);
    }

    loadLandingLanguages(): Observable<LanguageModel[]> {
        return this.commonService.getLandingLanguages("primary.*").pipe(
            tap<LanguageModel[]>((response) => {
                this.store.dispatch([new LoadLandingLanguage(response)]);
            }),
            catchError(
                () =>
                    // TODO: Ensure error gets logged to Kibana
                    EMPTY,
            ),
        );
    }
}

/** @docs-private */
export function EMPOWERED_LANGUAGE_FACTORY(language: InitialLoadLanguageService): () => Promise<LanguageModel[]> {
    return () => language.loadLandingLanguages().toPromise();
}
