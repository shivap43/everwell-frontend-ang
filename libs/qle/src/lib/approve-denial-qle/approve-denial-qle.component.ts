import { Component, OnInit, Inject, OnDestroy } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from "@angular/material/dialog";
import { DocumentApiService, QLEEndPlanRequestStatus } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { Observable, Subscription } from "rxjs";
import { DatePipe } from "@angular/common";
import { MemberInfoState, SetMemberQualifyingEvent, AccountListState, SharedState, RegexDataType } from "@empowered/ngxs-store";
import { PendingEnrollmentComponent } from "../pending-enrollment/pending-enrollment.component";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { tap } from "rxjs/operators";
import { DateFormats, MemberCredential, StatusType, Document } from "@empowered/constants";
import { filter } from "rxjs/operators";

const REVIEW_PENDING_ENROLLMENT = "primary.portal.qle.reviewPendingEnrollment.lifeEventDetails";

@Component({
    selector: "empowered-approve-denial-qle",
    templateUrl: "./approve-denial-qle.component.html",
    styleUrls: ["./approve-denial-qle.component.scss"],
})
export class ApproveDenialQleComponent implements OnInit, OnDestroy {
    @Select(SharedState.regex) regex$: Observable<RegexDataType>;
    memberInfo: any;
    mpGroupId: number;
    memberId: number;
    apiSubscription: Subscription[] = [];
    qualifyingEventId: number;
    expand: string;
    formTitle: string;
    isPending = false;
    eventType$: Observable<any>;
    eventType: string;
    eventDate: string | Date;
    qleAdded: string | Date;
    adminComment: string;
    memberComment: string;
    errorResponse = false;
    errorMessage: string;
    documentFileName: string;
    uploadDate: string;
    documents: Document[] = [];
    formSubtitle: string;
    isDocument = false;
    isLoading = true;
    selectedQLE: any;
    portal = "";
    MEMBER_PORTAL = "member";
    isMember = false;
    name: string;
    sVariable = "'s";
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.cancel",
        "primary.portal.common.close",
        "primary.portal.qle.goToPendingEnrollment.btnLabel",
        "primary.portal.qle.goToPendingEnrollment.view",
        "primary.portal.qle.approved.endCoverageRequest",
        "primary.portal.qle.denied.endCoverageRequest",
        "primary.portal.qle.pending.endCoverageRequest",
        "primary.portal.qle.eventAdded",
        "primary.portal.qle.requestedEndDate",
        "primary.portal.qle.adminNotes",
        "primary.portal.qle.producerComments",
        "primary.portal.qle.employeeComments",
    ]);
    QLE_STATUS_COVERAGE_CANCELLED = QLEEndPlanRequestStatus.COVERAGE_CANCELLED;
    QLE_STATUS_REQUEST_SUBMITTED = QLEEndPlanRequestStatus.COVERAGE_CANCELLATION_REQUEST_SUBMITTED;
    QLE_STATUS_PENDING_HR_APPROVAL = QLEEndPlanRequestStatus.PENDING_HR_APPROVAL;
    STATUS_APPROVED = StatusType.APPROVED;
    STATUS_DENIED = StatusType.DENIED;
    STATUS_PENDING = StatusType.PENDING;
    STATUS_PENDING_AFLAC_APPROVAL = StatusType.PENDING_AFLAC_APPROVAL;
    STATUS_PENDING_HR_APPROVAL = StatusType.PENDING_HR_APPROVAL;
    PRODUCER = "PRODUCER";
    SUBSCRIBER = "SUBSCRIBER";
    ADMIN = "ADMIN";
    REQUESTED_END_DATE_FORMAT = DateFormats.MONTH_DAY_YEAR;
    validationRegex: RegexDataType;
    isAdminCommentValid: boolean;
    isMemberCommentValid: boolean;

    constructor(
        private readonly store: Store,
        private readonly dialogRef: MatDialogRef<ApproveDenialQleComponent>,
        private readonly dialog: MatDialog,
        private readonly datePipe: DatePipe,
        private readonly documentService: DocumentApiService,
        private readonly language: LanguageService,
        private readonly user: UserService,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
    ) {
        this.apiSubscription.push(
            this.regex$.pipe(filter((regexData) => regexData !== undefined && regexData !== null)).subscribe((regexData) => {
                this.validationRegex = regexData;
            }),
        );
    }

    /**
     * This is the initial function that gets executed in this component
     * @returns void
     */
    ngOnInit(): void {
        this.selectedQLE = this.data.selectedVal;
        this.apiSubscription.push(this.user.portal$.pipe(tap((portal) => (this.isMember = portal === this.MEMBER_PORTAL))).subscribe());
        if (this.isMember) {
            this.isMember = true;
            this.apiSubscription.push(
                this.user.credential$.subscribe((credential: MemberCredential) => {
                    this.mpGroupId = credential.groupId;
                    this.memberInfo = {};
                    this.memberInfo.id = credential.memberId;
                    this.name = credential.name.firstName + this.sVariable;
                }),
            );
        } else if (!this.isMember) {
            this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
            this.memberInfo = this.store.selectSnapshot(MemberInfoState.getMemberInfo);
            this.name = this.memberInfo.name.firstName + this.sVariable;
        }
        if (this.selectedQLE !== null) {
            this.store.dispatch(new SetMemberQualifyingEvent(this.selectedQLE));
            switch (this.selectedQLE.status) {
                case StatusType.APPROVED:
                    if (this.selectedQLE.isStatusViewPendingEnrollments) {
                        this.formTitle = REVIEW_PENDING_ENROLLMENT;
                        this.isPending = true;
                    } else {
                        this.isPending = false;
                        this.formTitle = "primary.portal.qle.approved.lifeEventDetails";
                    }
                    break;
                case StatusType.DENIED:
                    this.isPending = false;
                    this.formTitle = "primary.portal.qle.denied.lifeEventDetails";
                    break;
                case StatusType.PENDING:
                    if (this.selectedQLE.isNoEnrollment) {
                        this.isPending = false;
                    } else {
                        this.isPending = true;
                    }
                    this.formTitle = REVIEW_PENDING_ENROLLMENT;

                    break;
                case StatusType.PENDING_AFLAC_APPROVAL:
                    this.isPending = false;
                    this.formTitle = REVIEW_PENDING_ENROLLMENT;
                    break;
                case StatusType.PENDING_HR_APPROVAL:
                    this.isPending = false;
                    this.formTitle = REVIEW_PENDING_ENROLLMENT;
                    break;
                default:
                    return;
            }
            this.eventType = this.selectedQLE.type;
            this.eventDate = this.datePipe.transform(this.selectedQLE.eventDate, this.REQUESTED_END_DATE_FORMAT);
            this.qleAdded = this.datePipe.transform(this.selectedQLE.createDate, DateFormats.DATE_FORMAT_MM_DD_YY);
            this.adminComment = this.selectedQLE.adminComment;
            if (this.adminComment) {
                this.isAdminCommentValid = !this.adminComment.match(new RegExp(this.validationRegex.ACCOUNT_NAME));
            }
            this.memberComment = this.selectedQLE.memberComment;
            if (this.memberComment) {
                this.isMemberCommentValid = !this.memberComment.match(new RegExp(this.validationRegex.ACCOUNT_NAME));
            }
            if (this.selectedQLE.documents.length > 0) {
                this.isDocument = true;
                this.documents = this.selectedQLE.documents;
            } else {
                this.isDocument = false;
            }
            this.isLoading = false;
        }
    }

    openPendingEnrollmentDialog(): void {
        this.dialogRef.close();
        const dialogRef = this.dialog.open(PendingEnrollmentComponent, {
            minWidth: "100%",
            height: "100%",
            panelClass: "approve-qle",
            data: {
                selectedVal: this.data.selectedVal,
                selecteEvent: this.data.selecteEvent,
                enrollmentId: this.data.enrollmentId,
                editLifeEvent: false,
                memberDetails: this.memberInfo,
            },
        });
        dialogRef.afterClosed();
    }

    viewFile(documentId: number, fileName: string): void {
        const fileType = fileName.split(".").pop();
        this.apiSubscription.push(
            this.documentService.downloadDocument(documentId, this.mpGroupId).subscribe((response) => {
                switch (fileType) {
                    case "pdf": {
                        const pdfBlob = new Blob([response], { type: "application/pdf" });

                        /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                        if ((window.navigator as any).msSaveOrOpenBlob) {
                            (window.navigator as any).msSaveOrOpenBlob(pdfBlob);
                        } else {
                            const fileurl = URL.createObjectURL(pdfBlob);
                            window.open(fileurl, "_blank");
                        }
                        break;
                    }
                    default: {
                        const blob = new Blob([response], {
                            type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        });

                        /*
                        source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                        msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                        Typescript won't know this is a thing, so we have to use Type Assertion
                        */
                        if ((window.navigator as any).msSaveOrOpenBlob) {
                            (window.navigator as any).msSaveOrOpenBlob(blob);
                        } else {
                            const anchor = document.createElement("a");
                            anchor.download = fileName;
                            const fileURLBlob = URL.createObjectURL(blob);
                            anchor.href = fileURLBlob;
                            document.body.appendChild(anchor);
                            anchor.click();
                        }
                    }
                }
            }),
        );
    }

    closeForm(): void {
        this.dialogRef.close();
    }

    ngOnDestroy(): void {
        this.apiSubscription.forEach((sub) => {
            sub.unsubscribe();
        });
    }
}
