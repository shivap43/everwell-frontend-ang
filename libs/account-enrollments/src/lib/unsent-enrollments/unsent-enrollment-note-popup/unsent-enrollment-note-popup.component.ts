import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";

export interface DialogData {
    title: string;
    editRowData: any;
    maxLength: number;
}

@Component({
    selector: "empowered-unsent-enrollment-note-popup",
    templateUrl: "./unsent-enrollment-note-popup.component.html",
    styleUrls: ["./unsent-enrollment-note-popup.component.scss"],
})
export class UnsentEnrollmentNotePopupComponent implements OnInit {
    notePopUpForm: FormGroup;
    notePopUpFormControls: any;

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.accountEnrollments.addNote.title",
        "primary.portal.accountEnrollments.addNote.description",
        "primary.portal.accountEnrollments.addNote.textboxTitle",
        "primary.portal.accountEnrollments.addNote.maxCharacter",
        "primary.portal.accountEnrollments.addNote.saveNote",
        "primary.portal.accountEnrollments.addNote.cancelNote",
        "primary.portal.common.cancel",
        "primary.portal.common.save",
        "primary.portal.common.close",
    ]);
    constructor(
        private formBuilder: FormBuilder,
        public dialogRef: MatDialogRef<UnsentEnrollmentNotePopupComponent>,
        private language: LanguageService,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {}

    ngOnInit(): void {
        this.initializeWorkForm();
    }

    /** Initializing Note Form */
    initializeWorkForm(): void {
        if (this.data.editRowData.enrollmentComment) {
            this.notePopUpForm = this.formBuilder.group({
                noteData: this.formBuilder.group(
                    {
                        enrollmentComment: [
                            this.data.editRowData.enrollmentComment,
                            [Validators.maxLength(this.data.maxLength)],
                        ],
                    },
                    { updateOn: "blur" }
                ),
            });
        } else {
            this.notePopUpForm = this.formBuilder.group({
                noteData: this.formBuilder.group(
                    {
                        enrollmentComment: [""],
                    },
                    { updateOn: "blur" }
                ),
            });
        }
    }

    /** Form control getter */
    get formControls(): object {
        return this.notePopUpForm.controls;
    }

    /** Cancel click on popup */
    onCancelClick(): void {
        this.dialogRef.close();
    }

    /** Add Note Popup */
    onAddNote(formdata: any, valid: boolean): void {
        if (valid) {
            const rowData = { ...this.data.editRowData };
            rowData.enrollmentComment = formdata.noteData.enrollmentComment;
            this.data.editRowData = { ...rowData };
            this.dialogRef.close({ data: this.data.editRowData });
        }
    }
}
