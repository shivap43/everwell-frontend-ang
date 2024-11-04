import { takeUntil } from "rxjs/operators";
import { Subject, combineLatest } from "rxjs";

import { Component, OnInit, OnDestroy } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { AccountService } from "@empowered/api";
import { TpiSSOModel } from "@empowered/constants";
import { TPIState, StaticUtilService } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";

const SUPPORT_EMAIL_CONFIG = "general.partner.support_email";
const SUPPORT_PHONE_CONFIG = "support.phone_number";
const PRIMARY_PRODUCER = "PRIMARY_PRODUCER";

@Component({
    selector: "empowered-lnl-footer",
    templateUrl: "./lnl-footer.component.html",
    styleUrls: ["./lnl-footer.component.scss"],
})
export class LnlFooterComponent implements OnInit, OnDestroy {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.lnlFooter.contentRight",
        "primary.portal.lnlFooter.privacyPolicy",
        "primary.portal.lnlFooter.termsUse",
        "primary.portal.lnlFooter.emailLink",
        "primary.portal.lnlFooter.contact",
        "primary.portal.lnlFooter.contact.number",
        "primary.portal.lnlFooter.contactInfo",
        "primary.portal.consentStatement.title",
    ]);
    supportMailID: string;
    phoneNumber: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    primaryProducerEmail: string;
    primaryProducerMobile: string;
    primaryProducerFirstName: string;
    primaryProducerLastName: string;
    primaryProducerContactInfo: string;
    ssoAuthData: TpiSSOModel;

    constructor(
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly store: Store,
    ) {}

    /**
     * Life cycle hook to initialize the component
     */
    ngOnInit(): void {
        this.ssoAuthData = this.store.selectSnapshot(TPIState.tpiSsoDetail);
        this.getPrimaryProducer();
        combineLatest([
            this.staticUtilService.cacheConfigValue(SUPPORT_EMAIL_CONFIG),
            this.staticUtilService.cacheConfigValue(SUPPORT_PHONE_CONFIG),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([email, phoneNumber]) => {
                this.supportMailID = email;
                this.phoneNumber = phoneNumber;
            });
    }
    /**
     * Function to get the primary producer information
     */
    getPrimaryProducer(): void {
        this.accountService
            .getAccountProducers(this.ssoAuthData.user.groupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((producer) => {
                const primaryProducer = producer.filter((primary) => primary.role === PRIMARY_PRODUCER)[0].producer;
                this.primaryProducerMobile = primaryProducer.phoneNumber;
                this.primaryProducerFirstName = primaryProducer.name.firstName;
                this.primaryProducerLastName = primaryProducer.name.lastName;
                this.primaryProducerEmail = primaryProducer.emailAddress;
                this.primaryProducerContactInfo = this.languageStrings["primary.portal.lnlFooter.contactInfo"]
                    .replace("##producerFName##", this.primaryProducerFirstName)
                    .replace("##producerLName##", this.primaryProducerLastName)
                    .replace("##phoneNumber##", this.primaryProducerMobile)
                    .replace("##emailAddress##", this.primaryProducerEmail);
            });
    }
    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
