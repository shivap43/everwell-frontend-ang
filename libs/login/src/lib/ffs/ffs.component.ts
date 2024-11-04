import { Component, OnDestroy, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Component({
    selector: "empowered-ffs",
    templateUrl: "./ffs.component.html",
    styleUrls: ["./ffs.component.scss"],
})
export class FfsComponent implements OnInit, OnDestroy {
    url: string;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.ffs.goToFfs"]);
    private readonly unsubscribe$ = new Subject<void>();

    constructor(private readonly route: ActivatedRoute, private readonly language: LanguageService) {}

    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => (this.url = params["link"]));
    }

    goToFFS(): void {
        window.open(this.url, "_self");
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
