import { Injectable } from "@angular/core";
import { CanActivate, Router } from "@angular/router";
import { AuthenticationService } from "@empowered/api";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";

@Injectable({
    providedIn: "root",
})
export class KeepAliveGuard implements CanActivate {
    constructor(private router: Router, private authenticationService: AuthenticationService) {}

    canActivate(): Observable<boolean> {
        return this.authenticationService.keepalive().pipe(
            map(() => true),
            catchError(() => this.router.navigate(["/login"]))
        );
    }
}
