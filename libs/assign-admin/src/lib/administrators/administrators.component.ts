import { switchMap, map, catchError } from "rxjs/operators";
import { LanguageService } from "@empowered/language";
import { Component, OnInit } from "@angular/core";
import { Observable, of, iif } from "rxjs";
import { NotificationService } from "@empowered/api";
import { StaticUtilService } from "@empowered/ngxs-store";

const CONFIG_EMAIL_TRACKING_ENABLED = "broker.group_portal.audit_history_tab.email_sms";
@Component({
    selector: "empowered-administrators",
    templateUrl: "./administrators.component.html",
    styleUrls: ["./administrators.component.scss"],
})
export class AdministratorsComponent implements OnInit {
    languageStrings: Record<string, string>;
    showEmailsAndTexts$: Observable<boolean>;
    constructor(
        private readonly language: LanguageService,
        private readonly staticUtil: StaticUtilService,
        private readonly notifications: NotificationService,
    ) {}

    /**
     * Initializes language and config
     * @returns nothing
     */
    ngOnInit(): void {
        this.showEmailsAndTexts$ = this.staticUtil.cacheConfigEnabled(CONFIG_EMAIL_TRACKING_ENABLED).pipe(
            switchMap((configEnabled) =>
                iif(() => configEnabled, this.notifications.getEmailSmsAudit().pipe(catchError(() => of([]))), of(undefined)),
            ),
            map((emailsAndTexts) => emailsAndTexts && emailsAndTexts.length > 0),
        );
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.administrators.tab.title.administratorList",
            "primary.portal.emailTracking.emailTextAudit",
            "primary.portal.emailTracking.table.searchHint.admin",
            "primary.portal.administrators.header",
        ]);
    }
}
