import { of, combineLatest, BehaviorSubject, Subject, iif, defer, Observable } from "rxjs";
import { FormBuilder, FormGroup, Validators, FormControl, AbstractControl, ValidatorFn } from "@angular/forms";
import { UserService } from "@empowered/user";
import { Component, ViewChild, ViewContainerRef, OnDestroy } from "@angular/core";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import {
    shareReplay,
    map,
    withLatestFrom,
    distinctUntilChanged,
    tap,
    startWith,
    switchMap,
    takeUntil,
    filter,
    first,
} from "rxjs/operators";
import {
    AbstractAudience,
    DocumentApiService,
    Resource,
    Thread,
    TargetUnit,
    TargetUnitType,
    AccountService,
    MessagingService,
    MessageAttachment,
    MessageCategory,
} from "@empowered/api";
import { Store } from "@ngxs/store";
import { ResourceListState, StaticUtilService } from "@empowered/ngxs-store";
import { OptionData } from "../compose-message-components/single-recipient-input/single-recipient-input.component";
import { MessageCenterFacadeService } from "../../services/message-center-facade.service";
import { ConfigName, MessageCenterLanguage } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { DeleteFunction, UploadFunction } from "@empowered/ui";
import { SharedService } from "@empowered/common-services";

const SINGLE_RECIPIENT_ERROR_MESSAGE = "Missing single recipient response";
const PORTAL_ADMIN = "admin";
const PORTAL_PRODUCER = "producer";
const RECIPIENT_TYPE_SINGLE = "single";
const RECIPIENT_TYPE_PRODUCER = "producer";
const ATTACHMENT_TYPE_FILE = "file";

// Form control names
const FORM_INPUT_SINGLE_RECIPIENT = "singleRecipient";
const FORM_INPUT_SUBJECT = "subject";
const FORM_INPUT_MESSAGE = "message";
const FORM_INPUT_RESOURCE_ID = "resourceId";
const FORM_INPUT_CATEGORY_ID = "categoryId";

@Component({
    selector: "empowered-compose-message",
    templateUrl: "./compose-message.component.html",
    styleUrls: ["./compose-message.component.scss"],
})
export class ComposeMessageComponent implements OnDestroy {
    readonly MessageCenterLanguage = MessageCenterLanguage;
    readonly PORTAL_ADMIN = PORTAL_ADMIN;
    readonly PORTAL_PRODUCER = PORTAL_PRODUCER;
    readonly RECIPIENT_TYPE_PRODUCER = RECIPIENT_TYPE_PRODUCER;
    readonly RECIPIENT_TYPE_SINGLE = RECIPIENT_TYPE_SINGLE;
    readonly MAX_FILE_SIZE = 10240;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    @ViewChild("recipientInput", { read: ViewContainerRef }) recipientInputView: ViewContainerRef;
    @ViewChild("attachmentInput", { read: ViewContainerRef }) attachmentInputView: ViewContainerRef;

    // Language
    uploadFileLabel = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_CENTER_COMPOSE_FILE_UPLOAD_LABEL);
    uploadFileHint = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.MESSAGE_CENTER_COMPOSE_FILE_UPLOAD_HINT);

    recipientType: FormControl = this.builder.control(RECIPIENT_TYPE_SINGLE);
    attachmentType: FormControl = this.builder.control(ATTACHMENT_TYPE_FILE);

    readonly FORM_INPUT_SINGLE_RECIPIENT = FORM_INPUT_SINGLE_RECIPIENT;
    readonly FORM_INPUT_SUBJECT = FORM_INPUT_SUBJECT;
    readonly FORM_INPUT_MESSAGE = FORM_INPUT_MESSAGE;
    readonly FORM_INPUT_RESOURCE_ID = FORM_INPUT_RESOURCE_ID;
    readonly FORM_INPUT_CATEGORY_ID = FORM_INPUT_CATEGORY_ID;
    form: FormGroup = this.builder.group(
        {
            [FORM_INPUT_SINGLE_RECIPIENT]: [[], this.singleRecipientValidator(this.recipientType)],
            [FORM_INPUT_SUBJECT]: [
                "",
                [Validators.required],
                [
                    (abstractControl: AbstractControl) =>
                        this.staticUtil.cacheConfigValue(ConfigName.MESSAGE_CENTER_SUBJECT_LENGTH).pipe(
                            first(),
                            filter((charLimit) => Boolean(charLimit)),
                            map((charLimit) =>
                                abstractControl.value && abstractControl.value.length <= +charLimit
                                    ? undefined
                                    : { subjectTooLong: "true" },
                            ),
                        ),
                ],
            ],
            [FORM_INPUT_MESSAGE]: ["", Validators.required],
            [FORM_INPUT_RESOURCE_ID]: [],
            [FORM_INPUT_CATEGORY_ID]: [],
        },
        {
            updateOn: "submit",
        },
    );

    private readonly singleRecipientValue$: BehaviorSubject<OptionData[]> = new BehaviorSubject<OptionData[]>([]);

    multiRecipientInit!: AbstractAudience[];
    private readonly multipleRecipientValue$: BehaviorSubject<AbstractAudience[]> = new BehaviorSubject(this.multiRecipientInit);

    private readonly uploadedAttachments$: BehaviorSubject<number[]> = new BehaviorSubject<number[]>([]);

    /**
     * DATA OBSERVABLES
     */
    // portal of the logged in user
    portal$: Observable<string> = this.sharedService.userPortal$.pipe(
        map((portalState) => portalState.type),
        shareReplay(1),
    );

    // Checks to see if the user has benefit resources available
    // TODO :: IMPLEMENT THE LOOKUP
    hasBenefitResources$: Observable<boolean> = of(true).pipe(shareReplay(1));

    // Determine if the attachment type drop down can be displayed
    doDisplayAttachmentType$: Observable<boolean> = combineLatest([this.portal$, this.hasBenefitResources$]).pipe(
        map(([portal, hasBenefitResources]) => portal === PORTAL_ADMIN && hasBenefitResources),
    );

    // List of available resources
    resources$: Observable<Resource[]> = this.store.select(ResourceListState.getResourceList);

    // List of categories
    categories$: Observable<MessageCategory[]> = this.messageCenterFacade.getCategories();

    /**
     * EVENT OBSERVABLES
     */
    // Monitor for changes in the recipient type and display the correct input component
    recipientTypeValueChange$: Observable<string> = this.recipientType.valueChanges.pipe(
        startWith(RECIPIENT_TYPE_SINGLE),
        distinctUntilChanged(),
    );

    showFileUpload$: Observable<boolean> = this.attachmentType.valueChanges.pipe(
        startWith(ATTACHMENT_TYPE_FILE),
        map((attachmentType) => attachmentType === ATTACHMENT_TYPE_FILE),
    );

    constructor(
        private readonly bottomSheetRef: MatBottomSheetRef,
        private readonly builder: FormBuilder,
        private readonly sharedService: SharedService,
        private readonly documentService: DocumentApiService,
        private readonly store: Store,
        private readonly userService: UserService,
        private readonly accountService: AccountService,
        private readonly messagingService: MessagingService,
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly staticUtil: StaticUtilService,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Unsubscribe from the observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    // Functions used to upload and delete documents
    uploadFunction: UploadFunction = (file: File) => this.documentService.uploadDocument(file);
    deleteFunction: DeleteFunction = (documentId: number) => this.documentService.deleteDocument(documentId);

    /**
     * Validator function to validate the length of subject
     *
     * @param recipientType the control for the recipient type
     * @returns The validator function
     */
    singleRecipientValidator(recipientType: FormControl): ValidatorFn {
        return (control: AbstractControl): { [key: string]: any } | null =>
            recipientType.value === RECIPIENT_TYPE_SINGLE && (!control || !control.value || control.value.length <= 0)
                ? { required: SINGLE_RECIPIENT_ERROR_MESSAGE }
                : null;
    }

    /**
     * Close the sheet
     */
    close(): void {
        this.bottomSheetRef.dismiss();
    }

    /**
     * Submit the form and build the thread and message
     */
    onSubmit(): void {
        if (this.form.valid) {
            this.portal$
                .pipe(
                    switchMap((portal) =>
                        this.userService.credential$.pipe(
                            map((credential) => {
                                if (portal === PORTAL_ADMIN) {
                                    return { type: TargetUnitType.ADMIN, ids: [credential["adminId"]] } as TargetUnit;
                                }
                                if (portal === PORTAL_PRODUCER) {
                                    return {
                                        type: TargetUnitType.PRODUCER,
                                        ids: [credential["producerId"]],
                                    } as TargetUnit;
                                }
                                return { type: TargetUnitType.MEMBER, ids: [credential["memberId"]] } as TargetUnit;
                            }),
                        ),
                    ),
                    // determine if audience and submit, output should be sentTo target unit (switchMap, inner pipe)
                    switchMap((fromTargetUnit) =>
                        iif(
                            () => this.recipientType.value === "audience",
                            defer(() =>
                                this.multipleRecipientValue$.asObservable().pipe(
                                    switchMap((recipients) => this.accountService.createAudienceGrouping({ audiences: recipients })),
                                    map((resp) => {
                                        const locationParts: string[] = resp.headers.get("location").split("/");
                                        return +locationParts[locationParts.length - 1];
                                    }),
                                    map((audienceId) => ({ type: TargetUnitType.AUDIENCE, ids: [audienceId] } as TargetUnit)),
                                ),
                            ),
                            defer(() =>
                                of(this.form.controls[FORM_INPUT_SINGLE_RECIPIENT].value).pipe(
                                    map(
                                        (singleRecipientValues) =>
                                            ({
                                                type: singleRecipientValues[0].type,
                                                ids: singleRecipientValues.map((value) => value.value),
                                            } as TargetUnit),
                                    ),
                                ),
                            ),
                        ).pipe(
                            // Got the to in the pipe, and the from in scope
                            withLatestFrom(this.uploadedAttachments$.asObservable()),
                            switchMap(([toTargetUnit, attachments]) =>
                                this.messagingService.createThread({
                                    thread: {
                                        from: fromTargetUnit,
                                        sentTo: toTargetUnit,
                                        subject: this.form.controls[FORM_INPUT_SUBJECT].value,
                                        categoryId:
                                            this.form.controls[FORM_INPUT_CATEGORY_ID].value &&
                                            this.recipientType.value !== RECIPIENT_TYPE_PRODUCER
                                                ? +this.form.controls[FORM_INPUT_CATEGORY_ID].value
                                                : undefined,
                                    } as Thread,
                                    message: {
                                        from: fromTargetUnit,
                                        sentTo: toTargetUnit,
                                        body: this.form.controls[FORM_INPUT_MESSAGE].value,
                                        attachments:
                                            this.attachmentType.value === ATTACHMENT_TYPE_FILE
                                                ? attachments.map(
                                                      (attachment) =>
                                                          ({
                                                              referenceType: "FILE",
                                                              referenceId: attachment,
                                                          } as MessageAttachment),
                                                  )
                                                : [
                                                      {
                                                          referenceType: "RESOURCE",
                                                          referenceId: +[this.form.controls[FORM_INPUT_RESOURCE_ID].value],
                                                      } as MessageAttachment,
                                                  ],
                                    },
                                }),
                            ),
                        ),
                    ),
                    tap((resp) => this.bottomSheetRef.dismiss()),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe();
        }
    }

    /**
     * Update the single recipient value with the latest emitted value
     *
     * @param newValues new emitted value
     */
    updateSingleRecipient(newValues: OptionData[]): void {
        this.singleRecipientValue$.next(newValues);
    }

    /**
     * Update the multiple recipient value with the latest emitted value
     *
     * @param newValue new emitted value
     */
    updateMultiRecipient(newValue: AbstractAudience[]): void {
        this.multipleRecipientValue$.next(newValue);
    }

    /**
     * Catch the upload of documents from the uploader
     *
     * @param uploadedDocuments the full list of uploaded documents
     */
    documentUpload(uploadedDocuments: number[]): void {
        this.uploadedAttachments$.next(uploadedDocuments);
    }
}
