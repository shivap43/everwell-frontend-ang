import { Validators, AbstractControl, FormBuilder, FormControl } from "@angular/forms";
import { Component, Output, Input, EventEmitter, OnDestroy } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { DeleteAdminModalComponent } from "../../../components/modals/delete-admin-modal/delete-admin-modal.component";
import { EmpoweredModalService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage, Admin } from "@empowered/constants";
import { takeUntil, filter } from "rxjs/operators";

@Component({
    selector: "empowered-category-admin-assignment-row",
    templateUrl: "./category-admin-assignment-row.component.html",
    styleUrls: ["./category-admin-assignment-row.component.scss"],
})
export class CategoryAdminAssignmentRowComponent implements OnDestroy {
    MessageCenterLanguage = MessageCenterLanguage;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    @Input() id: number;
    @Input() adminsAndAssignment$: Observable<(Admin & { selectedId: number })[]>;
    @Output() deleteRequest: EventEmitter<number> = new EventEmitter();
    @Output() promoteRequest: EventEmitter<number> = new EventEmitter();

    // Language
    standardAdminAria = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.CATEGORY_ADMIN_ASSIGNMENT_ROW_ARIA);

    adminControl: FormControl = this.builder.control("", Validators.required);

    constructor(
        private readonly builder: FormBuilder,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Clean up subscriptions on destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Delete the admin row
     */
    onClickDelete(): void {
        this.empoweredModal
            .openDialog(DeleteAdminModalComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp != null && resp)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((resp) => this.deleteRequest.emit(this.id));
    }

    /**
     * Echo out the promotion to the parent component
     */
    onClickPromote(): void {
        this.promoteRequest.emit(this.id);
    }

    /**
     * Provide access to the delete emitter
     *
     * @returns the observable cast of the event emitter
     */
    getDeleteRequestStream(): Observable<number> {
        return this.deleteRequest.asObservable();
    }

    /**
     * Provide access to the promote event emitter
     *
     * @returns the observable cast of the event emitter
     */
    getPromoteRequestStream(): Observable<number> {
        return this.promoteRequest.asObservable();
    }

    /**
     * Provide access to the internal control
     *
     * @returns the control
     */
    getControl(): AbstractControl {
        return this.adminControl;
    }

    /**
     * Set the value of the internal control
     *
     * @param value the admin id to set the value of
     */
    setControlValue(value: number): void {
        this.adminControl.setValue(value);
    }
}
