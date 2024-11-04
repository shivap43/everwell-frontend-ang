import { Injectable } from "@angular/core";
import { Store } from "@ngxs/store";
import { Configurations } from "@empowered/constants";
import { Observable, of, combineLatest, race } from "rxjs";
import { filter, map, distinctUntilChanged, delay, retry, switchMap } from "rxjs/operators";
import { SharedState } from "../shared/shared.state";
import { FetchConfigs } from "../shared/shared.actions";
import { StaticService } from "@empowered/api";
import { BreakPointUtilService } from "../state-services/break-point-util.service";
import { FetchLanguage, LanguageState } from "@empowered/language";

const OBSERVABLE_TIMEOUT = 5000;
const RETRY_COUNT = 5;
@Injectable({
    providedIn: "root",
})
export class StaticUtilService {
    constructor(
        private readonly store: Store,
        private readonly breakPointUtilService: BreakPointUtilService,
        private readonly staticService: StaticService,
    ) {}

    /**
     * @param config Configuration of type boolean against which to determine if its enabled
     * @returns boolean value signifying if its enabled or disabled
     */
    isConfigEnabled(config: Configurations): boolean {
        return config ? config.dataType.toLowerCase() === "boolean" && config.value.toLowerCase() === "true" : false;
    }

    cacheConfigEnabled(configName: string): Observable<boolean> {
        const configIsEnabled: (config: Configurations) => boolean = (config) =>
            config.dataType?.toLowerCase() === "boolean" && config.value.toLowerCase() === "true";

        return this.getConfig(configName).pipe(
            // If config is found, map it to boolean, otherwise false
            map((configOrFalse) => {
                if (configOrFalse) {
                    return configIsEnabled(configOrFalse as Configurations);
                }
                // Return false if not a config
                return false;
            }),
        );
    }

    cacheConfigValue(configName: string): Observable<string> {
        return this.getConfig(configName).pipe(
            // If config is found, map it to string, otherwise false
            map((configOrFalse) => {
                if (configOrFalse) {
                    return (configOrFalse as Configurations).value;
                }
                // Return empty if not a config
                return null;
            }),
        );
    }

    /**
     * Checks to see if the user has a certain permission, defaults to false if a response is not retrieved.
     * @param permission The permission to check for
     */
    hasPermission(permission: string): Observable<boolean> {
        return race(
            // Check the store to see if a user has permission
            this.store.select(SharedState.hasPermission(permission)).pipe(
                // Do not emit null values, this breaks the permission guard
                filter((hasPermission) => hasPermission !== undefined && hasPermission != null),
            ),
            // If there is no response within the time limit, default to false
            of(false).pipe(
                delay(OBSERVABLE_TIMEOUT),
                // Switch over to the store's stream in case the request eventually succeeds
                switchMap((state) => this.store.select(SharedState.hasPermission(permission))),
            ),
        );
    }

    /**
     * Checks to make sure the user has one of the listed permissions
     * @param permissions list of permissions to check
     */
    hasOnePermission(permissions: string[]): Observable<boolean> {
        return combineLatest(permissions.map((permission) => this.hasPermission(permission))).pipe(
            map((hasPermissions) => hasPermissions.reduce((accumulator, value) => accumulator || value, false)),
        );
    }

    /**
     * Checks to make sure the user has all of the listed permissions
     * @param permissions list of permissions to check
     */
    hasAllPermission(permissions: string[]): Observable<boolean> {
        return combineLatest(permissions.map((permission) => this.hasPermission(permission))).pipe(
            map((hasPermissions) => hasPermissions.reduce((accumulator, value) => accumulator && value, true)),
        );
    }

    /**
     * Get the config, but fail over to null if the timeout limit is met.
     * Keep the stream open to resolve timeout issues
     * @param configName the name of the config
     */
    private getConfig(configName: string): Observable<Configurations> {
        return race(
            // Dispatch the action to load the config
            this.store.dispatch(new FetchConfigs(configName)).pipe(
                // Retry in case of failure
                retry(RETRY_COUNT),
                // Switch over to the store's stream
                switchMap((state) => this.store.select(SharedState.getConfig(configName))),
                // Only emit if there is a config
                filter((configuration) => Boolean(configuration)),
            ),
            // Fail-over stream with initial result of undefined from state
            of(null).pipe(
                // Give the config a chance to load
                delay(OBSERVABLE_TIMEOUT),
                // Switch over to the store's stream in case the request eventually succeeds
                switchMap((state) => this.store.select(SharedState.getConfig(configName))),
            ),
        ).pipe(
            // Prevent duplicate emissions
            distinctUntilChanged((prev, curr) => prev && curr && prev.value === curr.value),
        );
    }

    /**
     * @param configNames - Array of config names to be fetched from the store/database
     * @returns Configurations fetched against the configNames
     */
    cacheConfigs(configNames: string[]): Observable<Configurations[]> {
        return race(
            this.store.dispatch(new FetchConfigs(configNames.toString())).pipe(
                // Retry in case of failure
                retry(RETRY_COUNT),
                // Switch over to the store's stream
                switchMap(() => this.store.select(SharedState.getConfigs(configNames))),
                // Only emit if there is a config
                filter((configuration) => Boolean(configuration)),
            ),
            of(null).pipe(
                // Give the config a chance to load
                delay(OBSERVABLE_TIMEOUT),
                // Switch over to the store's stream in case the request eventually succeeds
                switchMap(() => this.store.select(SharedState.getConfigs(configNames))),
                // Only emit if there is a config
                filter((configuration) => Boolean(configuration)),
            ),
        ).pipe(
            // Prevent duplicate emissions
            distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
        );
    }

    /**
     * Used to fetch group specific configs from the database and also preserves order of the returned configs
     * but doesn't store them in store
     * @param configNames Config to fetch from the database
     * @param mpGroup group id of the group
     * @returns Observable of an array of configurations
     */
    fetchConfigs(configNames: string[], mpGroup?: number): Observable<Configurations[]> {
        return this.staticService
            .getConfigurations(configNames.join(","), mpGroup ? mpGroup : undefined)
            .pipe(map((configs) => configs.sort((a, b) => configNames.indexOf(a.name) - configNames.indexOf(b.name))));
    }

    /**
     * Combining system variables with the tag name and is fired off when the screen width reaches a new
     * breakpoint size
     * @param tagName language tag
     * @returns gets language from store using the fetchValueForTagName selector
     */
    getLanguage(tagName: string): Observable<string> {
        return this.breakPointUtilService.breakpointObserver$.pipe(
            map((state) => state.size),
            distinctUntilChanged(),
            switchMap((state) => this.store.select(LanguageState.fetchValueForTagName(tagName, state))),
        );
    }

    /**
     * Dispatches an action to make an api call to retrieve a set of languages
     * @param tagName language tag
     * @returns requests new language every time the system changes
     */
    dispatchLanguage(tagName: string): Observable<unknown> {
        return this.breakPointUtilService.breakpointObserver$.pipe(
            map((state) => state.size),
            distinctUntilChanged(),
            switchMap((state) => this.store.dispatch(new FetchLanguage(tagName, undefined, undefined, undefined, state))),
        );
    }
}
