import { Component, ViewChild, Input, Output, EventEmitter, OnDestroy, OnInit } from "@angular/core";
import { MediaMatcher } from "@angular/cdk/layout";
import { MatSidenav } from "@angular/material/sidenav";
import { MonSideNavList } from "@empowered/api";
import { AppSettings } from "@empowered/constants";
import { filter, map } from "rxjs/operators";
import { Subscription, Observable } from "rxjs";
import { EmployeeData } from "@empowered/constants";
import { BreakPointUtilService } from "@empowered/ngxs-store";

@Component({
    selector: "empowered-generic-sidenav",
    templateUrl: "./generic-sidenav.component.html",
    styleUrls: ["./generic-sidenav.component.scss"],
})
export class GenericSidenavComponent implements OnInit, OnDestroy {
    @ViewChild("dashboardSideNavInput", { static: true }) dashboardSideNav: MatSidenav;
    private readonly _mobileQueryListener: () => void;
    dashBoardSideNavLogo;
    dashBoardSideNavColor;
    mobileQuery: MediaQueryList;
    BREAKPOINT_SIZES = AppSettings.BREAKPOINT_SIZES;
    subscriptions: Subscription[] = [];
    @Input() navigationOptions: MonSideNavList[];
    @Input() enableBackToPreviousListing: boolean;
    @Input() previousListName: string;
    @Input() employeeData: EmployeeData;
    @Output() optionSelectedOutput: EventEmitter<any> = new EventEmitter<any>();
    @Input() brandingColor$: Observable<string>;
    constructor(media: MediaMatcher, private readonly breakPointUtilService: BreakPointUtilService) {
        this.dashBoardSideNavLogo = "assets/images/logo.png";
        this.dashBoardSideNavColor = "#00abb9";
        this.mobileQuery = media.matchMedia("(max-width: 992px)");
    }
    /**
     * This function will handle side nav visibility based on device size.
     * @returns void
     */
    ngOnInit(): void {
        this.subscriptions.push(
            this.breakPointUtilService.breakpointObserver$
                .pipe(
                    filter((res) => res.size === this.BREAKPOINT_SIZES.LG || res.size === this.BREAKPOINT_SIZES.XL),
                    map((resp) => this.dashboardSideNav.open()),
                )
                .subscribe(),
        );
    }
    navitageToSelectedOption(event: any): void {
        this.optionSelectedOutput.emit(event);
    }
    /**
     * destroying subscriptions
     */
    ngOnDestroy(): void {
        this.subscriptions.forEach((subscription) => {
            subscription.unsubscribe();
        });
    }
}
