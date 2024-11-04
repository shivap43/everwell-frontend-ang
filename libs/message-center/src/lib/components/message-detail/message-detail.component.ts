/* eslint-disable no-underscore-dangle */
import { CommentModalComponent } from "../modals/comment-modal/comment-modal.component";
import { DeleteFunction, OpenToast, UploadFunction } from "@empowered/ui";
import { map, filter, tap, switchMap, takeUntil, withLatestFrom } from "rxjs/operators";
import { Observable, combineLatest, BehaviorSubject, Subject } from "rxjs";
import { Component, Inject, AfterViewInit, OnDestroy } from "@angular/core";
import { MatBottomSheetRef, MAT_BOTTOM_SHEET_DATA } from "@angular/material/bottom-sheet";
import { MessageCenterFacadeService } from "../../services/message-center-facade.service";
import {
    MessagingService,
    Message,
    Comment,
    BoxType,
    CategorizedMessage,
    Thread,
    MessageCategory,
    DocumentApiService,
    TargetUnitType,
    ReferenceType,
    MessageAttachment,
    TargetUnit,
} from "@empowered/api";
import { UserService } from "@empowered/user";
import { DeleteMessageModalComponent } from "../modals/delete-message-modal/delete-message-modal.component";
import { Store } from "@ngxs/store";
import { DeleteCommentModalComponent } from "../modals/delete-comment-modal/delete-comment-modal.component";
import { LanguageService } from "@empowered/language";
import { SecondaryLanguage, DateFormats, PortalType, MessageCenterLanguage, FileType, ToastType } from "@empowered/constants";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { DateService } from "@empowered/date";
import { EmpoweredModalService } from "@empowered/common-services";

@Component({
    selector: "empowered-message-detail",
    templateUrl: "./message-detail.component.html",
    styleUrls: ["./message-detail.component.scss"],
})
export class MessageDetailComponent implements AfterViewInit, OnDestroy {
    readonly INBOX_BOXTYPE = "INBOX";
    readonly SENT_BOXTYPE = "SENT";
    readonly DELETE_BOXTYPE = "DELETE";

    MessageCenterLanguage = MessageCenterLanguage;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    // Language
    uploadFileLabel = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_FILE_UPLOAD_LABEL);
    uploadFileHint = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_FILE_UPLOAD_HINT);
    replyTooltip = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_BUTTON_REPLY_TOOLTIP);

    // Inputs
    private readonly _thread$: BehaviorSubject<Thread> = new BehaviorSubject<Thread>(undefined);
    private readonly _box$: BehaviorSubject<BoxType> = new BehaviorSubject<BoxType>(undefined);

    thread$: Observable<Thread> = this._thread$.asObservable().pipe(filter((thread) => Boolean(thread)));
    box$: Observable<BoxType> = this._box$.asObservable().pipe(filter((box) => Boolean(box)));
    category$: Observable<MessageCategory> = this._thread$.asObservable().pipe(
        // Whenever the thread updates, get the messages
        switchMap((thread) =>
            this.messageCenterFacade
                .getCategories()
                .pipe(map((categories) => categories.find((category) => category.id === thread.categoryId))),
        ),
    );
    // Whenever the thread or box updates, get if it was recalled or last read on
    threadBoxLoad$: Observable<[Thread, BoxType]> = combineLatest([this.thread$, this.box$]).pipe(
        tap(([thread, box]) => {
            if (box === "SENT") {
                if (thread.recalledOn) {
                    const recalledOnMoment = this.dateService.toDate(thread.recalledOn.toString());
                    this.recalledOnDate =
                        `${this.dateService.format(recalledOnMoment, DateFormats.MONTH_DAY_YEAR)} ` +
                        `${this.dateService.format(recalledOnMoment, DateFormats.TIME_AM_PM)}`;
                }
                if (thread.lastReadOn) {
                    const lastReadMoment = this.dateService.toDate(thread.lastReadOn.toString());
                    this.lastReadOnDate =
                        `${this.dateService.format(lastReadMoment, DateFormats.MONTH_DAY_YEAR)} ` +
                        `${this.dateService.format(lastReadMoment, DateFormats.TIME_AM_PM)}`;
                }
            }
        }),
    );

    portal$: Observable<string> = this.userService.portal$.pipe(
        tap((portal) => (this.isAdmin = portal.toUpperCase() === PortalType.ADMIN)),
    );
    isAdmin = false;

    // List of messages associated with the thread
    messages$: Observable<(Message | CategorizedMessage)[]> = this.thread$.pipe(
        switchMap((thread) =>
            this.messageCenterFacade.requestMessages(thread.id).pipe(
                switchMap((state) => this.messageCenterFacade.getMessages(thread.id)),
                // Only emit if there are messages
                filter((messages) => messages != null && messages.length > 0),
                map((messages) =>
                    !messages.reduce((allDated, message) => allDated || message.sentOn == null, false)
                        ? messages
                              .slice()
                              .sort((first, second) =>
                                  this.dateService.toDate(first.sentOn) > this.dateService.toDate(second.id) ? -1 : 1,
                              )
                        : messages.slice().sort((first, second) => (first.id > second.id ? -1 : 1)),
                ),
                tap((messages) => (this.latestMessage = messages[0])),
                map((messages) => messages.slice(1)),
                filter((messages) => messages.length > 0),
            ),
        ),
    );
    latestMessage: Message | CategorizedMessage;

    // Display string
    lastReadOnDate: string;
    recalledOnDate: string;

    // Admin Comments
    adminComments$: Observable<Comment[]> = combineLatest([
        this.thread$.pipe(switchMap((thread) => this.messageCenterFacade.getComments(thread.id))),
        this.portal$,
    ]).pipe(
        // Only emit if it is the admin portal
        filter(([comments, portal]) => comments && portal.toUpperCase() === PortalType.ADMIN),
        // Only emit if there are comments
        map(([comments]) => comments),
    );

    // State variable
    replying = false;
    private readonly replyingSubject$: BehaviorSubject<boolean> = new BehaviorSubject(this.replying);

    replyForm: FormGroup = this.formBuilder.group(
        {
            replyMessage: ["", Validators.required],
        },
        {
            updateOn: "submit",
        },
    );

    private readonly uploadedDocuments$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

    // State driven variables
    headerTitle: Observable<string> = combineLatest([this.replyingSubject$.asObservable(), this.box$]).pipe(
        map(([isReplying, boxType]) => {
            switch (boxType) {
                case "SENT":
                    return this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_HEADER_SENT);
                case "DELETE":
                    return this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_HEADER_DELETE);
                default:
                    return isReplying
                        ? this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_HEADER_REPLY)
                        : this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_DETAIL_HEADER_READ);
            }
        }),
    );
    allowedFileTypes: FileType[] = [FileType.JPG, FileType.PNG];

    /**
     * Subscribe to the required observables, get the thead and box from the dialog data
     *
     * @param bottomSheetRef
     * @param data
     * @param messageCenterFacade
     * @param messagingService
     * @param userService
     * @param empoweredModal
     * @param store
     * @param languageService
     * @param formBuilder
     * @param documentService
     */
    constructor(
        private readonly bottomSheetRef: MatBottomSheetRef,
        @Inject(MAT_BOTTOM_SHEET_DATA) public data: { thread: Thread; boxType: BoxType },
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly messagingService: MessagingService,
        private readonly userService: UserService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly store: Store,
        private readonly languageService: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly documentService: DocumentApiService,
        private readonly dateService: DateService,
    ) {
        this.messageCenterFacade.requestComments(data.thread.id).pipe(takeUntil(this.unsubscribe$)).subscribe();
        this.threadBoxLoad$.subscribe();
        this._thread$.next(data.thread);
        this._box$.next(data.boxType);
    }

    /**
     * After the view is initialized, subscribe to the portal
     */
    ngAfterViewInit(): void {
        this.portal$.pipe(takeUntil(this.unsubscribe$)).subscribe();
    }

    /**
     * OnDestroy, clean up observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    // Upload and delete functions for the file uploader
    uploadFunction: UploadFunction = (file: File) => this.documentService.uploadDocument(file);
    deleteFunction: DeleteFunction = (documentId: number) => this.documentService.deleteDocument(documentId);

    /**
     * Close out the sheet
     */
    close(): void {
        this.bottomSheetRef.dismiss();
    }

    /**
     * Open the add note modal, and submit the result to the server
     */
    clickAddNote(): void {
        this.empoweredModal
            .openDialog(CommentModalComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this._thread$.asObservable()),
                switchMap(([resp, thread]) => this.messagingService.createThreadComment(thread.id, resp)),
                tap(
                    (resp) => {
                        /* On success reload comments*/
                    },
                    (error) =>
                        this.store.dispatch(
                            new OpenToast({
                                message: this.languageService.fetchSecondaryLanguageValue(SecondaryLanguage.SERVICE_UNAVAILABLE),
                                toastType: ToastType.DANGER,
                            }),
                        ),
                ),
                switchMap((resp) => this.messageCenterFacade.requestComments(this.data.thread.id, true)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Open the note modal and load it with the comment to edit, submit to server
     *
     * @param comment The note to edit
     */
    clickEditNote(comment: Comment): void {
        this.empoweredModal
            .openDialog(CommentModalComponent, { data: comment })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this._thread$.asObservable()),
                switchMap(([resp, thread]) =>
                    this.messagingService.updateThreadComment(thread.id, comment.id, {
                        text: resp,
                        updateOn: new Date(),
                    }),
                ),
                tap(
                    (resp) => {
                        /* On success, reload the comments*/
                    },
                    (error) =>
                        this.store.dispatch(
                            new OpenToast({
                                message: this.languageService.fetchSecondaryLanguageValue(SecondaryLanguage.SERVICE_UNAVAILABLE),
                                toastType: ToastType.DANGER,
                            }),
                        ),
                ),
                switchMap((resp) => this.messageCenterFacade.requestComments(this.data.thread.id, true)),
                /* get thread comment from server based on location header? dispatch action to load? */
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Delete the comment
     *
     * @param comment comment to delete
     */
    clickDeleteNote(comment: Comment): void {
        this.empoweredModal
            .openDialog(DeleteCommentModalComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this._thread$.asObservable()),
                switchMap(([resp, thread]) => this.messagingService.deleteThreadComment(thread.id, comment.id)),
                tap(
                    (resp) => {
                        /* On success, reload comments*/
                    },
                    (error) =>
                        this.store.dispatch(
                            new OpenToast({
                                message: this.languageService.fetchSecondaryLanguageValue(SecondaryLanguage.SERVICE_UNAVAILABLE),
                                toastType: ToastType.DANGER,
                            }),
                        ),
                ),
                switchMap((resp) => this.messageCenterFacade.requestComments(this.data.thread.id, true)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Delete the current thread
     */
    clickDeleteMessage(): void {
        this.empoweredModal
            .openDialog(DeleteMessageModalComponent)
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this._thread$.asObservable()),
                switchMap(([resp, thread]) => this.messagingService.deleteThread(thread.id)),
                tap(
                    (resp) => this.bottomSheetRef.dismiss(true),
                    (error) =>
                        this.store.dispatch(
                            new OpenToast({
                                message: this.languageService.fetchSecondaryLanguageValue(SecondaryLanguage.SERVICE_UNAVAILABLE),
                                toastType: ToastType.DANGER,
                            }),
                        ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * Recall the message
     */
    clickRecallMessage(): void {
        if (this.latestMessage != null) {
            this.messagingService
                .recallLastMessage(this.latestMessage.id)
                .pipe(
                    tap(
                        (resp) => {
                            /* TODO FIXME :: update message detail to disable button and show recall count*/
                        },
                        (error) => {
                            /* TODO SHOW STATIC ERROR MESSAGE*/
                        },
                    ),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Move the message back to the inbox from the trash box
     */
    clickMoveToInbox(): void {
        this._thread$
            .asObservable()
            .pipe(
                switchMap((thread) =>
                    this.messagingService.restoreDeletedThread(thread.id).pipe(
                        takeUntil(this.unsubscribe$),
                        tap(
                            (resp) => this.bottomSheetRef.dismiss(true),
                            (error) => {
                                /* TODO SHOW STATIC ERROR MESSAGE*/
                            },
                        ),
                    ),
                ),
            )
            .subscribe();
    }

    /**
     * Capture the documents from the file uploader
     *
     * @param uploadedDocumentIds the document ids that have been uploaded
     */
    onUploadDocuments(uploadedDocumentIds: number[]): void {
        this.uploadedDocuments$.next(uploadedDocumentIds);
    }

    /**
     * Capture Submit event and if valid submit to the server
     */
    onReply(): void {
        if (this.replyForm.valid && this.latestMessage) {
            this.portal$
                .pipe(
                    map((portal) => portal.toUpperCase()),
                    switchMap((portal) =>
                        this.userService.credential$.pipe(
                            map((credential) => {
                                if (portal === PortalType.ADMIN) {
                                    return { type: TargetUnitType.ADMIN, ids: [credential["adminId"]] } as TargetUnit;
                                }
                                if (portal === PortalType.PRODUCER) {
                                    return {
                                        type: TargetUnitType.PRODUCER,
                                        ids: [credential["producerId"]],
                                    } as TargetUnit;
                                }
                                return { type: TargetUnitType.MEMBER, ids: [credential["memberId"]] } as TargetUnit;
                            }),
                        ),
                    ),
                    withLatestFrom(this.uploadedDocuments$.asObservable(), this._thread$.asObservable()),
                    // Post the reply
                    switchMap(([fromTargetUnit, attachments, thread]) =>
                        this.messagingService.replyToThread(thread.id, {
                            from: fromTargetUnit,
                            sentTo: this.latestMessage.from,
                            body: this.replyForm.controls["replyMessage"].value,
                            attachments:
                                attachments && attachments.length > 0
                                    ? attachments.map(
                                          (attachment) =>
                                              ({
                                                  referenceType: ReferenceType.FILE,
                                                  referenceId: attachment,
                                              } as MessageAttachment),
                                      )
                                    : undefined,
                        }),
                    ),
                    tap((resp) => this.bottomSheetRef.dismiss()),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Toggle the reply state
     */
    toggleReply(): void {
        this.replying = !this.replying;
        this.replyingSubject$.next(this.replying);
    }
}
