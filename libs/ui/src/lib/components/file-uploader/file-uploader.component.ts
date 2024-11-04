import { Component, Input, EventEmitter, OnDestroy, ViewChildren, ElementRef, QueryList, Output } from "@angular/core";
import { BehaviorSubject, Observable, Subject, combineLatest } from "rxjs";
import { HttpEvent, HttpEventType } from "@angular/common/http";

import {
    takeUntil,
    map,
    withLatestFrom,
    shareReplay,
    tap,
    distinctUntilChanged,
    first,
    filter,
    finalize,
    debounceTime,
} from "rxjs/operators";
import { DateFormats, FileType, UploadedFile } from "@empowered/constants";
import { NgxDropzoneChangeEvent } from "ngx-dropzone";
import { RejectedFile } from "ngx-dropzone/lib/ngx-dropzone.service";
import { DateService } from "@empowered/date";
/* eslint-disable @typescript-eslint/no-explicit-any */
export type UploadFunction = (file: File) => Observable<HttpEvent<any>>;
export type DeleteFunction = (documentId: number) => Observable<any>;

enum FileUploadError {
    FORMAT = "format",
    SIZE = "size",
    DIMENSION = "dimension",
    UPLOAD = "upload",
}

const DEFAULT_ERROR_MESSAGES: Map<FileUploadError, string> = new Map<FileUploadError, string>()
    .set(FileUploadError.FORMAT, "Invalid Format")
    .set(FileUploadError.SIZE, "Invalid Size")
    .set(FileUploadError.DIMENSION, "Invalid Dimension")
    .set(FileUploadError.UPLOAD, "Failed to Upload");
const DROPZONE_LABEL_DEFAULT = "Drag and drop file here or browse";
const UPLOADER_LABEL_DEFAULT = "Upload file";
const LAST_UPLOAD_PREFIX = "Last upload: ";
const DEBOUNCE_MILLIS_FILE_UPLOAD = 250;
const RANDOM_ID_OFFSET = 1000;
const PERCENTAGE_OFFSET = 100;

@Component({
    selector: "empowered-file-uploader",
    templateUrl: "./file-uploader.component.html",
    styleUrls: ["./file-uploader.component.scss"],
})
export class FileUploaderComponent implements OnDestroy {
    // Create and auto incrementing ID field that whenever you get the value it increments
    /* eslint-disable no-underscore-dangle */
    _latestId = 1;
    get latestId(): number {
        return ++this._latestId;
    }

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    internalId = Math.random() * RANDOM_ID_OFFSET;

    @ViewChildren("testImageElem") testImageElems: QueryList<ElementRef>;

    // Input Subjects
    private readonly _label$: BehaviorSubject<string> = new BehaviorSubject<string>(UPLOADER_LABEL_DEFAULT);
    private readonly _dropzoneLabel$: BehaviorSubject<string> = new BehaviorSubject<string>(DROPZONE_LABEL_DEFAULT);
    private readonly _hint$: BehaviorSubject<string> = new BehaviorSubject<string>("");
    private readonly _errorMessages$: BehaviorSubject<Map<FileUploadError, string>> = new BehaviorSubject<Map<FileUploadError, string>>(
        DEFAULT_ERROR_MESSAGES,
    );
    private readonly _maxFiles$: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
    private readonly _acceptableFileTypes$: BehaviorSubject<FileType[]> = new BehaviorSubject<FileType[]>([]);
    private readonly _acceptableFileSize$: BehaviorSubject<number> = new BehaviorSubject<number>(-1);
    private readonly _maxImageHeight$: BehaviorSubject<number> = new BehaviorSubject<number>(undefined);
    private readonly _maxImageWidth$: BehaviorSubject<number> = new BehaviorSubject<number>(undefined);
    private readonly _uploadFunction$: BehaviorSubject<UploadFunction> = new BehaviorSubject<UploadFunction>(undefined);
    private readonly _deleteFunction$: BehaviorSubject<DeleteFunction> = new BehaviorSubject<DeleteFunction>(undefined);

    // Observables for the template to access subjects
    label$: Observable<string> = this._label$.asObservable();
    dropzoneLabel$: Observable<string> = this._dropzoneLabel$.asObservable();
    hint$: Observable<string> = this._hint$.asObservable();

    /**
     * Inputs
     */
    @Input() set label(newLabel: string) {
        this._label$.next(newLabel);
    }

    @Input() set dropZoneLabel(newLabel: string) {
        this._dropzoneLabel$.next(newLabel);
    }

    @Input() set hint(newHint: string) {
        this._hint$.next(newHint);
    }

    @Input() set errorMessages(newErrorMessages: Map<FileUploadError, string>) {
        this._errorMessages$.next(newErrorMessages);
    }
    get errorMessages(): Map<FileUploadError, string> {
        return this._errorMessages$.value;
    }

    @Input() set maxFiles(newMaxFiles: number) {
        this._maxFiles$.next(newMaxFiles);
    }
    get maxFiles(): number {
        return this._maxFiles$.value;
    }

    @Input() set acceptableFileTypes(newAcceptableFileTypes: FileType[]) {
        this._acceptableFileTypes$.next(newAcceptableFileTypes);
    }
    get acceptableFileTypes(): FileType[] {
        return this._acceptableFileTypes$.value;
    }

    @Input() set acceptableFileSize(newAcceptableFileSize: number) {
        this._acceptableFileSize$.next(newAcceptableFileSize);
    }
    get acceptableFileSize(): number {
        return this._acceptableFileSize$.value;
    }

    @Input() set maxImageHeight(newHeight: number) {
        this._maxImageHeight$.next(newHeight);
    }
    get maxImageHeight(): number {
        return this._maxImageHeight$.value;
    }

    @Input() set maxImageWidth(newWidth: number) {
        this._maxImageWidth$.next(newWidth);
    }
    get maxImageWidth(): number {
        return this._maxImageWidth$.value;
    }

    @Input() set uploadFunction(newFunction: UploadFunction) {
        this._uploadFunction$.next(newFunction);
    }
    get uploadFunction(): UploadFunction {
        return this._uploadFunction$.value;
    }

    @Input() set deleteFunction(newFunction: DeleteFunction) {
        this._deleteFunction$.next(newFunction);
    }
    get deleteFunction(): DeleteFunction {
        return this._deleteFunction$.value;
    }

    /**
     * Outputs
     */
    // Emits either the IDs of the uploaded files, or the files themselves (depends on if uploader function was supplied)
    @Output() private readonly uploads: EventEmitter<File[] | number[]> = new EventEmitter<File[] | number[]>();

    /**
     * Internal Variables
     */

    // Push test image data through this to validate the dimensions
    private readonly _testImage$: BehaviorSubject<UploadedFile & { readData: string }> = new BehaviorSubject<
    UploadedFile & { readData: string }
    >(undefined);
    testImage$: Observable<UploadedFile & { readData: string }> = this._testImage$.asObservable();

    // The list of all the uploaded files
    private readonly _uploads$: BehaviorSubject<UploadedFile[]> = new BehaviorSubject<UploadedFile[]>([]);
    uploads$: Observable<UploadedFile[]> = this._uploads$.asObservable();

    // Combine the list of acceptable types into a comma separated list
    allowedMimeTypes$: Observable<string> = this._acceptableFileTypes$.asObservable().pipe(
        map((mimeList) =>
            mimeList.reduce((accumulator, currentMime) => (accumulator === "" ? currentMime : `${accumulator}, ${currentMime}`), ""),
        ),
        shareReplay(1),
    );
    // Convert the number of files that can be uploaded into a boolean for multiples
    allowMultipleUploads$: Observable<boolean> = this._maxFiles$.asObservable().pipe(map((maxFileCount) => maxFileCount > 1));
    // The upload and delete functions determine if the files can be deleted once uploaded
    canDelete$: Observable<boolean> = combineLatest(this._deleteFunction$.asObservable(), this._uploadFunction$.asObservable()).pipe(
        map(([deleteFunc, uploadFunc]) => Boolean(deleteFunc && uploadFunc) || (!deleteFunc && !uploadFunc)),
        shareReplay(1),
    );

    // Whenever the uploaded files change (errors and in progress uploads don't count), emit the new list
    uploadChange$: Observable<unknown[]> = this._uploads$.asObservable().pipe(
        // Slow down multiple rapid uploads
        debounceTime(DEBOUNCE_MILLIS_FILE_UPLOAD),
        // reduce the number of emissions by only emitting completed uploads
        distinctUntilChanged((firstList, secondList) => {
            const sortedFirst: UploadedFile[] = [...firstList]
                .filter((upload) => this.isUploadComplete(upload))
                .sort(this.sortUploadedFiles);
            const sortedSecond: UploadedFile[] = [...secondList]
                .filter((upload) => this.isUploadComplete(upload))
                .sort(this.sortUploadedFiles);

            return (
                sortedFirst.length === sortedSecond.length &&
                sortedSecond.reduce(
                    (accumulator, current) => accumulator && Boolean(sortedFirst.find((element) => element.id === current.id)),
                    true,
                )
            );
        }),
        // Emit the latest successful uploads
        tap((uploads) => {
            const successfulUploads: UploadedFile[] = uploads.filter((upload) => this.isUploadComplete(upload));
            const emissionValue: number[] | File[] = successfulUploads.reduce(
                (accumulator, current) => accumulator && Boolean(current.documentId),
                true,
            )
                ? successfulUploads.map((upload) => upload.documentId)
                : successfulUploads.map((upload) => upload.file);
            this.uploads.emit(emissionValue);
        }),
        takeUntil(this.unsubscribe$.asObservable()),
    );

    // File may still be uploading and cannot be deleted, build up a queue of unsuccessful deletes
    private readonly _deleteQueue$: BehaviorSubject<UploadedFile[]> = new BehaviorSubject<UploadedFile[]>([]);
    // Every time a successful upload occurs and there are items in the delete queue, attempt to remove the files
    private readonly deleteQueue$ = this._uploads$.asObservable().pipe(
        withLatestFrom(this._deleteQueue$.asObservable()),
        filter(([, deleteThese]) => deleteThese && deleteThese.length > 0),
        tap(([uploads, deleteThese]) => {
            uploads
                .filter(
                    (upload) => (upload.documentId || upload.errorMessage) && deleteThese.find((deleteable) => deleteable.id === upload.id),
                )
                .forEach((upload) => this.deleteFile(upload));
        }),
    );
    // Delete processing queue to prevent duplicate delete attempts for async deletes
    private readonly _deleteProcessingQueue$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);
    // String for the last uploaded file
    private readonly _lastUploaded$: BehaviorSubject<UploadedFile> = new BehaviorSubject<UploadedFile>(undefined);
    lastUploaded$: Observable<string> = this._lastUploaded$.asObservable().pipe(
        filter((upload) => Boolean(upload)),
        map((upload) => `${LAST_UPLOAD_PREFIX} ${upload.name} on ${this.dateService.format(new Date(), DateFormats.MONTH_DAY_YEAR)}`),
    );

    /**
     * Subscribe to the event driven observables here to get them initialized before the inputs
     */
    constructor(private readonly dateService: DateService) {
        this.uploadChange$.subscribe();
        this.deleteQueue$.subscribe();
    }

    /**
     * Unsubscribe from observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Uploads the file and then monitors the upload's progress, updating the percent complete of the internal model
     *
     * @param file the file to upload
     * @returns Observable to perform the upload, and then monitor for updates from the server
     */
    private monitorUpload(file: UploadedFile): Observable<HttpEvent<any>> {
        const uploadRequest: Observable<HttpEvent<any>> = this.uploadFunction.apply(null, [file.file]);
        return uploadRequest.pipe(
            tap(
                (event) =>
                    this._uploads$.next(
                        this._uploads$.value.map((upload) => {
                            if (upload.id === file.id) {
                                switch (event.type) {
                                    // If it is a progress update, just update the percent complete
                                    case HttpEventType.UploadProgress:
                                        upload.percentComplete = Math.round((PERCENTAGE_OFFSET * event.loaded) / event.total);
                                        break;
                                    // If it is a response, add the document ID
                                    case HttpEventType.Response: {
                                        const locationParts: string[] = event.headers.get("location").split("/");
                                        upload.documentId = +locationParts[locationParts.length - 1];
                                        break;
                                    }
                                }
                            }
                            return upload;
                        }),
                    ),
                // If there is an error, add the error message to the upload
                () =>
                    this._uploads$.next(
                        this._uploads$.value.map((upload) => {
                            if (upload.id === file.id) {
                                upload.percentComplete = 0;
                                upload.errorMessage = this.errorMessages.get(FileUploadError.UPLOAD);
                            }
                            return upload;
                        }),
                    ),
            ),
            takeUntil(this.unsubscribe$.asObservable()),
        );
    }

    /**
     * Uploaded files that were the correct type, but not necessarily the correct size or dimensions. Validate the other
     * file attributes, and push them into the list of uploaded files.
     *
     * @param changeEvent NgxDropzoneChangeEvent will have Added files, Rejected files properties
     */
    onFileUpload(changeEvent: NgxDropzoneChangeEvent): void {
        const uploadCount = this._uploads$.value.filter((upload) => !upload.errorMessage).length;
        const remainingUploads =
            changeEvent.addedFiles.length + uploadCount > this.maxFiles ? this.maxFiles - uploadCount : changeEvent.addedFiles.length;

        changeEvent.addedFiles
            // Check the upload count, and do not upload more than allowed
            .slice(0, this.maxFiles === -1 ? changeEvent.addedFiles.length : remainingUploads)
            // Process each file
            .forEach((file) => {
                // Wrap the file with additional metadata
                const uploadedFile: UploadedFile = {
                    id: this.latestId,
                    name: file.name,
                    file: file,
                };

                // Validate file type
                if (!this.validFileType(file)) {
                    uploadedFile.errorMessage = this.errorMessages.get(FileUploadError.FORMAT);
                }

                // Check if the file is too large
                if (!this.validFileSize(file)) {
                    uploadedFile.errorMessage = this.errorMessages.get(FileUploadError.SIZE);
                }

                // If file is an image and there are dimensions specified, validate them
                if (!uploadedFile.errorMessage && file.type.indexOf("image") !== -1 && (this.maxImageHeight || this.maxImageWidth)) {
                    // Read the data
                    const fileReader = new FileReader();
                    // When the data is finished reading, push it to the invisible element to validate it
                    fileReader.onload = (progressEvent: ProgressEvent) => {
                        this._testImage$.next({
                            ...uploadedFile,
                            readData: (progressEvent.target as FileReader).result as string,
                        });
                    };
                    fileReader.readAsDataURL(file);
                } else if (!uploadedFile.errorMessage && this.uploadFunction) {
                    uploadedFile.percentComplete = 0;
                    // There are no dimensions to validate, but the file needs to be uploaded
                    this.monitorUpload(uploadedFile).subscribe();
                }

                // Add the file to the list of internal files
                this._uploads$.next([...this._uploads$.value, uploadedFile]);
                this._lastUploaded$.next(uploadedFile);
            });
        /**
         * Files were rejected by the uploader because of their type, add them to the list with the appropriate error.
         *
         * @param rejectedFiles List of files that had an invalid type
         */
        if (changeEvent.rejectedFiles.length) {
            this._uploads$.next([
                ...this._uploads$.value,
                ...changeEvent.rejectedFiles.map(
                    (file: RejectedFile) =>
                        ({
                            id: this.latestId,
                            name: file.name,
                            file: file,
                            errorMessage: this.errorMessages.get(FileUploadError.FORMAT),
                        } as UploadedFile),
                ),
            ]);
        }
    }

    /**
     * Validate if the file is the correct size
     *
     * @param file The file to evaluate
     * @returns If the file is compliant (true), or not (false)
     */
    validFileSize(file: File): boolean {
        return this.acceptableFileSize < 0 || file.size <= this.acceptableFileSize;
    }

    /**
     * Validate the file type is allowed
     *
     * @param file The file to evaluate
     * @returns If the file is compliant (true), or not (false)
     */
    validFileType(file: File): boolean {
        return Boolean(
            !this.acceptableFileTypes ||
                this.acceptableFileTypes.length === 0 ||
                this.acceptableFileTypes.find((fileType) => fileType === file.type),
        );
    }

    /**
     * When the test image loads, validate the dimensions of the image, if invalid add the appropriate error message to the upload list
     *
     * @param uploadedFile The file to validate
     */
    validateDimensions(uploadedFile: UploadedFile): void {
        // If invalid, find uploaded file in list and add error message
        this.testImageElems.forEach((testImageElem) => {
            const uploadHeight = Number(testImageElem.nativeElement.naturalHeight);
            const uploadWidth = Number(testImageElem.nativeElement.naturalWidth);
            this._uploads$.next([
                ...this._uploads$.value.map((upload) =>
                    upload.documentId === uploadedFile.documentId
                        ? ({
                            id: this.latestId,
                            name: upload.name,
                            file: upload.file,
                            // Test to see if the image dimensions match what was passed in, if it does leave undefined, otherwise add error
                            errorMessage:
                                  (!this.maxImageWidth || uploadWidth <= this.maxImageWidth) &&
                                  (!this.maxImageHeight || uploadHeight <= this.maxImageHeight)
                                      ? undefined
                                      : this.errorMessages.get(FileUploadError.DIMENSION),
                        } as UploadedFile)
                        : upload,
                ),
            ]);
        });

        // If upload function given, and dimensions are valid, subscribe to the upload
        const updatedUpload: UploadedFile = this._uploads$.value.find((upload) => upload.id === uploadedFile.id);
        if (this.uploadFunction && updatedUpload && !updatedUpload.errorMessage) {
            this.monitorUpload(updatedUpload).subscribe();
        }
    }

    /**
     * Delete the file from the list, and if there is a delete function run it as well
     *
     * @param file The uploaded file to remove
     */
    deleteFile(file: UploadedFile): void {
        const deletedUpload: UploadedFile = this._uploads$.value.find((upload) => upload.id === file.id);
        // If there is a delete function and the document was uploaded, then run the delete if it has not already been run
        if (this.deleteFunction && deletedUpload.documentId && this._deleteProcessingQueue$.value.indexOf(deletedUpload.id) === -1) {
            this._deleteProcessingQueue$.next([...this._deleteProcessingQueue$.value, deletedUpload.id]);
            this.deleteFunction
                .apply(null, [deletedUpload.documentId])
                .pipe(
                    first(),
                    // On successful delete, remove from the list and the delete queue
                    tap(() => {
                        this._uploads$.next([...this._uploads$.value.filter((upload) => upload.id !== deletedUpload.id)]);
                        this._deleteQueue$.next(this._deleteQueue$.value.filter((deleteTarget) => deleteTarget.id !== file.id));
                    }),
                    takeUntil(this.unsubscribe$.asObservable()),
                    // If there is an error or success, remove from the queue
                    finalize(() =>
                        this._deleteProcessingQueue$.next(
                            this._deleteProcessingQueue$.value.filter((processingId) => processingId !== deletedUpload.id),
                        ),
                    ),
                )
                .subscribe();
        } else if (this.deleteFunction && !deletedUpload.documentId) {
            // We should delete the upload, but its not done uploading yet. TODO: Might could cancel the current delete observable
            this._deleteQueue$.next([...this._deleteQueue$.value, file]);
        } else if (!this.uploadFunction) {
            // If no upload function, then just remove from the list, the delete queue, and the processing list
            this._uploads$.next([...this._uploads$.value.filter((upload) => upload.id !== deletedUpload.id)]);
            this._deleteQueue$.next(this._deleteQueue$.value.filter((deleteTarget) => deleteTarget.id !== file.id));
        }
    }

    /**
     * Sort function to put the uploaded files in order of upload
     *
     * @param firstElem first uploaded file
     * @param secondElem second uploaded file
     * @returns 1 if the first element came after, -1 if it came before
     */
    private sortUploadedFiles(firstElem: UploadedFile, secondElem: UploadedFile): number {
        return firstElem.id > secondElem.id ? 1 : -1;
    }

    /**
     * Check if the uploaded file has completed uploading or not
     *
     * @param upload the file to validate
     * @returns if the upload is complete or not
     */
    isUploadComplete(upload: UploadedFile): boolean {
        return !upload.errorMessage && (Boolean(this.uploadFunction && upload.documentId) || Boolean(!this.uploadFunction && upload.file));
    }
}
