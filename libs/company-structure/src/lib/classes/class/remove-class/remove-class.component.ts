import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { ClassNames, ClassTypeDisplay } from "@empowered/api";
import { Component, OnInit, Inject, Optional } from "@angular/core";
import { PortalsService } from "../../../portals.service";
import { ActionType } from "../../../shared/models/container-data-model";
import { LanguageModel } from "@empowered/api";
import { LanguageService, LanguageState } from "@empowered/language";
import { Store } from "@ngxs/store";
import { take } from "rxjs/operators";

@Component({
    selector: "empowered-remove-class",
    templateUrl: "./remove-class.component.html",
    styleUrls: ["./remove-class.component.scss"],
})
export class RemoveClassComponent implements OnInit {
    classNameForm: FormGroup;
    primaryLanguages: LanguageModel[];
    secondaryLanguages: LanguageModel[];
    disableSubmit = false;
    languageStrings: Record<string, string>;

    constructor(
        @Optional()
        @Inject(MAT_DIALOG_DATA)
        readonly data: { className: ClassNames; classType: ClassTypeDisplay; list: ClassNames[] | null },
        private readonly dialogRef: MatDialogRef<RemoveClassComponent>,
        private readonly portalsService: PortalsService,
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly language: LanguageService,
    ) {
        this.primaryLanguages = this.store.selectSnapshot(LanguageState.languageList);
        this.secondaryLanguages = this.store.selectSnapshot(LanguageState.secondaryLanguageList);
    }

    ngOnInit(): void {
        this.fetchLanguage();
        this.classNameForm = this.formBuilder.group(
            {
                classNameControl: [null],
            },
            { updateOn: "blur" },
        );
    }
    removeClass(): void {
        // FIXME - Using this until spinner is fixed to disallow clicking button more than once.
        this.updateRemoveClassValidators(true);
        if (this.classNameForm.valid) {
            this.disableSubmit = true;
            const removeClassData = {
                classTypeId: this.data.classType.id,
                classId: this.data.className.id,
                panel: this.dialogRef,
            };
            if (this.data.className.default) {
                const updateClassData = {
                    updateClassReq: Object.assign(this.classNameForm.get("classNameControl").value, { default: true }),
                    classTypeId: this.data.classType.id,
                    classId: this.classNameForm.controls.classNameControl.value.id,
                };
                this.portalsService.setAction({
                    action: ActionType.class_remove_default,
                    data: { updateClassData: updateClassData, removeClassData: removeClassData },
                });
            } else {
                this.portalsService.setAction({
                    action: ActionType.class_remove,
                    data: removeClassData,
                });
            }
        }
        this.classNameForm.valueChanges.pipe(take(1)).subscribe(() => this.updateRemoveClassValidators(false));
    }
    updateRemoveClassValidators(submit: boolean): void {
        const ctrl = this.classNameForm.get("classNameControl");
        if (submit && this.data.className.default) {
            ctrl.setValidators([Validators.required]);
        } else {
            ctrl.clearValidators();
        }
        ctrl.updateValueAndValidity({ emitEvent: false });
    }
    closeDialog(): void {
        this.dialogRef.close();
    }
    fetchLanguage(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues(["primary.portal.common.cancel", "primary.portal.common.remove"]);
    }
}
