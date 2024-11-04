import { Component, Inject, OnInit } from "@angular/core";
import { LanguageService } from "@empowered/language";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { EnrollmentState } from "@empowered/ngxs-store";

const APPLICANT_FIRST_NAME = "##ApplicantFirstName##";

@Component({
    selector: "empowered-screen-hand-off",
    templateUrl: "./screen-hand-off.component.html",
    styleUrls: ["./screen-hand-off.component.scss"],
})
export class ScreenHandOffComponent implements OnInit {
    // title of modal
    title: string;
    // Dialog body content
    bodyContent: string;
    // it holds all localized text
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.vf2f.handOff",
        "primary.portal.vf2f.handOffTitle",
        "primary.portal.vf2f.confirm",
        "primary.portal.vf2f.member.handOff",
        "primary.portal.vf2f.enrollment.complete",
    ]);

    /**
     * constructor of component
     * @param language -  Reference of Language service [used to get localized value]
     * @param dialogRef -  Reference of angular material dialog
     * @param store - Reference of ngxs store
     * @param isProducer - Producer's flag
     */
    constructor(
        private readonly language: LanguageService,
        private readonly dialogRef: MatDialogRef<ScreenHandOffComponent>,
        private readonly store: Store,
        @Inject(MAT_DIALOG_DATA) readonly isProducer: boolean,
    ) {}

    /**
     * Angular life cycle hook. it will be called at the time of initialization of component.
     * Update the title and body content based on user's role [producer, member].
     * @returns void
     */
    ngOnInit(): void {
        if (this.isProducer) {
            this.title = this.languageStrings["primary.portal.vf2f.handOffTitle"];
            this.bodyContent = this.languageStrings["primary.portal.vf2f.handOff"];
        } else {
            const memberInfo = this.store.selectSnapshot(EnrollmentState.GetMemberData);
            this.title = this.languageStrings["primary.portal.vf2f.enrollment.complete"];
            const bodyContent = this.languageStrings["primary.portal.vf2f.member.handOff"];
            this.bodyContent = bodyContent.replace(APPLICANT_FIRST_NAME, memberInfo.info.name.firstName);
        }
    }
    /**
     * close the dialog box
     * @param isClosed flag to check whether modal is closed or dismissed
     */
    closeDialog(isClosed?: boolean): void {
        this.dialogRef.close(isClosed);
    }
}
