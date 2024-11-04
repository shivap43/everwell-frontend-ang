import { Injectable } from "@angular/core";
import { PortalState, Credential } from "@empowered/constants";
import { Dispatch } from "@ngxs-labs/dispatch-decorator";
import { Select } from "@ngxs/store";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { SetUserCredential } from "./user.actions";
import { UserState } from "./user.state";

@Injectable({
    providedIn: "root",
})
export class UserService {
    @Select(UserState) credential$!: Observable<Credential>;

    isAuthenticated$ = this.credential$.pipe(map((credential) => Object.entries(credential).length !== 0));

    portal$ = this.credential$.pipe(
        map((credential) => {
            if ("producerId" in credential && !("memberId" in credential)) {
                return "producer";
            }

            if ("memberId" in credential) {
                return "member";
            }

            if ("adminId" in credential && !("memberId" in credential)) {
                return "admin";
            }

            return undefined;
        }),
        // TODO - Add tap here to set cookie for returning visitors
    );

    portalV2$: Observable<PortalState> = this.credential$.pipe(
        map((credential) => {
            if ("producerId" in credential) {
                return { type: "producer" };
            }

            if ("memberId" in credential && !("adminId" in credential)) {
                return { type: "member", subPortals: ["support"] };
            }

            if ("adminId" in credential) {
                return { type: "admin" };
            }

            return { type: "public" };
        }),
    );

    id$ = this.credential$.pipe(map((user) => user.id));

    username$ = this.credential$.pipe(map((user) => user.username));

    name$ = this.credential$.pipe(map((user) => user.name));

    hasConsented$ = this.credential$.pipe(map((user) => user.consented));

    @Dispatch()
    setUserCredential = (credential: Credential) => new SetUserCredential(credential);
}
