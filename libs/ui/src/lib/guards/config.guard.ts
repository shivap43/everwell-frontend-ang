import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, CanActivateChild, Router } from "@angular/router";
import { StaticUtilService } from "@empowered/ngxs-store";
import { Observable, combineLatest, iif, of, defer } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Prevents navication to a route based on a config option. The config MUST be a boolean type and its value MUST be 'true'
 * in order to navigate to the route; otherwise the route will refuse to load. Additional fields are available to redirect
 * the router on failure.
 *
 * ***** TO IMPLEMENT *****
 * Add this guard to the 'canActivate' or 'canActivateChild' field to any route, and add the feature enable config to
 * the data for that route under the requiredConfig field. To redirece users, add the 'requiredConfigRedirect' field with
 * a relative (to the domain) path. In order to resolve the new path against the current url (the url being navigated to),
 * add 'requiredConfigRelative' with a value of true.
 *
 * Example:
 *
 * {
 *    path: "payroll",
 *    loadChildren: import("@empowered/accounts").then(m => m.AccountsModule),
 *    canActivate: [ConfigGuard],
 *    data: {
 *          requiredConfig: "general.not.a.config",
 *          requiredConfigRedirect: "general.not.a.config",
 *          requiredConfigRelative: true
 *    }
 *  }
 *
 */
@Injectable({
    providedIn: "root",
})
export class ConfigGuard implements CanActivate, CanActivateChild {
    static readonly CONFIG_FIELD: string = "requiredConfig";
    static readonly CONFIG_REDIRECT_FIELD: string = "requiredConfigRedirect";
    static readonly CONFIG_REDIRECT_RELATIVE_FIELD: string = "requiredConfigRelative";

    constructor(private staticUtil: StaticUtilService, private router: Router) {}

    /**
     * Decides if a route can be activated ,
     * @param route route associated with a component loaded in an outlet
     * @param state represents the state of the router at the moment
     * @returns observable of boolean or redirect url that indicates if the route can be accessed
     */
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean {
        if (route && route.data && route.data[ConfigGuard.CONFIG_FIELD]) {
            return combineLatest(
                this.staticUtil.cacheConfigEnabled(route.data[ConfigGuard.CONFIG_FIELD]),
                iif(
                    () =>
                        route.data[ConfigGuard.CONFIG_REDIRECT_FIELD] !== undefined &&
                        route.data[ConfigGuard.CONFIG_REDIRECT_FIELD] != null,
                    defer(() => this.staticUtil.cacheConfigValue(route.data[ConfigGuard.CONFIG_REDIRECT_FIELD])),
                    of(""),
                ),
            ).pipe(
                map(([configEnabled, configValue]) => {
                    // If there is a redirect field, redirect to the new url on failure
                    if (!configEnabled && configValue) {
                        // If it is a relative URL, then evaluate the new URL compared to the current URL
                        if (route.data[ConfigGuard.CONFIG_REDIRECT_RELATIVE_FIELD]) {
                            return this.resolvePath(state.url, configValue);
                        }
                        return this.router.createUrlTree([configValue]);
                    }
                    return configEnabled;
                }),
            );
        }

        // Required data not passed into the guard, fail by default
        return false;
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | boolean {
        if (childRoute && childRoute.data && childRoute.data[ConfigGuard.CONFIG_FIELD]) {
            return combineLatest(
                this.staticUtil.cacheConfigEnabled(childRoute.data[ConfigGuard.CONFIG_FIELD]),
                iif(
                    () =>
                        childRoute.data[ConfigGuard.CONFIG_REDIRECT_FIELD] !== undefined &&
                        childRoute.data[ConfigGuard.CONFIG_REDIRECT_FIELD] != null,
                    this.staticUtil.cacheConfigValue(childRoute.data[ConfigGuard.CONFIG_REDIRECT_FIELD]),
                    of(""),
                ),
            ).pipe(
                map(([configEnabled, configValue]) => {
                    // If there is a redirect field, redirect to the new url on failure
                    if (!configEnabled && configValue) {
                        // If it is a relative URL, then evaluate the new URL compared to the current URL
                        if (childRoute.data[ConfigGuard.CONFIG_REDIRECT_RELATIVE_FIELD]) {
                            return this.resolvePath(state.url, configValue);
                        }
                        return this.router.createUrlTree([configValue]);
                    }
                    return configEnabled;
                }),
            );
        }

        // Required data not passed into the guard, fail by default
        return false;
    }

    /**
     * Resolve a pseudo-relative path against the known path
     *
     * @param url The full URL from the state
     * @param path The relative path resolved agains the known path
     * @returns The new resolved path
     */
    resolvePath(url: string, path: string): UrlTree {
        const stateUrlElements: string[] = path.split("/");
        const backNavigation: number = stateUrlElements.reduceRight(
            (accumulator, currentPath) => (currentPath === ".." ? accumulator + 1 : accumulator),
            0,
        );
        const appendPath: string = stateUrlElements
            .filter((element) => element && element !== "..")
            .reduce((accumulator, element) => accumulator + "/" + element, "");

        const routeElements: string[] = url.split("/");
        return this.router.createUrlTree([
            routeElements
                .slice(0, routeElements.length - backNavigation)
                .filter((element) => element !== undefined && element != null && element !== "")
                .reduce((accumulator, element) => accumulator + "/" + element, "")
                .concat(appendPath),
        ]);
    }
}
