import { Injectable } from "@angular/core";
import { RouterState, RouterStateModel } from "@ngxs/router-plugin";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { PortalName } from "./common-selectors.model";

@Injectable({
    providedIn: "root",
})
export class CommonSelectorsService {
    @Select(RouterState) router$: Observable<RouterStateModel>;

    @Select(RouterState.url) url$!: Observable<string>;

    // Search the activated url path segments for "admin", "member", or "producer" and output if found
    portal$: Observable<PortalName> = this.url$.pipe(
        map<string, PortalName>((url) => url.match("admin|member|producer").shift() as PortalName)
    );
}
