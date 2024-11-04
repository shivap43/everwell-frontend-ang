import { Action, Selector, State, StateContext, createSelector, Store } from "@ngxs/store";
import {
    SetPortal,
    SetRouteAfterLogin,
    SetIncompleteRegistrationAlert,
    SetRegex,
    SetIsSubOrdinates,
    SetConfig,
    SetPermissions,
    FetchConfigs,
    SetIdToCloseSEP,
    SetURLNavigationAfterLogin,
    SetFileServerBasePath,
    SetQueryParams,
    SetPrivacyForEnroller,
} from "./shared.actions";
import { SharedStateModel, RegexDataType, FileServerBasePath, QueryParam } from "./shared.model";
import { Observable } from "rxjs";
import { StaticService, AccountService, AuthenticationService } from "@empowered/api";
import { Configurations, GET_CREDENTIAL_TYPE, Accounts } from "@empowered/constants";
import { map, tap, retry } from "rxjs/operators";
import { ResetState, SetUserCredential } from "@empowered/user/state/actions";
import { Injectable } from "@angular/core";

const defaultState: SharedStateModel = {
    configs: [],
    permissions: null,
    regex: null,
    queryParams: null,
};

@State<SharedStateModel>({
    name: "core",
    defaults: defaultState,
})
@Injectable()
export class SharedState {
    validationRegex: any;

    constructor(
        private staticService: StaticService,
        private accountService: AccountService,
        private authService: AuthenticationService,
        private store: Store,
    ) {}

    @Selector()
    static portal(state: SharedStateModel): string {
        return state.portal;
    }

    @Selector()
    static routeAfterLogin(state: SharedStateModel): string {
        return state.routeAfterLogin;
    }
    /**
     * Selector basePath: for returning value of file server base-path.
     * @param: state- the current state value
     * @returns: value of file server base-path
     */
    @Selector()
    static basePath(state: FileServerBasePath): string {
        return state.basePath;
    }
    @Selector()
    static hasSubOrdinate(state: SharedStateModel): boolean {
        return state.hasSubOrdinate;
    }

    @Selector()
    static showAlert(state: SharedStateModel): boolean {
        return state.showAlert;
    }
    @Selector()
    static regex(state: SharedStateModel): RegexDataType {
        return state.regex;
    }

    @Selector()
    static getState(state: SharedStateModel): SharedStateModel {
        return state;
    }
    @Selector()
    static getQleIdToCloseSEP(state: SharedStateModel): any {
        return state.qleIdToCloseSEP;
    }
    @Selector()
    static getURLNavigationAfterLogin(state: SharedStateModel): string {
        return state.urlToNavigateAfterLogin;
    }
    /**
     * Selector getQueryParams for returning query params
     * @param state the current state value
     * @returns the query params
     */
    @Selector()
    static getQueryParams(state: SharedStateModel): QueryParam {
        return state.queryParams;
    }
    static getConfig(configName: string): (state: SharedStateModel) => Configurations {
        return createSelector([SharedState], (state: SharedStateModel) => {
            if (state && state.configs) {
                const foundConfig = state.configs.find((config) => config.configName === configName);
                return foundConfig ? foundConfig.config : undefined;
            }
            return undefined;
        });
    }

    /**
     * Fetches configs from store
     * @param configName Config names to fetch from store
     * @returns configurations fetched from the store
     */
    static getConfigs(configName: string[]): (state: SharedStateModel) => Configurations[] {
        return createSelector([SharedState], (state: SharedStateModel) => {
            const foundConfigs: Configurations[] = [];
            if (state && state.configs) {
                configName.forEach((config) => {
                    foundConfigs.push(state.configs.find((configs) => configs.configName === config).config);
                });
                return foundConfigs.length === configName.length ? foundConfigs : undefined;
            }
            return undefined;
        });
    }
    /**
     * Selector getPrivacyForEnroller for returning isEnroller value
     * @param state the current state value
     * @returns the true or false value
     */
    @Selector()
    static getPrivacyForEnroller(state: SharedStateModel): boolean {
        return state.isEnroller;
    }

    static hasPermission(permission: string): (state: SharedStateModel) => boolean {
        return createSelector(
            [SharedState],
            (state: SharedStateModel) => state && state.permissions && state.permissions.indexOf(permission) !== -1,
        );
    }

    @Action(ResetState)
    resetState(context: StateContext<SharedStateModel>): void {
        context.setState(defaultState);
    }

    @Action(SetPortal)
    setPortal(context: StateContext<SharedStateModel>, action: SetPortal): void {
        const state = context.getState();
        context.setState({
            ...state,
            portal: action.portal,
        });
    }

    @Action(SetRouteAfterLogin)
    setRouteAfterLogin(context: StateContext<SharedStateModel>, action: SetRouteAfterLogin): void {
        const state = context.getState();
        context.setState({
            ...state,
            routeAfterLogin: action.routeAfterLogin,
        });
    }
    /**
     * Action setFileServerBasePath : to set state with file server path in basePath.
     * @param: SetFileServerBasePath - action class
     */
    @Action(SetFileServerBasePath)
    setFileServerBasePath(context: StateContext<FileServerBasePath>, action: SetFileServerBasePath): void {
        const state = context.getState();
        context.setState({
            ...state,
            basePath: action.basePath,
        });
    }
    @Action(SetURLNavigationAfterLogin)
    setURLNavigationAfterLogin(context: StateContext<SharedStateModel>, action: SetURLNavigationAfterLogin): void {
        const state = context.getState();
        context.setState({
            ...state,
            urlToNavigateAfterLogin: action.urlToNavigateAfterLogin,
        });
    }
    @Action(SetIncompleteRegistrationAlert)
    SetIncompleteRegistrationAlert(context: StateContext<SharedStateModel>, saveError: boolean): void {
        const state = context.getState();
        context.setState({
            ...state,
            showAlert: saveError,
        });
    }

    @Action(SetRegex)
    SetRegex(context: StateContext<SharedStateModel>): Observable<RegexDataType> {
        return this.staticService.getRegex("portal.validation.*").pipe(
            map((Response) => Response),
            tap<any>((regex) => {
                this.validationRegex = regex;
                context.setState({
                    ...context.getState(),
                    regex: regex.reduce((obj, item) => {
                        obj[item.name.substring(item.name.lastIndexOf(".") + 1, item.name.length).toUpperCase()] = item.value;
                        return obj;
                    }, {}),
                });
            }),
        );
    }
    @Action(SetIsSubOrdinates)
    setIsSubOrdinates(context: StateContext<SharedStateModel>, action: SetIsSubOrdinates): void {
        const state = context.getState();
        context.setState({
            ...state,
            hasSubOrdinate: action.subordinate,
        });
    }

    @Action(SetUserCredential)
    setMemberMPGroupAccount(context: StateContext<SharedStateModel>, { credential }: SetUserCredential): Observable<Accounts> | void {
        if (credential && Object.keys(credential).length && GET_CREDENTIAL_TYPE(credential) === "MEMBER") {
            return this.accountService.getAccount().pipe(
                tap((account) =>
                    context.patchState({
                        memberMPGroupAccount: account,
                    }),
                ),
            );
        }
    }

    @Action(SetConfig)
    setConfig(context: StateContext<SharedStateModel>, { config }: SetConfig): void {
        if (config) {
            context.patchState({
                configs: [
                    ...context.getState().configs.filter((stateConfigs) => stateConfigs.configName !== config.name),
                    { config: config, configName: config.name },
                ],
            });
        }
    }

    @Action(FetchConfigs)
    fetchConfigs(context: StateContext<SharedStateModel>, { configName }: FetchConfigs): Observable<Configurations[]> | void {
        // Check if multiple configs are passed as a single string
        const configs = configName?.split(",");
        const previousConfigs = context.getState().configs.map((config) => config.configName);
        const configsToFetch = configs?.filter((config) => !previousConfigs.includes(config));
        if (configsToFetch?.length !== 0) {
            // Add a lock so duplicate requests are not made
            context.patchState({ configs: [...context.getState().configs, ...configsToFetch.map((config) => ({ configName: config }))] });
            const configNames = configsToFetch.toString();
            return this.staticService.getConfigurations(configNames).pipe(
                retry(3),
                tap(
                    // On success, get the config from the list and add it to the state
                    (resp) =>
                        context.patchState({
                            configs:
                                // If the config is in the payload, get all the other configs from context and load in the new one
                                resp.every((config) => configNames.includes(config.name))
                                    ? [
                                          ...context.getState().configs.filter((config) => resp.every((c) => c.name !== config.configName)),
                                          ...resp.map((config) => ({
                                              configName: config.name,
                                              config: config,
                                          })),
                                      ]
                                    : // If the config wasn't there, just reassign the current configs
                                      context.getState().configs,
                        }),
                    // On error, remove the lock from the requested config
                    () =>
                        context.patchState({
                            configs: context.getState().configs.filter((config) => configsToFetch.every((c) => c !== config.configName)),
                        }),
                ),
            );
        }
    }

    /**
     * Whenever the user credential is set, that means that they are authenticated and we
     * are able to fetch permissions.
     * @param context ShareStateModel
     */
    @Action(SetUserCredential)
    setPermissionsFromLogin(context: StateContext<SharedStateModel>): void {
        this.store.dispatch(new SetPermissions());
    }

    /**
     * Get the permissions if they haven't yet
     * @param context SharedStateModel
     */
    @Action(SetPermissions)
    setPermissions(context: StateContext<SharedStateModel>, { forceOverride }: SetPermissions): Observable<string[]> | void {
        if (!context.getState().permissions || forceOverride) {
            return this.authService.getPermissions().pipe(tap((permissions) => context.patchState({ permissions: permissions })));
        }
    }

    @Action(SetIdToCloseSEP)
    setIdToCloseSEP(context: StateContext<SharedStateModel>, id: number): void {
        const state = context.getState();
        context.setState({
            ...state,
            qleIdToCloseSEP: id,
        });
    }

    /**
     * To set the value in query params
     * @param context has the context
     * @param action has the query params to set
     */
    @Action(SetQueryParams)
    setQueryParams(context: StateContext<SharedStateModel>, action: SetQueryParams): void {
        const state = context.getState();
        context.setState({
            ...state,
            queryParams: action.queryParams,
        });
    }
    /**
     * To set the value in isEnroller
     * @param context has the context
     * @param action has the isEnroller params to set
     */
    @Action(SetPrivacyForEnroller)
    SetPrivacyForEnroller(context: StateContext<SharedStateModel>, action: { isEnroller: boolean }): void {
        context.patchState({
            isEnroller: action.isEnroller,
        });
    }
}
