import { HTTP_INTERCEPTORS, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Inject, Injectable, Optional, Provider } from "@angular/core";
import { RouterState } from "@ngxs/router-plugin";
import { Select } from "@ngxs/store";
import { combineLatest, Observable } from "rxjs";
import { distinctUntilChanged, map, mergeMap, pluck } from "rxjs/operators";
import { Configuration } from "../services/configuration";
import { BASE_PATH } from "../services/variables";

@Injectable({ providedIn: "root" })
export class MpGroupInterceptor implements HttpInterceptor {
    configuration = new Configuration();
    @Select(RouterState) router$!: Observable<any>;
    /**
     * First, we listen for route changes that include an mpGroupId in the path params.
     */
    mpGroupId$: Observable<number> = this.router$.pipe(pluck("state", "params", "mpGroupId"), distinctUntilChanged());

    accountId$: Observable<number> = this.router$.pipe(pluck("state", "params", "accountId"), distinctUntilChanged());

    prospectId$: Observable<number> = this.router$.pipe(pluck("state", "params", "prospectId"), distinctUntilChanged());

    /**
     * Finally, we combine all emissions and filter based on user context.
     * Account context > User context
     * If neither is defined, we default to empty string value.
     */
    mpGroup$: Observable<string> = combineLatest([this.mpGroupId$, this.accountId$, this.prospectId$]).pipe(
        map(([mpgId, aId, pId]) => String(mpgId || aId || pId || "")),
    );

    private basePath = "/api";

    constructor(@Optional() configuration: Configuration, @Optional() @Inject(BASE_PATH) basePath: string) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Select API calls that have an empty MP-Group header
        // NOTE: This will ONLY override empty MP-Group headers
        if (req.url.startsWith(this.configuration.basePath ?? "") && req.headers.has("MP-Group") && req.headers.get("MP-Group") === "") {
            /** checking for a groupId value inside the user's credential (i.e. MMP user) from session storage
                instead of depending on user lib **/
            const userInfo = sessionStorage.getItem("userInfo");
            const parsedUserInfo = userInfo ? JSON.parse(userInfo) : null;
            const userData = sessionStorage.getItem("user");
            const parsedUserData = userData ? JSON.parse(userData) : null;

            return this.mpGroup$.pipe(
                mergeMap((mpGroup) => {
                    if (!mpGroup && (parsedUserInfo?.groupId || parsedUserData?.groupId)) {
                        mpGroup = parsedUserInfo?.groupId || parsedUserData?.groupId;
                    }
                    const headers = mpGroup
                        ? req.headers.set("MP-Group", mpGroup ? mpGroup.toString() : "")
                        : req.headers.delete("MP-Group");
                    const modified = req.clone({ headers });

                    return next.handle(modified);
                }),
            );
        }

        return next.handle(req);
    }
}

export const MPGROUP_INTERCEPTOR: Provider = {
    provide: HTTP_INTERCEPTORS,
    useClass: MpGroupInterceptor,
    multi: true,
};
