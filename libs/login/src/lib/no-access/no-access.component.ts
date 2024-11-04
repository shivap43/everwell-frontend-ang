import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subject } from "rxjs";
import { StaticUtilService } from "@empowered/ngxs-store";
import { ConfigName } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-no-access",
    templateUrl: "./no-access.component.html",
    styleUrls: ["./no-access.component.scss"],
})
export class NoAccessComponent implements OnInit, OnDestroy {
    private unsubscribe$ = new Subject<void>();
    aflacLoginLink: string;
    constructor(private readonly staticUtil: StaticUtilService) {}

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and function at the time of component loading.
     */
    ngOnInit(): void {
        this.staticUtil
            .cacheConfigValue(ConfigName.MY_AFLAC_LOGIN_LINK)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((aflacLink) => {
                this.aflacLoginLink = aflacLink;
            });
    }
    /**
     * Unsubscribes from observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
