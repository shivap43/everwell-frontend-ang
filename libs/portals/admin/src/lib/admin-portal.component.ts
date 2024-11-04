import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { Store } from "@ngxs/store";
import { SetPortal, SetRouteAfterLogin, SetRegex, SetURLNavigationAfterLogin, UtilService } from "@empowered/ngxs-store";
import { Portals } from "@empowered/constants";

/* eslint-disable @angular-eslint/use-component-view-encapsulation */
@Component({
    selector: "empowered-admin-portal",
    templateUrl: "./admin-portal.component.html",
    styleUrls: ["./admin-portal.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class AdminPortalComponent implements OnInit {
    @HostBinding("class") classes = "admin-portal";

    constructor(private readonly store: Store, private readonly utilService: UtilService) {}

    ngOnInit(): void {
        this.store.dispatch([
            new SetPortal(Portals.ADMIN),
            new SetRouteAfterLogin("/admin"),
            new SetURLNavigationAfterLogin("/admin/accountList"),
        ]);
        if (Object.keys(this.store["_stateStream"].value.user).length > 0) {
            this.store.dispatch(new SetRegex());
        }
    }
    callResetAppFocus(): void {
        this.utilService.resetAppFocus();
    }
}
