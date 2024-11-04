import { AccountService } from "@empowered/api";
import { StaticUtilService, checkIfAbleToAccessModuleInHQAccount } from "@empowered/ngxs-store";

import { Injectable } from "@angular/core";
import { Observable, of, iif, combineLatest, defer } from "rxjs";
import { map, filter, switchMapTo } from "rxjs/operators";

const CONFIG_ENABLE_TPI_RESTRICTIONS = "group.aflac_hq.restrictions";
@Injectable({
    providedIn: "root",
})
export class TPIRestrictionsForHQAccountsService {
    constructor(private readonly staticUtil: StaticUtilService, private readonly accountService: AccountService) {}
    /**
     * Checks if a TPI-restricted module can be accessed inside a Aflac HQ account
     * based on whether the feature toggle config (for TPI restrictions) is enabled
     * and on the required permission (optional), the required permission (optional).
     * In the absence of the permission and/or config, access depends solely on whether the account is HQ.
     * @param requiredPermission permission required to access module (optional)
     * @param requiredConfig config required to access module (optional)
     * @param groupId id of the group (optional)
     * @returns observable of whether the module can be accessed
     */
    canAccessTPIRestrictedModuleInHQAccount(requiredPermission?: string, requiredConfig?: string, groupId?: number): Observable<boolean> {
        return combineLatest(
            checkIfAbleToAccessModuleInHQAccount(this.staticUtil, this.accountService, requiredPermission || "", false, groupId),
            this.staticUtil.cacheConfigEnabled(CONFIG_ENABLE_TPI_RESTRICTIONS),
            // If a required config is passed in check if it is enabled
            iif(
                () => !!requiredConfig,
                defer(() => this.staticUtil.cacheConfigEnabled(requiredConfig)),
                of(true),
            ),
        ).pipe(
            // If the toggle config is disabled, do not need make the other checks; the module is always accessible
            map(([canAccessModuleInHqAccount, tpiRestrictionsEnabled, requiredConfigEnabled]) =>
                tpiRestrictionsEnabled ? requiredConfigEnabled && canAccessModuleInHqAccount : true,
            ),
        );
    }

    /**
     * Returns info about whether member profile can be accessed by a member/producer
     * @param memberEditProfileConfig config that controls if a member can edit profile
     * @param producerEditProfilePermission permission that controls if a producer can edit profile
     * @param producerPartialEditProfilePermission permission that controls if a producer can partially edit profile
     * @returns observable of an array of whether the user has the permissions, or the configs passed in as parameters enabled.
     */
    canEditMemberProfile(
        memberEditProfileConfig: string,
        producerEditProfilePermission: string,
        producerPartialEditProfilePermission: string,
    ): Observable<[boolean, boolean, boolean]> {
        return this.canAccessTPIRestrictedModuleInHQAccount().pipe(
            filter((canAccess) => !canAccess),
            switchMapTo(
                combineLatest(
                    this.staticUtil.cacheConfigEnabled(memberEditProfileConfig),
                    this.staticUtil.hasPermission(producerEditProfilePermission),
                    this.staticUtil.hasPermission(producerPartialEditProfilePermission),
                ),
            ),
        );
    }
}
