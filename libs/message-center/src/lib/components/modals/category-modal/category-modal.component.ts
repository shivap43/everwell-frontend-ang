import { Validators } from "@angular/forms";
import { FormBuilder, FormGroup } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { Component, Inject, Optional } from "@angular/core";
import { Observable } from "rxjs";
import { MessageCategory } from "@empowered/api";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-category-modal",
    templateUrl: "./category-modal.component.html",
    styleUrls: ["./category-modal.component.scss"],
})
export class CategoryModalComponent {
    MessageCenterLanguage = MessageCenterLanguage;

    messageCategories$: Observable<MessageCategory[]>;

    categoryForm: FormGroup = this.builder.group({
        categoryFormControl: ["", Validators.required],
    });

    /**
     * Pull the data from the injected dialog model
     *
     * @param matDialogRef
     * @param data
     * @param builder
     */
    constructor(
        private readonly matDialogRef: MatDialogRef<CategoryModalComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) private readonly data: { categories: Observable<MessageCategory[]> },
        private readonly builder: FormBuilder
    ) {
        this.messageCategories$ = data.categories;
    }
}
