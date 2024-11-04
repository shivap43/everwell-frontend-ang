import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: "mon-forgot-username-username-sent",
    templateUrl: "./username-sent.component.html",
    styleUrls: ["./username-sent.component.scss"],
})
export class UsernameSentComponent implements OnInit, OnDestroy {
    verifyMethod;
    contact;
    backRoute;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.tryAgain",
        "primary.portal.common.returnToLogin",
        "primary.portal.common.back",
        "primary.portal.forgotUsername.phone",
    ]);
    private readonly unsubscribe$ = new Subject<void>();

    constructor(private readonly router: ActivatedRoute, private readonly language: LanguageService) {}

    ngOnInit(): void {
        this.contact = localStorage.getItem("contact");
        this.router.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params["id"] === "email") {
                this.verifyMethod = "email";
            } else if (params["id"] === "phone") {
                this.verifyMethod = "phone";
            } else {
                this.verifyMethod = "invalid";
            }
            this.backRoute = "../../verifyMethod/" + params["id"];
        });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
