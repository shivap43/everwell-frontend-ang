import { Provider, Injectable } from "@angular/core";
import { Params, RouterStateSnapshot } from "@angular/router";
import { RouterStateSerializer } from "@ngxs/router-plugin";

export interface RouterStateParams {
    url: string;
    params: Params;
    queryParams: Params;
}

// Map the router snapshot to { url, params, queryParams }
@Injectable()
export class CustomRouterStateSerializer implements RouterStateSerializer<RouterStateParams> {
    serialize(routerState: RouterStateSnapshot): RouterStateParams {
        const {
            url,
            root: { queryParams },
        } = routerState;

        let params = {};

        let { root: route } = routerState;
        while (route.firstChild) {
            route = route.firstChild;
            params = { ...params, ...route.params };
        }

        return { url, params, queryParams };
    }
}

export const NGXS_ROUTE_SERIALIZER: Provider = {
    provide: RouterStateSerializer,
    useClass: CustomRouterStateSerializer,
};
