import { switchMap, tap, retry, takeUntil } from "rxjs/operators";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { UserService } from "@empowered/user";
import { CsrfService } from "@empowered/util/csrf";
import { Subject, Subscription } from "rxjs";

@Component({
    selector: "empowered-sso-login",
    templateUrl: "./sso-login.component.html",
    styleUrls: ["./sso-login.component.scss"],
})
export class SsoLoginComponent implements OnInit, OnDestroy {
    ssoLoginError = false;
    showPreloader = false;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private csrf: CsrfService,
        public user: UserService,
        private route: ActivatedRoute,
        private router: Router,
        private authService: AuthenticationService,
    ) {}

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            const sso = params["encData"];
            if (sso !== undefined && sso !== null) {
                this.showPreloader = true;
                this.producerSSO(sso);
            }
        });
    }

    producerSSO(encryptedString: string): void {
        this.csrf
            .load()
            .pipe(
                retry(3),
                switchMap((res) =>
                    this.authService.producerSSO(encryptedString).pipe(
                        tap(
                            (data: any) => {
                                this.showPreloader = false;
                                this.ssoLoginError = false;
                                sessionStorage.setItem("userInfo", JSON.stringify(data));
                                this.user.setUserCredential(data);
                                if (!data.consented) {
                                    this.router.navigate(["/producer/login/consent"], {
                                        relativeTo: this.route,
                                    });
                                } else {
                                    this.router.navigate(["/producer/payroll"], {
                                        relativeTo: this.route,
                                    });
                                }
                            },
                            (error) => {
                                this.showPreloader = false;
                                this.ssoLoginError = true;
                            },
                        ),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
    goToRegistration(): void {
        this.router.navigate(["register"], { relativeTo: this.route });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
