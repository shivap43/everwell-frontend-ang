import { Injectable } from "@angular/core";
import { createEffect, Actions, ofType } from "@ngrx/effects";
import { of } from "rxjs";
import { catchError, map, mapTo, switchMap, tap } from "rxjs/operators";
import { AuthenticationService, LoginResponse } from "@empowered/api";
import { HttpErrorResponse } from "@angular/common/http";

import * as AuthActions from "./auth.actions";

@Injectable()
export class AuthEffects {
    login$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.login),
            switchMap((action) =>
                this.auth.login(action.portal, action.loginDetails).pipe(
                    map((data: LoginResponse) =>
                        AuthActions.loginSuccess({
                            user: data.user,
                        }),
                    ),
                    catchError((httpErrorResponse: HttpErrorResponse) => of(AuthActions.loginFailure({ error: httpErrorResponse.error }))),
                ),
            ),
        ),
    );

    logout$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.logout),
            tap(() => {
                localStorage.clear();
            }),
            mapTo(AuthActions.logoutSuccess()),
        ),
    );

    constructor(private actions$: Actions, private auth: AuthenticationService) {}
}
