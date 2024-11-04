import { Component, Input, Output, EventEmitter } from "@angular/core";
import { UploadedFile } from "@empowered/constants";
import { BehaviorSubject, Observable } from "rxjs";

@Component({
    selector: "empowered-file-row",
    templateUrl: "./file-row.component.html",
    styleUrls: ["./file-row.component.scss"],
})
export class FileRowComponent {
    private readonly uploadedFileSubject$: BehaviorSubject<UploadedFile> = new BehaviorSubject<UploadedFile>(undefined);
    uploadedFile$: Observable<UploadedFile> = this.uploadedFileSubject$.asObservable();

    // Inputs
    @Input() set uploadedFile(newFile: UploadedFile) {
        this.uploadedFileSubject$.next(newFile);
    }
    // If the row can be deleted or not
    @Input() canDelete: boolean;

    // Lets the parent know if the row should be deleted
    @Output() delete: EventEmitter<void> = new EventEmitter<void>();

    /**
     * Click handler for the X button, signals the row should be deleted
     */
    onDeleteClick(): void {
        this.delete.emit();
    }
}
