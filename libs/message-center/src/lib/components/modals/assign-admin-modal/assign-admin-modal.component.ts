import { Validators } from "@angular/forms";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, Inject, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage, Admin } from "@empowered/constants";

@Component({
    selector: "empowered-assign-admin-modal",
    templateUrl: "./assign-admin-modal.component.html",
    styleUrls: ["./assign-admin-modal.component.scss"],
})
export class AssignAdminModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    isUpdate = false;
    admins$: Observable<Admin[]>;

    // Language
    aria = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.ASSIGN_ADMIN_MODAL_LABEL_ADMIN_ARIA);

    adminForm: FormGroup = this.builder.group({
        adminFormControl: ["", Validators.required],
    });

    /**
     * Pull the data from the injected dialog model
     *
     * @param matDialogRef
     * @param data
     * @param builder
     * @param languageService
     */
    constructor(
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: { isUpdate: boolean; admins: Observable<Admin[]> },
        private readonly builder: FormBuilder,
        private readonly languageService: LanguageService,
    ) {
        this.isUpdate = this.data.isUpdate;
        this.admins$ = this.data.admins;
    }
}
