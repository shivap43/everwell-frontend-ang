import { first, map } from "rxjs/operators";
import {
    GetBoxTypeThreads,
    GetThreadMessages,
    GetMessageCategories,
    GetThreadAdminComments,
    GetCategoryAdminAssignments,
    GetAccountAdmins,
    GetAccountMembers,
    GetAccountProducers,
    GetSupervisoryAdmin,
} from "./message-center.actions";
import { State, Store, Action, StateContext, createSelector } from "@ngxs/store";
import { ThreadMessages, ThreadComments, BoxTypeThreads } from "./message-center.models";
import {
    MessagingService,
    Message,
    Comment,
    MessageCategory,
    AccountService,
    MemberService,
    ProducerSearch,
    ProducerService,
    CategorizedMessage,
    BoxType,
    Thread,
    CategoryAdminAssignment,
} from "@empowered/api";
import { MemberListItem, Admin } from "@empowered/constants";
import { Observable } from "rxjs";
import { throttleGroupDataUpdate } from "../rxjs-operators";
import { Injectable } from "@angular/core";
import { GroupData, GroupState } from "../group";

@State<undefined>({
    name: "messageCenter",
    defaults: undefined,
})
@Injectable()
export class MessageCenterState {
    constructor(
        private readonly store: Store,
        private readonly messageService: MessagingService,
        private readonly accountService: AccountService,
        private readonly memberService: MemberService,
        private readonly producerService: ProducerService,
    ) {}

    /**
     * Get the threads for a given group and box
     *
     * @param groupId the id to get threads for
     * @param boxType the box to get threads for
     * @returns selector to get the threads
     */
    static getThreads(groupId: number, boxType: BoxType): (GroupState: GroupData[]) => Thread[] {
        return createSelector([GroupState], (groupData: GroupData[]) => {
            const boxTypeThreads: BoxTypeThreads = GroupState.getSliceField<BoxTypeThreads[]>(groupId, GetBoxTypeThreads, [])
                .apply(null, [groupData])
                .find((boxThreads) => boxThreads.boxType === boxType);
            return boxTypeThreads ? boxTypeThreads.threads : [];
        });
    }

    /**
     * Get the messages for a given group and thread
     *
     * @param groupId the id to get the messages for
     * @param threadId the thread to get the messages for
     * @returns the selector for the messages
     */
    static getMessages(groupId: number, threadId: number): (state: GroupData[]) => (Message | CategorizedMessage)[] {
        return createSelector([GroupState], (groupData: GroupData[]) => {
            const threadMessages: ThreadMessages = GroupState.getSliceField<ThreadMessages[]>(groupId, GetThreadMessages, [])
                .apply(null, [groupData])
                .find((messages) => messages.threadId === threadId);
            return threadMessages ? threadMessages.messages : [];
        });
    }

    /**
     * Get the comments for a given group and thread
     *
     * @param groupId the group id to get the comments for
     * @param threadId the thread id to get the comments for
     * @returns the selector for the comments
     */
    static getComments(groupId: number, threadId: number): (state: GroupData[]) => Comment[] {
        return createSelector([GroupState], (groupData: GroupData[]) => {
            const comments: ThreadComments = GroupState.getSliceField<ThreadComments[]>(groupId, GetThreadAdminComments, [])
                .apply(null, [groupData])
                .find((threadComments) => threadComments.threadId === threadId);
            return comments ? comments.comments : [];
        });
    }

    /**
     * Get the supervisory admin for a given group
     *
     * @param groupId the group id to get the supervisor for
     * @returns the selector for the messages
     */
    static getSupervisoryAdmin(groupId: number): (state: GroupData[]) => Admin {
        return GroupState.getSliceField<Admin>(groupId, GetSupervisoryAdmin);
    }

    /**
     * Get the admin assignments for a given group
     *
     * @param groupId the group to get the admin assignments for
     * @returns the selector for the admin assignments
     */
    static getCategoryAdminAssignments(groupId: number): (state: GroupData[]) => CategoryAdminAssignment[] {
        return createSelector([GroupState], (groupData: GroupData[]) =>
            GroupState.getSliceField<CategoryAdminAssignment[]>(groupId, GetCategoryAdminAssignments, []).apply(null, [groupData]),
        );
    }

    /**
     * Get the producers of an account
     *
     * @param groupId the group to get the producers for
     * @returns the selector for the producers of an account
     */
    static getAccountProducers(groupId: number): (state: GroupData[]) => ProducerSearch[] {
        return GroupState.getSliceField<ProducerSearch[]>(groupId, GetAccountProducers, []);
    }

    /**
     * Get the categories for the given group
     *
     * @param groupId the group to get the categories for
     * @returns the selector for the categories
     */
    static getCategories(groupId: number): (state: GroupData[]) => MessageCategory[] {
        return GroupState.getSliceField<MessageCategory[]>(groupId, GetMessageCategories, []);
    }

    /**
     * Get the admins for the given group
     *
     * @param groupId the group to get the admins for
     * @returns the selector for the admins
     */
    static getAdmins(groupId: number): (state: GroupData[]) => Admin[] {
        return GroupState.getSliceField<Admin[]>(groupId, GetAccountAdmins, []);
    }

    /**
     * Get the members for the given group
     *
     * @param groupId the group to get the members for
     * @returns the selector for the members
     */
    static getAccountMembers(groupId: number): (state: GroupData[]) => MemberListItem[] {
        return GroupState.getSliceField<MemberListItem[]>(groupId, GetAccountMembers, []);
    }

    /**
     * Get the box threads and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetBoxTypeThreads)
    getThreads(context: StateContext<undefined>, action: GetBoxTypeThreads): Observable<BoxTypeThreads[]> | void {
        return throttleGroupDataUpdate(
            this.messageService.getThreadsByBoxType(action.boxType, action.search).pipe(
                first(),
                map((resp) => [
                    {
                        boxType: action.boxType,
                        threads: resp,
                    } as BoxTypeThreads,
                ]),
            ),
            this.store,
            GetBoxTypeThreads,
            action,
            (newValues) => [
                ...this.store
                    .selectSnapshot(GroupState.getSliceField<BoxTypeThreads[]>(action.groupId, GetBoxTypeThreads, []))
                    .filter((boxThread) => boxThread.boxType !== action.boxType),
                ...newValues,
            ],
            action.forceRefresh,
        );
    }

    /**
     * Get the thread's messages and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetThreadMessages)
    getThreadMessages(context: StateContext<undefined>, action: GetThreadMessages): Observable<ThreadMessages[]> | void {
        return throttleGroupDataUpdate(
            this.messageService.getThreadMessages(action.threadId, ["assignedAdminId"]).pipe(
                map(
                    (resp) =>
                        [
                            {
                                threadId: action.threadId,
                                messages: resp,
                            },
                        ] as ThreadMessages[],
                ),
                first(),
            ),
            this.store,
            GetThreadMessages,
            action,
            (newValues) => [
                ...this.store
                    .selectSnapshot(GroupState.getSliceField<ThreadMessages[]>(action.groupId, GetThreadMessages, []))
                    .filter((message) => message.threadId !== action.threadId),
                ...newValues,
            ],
            action.forceRefresh,
        );
    }

    /**
     * Get the thread's comments and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetThreadAdminComments)
    getThreadAdminComments(context: StateContext<undefined>, action: GetThreadAdminComments): Observable<ThreadComments[]> {
        return throttleGroupDataUpdate(
            this.messageService.getThreadComments(action.threadId).pipe(
                map((comments) => [
                    {
                        threadId: action.threadId,
                        comments: comments,
                        createdOn: new Date(),
                    } as ThreadComments,
                ]),
            ),
            this.store,
            GetThreadAdminComments,
            action,
            (newValues) => [
                ...this.store
                    .selectSnapshot(GroupState.getSliceField<ThreadComments[]>(action.groupId, GetThreadAdminComments, []))
                    .filter((threadComments) => threadComments.threadId !== action.threadId),
                ...newValues,
            ],
            action.forceRefresh,
        );
    }

    /**
     * Get the categories and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetMessageCategories)
    getMessageCategories(context: StateContext<undefined>, action: GetMessageCategories): Observable<MessageCategory[]> {
        return throttleGroupDataUpdate(
            this.messageService.getMessageCategories(),
            this.store,
            GetMessageCategories,
            action,
            undefined,
            action.forceRefresh,
        );
    }

    /**
     * Get the admin assignments and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetCategoryAdminAssignments)
    getCategoryAdminAssignments(
        context: StateContext<undefined>,
        action: GetCategoryAdminAssignments,
    ): Observable<CategoryAdminAssignment[]> {
        return throttleGroupDataUpdate(
            this.messageService.getCategoryAdminAssignments(action.categoryId).pipe(
                map((resp) => [
                    {
                        categoryId: action.categoryId,
                        assignment: resp,
                        createdOn: new Date(),
                    } as CategoryAdminAssignment,
                ]),
            ),
            this.store,
            GetCategoryAdminAssignments,
            action,
            (newValues) => [
                ...this.store
                    .selectSnapshot(GroupState.getSliceField<CategoryAdminAssignment[]>(action.groupId, GetCategoryAdminAssignments, []))
                    .filter((assignment) => assignment.categoryId !== action.categoryId),
                ...newValues,
            ],
            action.forceRefresh,
        );
    }

    /**
     * Get the admins and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetAccountAdmins)
    getAccountAdmins(context: StateContext<undefined>, action: GetAccountAdmins): Observable<Admin[]> {
        return throttleGroupDataUpdate(this.accountService.getAccountAdmins(), this.store, GetAccountAdmins, action);
    }

    /**
     * Get the members and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetAccountMembers)
    getAccountMembers(context: StateContext<undefined>, action: GetAccountMembers): Observable<MemberListItem[]> | void {
        return throttleGroupDataUpdate(
            // eslint-disable-next-line no-underscore-dangle
            this.memberService._searchMembers().pipe(map((resp) => (resp && resp.content ? resp.content : []))),
            this.store,
            GetAccountMembers,
            action,
            undefined,
            action.forceRefresh,
        );
    }

    /**
     * Get the account producers and cache them by group, and throttle them by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetAccountProducers)
    getAccountProducers(context: StateContext<undefined>, action: GetAccountProducers): Observable<ProducerSearch[]> {
        return throttleGroupDataUpdate(
            // TODO :: Currently not implemented by Java
            // this.producerService.producerSearch({ associatedAccountId: action.groupId }).pipe(map(content => content.content)),
            this.producerService.producerSearch({ filter: `accountId:${action.groupId}` }).pipe(map((content) => content.content)),
            this.store,
            GetAccountProducers,
            action,
            undefined,
            action.forceRefresh,
        );
    }

    /**
     * Get the supervisory admin and cache it by group, and throttle it by action
     *
     * @param context states context
     * @param action action to load threads
     * @returns the data observable that requests data from the API
     */
    @Action(GetSupervisoryAdmin)
    getSupervisoryAdmin(context: StateContext<undefined>, action: GetSupervisoryAdmin): Observable<Admin> {
        return throttleGroupDataUpdate(
            this.messageService.getSupervisoryAdmin(),
            this.store,
            GetSupervisoryAdmin,
            action,
            undefined,
            action.forceRefresh,
        );
    }
}
