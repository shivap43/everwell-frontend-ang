import { catchError, map } from "rxjs/operators";
import { Injectable } from "@angular/core";
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable, of } from "rxjs";
import { StaticUtilService } from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class NonProdGuard implements CanActivate {
    static readonly CONFIG_FIELD: string = "requiredConfig";
    constructor(private readonly staticUtil: StaticUtilService, private readonly router: Router) {}

    /**
     * Allowing the route only for non-prod environments.
     * @param route
     * @param state
     * @returns Observable<boolean>
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        if (route && route.data && route.data[NonProdGuard.CONFIG_FIELD]) {
            return this.staticUtil.cacheConfigValue(route.data[NonProdGuard.CONFIG_FIELD]).pipe(
                map((resp) =>
                    // If no config found, cacheConfigValue returns false
                    // Else return boolean based on the env.
                    resp ? !(resp === "prod" || resp === "preprod" || resp === "aflactraining") : false,
                ),
                catchError((err) => {
                    this.router.navigate(["/login"]);
                    return of(false);
                }),
            );
        }
        return of(true);
    }
}
