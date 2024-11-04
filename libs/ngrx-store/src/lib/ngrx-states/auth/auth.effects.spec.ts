import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { AuthenticationService } from "@empowered/api";
import { ApiError } from "@empowered/constants";
import { provideMockActions } from "@ngrx/effects/testing";
import { Action } from "@ngrx/store";
import { provideMockStore } from "@ngrx/store/testing";
import { NxModule } from "@nrwl/angular";
import { Observable, of, throwError } from "rxjs";

import * as AuthActions from "./auth.actions";
import { AuthEffects } from "./auth.effects";

const mockAuthenticationService = {
    login: (
        portal: string,
        credential?: {
            username: string;
            password: string;
        },
        mpGroup?: string,
    ) => of({ user: { username: credential?.username } }),
} as AuthenticationService;

describe("AuthEffects", () => {
    let actions$: Observable<Action>;
    let effects: AuthEffects;

    let authenticationService: AuthenticationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NxModule.forRoot()],
            providers: [
                AuthEffects,
                provideMockActions(() => actions$),
                provideMockStore(),
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
            ],
        });

        effects = TestBed.inject(AuthEffects);
        authenticationService = TestBed.inject(AuthenticationService);
    });

    describe("login$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(
                AuthActions.login({
                    portal: "some portal",
                    loginDetails: { password: "some password", username: "some username" },
                }),
            );
        });

        it("should get user credentials on login success", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(authenticationService, "login");

            effects.login$.subscribe((action) => {
                expect(spy).toBeCalledWith("some portal", { password: "some password", username: "some username" });

                expect(action).toStrictEqual(
                    AuthActions.loginSuccess({
                        user: {
                            username: "some username",
                        },
                    }),
                );

                done();
            });
        });

        it("should get error response on login error", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(authenticationService, "login").mockReturnValueOnce(
                throwError({
                    error: { message: "some error message" },
                }),
            );

            effects.login$.subscribe((action) => {
                expect(spy).toBeCalledWith("some portal", { password: "some password", username: "some username" });

                expect(action).toStrictEqual(AuthActions.loginFailure({ error: { message: "some error message" } as ApiError }));

                done();
            });
        });
    });

    describe("logout$", () => {
        beforeEach(() => {
            jest.clearAllMocks();

            actions$ = of(AuthActions.logout());
        });

        it("should clear localStorage", (done) => {
            expect.assertions(2);

            const spy = jest.spyOn(localStorage, "clear");

            effects.logout$.subscribe((action) => {
                expect(spy).toBeCalledTimes(1);

                expect(action).toStrictEqual(AuthActions.logoutSuccess());

                done();
            });
        });
    });
});
