import { FormBuilder, FormControl, AbstractControl } from "@angular/forms";
import { Component, Input, Output, EventEmitter } from "@angular/core";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-category-update-row",
    templateUrl: "./category-update-row.component.html",
    styleUrls: ["./category-update-row.component.scss"],
})
export class CategoryUpdateRowComponent {
    MessageCenterLanguage = MessageCenterLanguage;
    @Input() id: number;

    categoryGroup: FormControl = this.builder.control("");

    @Output() deleteRequestEmitter: EventEmitter<number> = new EventEmitter();

    constructor(private readonly builder: FormBuilder) {}

    /**
     * Echo out the emission for the category to delete
     */
    deleteRequest(): void {
        this.deleteRequestEmitter.emit(this.id);
    }

    /**
     * Return access to the internal control
     *
     * @returns the internal control
     */
    getCategoryControl(): AbstractControl {
        return this.categoryGroup;
    }
}
