import { Component, OnInit, Inject } from "@angular/core";
import { TpiSSOModel } from "@empowered/constants";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { MemberService } from "@empowered/api";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-tpi-add-dependents",
    templateUrl: "./tpi-add-dependents.component.html",
    styleUrls: ["./tpi-add-dependents.component.scss"],
})
export class TpiAddDependentsComponent implements OnInit {
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(["primary.portal.common.save"]);

    /**
     * This method will be automatically invoked when an instance of the class is created.
     * @param tpiSSODetails is tpi sso details which was injected while opening dialog
     * @param language is instance of LanguageService
     * @param memberService is instance of MemberService
     * @param empoweredService is instance of EmpoweredModalService
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) readonly tpiSSODetails: TpiSSOModel,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly empoweredService: EmpoweredModalService,
    ) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     * This method is used to initiate @observable onSubmitDependent to false
     */
    ngOnInit(): void {
        this.memberService.onSubmitDependent(false);
    }

    /**
     * This method will execute on click of save
     * This method is used to set @observable onSubmitDependent to true which saves dependent info
     */
    saveDependentInfo(): void {
        this.memberService.onSubmitDependent(true);
    }

    /**
     * This method is used to close modal
     */
    closeModal(): void {
        this.empoweredService.closeDialog();
    }
}
