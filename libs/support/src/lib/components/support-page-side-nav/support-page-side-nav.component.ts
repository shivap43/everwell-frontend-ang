import { Component, OnDestroy, OnInit } from "@angular/core";
import { Location } from "@angular/common";
import { SharedService } from "@empowered/common-services";
import { map, shareReplay, takeUntil } from "rxjs/operators";
import { Observable, Subject } from "rxjs";
import { Router, ActivatedRoute } from "@angular/router";
import { Permission, Portals } from "@empowered/constants";
/**
 * Support page side nav component used to provide support functionality including Training resources and Download unplugged
 * @param unsubscribe$ is a subject used to unsubscribe the observable
 * @param portals public copy of Portals enum to make it accessible in the template
 * @param portalType$ is observable of type portalType used to get type of portal
 */
@Component({
    selector: "empowered-support-page-side-nav",
    templateUrl: "./support-page-side-nav.component.html",
    styleUrls: ["./support-page-side-nav.component.scss"],
})
export class SupportPageSideNavComponent implements OnInit, OnDestroy {
    private readonly unsubscribe$: Subject<void> = new Subject();
    portals = Portals;
    /**
     * Used to Initialize the portal Type in order to verify the portal is Producer portal or not
     */
    portalType$: Observable<Portals> = this.sharedService.userPortal$.pipe(
        map((portal) => portal.type.toUpperCase() as Portals),
        shareReplay(1),
        takeUntil(this.unsubscribe$),
    );
    permissionEnum = Permission;

    constructor(
        private readonly location: Location,
        private readonly sharedService: SharedService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
    ) {}
    /**
     * Use to check If it is producer portal then it will redirect to trainingResources Component
     */
    ngOnInit(): void {
        this.portalType$.pipe(takeUntil(this.unsubscribe$)).subscribe(() => {
            this.router.navigate(["trainingResources"], {
                relativeTo: this.route,
            });
        });
    }

    /**
     * Use on Back click button/link to go back to previous page
     */
    backClick(): void {
        this.location.back();
    }

    /**
     * Used to unsubscribe the observable if no longer needed
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
