import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, Inject, Optional } from "@angular/core";
import { Comment } from "@empowered/api";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { MessageCenterLanguage } from "@empowered/constants";

const FIELD_NAME_COMMENT = "commentControl";
@Component({
    selector: "empowered-add-comment-modal",
    templateUrl: "./comment-modal.component.html",
    styleUrls: ["./comment-modal.component.scss"],
})
export class CommentModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    editForm: FormGroup = this.formBuilder.group({
            [FIELD_NAME_COMMENT]: ["", { validators: Validators.required, updateOn: "blur" }]
        });
    isUpdate = false;
    fieldNameComment: string = FIELD_NAME_COMMENT;

    /**
     * Grab the data from the injected dialog model
     *
     * @param matDialogRef
     * @param formBuilder
     * @param data
     */
    constructor(
        private readonly matDialogRef: MatDialogRef<CommentModalComponent>,
        private readonly formBuilder: FormBuilder,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: Comment
    ) {
        if (data) {
            this.editForm.controls[FIELD_NAME_COMMENT].setValue(data.text);
            this.isUpdate = true;
        }
    }

    /**
     * Catch the submit, and then submit the form.
     */
    onSubmit(): void {
        if (this.editForm.valid) {
            this.matDialogRef.close(this.editForm.controls[FIELD_NAME_COMMENT].value);
        }
    }
}
