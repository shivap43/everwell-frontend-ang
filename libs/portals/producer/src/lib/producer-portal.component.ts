import { Component, HostBinding, OnInit, ViewEncapsulation } from "@angular/core";
import { SetPortal, SetRouteAfterLogin, SetRegex, SetURLNavigationAfterLogin, UtilService } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { Portals } from "@empowered/constants";

/* eslint-disable @angular-eslint/use-component-view-encapsulation */
@Component({
    selector: "empowered-producer-portal",
    templateUrl: "./producer-portal.component.html",
    styleUrls: ["./producer-portal.component.scss"],
    encapsulation: ViewEncapsulation.None,
})
export class ProducerPortalComponent implements OnInit {
    @HostBinding("class") classes = "producer-portal";

    constructor(private readonly store: Store, private readonly utilService: UtilService) {}

    ngOnInit(): void {
        this.store.dispatch([
            new SetPortal(Portals.PRODUCER),
            new SetRouteAfterLogin("/producer"),
            new SetURLNavigationAfterLogin("/producer/overview"),
        ]);
        if (Object.keys(this.store["_stateStream"].value.user).length > 0) {
            this.store.dispatch(new SetRegex());
        }
    }
    callResetAppFocus(): void {
        this.utilService.resetAppFocus();
    }
}
