import { Injectable } from "@angular/core";
import { AccountService, AuthenticationService, StaticService, PermissionsModel } from "@empowered/api";
import { forkJoin, Observable } from "rxjs";
import { filter, map } from "rxjs/operators";
import { ConfigName, GroupAttribute, Configurations, Accounts } from "@empowered/constants";
const CAFETERIA_ELIGIBILITY = "is_eligible_cafeteria_offering";
const IS_ELIGIBLE = "true";
const HQ_ACCOUNT = "is_hq_account";
const TRUE_VALUE = "TRUE";
@Injectable({ providedIn: "root" })
export class AccountsBusinessService {
    constructor(
        private readonly accountService: AccountService,
        private readonly staticService: StaticService,
        private readonly authenticationService: AuthenticationService,
    ) {}
    /**
     * check if group is cafeteria
     * @returns observable of group attribute
     */
    checkForCafeteriaEligibility(): Observable<boolean> {
        return this.accountService.getGroupAttributesByName([CAFETERIA_ELIGIBILITY]).pipe(
            filter((resp) => resp.length > 0),
            map((resp) => resp[0].value === IS_ELIGIBLE),
        );
    }

    checkPermissions(mpGroupId: string): Observable<[Accounts, Configurations[], GroupAttribute[], PermissionsModel[]]> {
        return forkJoin([
            this.accountService.getAccount(mpGroupId),
            this.staticService.getConfigurations(ConfigName.PRODUCER_PERMISSION_TPP_RESTRICT_SHOP, +mpGroupId),
            this.accountService.getGroupAttributesByName([HQ_ACCOUNT], +mpGroupId),
            this.authenticationService.permissions$,
        ]);
    }
}
