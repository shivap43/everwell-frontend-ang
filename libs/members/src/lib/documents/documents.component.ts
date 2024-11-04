import { Subscription, forkJoin, Observable, Subject } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";
import {
    MemberService,
    MemberNote,
    DocumentsGridTitles,
    DocumentApiService,
    StaticService,
    AccountService,
    FormType,
    ShoppingCartDisplayService,
    EnrollmentService,
    PdaForm,
    SendReminderMode,
    PendingReasonForPdaCompletion,
} from "@empowered/api";
import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Store } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { SummaryPipe, MonDialogData, MonDialogComponent, CreateNewPdaPopupComponent, NewPdaComponent } from "@empowered/ui";
import { AddUpdateDocumentComponent } from "./add-update-document/add-update-document.component";
import { MatTableDataSource } from "@angular/material/table";
import { MatDialog } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { UserService } from "@empowered/user";
import { map, filter, switchMap, tap, takeUntil } from "rxjs/operators";
import {
    Permission,
    DateFormats,
    ConfigName,
    ClientErrorResponseCode,
    CompanyCode,
    AppSettings,
    Portals,
    PartnerAccountType,
    ProducerCredential,
    MemberContactListDisplay,
} from "@empowered/constants";
import { PdaCompletionComponent } from "@empowered/enrollment";
import { SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

const DEC_CONVERSION = 10;

@Component({
    selector: "empowered-documents",
    templateUrl: "./documents.component.html",
    styleUrls: ["./documents.component.scss"],
    providers: [DatePipe, SummaryPipe],
})
export class DocumentsComponent implements OnInit, OnDestroy {
    memberInfo: any;
    memberId: number;
    mpGroupId: number;
    notes: MemberNote[];
    displayedColumnsDocs: DocumentsGridTitles[];
    dataSource: MatTableDataSource<any[]>;
    data: any[];
    isSpinnerLoading = false;
    lastUploadFileName: string;
    phoneNumber = "phoneNumber";
    contactForm: FormGroup;
    // Need form control here as we are using single form control here
    pageNumberControl: FormControl = new FormControl(1);
    pageSizeOption: any;
    langStrings: Record<string, string>;
    errorMessageArray = [];
    ERROR = "error";
    DETAILS = "details";
    isLoading = true;
    errorMessage: string;
    email = "email";
    requestSent = false;
    hasMemberContact = false;
    showErrorMessage = false;
    unsignedPDAForms: PdaForm[] = [];
    maxSummaryCharacters = 90;
    CONFIG_MAX_CHAR = "user.note.maximum_number_of_character";
    maxNoteLength: number;
    maxFileSize: number;
    producerId: number;
    firstName = "";
    manualAddData: any;
    disableSendReminder = false;
    contactList: MemberContactListDisplay[] = [];
    isMemberPortal = false;
    isDirect = false;
    isAccountProducer = true;
    UserPermissions = Permission;
    readonly CREATE_FORM_PDA: string = Permission.CREATE_PDA_MEMBER;
    isCreatePdaPartnerAccountType$: Observable<boolean>;
    isPRStateMember: boolean;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    isPrPDAConfigEnabled: boolean;
    portal: string;
    showContact: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    /** Lifecycle hook */
    constructor(
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly dialog: MatDialog,
        private readonly docService: DocumentApiService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly datePipe: DatePipe,
        private readonly domSanitizer: DomSanitizer,
        private readonly languageService: LanguageService,
        private readonly staticService: StaticService,
        private readonly userService: UserService,
        private readonly route: ActivatedRoute,
        private readonly enrollmentsService: EnrollmentService,
        private readonly fb: FormBuilder,
        private readonly router: Router,
        private readonly accountService: AccountService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly sharedService: SharedService,
        private readonly staticUtilService: StaticUtilService,
        private readonly utilService: UtilService,
    ) {
        this.route.parent.parent.params.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            this.mpGroupId = params["mpGroupId"] ? params["mpGroupId"] : params["mpGroup"];
            this.memberId = params["memberId"] ? params["memberId"] : params["customerId"];
        });
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.pageSizeOption = [5];
        // Checking for Direct Path
        if (this.router.url.includes("direct")) {
            this.isDirect = true;
        }
    }

    /**
     * Lifecycle hook
     * method to get producer id
     * Method to initialize necessary variable
     * Method to call different methods
     */
    ngOnInit(): void {
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.producerId = credential.producerId;
        });
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.PR_PDA_TEMPLATE)
            .pipe(filter((prConfig) => prConfig))
            .subscribe(() => {
                this.isPrPDAConfigEnabled = true;
            });
        this.portal = this.store.selectSnapshot(SharedState.portal);
        if (this.portal) {
            this.portal = "/" + this.portal.toLowerCase();
        }
        // get member firstname
        this.memberService
            .getMember(this.memberId, true, this.mpGroupId.toString())
            .pipe(
                tap((member) => {
                    this.firstName = member.body.name.firstName;
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
        this.memberService
            .getAllCompletedForms(this.memberId, this.mpGroupId.toString(), true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.unsignedPDAForms = data.PDA;
            });

        this.dataSource = new MatTableDataSource<any>(this.manualAddData);
        this.dataSource.data = [];
        this.fetchDocuments();
        this.fetchLanguageStrings();
        this.fetchConfigurations();
        this.setCreatePDAPartnerAccountType();
        this.sharedService
            .checkPRState(this.memberId, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((result) => (this.isPRStateMember = result));
        this.getProducerDetails();
        this.getContactList();
    }

    /**
     *
     * This method is used to navigate into contact info page
     *
     */
    addContactInfo(): void {
        this.portal += `${this.isDirect ? "/direct" : "/payroll"}`;
        const url = `${this.portal}/${this.mpGroupId}/member/${this.memberId}/memberadd/`;
        this.router.navigate([url]);
    }

    /**
     *
     * This method is used to set the list of member contacts exists
     */
    getContactList(): void {
        this.contactForm = this.fb.group({
            contacts: [""],
        });
        let textContacts: string[] = [];
        const emailContacts: { email: string; primary: boolean }[] = [];
        let selectedValue: MemberContactListDisplay;
        this.memberService
            .getMemberContacts(this.memberId, this.mpGroupId.toString())
            .pipe(
                tap((memberContacts) => {
                    memberContacts.forEach((contact) => {
                        if (contact.phoneNumbers?.length) {
                            textContacts = contact.phoneNumbers.map((phoneNumber) => phoneNumber.phoneNumber);
                        }
                        if (contact.emailAddresses?.length) {
                            contact.emailAddresses.forEach((emailAddress) => {
                                emailContacts.push({
                                    email: emailAddress.email,
                                    primary: emailAddress.primary,
                                });
                            });
                        }
                    });
                    if (emailContacts.length) {
                        emailContacts.forEach((contactData) => {
                            this.contactList.push({
                                contact: contactData.email,
                                disableField: false,
                                type: this.email,
                                primary: contactData.primary,
                            });
                        });
                        const primaryEmail = this.contactList.find((eachContact) => eachContact.primary);
                        selectedValue = primaryEmail || this.contactList[0];
                    } else {
                        this.contactList = [
                            {
                                contact: this.languageService.fetchPrimaryLanguageValue("primary.portal.headset.noemailaddress"),
                                disableField: true,
                            },
                        ];
                    }
                    if (textContacts.length) {
                        textContacts.forEach((contactValue) => {
                            this.contactList.push({
                                contact: contactValue,
                                disableField: false,
                                type: this.phoneNumber,
                                formatted: this.utilService.formatPhoneNumber(contactValue),
                            });
                        });
                        if (!selectedValue) {
                            selectedValue = this.contactList[0];
                        }
                    } else {
                        this.contactList.push({
                            contact: this.languageService.fetchPrimaryLanguageValue("primary.portal.headset.nomobile"),
                            disableField: true,
                        });
                    }
                    this.hasMemberContact = this.contactList?.some((contactDetail) => contactDetail.type);
                    this.contactForm.controls.contacts.setValue(selectedValue);
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     * This method fetches the producer details of the group
     */
    getProducerDetails(): void {
        this.accountService
            .getAccountProducers(this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((producerList) => {
                this.isAccountProducer = producerList.some((producer) => producer.producer.id === this.producerId);
            });
    }

    /**
     * Function to send the reminder to the customer for PDA completion
     */
    sendToCustomer(): void {
        const requestSignData = this.contactForm.value.contacts;
        this.isLoading = true;
        const requestData: SendReminderMode =
            requestSignData.type === this.email ? { email: requestSignData.contact } : { phoneNumber: requestSignData.contact };
        this.shoppingCartService
            .requestShoppingCartSignature(this.mpGroupId, this.memberId, requestData, PendingReasonForPdaCompletion.PDA)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                () => {
                    this.isLoading = false;
                    this.requestSent = true;
                },
                () => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * Method to set create pda partner account type observable
     */
    setCreatePDAPartnerAccountType(): void {
        this.isCreatePdaPartnerAccountType$ = this.accountService
            .getAccount(this.mpGroupId.toString())
            .pipe(
                map(
                    (accountDetails) =>
                        accountDetails.partnerAccountType === PartnerAccountType.UNION ||
                        accountDetails.partnerAccountType === PartnerAccountType.ASSOCIATION ||
                        accountDetails.partnerAccountType === PartnerAccountType.NONPAYROLL,
                ),
            );
    }

    /**
     * Fetches the document information for the producer/admin
     */
    fetchDocuments(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.memberService
            .getMemberNotes(this.memberId, this.mpGroupId, "createAdminId,updateAdminId,documentIds")
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    this.notes = Response;
                    if (!this.isPrPDAConfigEnabled) {
                        this.notes = this.notes.filter((note) => note.formInfo?.type !== FormType.PDA_PR);
                    }
                    this.showContact = this.notes?.some(
                        (note) =>
                            (note.formInfo?.type === FormType.PDA_PR || note.formInfo?.type === FormType.PDA) && !note.formInfo?.signed,
                    );
                    this.setDatasource(this.notes);
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            );
    }

    /** Toggles Add Document popup */
    addDocuments(event: Event): void {
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            width: "100%",
            panelClass: "add-item",
            data: {
                mode: "ADD",
                mpGroupId: this.mpGroupId,
                memberId: this.memberId,
                maxFileSize: this.maxFileSize,
                maxNoteLength: this.maxNoteLength,
            },
        };
        const dialogRef = this.dialog.open(AddUpdateDocumentComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((flag) => {
                if (flag) {
                    this.fetchDocuments();
                }
            });
    }

    /**
     * Toggles new PDA popup
     * @param pdaFormId id of selected PDA
     * @param isEdit check if new PDA or to edit PDA
     */
    newPda(pdaFormId: number, isEdit: boolean): void {
        if (isEdit) {
            this.editPda(pdaFormId);
        } else {
            const dialogReference = this.empoweredModalService.openDialog(PdaCompletionComponent);
            dialogReference
                .afterClosed()
                .pipe(
                    filter((enrollMethodType) => !!enrollMethodType),
                    switchMap((enrollMethodType) => {
                        const dialogConfig = {
                            autoFocus: true,
                            width: "100%",
                            data: {
                                mpGroupId: this.mpGroupId,
                                memberId: this.memberId,
                                producerId: this.producerId,
                                isDocument: true,
                                state: null,
                                isOwnAccount: this.isAccountProducer,
                                isEditPda: isEdit,
                                formId: isEdit ? pdaFormId : null,
                                enrollmentType: enrollMethodType,
                            },
                        };
                        return this.empoweredModalService
                            .openDialog(CreateNewPdaPopupComponent)
                            .afterClosed()
                            .pipe(
                                filter((state) => state),
                                switchMap((state) => {
                                    dialogConfig.data.state = state;
                                    return this.empoweredModalService.openDialog(NewPdaComponent, dialogConfig).afterClosed();
                                }),
                            );
                    }),
                    filter((flag) => !!flag),
                    switchMap((flag) => {
                        this.fetchDocuments();
                        return this.memberService.getAllCompletedForms(this.memberId, this.mpGroupId.toString(), true);
                    }),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe((unsignedForms) => (this.unsignedPDAForms = unsignedForms.PDA));
        }
    }

    /**
     * Toggles PDA popup for editing
     * @param pdaFormId id of selected PDA
     */
    editPda(pdaFormId: number): void {
        const unsignedFormInfo = this.unsignedPDAForms.find((form) => form.id === pdaFormId);
        const dialogConfig = {
            autoFocus: true,
            width: "100%",
            data: {
                mpGroupId: this.mpGroupId,
                memberId: this.memberId,
                producerId: this.producerId,
                isDocument: true,
                state: null,
                isOwnAccount: this.isAccountProducer,
                isEditPda: true,
                formId: pdaFormId,
                enrollmentType: unsignedFormInfo ? unsignedFormInfo.submissionMethod : "",
            },
        };
        if (this.notes.some((note) => note.formInfo?.id === pdaFormId && note.formInfo?.type === FormType.PDA_PR)) {
            dialogConfig.data.state = CompanyCode.PR;
        }
        const dialogRef = this.dialog.open(NewPdaComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((flag) => {
                if (flag) {
                    this.fetchDocuments();
                }
            });
    }

    /** Toggles update document popup */
    updateDoc(id: number, formInfo: any): void {
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            width: "100%",
            panelClass: "add-item",
            data: {
                mode: "EDIT",
                id: id,
                mpGroupId: this.mpGroupId,
                memberId: this.memberId,
                maxFileSize: this.maxFileSize,
                maxNoteLength: this.maxNoteLength,
                formInfo: !(formInfo === null || formInfo === undefined) ? formInfo : null,
            },
        };
        const dialogRef = this.dialog.open(AddUpdateDocumentComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((flag) => {
                if (flag) {
                    this.fetchDocuments();
                }
            });
    }

    /**
     * Sets the data source for mat-table
     * @param data contains array of documents
     */
    setDatasource(data: any): void {
        this.dataSource = new MatTableDataSource(
            data.map((row) => {
                if (row.documents.length) {
                    row.documents.map(function (doc: any): void {
                        doc["modifiedName"] = doc.fileName;
                        if (doc.fileName.length > 24) {
                            const first16 = doc.fileName.substring(0, 15);
                            const last8 = doc.fileName.substring(doc.fileName.length - 8, doc.fileName.length);
                            doc["modifiedName"] = first16 + "..." + last8;
                        }
                    });
                }
                return {
                    document: row.documents.length ? row.documents : null,
                    notes: row.text,
                    addedBy:
                        (row.createAdmin && row.createAdmin.name && `${row.createAdmin.name.firstName} ${row.createAdmin.name.lastName}`) ||
                        "",
                    addedByAdminId: row.createAdminId,
                    modifiedOn: row.updateDate ? row.updateDate : row.createDate,
                    uploadDate: row.createDate,
                    signatureDate:
                        row.formInfo && row.formInfo.signed
                            ? this.datePipe.transform(row.formInfo.signedOn, DateFormats.MONTH_DAY_YEAR)
                            : null,
                    id: row.id,
                    formInfo: !(row.formInfo == null || row.formInfo === undefined) ? row.formInfo : null,
                    tooltipString: this.getDatesTooltip(row.createDate, row.updateDate),
                    summary: !(row.text === null || row.text === undefined)
                        ? row.text.length > this.maxSummaryCharacters
                            ? true
                            : false
                        : null,
                };
            }),
        );
        this.data = this.dataSource.data;
        this.displayedColumnsDocs = [
            DocumentsGridTitles.DOCUMENTS,
            DocumentsGridTitles.NOTES,
            DocumentsGridTitles.ADDED_BY,
            DocumentsGridTitles.MODIFIED_ON,
            DocumentsGridTitles.MANAGE,
        ];
        this.dataSource.paginator = this.paginator;
        if (this.paginator) {
            this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
        }
    }

    /** Sets html string for showing tooltip */
    getDatesTooltip(create: string, modified: string): any {
        let tooltipString: any;
        const createDate = this.datePipe.transform(create, AppSettings.DATE_TIME_FORMAT);
        const modifiedDate = this.datePipe.transform(modified, AppSettings.DATE_TIME_FORMAT);
        if (modified) {
            tooltipString = this.domSanitizer.bypassSecurityTrustHtml(
                // eslint-disable-next-line max-len
                `<div><b>${this.langStrings["primary.portal.members.document.addedTooltip"]}</b></div><div>${createDate}</div></br><div><b>${this.langStrings["primary.portal.members.document.lastModifyTooltip"]}</b></div><div>${modifiedDate}</div>`,
            );
        } else {
            tooltipString = this.domSanitizer.bypassSecurityTrustHtml(
                `<div><b>${this.langStrings["primary.portal.members.document.addedTooltip"]}</b></div><div>${createDate}</div>`,
            );
        }
        return tooltipString;
    }

    /**
     * Downloads the file on click of file name
     * @param id document id
     * @param fileName document name
     */
    downloadDoc(id: number, fileName: string): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        const fileType = fileName.split(".").pop();
        this.docService
            .downloadDocument(id, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (Response) => {
                    switch (fileType) {
                        case "pdf": {
                            const pdfBlob = new Blob([Response], { type: "application/pdf" });
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
                            const blob = new Blob([Response], {
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
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    if (error) {
                        this.showErrorAlertMessage(error);
                    } else {
                        this.errorMessage = null;
                    }
                },
            );
    }

    /**
     * Download Pda Form
     * @param formType PDA Form Type
     * @param formId ID of PDA Form
     */
    downloadForm(formType: string, formId: number): void {
        this.isSpinnerLoading = true;
        this.memberService
            .downloadMemberForm(this.memberId, formType, formId, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: any) => {
                    this.isSpinnerLoading = false;
                    const formBlob = new Blob([response], { type: "text/html" });

                    /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                    if ((window.navigator as any).msSaveOrOpenBlob) {
                        (window.navigator as any).msSaveOrOpenBlob(formBlob);
                    } else {
                        const anchor = document.createElement("a");
                        anchor.download = "formtype";
                        const fileURLBlob = URL.createObjectURL(formBlob);
                        anchor.href = fileURLBlob;
                        document.body.appendChild(anchor);
                        anchor.click();
                    }
                },
                () => {
                    this.isSpinnerLoading = false;
                },
            );
    }

    removeItem(id: number): void {
        const dialogData: MonDialogData = {
            title: this.langStrings["primary.portal.members.document.removeItemTitle"],
            content: this.langStrings["primary.portal.members.document.removeItemDesc"],
            primaryButton: {
                buttonTitle: this.langStrings["primary.portal.common.remove"],
                buttonAction: this.confirmRemoveItem.bind(this, id),
            },
            secondaryButton: {
                buttonTitle: this.langStrings["primary.portal.common.cancel"],
            },
        };
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    confirmRemoveItem(id: number): void {
        const observsers = [];
        const note = this.notes.find((x) => x.id === id);
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-this-alias
        const _this = this;
        if (note) {
            observsers.push(this.memberService.deleteMemberNote(this.memberId.toString(), this.mpGroupId.toString(), note.id.toString()));
            if (note.documents.length) {
                note.documents.forEach((element) => {
                    observsers.push(_this.docService.deleteDocument(element.id, this.mpGroupId));
                });
            }
        }
        if (observsers.length) {
            forkJoin(observsers)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    () => {
                        this.fetchDocuments();
                    },
                    (error) => {
                        this.showErrorAlertMessage(error);
                    },
                );
        }
    }

    /** mat-paginator configuration initializer */
    pageInputChanged(pageNumber: string): void {
        if (pageNumber !== "" && +pageNumber > 0 && +pageNumber <= this.paginator.getNumberOfPages()) {
            this.paginator.pageIndex = +pageNumber - 1;
            this.paginator.page.next({
                pageIndex: this.paginator.pageIndex,
                pageSize: this.paginator.pageSize,
                length: this.paginator.length,
            });
        }
    }

    /**
     * Fetches language strings from db
     */
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.members.document.title",
            "primary.portal.members.document.noDocumentError",
            "primary.portal.members.document.table.documents",
            "primary.portal.members.document.table.notes",
            "primary.portal.members.document.table.addedBy",
            "primary.portal.members.document.table.modifyOn",
            "primary.portal.members.document.table.manage",
            "primary.portal.members.document.manageMenu.update",
            "primary.portal.members.document.manageMenu.remove",
            "primary.portal.members.document.addedTooltip",
            "primary.portal.members.document.lastModifyTooltip",
            "primary.portal.members.document.viewLess",
            "primary.portal.members.document.viewMore",
            "primary.portal.members.document.removeTitle",
            "primary.portal.members.document.removeDesc",
            "primary.portal.common.remove",
            "primary.portal.common.cancel",
            "primary.portal.members.document.removeItemDesc",
            "primary.portal.members.document.removeItemTitle",
            "primary.portal.common.info",
            "primary.portal.common.ariaShowMenu",
            "primary.portal.common.enterPageNumber",
            "primary.portal.common.of",
            "primary.portal.members.document.manageMenu.page",
            "primary.portal.members.document.signed",
            "primary.portal.createReportForm.enrollment.status.pending",
            "primary.portal.pda.incomplete",
            "primary.portal.pda.signed",
            "primary.portal.pda.notify",
            "primary.portal.members.document.noDocumentError",
            "primary.portal.members.document.addItemButton",
        ]);
    }

    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }

    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.errorMessageArray = [];
        const error = err[this.ERROR];
        this.showErrorMessage = true;
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.documents.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }

    /**
     * Fetches data from configurations table
     */
    fetchConfigurations(): void {
        this.staticService
            .getConfigurations("user.note.*", parseFloat(this.mpGroupId.toString()))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                if (Response.length) {
                    Response.forEach((element) => {
                        if (this.CONFIG_MAX_CHAR === element.name) {
                            this.maxNoteLength = parseInt(element.value, DEC_CONVERSION);
                        }
                    });
                }
            });
        this.staticUtilService
            .cacheConfigValue(ConfigName.MAX_UPLOAD_FILE_SIZE)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((maxFileSize) => (this.maxFileSize = +maxFileSize));
    }

    /** Triggers the truncation of notes on table */
    viewFullNote(docData: any): void {
        const foundIndex = this.dataSource.data.findIndex((x) => x === docData);
        docData.summary = !docData.summary;
        this.data[foundIndex] = docData;
        this.dataSource.data = this.data;
    }

    /**
     * Life cycle hook to unsubscribe the subscribed observables
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
