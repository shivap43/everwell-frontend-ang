import { Injectable } from "@angular/core";
import { Observable, iif, defer } from "rxjs";
import { Accounts } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { filter, map, shareReplay, distinctUntilChanged, switchMap } from "rxjs/operators";
import { PathState, SharedState } from "@empowered/ngxs-store";
import { SharedService } from "./shared.service";

const PORTAL_PUBLIC = "public";
const PORTAL_MEMBER = "member";
const PATH_VARIABLE_MP_GROUP = "mpGroupId";

@Injectable({
    providedIn: "root",
})
export class MPGroupAccountService {
    /**
     * Emits the currently selected MP Group Account. In the case of a member, this will emit once on login,
     * and the Account should never change; in the case of a Producer or Admin this will emit whenever the
     * MP-Group ID in the path changes.
     */
    mpGroupAccount$: Observable<Accounts> = this.shared.userPortal$.pipe(
        filter((portal) => Boolean(portal) && portal.type !== PORTAL_PUBLIC),
        switchMap((portal) =>
            iif(
                () => portal.type === PORTAL_MEMBER,
                defer(() =>
                    this.store.select(SharedState.getState).pipe(
                        filter((state) => state !== undefined && state !== null),
                        map((state) => state.memberMPGroupAccount),
                    ),
                ),
                defer(() =>
                    this.store.select(PathState.getPathParameter(PATH_VARIABLE_MP_GROUP)).pipe(map((account) => account as Accounts)),
                ),
            ),
        ),
        distinctUntilChanged(
            (prevAccount, currAccount) =>
                (!prevAccount && !currAccount) || (prevAccount && currAccount && prevAccount.id === currAccount.id),
        ),
        shareReplay(1),
    );

    constructor(private readonly store: Store, private readonly shared: SharedService) {}
}
