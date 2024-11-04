import { Component } from "@angular/core";
import { LanguageService } from "@empowered/language";

@Component({
    selector: "empowered-census-statement-modal",
    templateUrl: "./census-statement-modal.component.html",
    styleUrls: ["./census-statement-modal.component.scss"],
})
export class CensusStatementModalComponent {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.enrollment.review.verify",
        "primary.portal.enrollment.review.confirmidentiy",
        "primary.portal.enrollment.review.firstname",
        "primary.portal.common.requiredField",
        "primary.portal.enrollment.review.lastname",
        "primary.portal.enrollment.review.birthdate",
        "primary.portal.enrollment.review.email",
        "primary.portal.enrollment.review.agree",
        "primary.portal.enrollment.review.consent",
        "primary.portal.review.selectionrequired",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.common.iAgree",
        "primary.portal.headset.consent.update",
        "primary.portal.headset.consent.service",
        "primary.portal.headset.consent.record",
        "primary.portal.headset.consent.paper",
        "primary.portal.headset.consent.agree",
        "primary.portal.headset.communication",
        "primary.portal.consent.rights",
        "primary.portal.headset.introduction",
        "primary.portal.headset.consent.info",
        "primary.portal.headset.consent.electronic",
        "primary.portal.headset.consent.statement",
        "primary.portal.headset.consent",
        "primary.portal.enrollment.review.consent",
        "primary.portal.headset.fpo.contact",
        "primary.portal.headset.fpo.birth.notmatch",
        "primary.portal.headset.fpo.birth",
        "primary.portal.headset.notmatch",
        "primary.portal.headset.fpo.lastname",
        "primary.portal.records.unmatch",
        "primary.portal.headset.fpo.firstname",
        "primary.portal.headset.contact.valid",
        "primary.portal.enrollment.review.invalidDate",
    ]);

    constructor(private readonly language: LanguageService) {}
}
