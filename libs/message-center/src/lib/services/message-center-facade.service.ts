import {
    MessageCategory,
    Message,
    CategorizedMessage,
    BoxType,
    Thread,
    Comment,
    ProducerSearch,
    CategoryAdminAssignment,
} from "@empowered/api";
import { MemberListItem, Admin } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { Injectable } from "@angular/core";
import { MPGroupAccountService } from "@empowered/common-services";
import { Observable } from "rxjs";
import { filter, switchMap } from "rxjs/operators";
import {
    MessageCenterState,
    GetMessageCategories,
    GetThreadMessages,
    GetThreadAdminComments,
    GetAccountAdmins,
    GetCategoryAdminAssignments,
    GetAccountMembers,
    GetAccountProducers,
    GetBoxTypeThreads,
    GetSupervisoryAdmin,
} from "@empowered/ngxs-store";

@Injectable({
    providedIn: "root",
})
export class MessageCenterFacadeService {
    constructor(private readonly store: Store, private readonly mpGroup: MPGroupAccountService) {}

    /**
     * Get the threads for a box
     *
     * @param boxType box type for the threads
     * @returns list of threads for that box
     */
    getThreads(boxType: BoxType): Observable<Thread[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getThreads(account.id, boxType))),
        );
    }

    /**
     * Get the messages for a thread
     *
     * @param threadId target thread
     * @returns list of messages related to the thread
     */
    getMessages(threadId: number): Observable<(Message | CategorizedMessage)[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getMessages(account.id, threadId))),
        );
    }

    /**
     * Get the comments for a thread
     *
     * @param threadId target thread
     * @returns list of comments for the thread
     */
    getComments(threadId: number): Observable<Comment[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getComments(account.id, threadId))),
        );
    }

    /**
     * Get the assignments for the admins
     *
     * @returns the list of assingments
     */
    getAdminAssignments(): Observable<CategoryAdminAssignment[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getCategoryAdminAssignments(account.id))),
        );
    }

    /**
     * Get the list of admins for the group
     *
     * @returns the list of admins for the group
     */
    getAdmins(): Observable<Admin[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getAdmins(account.id))),
        );
    }

    /**
     * Get the categories for the group
     *
     * @returns The list of categories
     */
    getCategories(): Observable<MessageCategory[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getCategories(account.id))),
        );
    }

    /**
     * Get the members for the group
     *
     * @returns the list of members
     */
    getMembers(): Observable<MemberListItem[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getAccountMembers(account.id))),
        );
    }

    /**
     * Get the list of producers for the group
     *
     * @returns the list of producers
     */
    getProducers(): Observable<ProducerSearch[]> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getAccountProducers(account.id))),
        );
    }

    /**
     * Get the supervisory admin for the message center
     *
     * @returns the admin that is the supervisor
     */
    getSupervisoryAdmin(): Observable<Admin> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.select(MessageCenterState.getSupervisoryAdmin(account.id))),
        );
    }

    /**
     * Dispatch the action to get the threads
     *
     * @param boxType target box
     * @param forceRefresh if the data needs to be refreshed
     * @param search search criteria
     * @returns the action stream for the dispatch
     */
    requestThreads(boxType: BoxType, forceRefresh: boolean = false, search?: string): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            switchMap((account) => this.store.dispatch(new GetBoxTypeThreads(account.id, boxType, forceRefresh, search))),
        );
    }

    /**
     * Requests the messages for a thread
     *
     * @param threadId the thread to get the messages for
     * @param forceRefresh if the cache should be cleared
     * @returns the action stream for the dispatch
     */
    requestMessages(threadId: number, forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            switchMap((account) => this.store.dispatch(new GetThreadMessages(account.id, threadId, forceRefresh))),
        );
    }

    /**
     * Requests the comments for a thread
     *
     * @param threadId thread to get comments for
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestComments(threadId: number, forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetThreadAdminComments(account.id, threadId, forceRefresh))),
        );
    }

    /**
     * Request the categories for the group
     *
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestCategories(forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetMessageCategories(account.id, forceRefresh))),
        );
    }

    /**
     * Request the admins for the group
     *
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestAdmins(forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetAccountAdmins(account.id))),
        );
    }

    /**
     * Request the assignments for a given category
     *
     * @param categoryId the category to get assignments for
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestAdminAssignments(categoryId: number, forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetCategoryAdminAssignments(account.id, categoryId, forceRefresh))),
        );
    }

    /**
     * Request the members for the group
     *
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestMembers(forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetAccountMembers(account.id, forceRefresh))),
        );
    }

    /**
     * Request the producers for the group.
     *
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestProducers(forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetAccountProducers(account.id, forceRefresh))),
        );
    }

    /**
     * Requests the supervisory admin for the group
     * @param forceRefresh if the cache should be cleared or not
     * @returns the action stream for the dispatch
     */
    requestSupervisoryAdmin(forceRefresh: boolean = false): Observable<unknown> {
        return this.mpGroup.mpGroupAccount$.pipe(
            filter((account) => Boolean(account)),
            switchMap((account) => this.store.dispatch(new GetSupervisoryAdmin(account.id, forceRefresh))),
        );
    }
}
