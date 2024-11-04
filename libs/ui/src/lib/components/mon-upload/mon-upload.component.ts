import { Component, OnInit, Input, EventEmitter, Output } from "@angular/core";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { Store } from "@ngxs/store";

@Component({
    selector: "empowered-mon-upload",
    templateUrl: "./mon-upload.component.html",
    styleUrls: ["./mon-upload.component.scss"],
})
export class MonUploadComponent implements OnInit {
    @Input() accept = "";
    @Input() uploadSucessStatus: string[];
    @Input() isProgressBarEnabled: boolean;
    @Input() uploadErrorStatus: string[];
    @Input() isFileError = false;
    @Input() isFileViewable: boolean;
    @Input() isFileAvailable = false;
    @Input() isFileSelected: boolean;
    @Input() isUploadingStarted: boolean;
    @Input() hasError: boolean[];
    @Input() isSucess: boolean[];
    @Input() modeProgress: string;
    @Input() fileUploadPercentage: number;
    @Output() cancelUpload: EventEmitter<any> = new EventEmitter();
    @Output() uploadFile: EventEmitter<any> = new EventEmitter();
    @Output() viewFile: EventEmitter<any> = new EventEmitter();
    @Input() files: any[] = [];
    @Input() fileBrowsed: boolean;
    @Input() hasWarning = false;
    isFileDragged: boolean;
    @Input() uploadedAdminName = "";
    @Input() lastUploadedFileDate = "";
    @Input() isExistingDoc = false;
    @Input() lastUploadFileName = "";
    @Input() hint: boolean;
    @Input() hintText = "";
    @Input() isSingleFile = false;
    @Input() isQLE = false;
    acceptFormat = "";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.shared.ui.monUpload.uploadLabel",
        "primary.portal.shared.ui.monUpload.filesForUpload",
        "primary.portal.shared.ui.monUpload.uploadLabel.browse",
        "primary.portal.shared.ui.monUpload.errorLabel",
        "primary.portal.qle.pendingEnrollment.fileAcceptMsg",
        "primary.portal.monupload.mapping.warning",
    ]);

    constructor(private readonly store: Store, private readonly language: LanguageService) {}

    /**
     * ng life cycle hook
     * This method will be automatically invoked when an instance of the class is created.
     */
    ngOnInit(): void {
        if (!this.isFileViewable || this.isQLE) {
            const format = this.accept.split(",");
            const formatList = format.splice(0, format.length - 1);
            formatList.forEach((fileFormat) => {
                if (this.acceptFormat === "") {
                    this.acceptFormat = fileFormat;
                } else {
                    this.acceptFormat = this.acceptFormat + ", " + fileFormat;
                }
            });
            this.acceptFormat = this.acceptFormat + " or " + format[format.length - 1];
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
    }
    onClickViewFile(file: any): void {
        this.viewFile.emit(file);
    }
    onUpload(event: File): void {
        this.uploadFile.emit(event);
    }
    cancelFileUpload(index: number): void {
        this.cancelUpload.emit(index);
    }

    allowDrop(ev: DragEvent): void {
        ev.preventDefault();
        ev.stopPropagation();
        this.isFileDragged = true;
    }

    drag(ev: DragEvent): void {
        ev.preventDefault();
        ev.stopPropagation();
        this.isFileDragged = false;
    }

    drop(ev: DragEvent): void {
        ev.preventDefault();
        ev.stopPropagation();
        this.isFileDragged = false;
        const file = ev.dataTransfer.files;
        this.uploadFile.emit(file[0]);
    }
}
