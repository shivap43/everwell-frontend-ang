import { Component, OnInit } from "@angular/core";
import { StaticService } from "@empowered/api";
import { StaticUtilService } from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { ConfigName } from "@empowered/constants";

@Component({
    selector: "empowered-registration-guide",
    templateUrl: "./registration-guide.component.html",
    styleUrls: ["./registration-guide.component.scss"],
})
export class RegistrationGuideComponent {
    registrationGuide$ = this.staticUtilService.cacheConfigValue(ConfigName.EVERWELL_GUIDE);
    emailTemplateFile$ = this.staticUtilService.cacheConfigValue(ConfigName.HR_EMAIL);

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.close"]);
    constructor(
        private readonly staticUtilService: StaticUtilService,
        private readonly staticService: StaticService,
        private readonly language: LanguageService,
    ) {}
}
