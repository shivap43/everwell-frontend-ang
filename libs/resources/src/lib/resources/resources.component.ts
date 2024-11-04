import { Component, OnInit } from "@angular/core";
import { LoadResources, SharedState } from "@empowered/ngxs-store";
import { Store } from "@ngxs/store";
import { LanguageService } from "@empowered/language";
import { SharedService } from "@empowered/common-services";
import { PagePrivacy } from "@empowered/constants";

@Component({
    selector: "empowered-resources",
    templateUrl: "./resources.component.html",
    styleUrls: ["./resources.component.scss"],
})
export class ResourcesComponent implements OnInit {
    partnerId = false;
    memberId = false;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.edit",
        "primary.portal.common.cancel",
        "primary.portal.resources.resources",
        "primary.portal.resources.benefitsLibrary",
        "primary.portal.resources.companyLibrary",
    ]);

    constructor(private readonly store: Store, private readonly language: LanguageService, private readonly sharedService: SharedService) {
        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_RESOURCES);
        }
    }

    ngOnInit(): void {
        this.store.dispatch(new LoadResources());
    }
}
