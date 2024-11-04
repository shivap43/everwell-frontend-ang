import { Injectable } from "@angular/core";
import { AuthenticationService, Csrf } from "@empowered/api";
import { Admin } from "@empowered/constants";
import { CookieService } from "ngx-cookie-service";
import { Observable, throwError } from "rxjs";
import { catchError, tap, retry, switchMap } from "rxjs/operators";
import { Store } from "@ngxs/store";
import { AccountsService } from "@empowered/common-services";
import { ResetState } from "@empowered/user/state/actions";

const PRODUCER_SEARCH_RESET = "";
const PRODUCER_WRITTINGNUMBER_RESET: Admin = null;
const SAMESITE_NONE = "None";
@Injectable({ providedIn: "root" })
export class CsrfService {
    constructor(
        private readonly auth: AuthenticationService,
        private readonly cookie: CookieService,
        private readonly store: Store,
        private readonly accountsService: AccountsService,
    ) {}
    /**
     * Function to set the headerName cookie from API on successful csrf API call
     * @returns Observable<Csrf> observable of Csrf interface
     */
    load(): Observable<Csrf> {
        return this.auth.csrf().pipe(
            // On success, set fresh cookie from API response…
            tap<Csrf>((csrf) => this.cookie.set(csrf.headerName, csrf.token, 0, "/", null, true, SAMESITE_NONE)),
            // In case of server error, use catch & replace strategy to prevent APP_INITIALIZER from blocking bootstrap…
            // TODO - Ensure CSRF errors get logged to Kibana
            catchError((err) => throwError(err)),
        );
    }
    logOut(): Observable<any> {
        return this.auth.logout().pipe(
            retry(3),
            switchMap(() => {
                this.store.dispatch(new ResetState());
                this.accountsService.setWritingNumberOfProducer(PRODUCER_WRITTINGNUMBER_RESET);
                this.accountsService.setProductSearchList(PRODUCER_SEARCH_RESET);
                return this.load().pipe(retry(3));
            }),
        );
    }
}

/** @docs-private */
export function EMPOWERED_CSRF_FACTORY(csrf: CsrfService): () => Promise<any> {
    return () => csrf.load().toPromise();
}
