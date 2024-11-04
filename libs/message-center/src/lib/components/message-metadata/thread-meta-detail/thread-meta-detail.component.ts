import { Component, Input, OnDestroy } from "@angular/core";
import { Message, Thread, CategorizedMessage, MessagingService } from "@empowered/api";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { filter, map, switchMap, withLatestFrom, takeUntil } from "rxjs/operators";
import { MessageCenterFacadeService } from "../../../services/message-center-facade.service";
import { StatusModalComponent } from "../../modals/status-modal/status-modal.component";
import { EmpoweredModalService } from "@empowered/common-services";
import { AssignAdminModalComponent } from "../../modals/assign-admin-modal/assign-admin-modal.component";
import { CategoryModalComponent } from "../../modals/category-modal/category-modal.component";
import { LanguageService } from "@empowered/language";
import { MessageCenterLanguage } from "@empowered/constants";

@Component({
    selector: "empowered-thread-meta-detail",
    templateUrl: "./thread-meta-detail.component.html",
    styleUrls: ["./thread-meta-detail.component.scss"],
})
export class ThreadMetaDetailComponent implements OnDestroy {
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    // Language
    labelTo = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_TO);
    labelCategory = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_CATEGORY);
    labelFrom = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_FROM);
    labelStatus = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_STATUS);
    labelAssignedAdmin = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_ASSIGNED_ADMIN);
    labelSubject = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_SUBJECT);
    labelSent = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_SENT);
    changeLabelChange = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_CHANGE);
    changeLabelAssignAnAdmin = this.languageService.fetchPrimaryLanguageValue(MessageCenterLanguage.THREAD_META_LABEL_ASSIGN_ADMIN);

    // Subjects for setter inputs
    private readonly threadSubject$: BehaviorSubject<Thread> = new BehaviorSubject<Thread>(undefined);
    private readonly messageSubject$: BehaviorSubject<Message | CategorizedMessage> = new BehaviorSubject<Message | CategorizedMessage>(
        undefined,
    );

    // Observables based off setting inputs
    readonly thread$: Observable<Thread> = this.threadSubject$.asObservable();
    readonly message$: Observable<Message | CategorizedMessage> = this.messageSubject$.asObservable();
    readonly messageCategory$: Observable<string> = this.thread$.pipe(
        filter((pipeThread) => "categoryId" in pipeThread),
        switchMap((pipeThread) =>
            this.messageCenterFacade
                .getCategories()
                .pipe(map((categories) => categories.find((category) => category.id && category.id === pipeThread.categoryId))),
        ),
        map((category) => category.name),
    );

    @Input() set thread(inputThread: Thread) {
        this.threadSubject$.next(inputThread);
    }
    get thread(): Thread {
        return this.threadSubject$.value;
    }
    @Input() set message(inputMessage: Message | CategorizedMessage) {
        this.messageSubject$.next(inputMessage);
    }
    get message(): Message | CategorizedMessage {
        return this.messageSubject$.value;
    }
    @Input() isAdminPortal = false;
    @Input() showChange = false;

    constructor(
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly messagingService: MessagingService,
        private readonly languageService: LanguageService,
    ) {}

    /**
     * Unsubscribe from subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * When the change status is clicked, open the modal, submit the response to the server
     */
    onChangeStatusClick(): void {
        this.empoweredModal
            .openDialog(StatusModalComponent, { data: ["NEW", "CLOSED", "INRESEARCH"] })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this.thread$),
                switchMap(([resp, thread]) => {
                    thread.status = resp;
                    return this.messagingService.updateThread(thread.id, thread);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * When the category change is clicked, open the modal, submit the response to the server
     */
    onChangeCategoryClick(): void {
        this.empoweredModal
            .openDialog(CategoryModalComponent, { data: { categories: this.messageCenterFacade.getCategories() } })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this.thread$),
                switchMap(([resp, thread]) => {
                    thread.categoryId = resp;
                    return this.messagingService.updateThread(thread.id, thread);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * When the change admin is clicked, open the modal, submit the response to the server
     */
    onChangeAdminClick(): void {
        this.empoweredModal
            .openDialog(AssignAdminModalComponent, { data: { isUpdate: true, admins: this.messageCenterFacade.getAdmins() } })
            .afterClosed()
            .pipe(
                filter((resp) => Boolean(resp)),
                withLatestFrom(this.thread$),
                switchMap(([resp, thread]) => {
                    thread.assignedAdminId = +resp;
                    return this.messagingService.updateThread(thread.id, thread);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }
}
