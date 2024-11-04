import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { CookieService } from "ngx-cookie-service";
import { AuthenticationService } from "@empowered/api";
import { CsrfService } from "@empowered/util/csrf";
import { switchMap, takeUntil, tap } from "rxjs/operators";
import { of, Subject, Subscription } from "rxjs";
import { UserService } from "@empowered/user";
import { LoginHelperService } from "../services/login-helper.service";
import { AdminCredential, MemberCredential, ProducerCredential } from "@empowered/constants";

const RESUME_URL = "/auth/aflac/resume";
@Component({
    selector: "empowered-oauth2-login",
    templateUrl: "./oauth2-login.component.html",
    styleUrls: ["./oauth2-login.component.scss"],
})
export class Oauth2LoginComponent implements OnInit, OnDestroy {
    userCred: AdminCredential | MemberCredential | ProducerCredential;
    private unsubscribe$ = new Subject<void>();
    subscriptions: Subscription[] = [];
    loader = true;
    constructor(
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly auth: AuthenticationService,
        private readonly cookieService: CookieService,
        private readonly csrfService: CsrfService,
        private readonly userService: UserService,
        private readonly loginHelperService: LoginHelperService,
    ) {}

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and function at the time of component loading.
     */
    ngOnInit(): void {
        if (this.router.url.indexOf(RESUME_URL) !== -1) {
            this.csrfService
                .load()
                .pipe(
                    switchMap(() =>
                        this.auth.resume().pipe(
                            tap((user) => {
                                const USER_INFO_STORAGE = "userInfo";
                                this.loader = false;
                                this.csrfService.load().toPromise();
                                this.userCred = user.user;
                                this.userCred.actionRequired = user.actionRequired;
                                sessionStorage.setItem(USER_INFO_STORAGE, JSON.stringify(this.userCred));
                                this.userService.setUserCredential(this.userCred);
                                this.subscriptions.push(
                                    ...this.loginHelperService.routeAfterLogin(user, this.userCred as MemberCredential),
                                );
                            }),
                        ),
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }
    /**
     * Unsubscribes from observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
