import { Component, Inject, Optional } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { AccountService } from "@empowered/api";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface WellthieData {
    accessedFrom: string;
}

const SSO_FORM = "saeform";
const POST_FORM_INDEX = 3;

@Component({
    selector: "empowered-wellthie-popup",
    templateUrl: "./wellthie-popup.component.html",
    styleUrls: ["./wellthie-popup.component.scss"],
})
export class WellthiePopupComponent {
    readonly WELLTHIE_LOGO = "/assets/images/wellthie-logo.png";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.wellthie.launchWellthie",
        "primary.portal.wellthie.digitalPlatform",
    ]);

    constructor(
        private readonly language: LanguageService,
        private readonly accountService: AccountService,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: WellthieData,
    ) {}

    /**
     * This method will get response from getWellthieCredentials api and use postform to render in html
     */
    openWelthieUrl(): void {
        this.accountService.getWellthieCredentials(this.data.accessedFrom).subscribe((resp) => {
            const windowRefernce = window.open("_parent", "welthieWindow", "location=no,width=600,height=350,top=200,left=450");
            windowRefernce.document.write(resp.wellthieData[POST_FORM_INDEX].postForm);
            windowRefernce.document.forms[SSO_FORM].submit();
        });
    }
}
