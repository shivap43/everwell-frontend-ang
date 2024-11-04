/* eslint-disable no-underscore-dangle */
import { EmpoweredModalService } from "@empowered/common-services";
import { MessageCategory, CategoryAdminType, MessagingService, CategoryAdminAssignment, AdminAssignment } from "@empowered/api";
import { Observable, combineLatest, BehaviorSubject, fromEvent, forkJoin, of, Subject } from "rxjs";
import { AdminRolesModalComponent } from "./../../../components/modals/admin-roles-modal/admin-roles-modal.component";
import { Component, OnDestroy, ViewChild, AfterViewInit } from "@angular/core";
import { MessageCenterFacadeService } from "../../../services/message-center-facade.service";
import { map, distinctUntilChanged, share, withLatestFrom, catchError, filter, switchMap, takeUntil, first, tap } from "rxjs/operators";
import { FormBuilder, FormControl } from "@angular/forms";
import { MessageCenterLanguage, Admin } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";

const ERROR_MESSAGE = "CAUGHT ERROR";

@Component({
    selector: "empowered-admin-settings-container",
    templateUrl: "./admin-settings-container.component.html",
    styleUrls: ["./admin-settings-container.component.scss"],
})
export class AdminSettingsContainerComponent implements AfterViewInit, OnDestroy {
    MessageCenterLanguage = MessageCenterLanguage;

    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    /**
     * DATA PROPERTIES
     */
    // Reference to the save assingments button
    @ViewChild("saveAssignments", { static: true }) saveAssignments;
    // updated assignments, mapped the category ID to the category's assignments
    updatedAdminAssignments: Map<number, AdminAssignment> = new Map();

    /**
     * DATA OBSERVABLES
     */
    // Sharable list of admins
    admins$: Observable<Admin[]> = this.messageCenterFacade.getAdmins().pipe(share());

    // List of categories that whenever a new one is encountered, we request the store to load it
    categories$: Observable<MessageCategory[]> = this.messageCenterFacade
        .getCategories()
        .pipe(
            switchMap((categories) =>
                forkJoin(categories.map((category) => this.messageCenterFacade.requestAdminAssignments(category.id).pipe(first()))).pipe(
                    map((responses) => categories),
                ),
            ),
        );
    // Sharable list of admin assignments
    adminAssignments$: Observable<CategoryAdminAssignment[]> = this.messageCenterFacade.getAdminAssignments().pipe(share());
    // Observable data model for the view, combines the categories with their assignments
    categoryAdminAssignments$: Observable<(CategoryAdminAssignment & { category: MessageCategory })[]> = combineLatest([
        this.categories$,
        this.adminAssignments$,
    ]).pipe(
        map(([categories, assignments]) => {
            const categoryAdmins: (CategoryAdminAssignment & { category: MessageCategory })[] = [];
            categories.forEach((category) => {
                const adminAssignments = assignments.find((assignment) => assignment.categoryId === category.id);

                categoryAdmins.push(
                    adminAssignments
                        ? { categoryId: category.id, category: category, assignment: adminAssignments.assignment }
                        : { categoryId: category.id, category: category, assignment: undefined },
                );
            });
            return categoryAdmins;
        }),
        distinctUntilChanged(),
    );

    /** Behaviour subject to emit new assignments from children components (based on updatedAdminAssignments).
     *  Mapped the category ID to the category's assignments. */
    private readonly updatedAdminAssignmentsSubject$: BehaviorSubject<Map<number, AdminAssignment>> = new BehaviorSubject(
        this.updatedAdminAssignments,
    );

    supervisoryAdmin: Admin;
    supervisoryAdminControl: FormControl = this.formBuilder.control("");
    supervisoryAdmin$: Observable<Admin> = this.messageCenterFacade.getSupervisoryAdmin().pipe(
        filter((supervisor) => Boolean(supervisor)),
        tap((supervisor) => {
            this.supervisoryAdminControl.setValue(supervisor.id);
            this.supervisoryAdmin = supervisor;
        }),
    );
    didAddRequests = false;

    /**
     * Request the prerequisite data (facade actions)
     *
     * @param empoweredModal
     * @param messageCenterFacade
     * @param messagingService
     * @param formBuilder
     */
    constructor(
        private readonly empoweredModal: EmpoweredModalService,
        private readonly messageCenterFacade: MessageCenterFacadeService,
        private readonly messagingService: MessagingService,
        private readonly formBuilder: FormBuilder,
    ) {
        forkJoin(
            this.messageCenterFacade.requestAdmins(),
            this.messageCenterFacade.requestCategories(),
            this.messageCenterFacade.requestMembers(),
            this.messageCenterFacade.requestProducers(),
            this.messageCenterFacade.requestSupervisoryAdmin(),
        )
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe();
    }

    /**
     * After the view initializes, grab the save button and start listening for clicks. On click perform the save actions
     */
    ngAfterViewInit(): void {
        // Initialize handler for the save button click
        fromEvent(this.saveAssignments._elementRef.nativeElement, "click")
            .pipe(
                // Need other observable data with the click event to build out the http requests
                withLatestFrom(
                    // Latest admin assignments
                    this.updatedAdminAssignmentsSubject$.asObservable(),
                    // Old admin assingments
                    this.adminAssignments$,
                ),
                // Map the data into a list of http requests
                map(([clickEvent, updatedAssignments, oldAssignments]) => this.marshallToRequests(updatedAssignments, oldAssignments)),
                // Only start the submission process if there are requests to send
                filter((requests) => requests.length > 0),
                // Sort and map the array so that the requests for primary admins happen first
                map((requests) =>
                    requests
                        .sort((firstAdminRequest, secondAdminRequest) => (firstAdminRequest.categoryAdminType === "PRIMARY" ? -1 : 1))
                        .map((request) => request.request),
                ),
                // Start the http requests
                switchMap((httpRequsts) => forkJoin(httpRequsts)),
                // After the requests are sent off, get the categories...
                withLatestFrom(this.categories$),
                // ...and re-request the data from the server
                switchMap(([responses, categories]) =>
                    forkJoin(
                        categories.map((category) => this.messageCenterFacade.requestAdminAssignments(category.id, true).pipe(first())),
                    ),
                ),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();

        // Save the supervisory admin if it has been updated
        fromEvent(this.saveAssignments._elementRef.nativeElement, "click")
            .pipe(
                filter(
                    (event) =>
                        this.supervisoryAdminControl.value &&
                        (!this.supervisoryAdmin || !this.supervisoryAdmin.id !== this.supervisoryAdminControl.value),
                ),
                switchMap((event) => this.messagingService.setSupervisoryAdmin(this.supervisoryAdminControl.value)),
                switchMap((resp) => this.messageCenterFacade.requestSupervisoryAdmin()),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * On destroy, clean up the subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }

    /**
     * Open up the Admin Roles explanation modal
     */
    onClickShowAdminRolesModal(): void {
        this.empoweredModal.openDialog(AdminRolesModalComponent);
    }

    /**
     * Reads the emissions for the admin assignments
     *
     * @param categoryId category that is being evaluated
     * @param latestAssignments the assignments for the category
     */
    onEmitCurrentAssignments(categoryId: number, latestAssignments: AdminAssignment): void {
        this.updatedAdminAssignments.set(categoryId, latestAssignments);
        this.updatedAdminAssignmentsSubject$.next(this.updatedAdminAssignments);
    }

    /**
     * Function to convert the assignments into HTTP Requests
     *
     * @param updatedAssignments The new admin assignments
     * @param oldAssignments the old admin assignments
     * @return list of requests to make to update the admin assignments
     */
    marshallToRequests(
        updatedAssignments: Map<number, AdminAssignment>,
        oldAssignments: CategoryAdminAssignment[],
    ): { categoryAdminType: CategoryAdminType; request: Observable<string | HttpResponse<unknown>> }[] {
        let httpRequests: {
            categoryAdminType: CategoryAdminType;
            request: Observable<string | HttpResponse<unknown>>;
        }[] = [];
        updatedAssignments.forEach((assignments, categoryId) => {
            const oldAssignment: CategoryAdminAssignment = oldAssignments.find((assignment) => assignment.categoryId === categoryId);
            if (!oldAssignment) {
                // Everything is new, add all posts
                this.didAddRequests = true;
                Object.keys(assignments).forEach((adminId) =>
                    httpRequests.push({
                        categoryAdminType: assignments[adminId],
                        request: this.messagingService
                            .saveCategoryAdminAssignment(categoryId, Number(adminId), assignments[adminId])
                            .pipe(catchError((error) => of(ERROR_MESSAGE))),
                    }),
                );
            } else {
                httpRequests = this.updateAssignment(httpRequests, assignments, oldAssignment, categoryId);
            }
            // Only remove the map if requests were added
            if (this.didAddRequests) {
                this.updatedAdminAssignments.set(categoryId, {});
                this.updatedAdminAssignmentsSubject$.next(this.updatedAdminAssignments);
            }
        });
        return httpRequests;
    }
    /**
     * Function to update the requests for admin assignments
     * @param httpRequests list of requests to make to update the admin assignments
     * @param assignments new admin assignments
     * @param oldAssignment the old admin assignments
     * @param categoryId categoryId
     * @returns httpRequests list of updated requests to make to update the admin assignments
     */
    updateAssignment(
        httpRequests: {
            categoryAdminType: CategoryAdminType;
            request: Observable<string | HttpResponse<unknown>>;
        }[],
        assignments: AdminAssignment,
        oldAssignment: CategoryAdminAssignment,
        categoryId: number,
    ): {
            categoryAdminType: CategoryAdminType;
            request: Observable<string | HttpResponse<unknown>>;
        }[] {
        // For each assignment determine if it is an update, or delete
        // Keep track of the updated or correct assignments
        const correctAssignments: string[] = [];
        Object.keys(assignments).forEach((adminId) => {
            if (!("adminId" in oldAssignment.assignment) || oldAssignment.assignment[adminId] !== assignments[adminId]) {
                // Either a new assignment or an updated assignment
                this.didAddRequests = true;
                correctAssignments.push(adminId);
                httpRequests.push({
                    categoryAdminType: assignments[adminId],
                    request: this.messagingService
                        .saveCategoryAdminAssignment(categoryId, Number(adminId), assignments[adminId])
                        .pipe(catchError((error) => of(ERROR_MESSAGE))),
                });
            } else if (oldAssignment.assignment[adminId] === assignments[adminId]) {
                // Assignment does not need to be updated, it is already correct
                correctAssignments.push(adminId);
            }
        });
        // Find any assignments that exist in the old assignments that are not part of the new assignments and remove them
        Object.keys(oldAssignment.assignment).forEach((adminId) => {
            if (!correctAssignments.some((admin) => admin === adminId)) {
                this.didAddRequests = true;
                httpRequests.push({
                    categoryAdminType: "STANDARD",
                    request: this.messagingService
                        .deleteCategoryAdminAssignment(categoryId, Number(adminId))
                        .pipe(catchError((error) => of(ERROR_MESSAGE))),
                });
            }
        });
        return httpRequests;
    }
}
