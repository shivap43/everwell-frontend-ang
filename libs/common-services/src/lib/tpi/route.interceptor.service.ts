import { Injectable } from "@angular/core";
import { Router, NavigationEnd, Event } from "@angular/router";
import { Subject, Observable, of } from "rxjs";
import { RouterState } from "@ngxs/router-plugin";
import { Select, Store } from "@ngxs/store";
import { PageLogService } from "../shared/page-log.service";
import { ResetToParameters, parameterNameMap } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { withLatestFrom, mergeMap, take, pluck, tap, filter, distinctUntilChanged, map, catchError } from "rxjs/operators";
import { HttpResponse } from "@angular/common/http";

// Function declared in index.html
declare let gtag: any;

@Injectable({
    providedIn: "root",
})
export class RouteInterceptorService {
    /**
     * Each time the route changes, check to see if there are any new path parameters,
     * if any parameter has changed then rerequest all parameters (in case of tenant DB).
     */
    @Select(RouterState) router$!: Observable<any>;
    routerStateParams$ = this.router$.pipe(
        // Get the router parameters
        pluck("state", "params"),
        // For each key, map to the appropriate translation
        map((params) => {
            const translatedParameters: unknown = {};
            if (params) {
                Object.keys(params).forEach((key) => {
                    let translatedKey = parameterNameMap.get(key);
                    translatedKey = translatedKey != null ? translatedKey : key;
                    translatedParameters[translatedKey] = params[key];
                });
            }
            return translatedParameters;
        }),
        // Only emit if there are new parameters that need to be fetched
        distinctUntilChanged((prevParams, currParams) => {
            const prevKeys: string[] = Object.keys(prevParams);
            const currKeys: string[] = Object.keys(currParams);

            return (
                prevKeys.length === currKeys.length &&
                prevKeys.reduce((accumulator, key) => accumulator && prevParams[key] === currParams[key], true)
            );
        }),
        // For each parameter set, make a request to the store
        tap((params) => this.store.dispatch(new ResetToParameters(params))),
    );

    /**
     * Google Analytics snippet - fires on navigation end
     */
    googleAnalyticsNavigationEnd$: Observable<Event> = this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        tap((event: NavigationEnd) => {
            gtag("config", "UA-44929342-1", {
                page_path: event.urlAfterRedirects,
            });
        }),
    );

    // Adding the updatePageLog feature on navigation end
    lastNavigationEndEvent$: Observable<NavigationEnd> = this.router.events.pipe(
        filter((event) => event instanceof NavigationEnd),
        map((event) => event as NavigationEnd),
        tap((navigationEnd) => (this.lastNavigationEndEvent = navigationEnd)),
    );

    pageLog$: Observable<HttpResponse<any>> = this.lastNavigationEndEvent$.pipe(
        withLatestFrom(this.user.isAuthenticated$),
        filter(([navigationEnd, isAuthenticated]) => isAuthenticated && navigationEnd.urlAfterRedirects.indexOf("login") === -1),
        mergeMap(([navigationEnd]) =>
            this.pageLogService.updatePageLog({ uri: navigationEnd.urlAfterRedirects }).pipe(
                take(1),
                catchError(() => of(null)),
            ),
        ),
    );

    lastNavigationEndEvent: NavigationEnd;

    currentRoute$: Subject<any>;

    constructor(public router: Router, private store: Store, public user: UserService, private pageLogService: PageLogService) {
        this.currentRoute$ = new Subject();
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                this.currentRoute$.next(event.url.substring(event.url.lastIndexOf("/") + 1));
            }
        });
    }

    trackCurrentRoute(): void {
        if (this.lastNavigationEndEvent) {
            gtag("config", "UA-44929342-1", {
                page_path: this.lastNavigationEndEvent.urlAfterRedirects,
            });
        }
    }
}
