import { Admin } from "@empowered/constants";
import { Message, MessageCategory } from "./models/message.model";
import { HttpResponse, HttpHeaders, HttpParams } from "@angular/common/http";
import { Thread, CreateThread } from "./models/thread.model";
import { Comment } from "./models/comment.model";
import { Configuration } from "../configuration";
import { HttpClient } from "@angular/common/http";
import { Injectable, Optional, Inject } from "@angular/core";
import { BASE_PATH } from "../variables";
import { Observable } from "rxjs";
import { AdminAssignment, CategoryAdminType } from "./models/assignments.model";

export type BoxType = "INBOX" | "SENT" | "DELETE";

export type GetThreadMessagesExpand = "assignedAdminId" | "audienceGroupingId";

@Injectable({
    providedIn: "root",
})
export class MessagingService {
    configuration = new Configuration();
    protected basePath = "/api";
    protected messagingBasePath = "/messageCenter";

    constructor(
        protected httpClient: HttpClient,
        @Optional() @Inject(BASE_PATH) basePath: string,
        @Optional() configuration: Configuration,
    ) {
        if (configuration) {
            this.configuration = configuration;
            this.configuration.basePath = configuration.basePath || basePath || this.basePath;
        } else {
            this.configuration.basePath = basePath || this.basePath;
        }
    }

    /**
     * Returns the list of threads for a given user
     *
     * @param boxType the box type to request
     * @param search filter the results on a partial subject, body, or sender (if applicable) match
     * @returns the list of threads
     */
    getThreadsByBoxType(boxType: BoxType, search?: string): Observable<Thread[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        let params: HttpParams = new HttpParams().set("boxType", boxType);
        if (search) {
            params = params.set("search", search);
        }

        return this.httpClient.get<Thread[]>(`${this.configuration.basePath}${this.messagingBasePath}/threads`, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Create a thread on the server
     *
     * @param thread thread / message object to create
     * @returns the response to the create request
     */
    createThread(thread: CreateThread): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/threads`, thread, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get the thread for a given Id
     *
     * @param threadId thread Id to request
     * @returns the thread
     */
    getThread(threadId: number): Observable<Thread> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<Thread>(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}`, {
            headers: headers,
        });
    }

    /**
     * Reply to a thread with a given message
     *
     * @param threadId the thread that is being replied to
     * @param threadReply the message response
     * @returns the reply response
     */
    replyToThread(threadId: number, threadReply: Message): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}`, threadReply, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Update the thread meta details
     *
     * @param threadId thread id to update
     * @param messageThread the new thread data
     * @returns the response to the update request
     */
    updateThread(threadId: number, messageThread: Thread): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.put(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}`, messageThread, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Delete the targeted thread
     *
     * @param threadId the thread id to delete
     * @returns the response to the delete request
     */
    deleteThread(threadId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.delete(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}`, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get all of the messages for a given thread
     *
     * @param threadId thread to get messages for
     * @param expand list of attributes to expand
     * @returns List of messages for the thread
     */
    getThreadMessages(threadId: number, expand?: GetThreadMessagesExpand[]): Observable<Message[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        let params = new HttpParams();

        if (expand && expand.length) {
            params = new HttpParams().set(
                "expand",
                expand.reduce((accumulator, expandValue) => accumulator.concat(expandValue), ""),
            );
        }

        return this.httpClient.get<Message[]>(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/messages`, {
            headers: headers,
            params: params,
        });
    }

    /**
     * Mark the given thread as read
     *
     * @param threadId the thread id to mark as read
     * @returns the response to the read request
     */
    readThread(threadId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/read`, null, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Recall the given thread
     *
     * @param threadId the thread id to recall
     * @returns the response to the recall request
     */
    recallLastMessage(threadId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/recallLast`, null, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get the comments for a given thread
     *
     * @param threadId the target thread
     * @returns the list of comments for the thread
     */
    getThreadComments(threadId: number): Observable<Comment[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<Comment[]>(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/comments`, {
            headers: headers,
        });
    }

    /**
     * Add a comment to the thread
     *
     * @param threadId the target thread id
     * @param comment the comment to add to the thread
     * @returns the response to the create request
     */
    createThreadComment(threadId: number, comment: Comment): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/comments`, comment, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get the targeted thread comment
     *
     * @param threadId the target thread id
     * @param commentId the target comment id
     * @returns the comment
     */
    getThreadComment(threadId: number, commentId: number): Observable<Comment> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<Comment>(
            `${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/comments/${commentId}`,
            { headers: headers },
        );
    }

    /**
     * Update a comment on a thread
     *
     * @param threadId the thread that the comment is on
     * @param commentId the comment to update
     * @param comment the comment to replace the old comment with
     * @returns the response to the update
     */
    updateThreadComment(threadId: number, commentId: number, comment: Comment): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.put(
            `${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/comments/${commentId}`,
            comment,
            { headers: headers, observe: "response" },
        );
    }

    /**
     * Delete given thread comment
     *
     * @param threadId target thread id with the comment
     * @param commentId comment id to remove
     * @returns response to delete
     */
    deleteThreadComment(threadId: number, commentId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.delete(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/comments/${commentId}`, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Restores a deleted thread to the inbox
     *
     * @param threadId the thread id
     * @returns the response to the restore response
     */
    restoreDeletedThread(threadId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/threads/${threadId}/restore`, null, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get all the message categories for the group
     *
     * @returns the list of message categories.
     */
    getMessageCategories(): Observable<MessageCategory[]> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<MessageCategory[]>(`${this.configuration.basePath}${this.messagingBasePath}/categories`, {
            headers: headers,
        });
    }

    /**
     * Create a new message category
     *
     * @param category the new category to create
     * @returns response to creating a category
     */
    createMessageCategory(category: string): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/categories`, name, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get the category by ID
     *
     * @param categoryId the target category's ID
     * @returns the target message category
     */
    getMessageCategory(categoryId: number): Observable<MessageCategory> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<MessageCategory>(`${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}`, {
            headers: headers,
        });
    }

    /**
     * Update the message category with a new category
     *
     * @param categoryId the target category to update
     * @param category the new category
     * @returns the response to the update to updating the message category
     */
    updateMessageCategory(categoryId: number, category: string): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.put(`${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}`, category, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Delete the message category
     *
     * @param categoryId the target category's ID
     * @returns the response to the delete request for the message category
     */
    deleteMessageCategory(categoryId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.delete(`${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}`, {
            headers: headers,
            observe: "response",
        });
    }

    /**
     * Get all the category assignments for the admins
     *
     * @param categoryId the category id
     * @returns a JSON map of the assignments
     */
    getCategoryAdminAssignments(categoryId: number): Observable<AdminAssignment> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<AdminAssignment>(
            `${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}/admins`,
            {
                headers: headers,
            },
        );
    }

    /**
     * Get the category assignment for an admin
     *
     * @param categoryId the category ID
     * @param adminId the admin ID
     * @returns the category admin type for that category id and admin id
     */
    getCategoryAdminAssignment(categoryId: number, adminId: number): Observable<CategoryAdminType> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<CategoryAdminType>(
            `${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}/admins/${adminId}`,
            { headers: headers },
        );
    }

    /**
     * update the category assignments for a category and admin.
     *
     * @param categoryId the category to update assignments for
     * @param adminId the admin id that the assignments belong to
     * @param categoryAdminType the assignments for the admin and category
     * @returns the response to the save request
     */
    saveCategoryAdminAssignment(
        categoryId: number,
        adminId: number,
        categoryAdminType: CategoryAdminType,
    ): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(
            `${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}/admins/${adminId}`,
            categoryAdminType,
            { headers: headers, observe: "response" },
        );
    }

    /**
     * Delete the category assignments for an admin
     *
     * @param categoryId the category ID for the assignments
     * @param adminId the admin ID to remove the assignments for
     * @returns the response to the delete request
     */
    deleteCategoryAdminAssignment(categoryId: number, adminId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.delete(
            `${this.configuration.basePath}${this.messagingBasePath}/categories/${categoryId}/admins/${adminId}`,
            { headers: headers, observe: "response" },
        );
    }

    /**
     * get the supervisory admin for the group
     *
     * @returns the supervisory admin for the group
     */
    getSupervisoryAdmin(): Observable<Admin> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.get<Admin>(`${this.configuration.basePath}${this.messagingBasePath}/supervisoryAdmin`, {
            headers: headers,
        });
    }

    /**
     * set the new supervisory admin
     *
     * @param adminId the admin to be the new supervisory admin
     * @returns the response to the update request
     */
    setSupervisoryAdmin(adminId: number): Observable<HttpResponse<unknown>> {
        const headers: HttpHeaders = new HttpHeaders().set("MP-Group", "");

        return this.httpClient.post(`${this.configuration.basePath}${this.messagingBasePath}/supervisoryAdmin`, adminId, {
            headers: headers,
            observe: "response",
        });
    }
}
