import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Store } from "@ngxs/store";
import { RegistrationState } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-account-messages",
    templateUrl: "./account-messages.component.html",
    styleUrls: ["./account-messages.component.scss"],
})
export class AccountMessagesComponent implements OnInit, OnDestroy {
    accountMessage;
    email;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.returnToLogin",
        "primary.portal.common.tryAgain",
    ]);
    private readonly unsubscribe$ = new Subject<void>();

    constructor(private readonly router: ActivatedRoute, private readonly store: Store, private readonly language: LanguageService) {}

    ngOnInit(): void {
        this.router.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params["id"] === "invalid") {
                this.accountMessage = "invalid";
            } else if (params["id"] === "success") {
                this.accountMessage = "success";
            } else {
                this.accountMessage = "exists";
            }
        });
        this.email = this.store.selectSnapshot(RegistrationState.email);
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
