import { Component, OnDestroy, OnInit } from "@angular/core";
import { UserService } from "@empowered/user";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-privacy-policy",
    templateUrl: "./privacy-policy.component.html",
    styleUrls: ["./privacy-policy.component.scss"],
})
export class PrivacyPolicyComponent implements OnInit, OnDestroy {
    isAuthenticated;
    private readonly unsubscribe$: Subject<void> = new Subject();

    constructor(public user: UserService) {}

    ngOnInit(): void {
        this.user.isAuthenticated$.pipe(takeUntil(this.unsubscribe$)).subscribe((res) => {
            this.isAuthenticated = res;
        });
    }

    /**
     * This method destroys all subscriptions.
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
