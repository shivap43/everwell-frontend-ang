import { Subscription, forkJoin, Observable, of, Subject } from "rxjs";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";
import {
    MemberService,
    MemberNote,
    DocumentsGridTitles,
    DocumentApiService,
    StaticService,
    FormType,
    PdaForm,
    AccountService,
    PendingEnrollmentReason,
    ShoppingCartDisplayService,
    EnrollmentService,
    EnrollmentMethodType,
    PendingReasonForPdaCompletion,
} from "@empowered/api";
import { Component, OnInit, OnDestroy, ViewChild, HostBinding } from "@angular/core";
import { Store } from "@ngxs/store";
import { CreateNewPdaPopupComponent } from "@empowered/ui";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { MatTableDataSource } from "@angular/material/table";
import { DatePipe } from "@angular/common";
import { MatPaginator, PageEvent } from "@angular/material/paginator";
import { FormBuilder, FormControl, FormGroup } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TPIState, SetRegex, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { filter, switchMap, takeUntil, tap } from "rxjs/operators";
import { ConfigName, Permission, CompanyCode, AppSettings, PartnerAccountType, Accounts, Document } from "@empowered/constants";
import { PdaCompletionComponent } from "@empowered/enrollment";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

interface MatTableData {
    document: Document[];
    formInfo: FormInfo;
    id: number;
    eSignature?: boolean;
    modifiedOn: string;
    tooltipString: SafeHtml;
    uploadDate: string;
}

interface FormInfo {
    id?: number;
    type?: string;
}

interface MemberContactListDisplay {
    contact: string;
    disableField: boolean;
    type?: string;
    primary?: boolean;
    formatted?: string;
}

enum ContactType {
    "EMAIL" = "email",
    "PHONE" = "phoneNumber",
}
@Component({
    selector: "empowered-tpi-pda-view",
    templateUrl: "./tpi-pda-view.component.html",
    styleUrls: ["./tpi-pda-view.component.scss"],
})
export class TpiPdaViewComponent implements OnInit, OnDestroy {
    @HostBinding("class") classes = "tpi-content-wrapper";
    memberId: number;
    groupId: string;
    mpGroupId: number;
    notes: MemberNote[];
    customerSign: string;
    displayedColumnsDocs: DocumentsGridTitles[];
    dataSource: MatTableDataSource<MatTableData>;
    data: MatTableData[] = [];
    isSpinnerLoading = false;
    lastUploadFileName: string;
    // Need form control here as we are using single form control here
    pageNumberControl: FormControl = new FormControl(1);
    pageSizeOption: [5];
    langStrings: Record<string, string>;
    ERROR = "error";
    DETAILS = "details";
    filename = "PDA.htm";
    dateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    errorMessage: string;
    showErrorMessage = false;
    MAX_SUMMARY_CHARACTERS = 90;
    CONFIG_FILE_SIZE = "user.note.upload.max_file_size";
    CONFIG_MAX_CHAR = "user.note.maximum_number_of_character";
    maxNoteLength: number;
    maxFileSize: number;
    MIN_FILE_NAME_LENGTH = 24;
    FIRST_16_CHAR = 15;
    LAST_8_CHAR = 8;
    appSettings = AppSettings;
    isPrPDAConfigEnabled: boolean;
    @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
    isAgent = false;
    RADIX = 10;
    isCompletePdaPartnerAccountType = false;
    contactForm: FormGroup;
    isLoading = true;
    requestSent = false;
    hasMemberContact = false;
    unsignedPDAForms: PdaForm[] = [];
    firstName = "";
    disableSendReminder = false;
    contactList: MemberContactListDisplay[] = [];
    isMemberPortal = false;
    UserPermissions = Permission;
    portal: string;
    showContact: boolean;
    private readonly unsubscribe$ = new Subject<void>();
    constructor(
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly docService: DocumentApiService,
        private readonly datePipe: DatePipe,
        private readonly domSanitizer: DomSanitizer,
        private readonly router: Router,
        private readonly languageService: LanguageService,
        private readonly staticService: StaticService,
        private readonly route: ActivatedRoute,
        private readonly sharedService: SharedService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly accountService: AccountService,
        private readonly shoppingCartService: ShoppingCartDisplayService,
        private readonly enrollmentsService: EnrollmentService,
        private readonly fb: FormBuilder,
        private readonly utilService: UtilService,
    ) {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
        this.store.dispatch(new SetRegex());
    }

    /**
     * Lifecycle hook on component initialisation
     */
    ngOnInit(): void {
        this.dataSource = new MatTableDataSource<MatTableData>();
        this.dataSource.data = [];
        this.groupId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.groupId;
        this.mpGroupId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.groupId.toString();
        this.memberId = this.store.selectSnapshot(TPIState).tpiSSODetail.user.memberId;
        this.getPartnerAccountType();
        if (this.store.selectSnapshot(TPIState).tpiSSODetail.user.producerId || this.store.selectSnapshot(TPIState.getTPIProducerId)) {
            this.isAgent = true;
        }
        // get member firstname
        this.memberService
            .getMember(this.memberId, true, this.mpGroupId.toString())
            .pipe(
                tap((member) => {
                    this.firstName = member?.body?.name?.firstName;
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
        this.getConfigurationSpecifications();
        this.fetchDocuments();
        this.fetchLanguageStrings();
        this.getContactList();
    }

    /**
     * Fetches language strings from db
     */
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.members.document.addedTooltip",
            "primary.portal.members.document.lastModifyTooltip",
            "primary.portal.tpiEnrollment.pdaForms",
            "primary.portal.tpiEnrollment.pdaFormsMember",
            "primary.portal.members.document.noPDA",
            "primary.portal.members.document.noSubscriberPDA",
            "primary.portal.member.Document.createNewPDA",
            "primary.portal.tpiEnrollment.pda.forms",
            "primary.portal.tpiEnrollment.pda.form.pendingPdaSignature",
            "primary.portal.tpiEnrollment.pda.form.pendingPda",
            "primary.portal.members.document.table.documents",
            "primary.portal.members.completedForms.dateSigned",
            "primary.portal.common.info",
            "primary.portal.members.document.table.manage",
            "primary.portal.qle.viewLabel",
            "primary.portal.document.showingItems",
            "primary.portal.document.showingItem",
            "primary.portal.members.document.manageMenu.page",
            "primary.portal.common.enterPageNumber",
            "primary.portal.common.of",
            "primary.portal.pda.signed",
            "primary.portal.pda.notify",
            "primary.portal.members.document.noDocumentError",
            "primary.portal.members.document.addItemButton",
        ]);
    }

    /**
     *
     * This method is used to set the list of member contacts exists
     */
    getContactList(): void {
        this.contactForm = this.fb.group({});
        let textContacts: string[] = [];
        const emailContacts: { email: string; primary: boolean }[] = [];
        let selectedValue: MemberContactListDisplay;
        // fetching member contact details to be displayed in send reminder module.
        this.memberService
            .getMemberContacts(this.memberId, this.mpGroupId.toString())
            .pipe(
                tap((memberContacts) => {
                    // storing contact details in textContacts and emailContacts array.
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
                    // updating contactList object with latest email contact details.
                    if (emailContacts.length) {
                        emailContacts.forEach((contactData) => {
                            this.contactList.push({
                                contact: contactData.email,
                                disableField: false,
                                type: ContactType.EMAIL,
                                primary: contactData.primary,
                            });
                        });
                        const primaryEmail = this.contactList.find((eachContact) => eachContact.primary);
                        selectedValue = primaryEmail || this.contactList[0];
                    } else {
                        // updating no email address in contactList if no email present in file
                        this.contactList = [
                            {
                                contact: this.languageService.fetchPrimaryLanguageValue("primary.portal.headset.noemailaddress"),
                                disableField: true,
                            },
                        ];
                    }
                    // updating contactList object with latest phone number details.
                    if (textContacts.length) {
                        textContacts.forEach((contactValue) => {
                            this.contactList.push({
                                contact: contactValue,
                                disableField: false,
                                type: ContactType.PHONE,
                                formatted: this.utilService.formatPhoneNumber(contactValue),
                            });
                        });
                        if (!selectedValue) {
                            selectedValue = this.contactList[0];
                        }
                    } else {
                        // updating no Phone number in contactList if no phone number present in file
                        this.contactList.push({
                            contact: this.languageService.fetchPrimaryLanguageValue("primary.portal.headset.nomobile"),
                            disableField: true,
                        });
                    }
                    this.hasMemberContact = this.contactList.some((contactDetail) => contactDetail.type);
                    this.contactForm.addControl("contacts", this.fb.control(selectedValue));
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe();
    }

    /**
     *
     * This method is used to check is request sent or not
     */
    sendToCustomer(): void {
        const requestSignData = this.contactForm.value.contacts;
        this.isLoading = true;
        const requestData =
            requestSignData.type === ContactType.EMAIL ? { email: requestSignData.contact } : { phoneNumber: requestSignData.contact };
        this.shoppingCartService
            .requestShoppingCartSignature(this.mpGroupId, this.memberId, requestData, PendingReasonForPdaCompletion.PDA)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.isLoading = false;
                    this.requestSent = true;
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * Fetches the Completed PDA, PDA_PR forms information of the member and document information for the producer/admin
     * @returns Observable<[MemberNote[], PdaForm[], PdaForm[]]>
     */
    getDocsForms(): Observable<[MemberNote[], PdaForm[], PdaForm[]]> {
        return forkJoin([
            this.memberService.getMemberNotes(this.memberId, this.mpGroupId, "createAdminId,updateAdminId,documentIds"),
            this.memberService.getMemberFormsByType(this.memberId, FormType.PDA, this.groupId, AppSettings.COMPLETED),
            this.memberService.getMemberFormsByType(this.memberId, FormType.PDA_PR, this.groupId, AppSettings.COMPLETED),
        ]);
    }

    /**
     * Get the customer signature data from /static/configs API
     */
    getConfigurationSpecifications(): void {
        this.staticService
            .getConfigurations("user.enrollment.telephone_signature_placeholder", this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data) => {
                    this.customerSign = data.length ? data[0].value?.split(",")[0] : "";
                },
                (error) => {
                    this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
                    this.showErrorMessage = true;
                    this.isSpinnerLoading = false;
                },
            );
        this.staticService
            .getConfigurations("user.note.*", parseFloat(this.mpGroupId.toString()))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                if (response.length) {
                    response.forEach((element) => {
                        if (this.CONFIG_FILE_SIZE === element.name) {
                            this.maxFileSize = parseInt(element.value, this.RADIX);
                        } else if (this.CONFIG_MAX_CHAR === element.name) {
                            this.maxNoteLength = parseInt(element.value, this.RADIX);
                        }
                    });
                }
            });
        this.staticUtilService
            .cacheConfigEnabled(ConfigName.PR_PDA_TEMPLATE)
            .pipe(
                filter((prConfig) => prConfig),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(() => {
                this.isPrPDAConfigEnabled = true;
            });
    }

    /**
     * Fetches and Sets the document information for the producer/admin and also the PDA forms of the member
     */
    fetchDocuments(): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        this.getDocsForms()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    if (response.length) {
                        this.notes = this.isPrPDAConfigEnabled
                            ? response[0]
                            : response[0].filter((res) => res.formInfo.type !== FormType.PDA_PR);
                        this.showContact = this.notes?.some(
                            (note) =>
                                (note.formInfo.type === FormType.PDA_PR || note.formInfo.type === FormType.PDA) && !note.formInfo.signed,
                        );
                        const pdaFormsList = this.isPrPDAConfigEnabled ? response[1].concat(response[2]) : response[1];
                        this.setDatasource(this.notes, pdaFormsList);
                        this.isSpinnerLoading = false;
                    }
                },
                (error) => {
                    this.errorResponse(error);
                },
            );
    }

    /**
     * displays the errors when the subscription fails
     * @param error - error message
     */
    errorResponse(error: Error): void {
        this.isSpinnerLoading = false;
        if (error) {
            this.showErrorAlertMessage(error);
        } else {
            this.errorMessage = null;
        }
    }
    /**
     * Toggles new PDA popup
     */
    pdaForm(): void {
        let enrollmentMethod = "";
        this.empoweredModalService
            .openDialog(PdaCompletionComponent)
            .afterClosed()
            .pipe(
                filter((result) => !!result),
                switchMap((result) => {
                    enrollmentMethod = result;
                    return this.empoweredModalService.openDialog(CreateNewPdaPopupComponent).afterClosed();
                }),
                takeUntil(this.unsubscribe$),
            )
            .subscribe((state) => {
                if (state) {
                    this.router.navigate(["../form"], {
                        queryParams: { PR: state === CompanyCode.PR, enrollmentMethod },
                        relativeTo: this.route,
                    });
                }
            });
    }

    /**
     * Sets the datasource for mat-table
     * @param MemberNote[] Array of notes for a particular member ID
     * @param PdaForm[] Array of PDA Forms for a particular member ID
     */
    setDatasource(data: MemberNote[], pdaForms: PdaForm[]): void {
        let pdaFormIndex: number;
        this.dataSource = new MatTableDataSource(
            data.map(
                function (row: MemberNote): MatTableData {
                    pdaFormIndex = pdaForms.findIndex((pdaForm) => pdaForm.id === row.formInfo.id);
                    if (row.documents.length) {
                        row.documents.forEach(function (doc: Document): void {
                            doc["modifiedName"] = doc.fileName;
                            if (doc.fileName.length > this.MIN_FILE_NAME_LENGTH) {
                                const first16 = doc.fileName.substring(0, this.FIRST_16_CHAR);
                                const last8 = doc.fileName.substring(doc.fileName.length - this.LAST_8_CHAR, doc.fileName.length);
                                doc["modifiedName"] = `${first16}...${last8}`;
                            }
                        });
                    }
                    return {
                        document: row.documents.length ? row.documents : null,
                        modifiedOn: row.updateDate ? row.updateDate : row.createDate,
                        uploadDate: row.createDate,
                        id: row.id,
                        eSignature:
                            pdaForms &&
                            pdaForms[pdaFormIndex] &&
                            !(pdaForms[pdaFormIndex].signature === this.customerSign || pdaForms[pdaFormIndex].signature === ""),
                        formInfo: !(row.formInfo == null || row.formInfo === undefined) ? row.formInfo : null,
                        tooltipString: this.getDatesTooltip(row.createDate, row.updateDate),
                    };
                }.bind(this),
            ),
        );
        this.data = this.dataSource.data;
        this.displayedColumnsDocs = [DocumentsGridTitles.DOCUMENTS, DocumentsGridTitles.MODIFIED_ON, DocumentsGridTitles.MANAGE];
        this.dataSource.paginator = this.paginator;
        if (this.paginator) {
            this.paginator.page.pipe(takeUntil(this.unsubscribe$)).subscribe((page: PageEvent) => {
                this.pageNumberControl.setValue(page.pageIndex + 1);
            });
        }
    }

    /**
     * Sets html string for showing tooltip
     * @param: create - date created
     * @param: modifies - date modified
     * @returns: html string for showing tooltip
     */
    getDatesTooltip(create: string, modified: string): SafeHtml {
        let tooltipString: SafeHtml;
        const createDate = this.datePipe.transform(create, AppSettings.DATE_TIME_FORMAT);
        const modifiedDate = this.datePipe.transform(modified, AppSettings.DATE_TIME_FORMAT);
        const ADDED_TOOLTIP_TITLE = this.langStrings["primary.portal.members.document.addedTooltip"];
        if (modified) {
            tooltipString = this.domSanitizer.bypassSecurityTrustHtml(
                `<div><b>${ADDED_TOOLTIP_TITLE}</b></div><div>${createDate}</div></br>
                <div><b>${ADDED_TOOLTIP_TITLE}</b></div><div>${modifiedDate}</div>`,
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
     * @param: id - current doc id
     * @param: fileName - the current file name
     */
    downloadDoc(id: number, fileName: string): void {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        const fileType = fileName.split(".").pop();
        this.docService
            .downloadDocument(id, this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
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
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.errorResponse(error);
                },
            );
    }
    /**
     * Displays the form in new Tab on click of View Button
     * @param: formType - the type of form
     * @param: formId - the current form id
     */
    displayForm(formType: string, formId: number): void {
        this.isSpinnerLoading = true;
        this.memberService
            .downloadMemberForm(this.memberId, formType, formId, this.mpGroupId.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    this.isSpinnerLoading = false;
                    const formBlob = new Blob([response], { type: "text/html" });
                    const fileURLBlob = URL.createObjectURL(formBlob);
                    window.open(fileURLBlob, "_blank");
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     * mat-paginator configuration initializer
     * @param: pageNumber - the current page number
     */
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
     * hide the alert message
     */
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }

    /**
     * Error handling configuration
     * @param: err - error response
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[this.ERROR];
        this.showErrorMessage = true;
        if (error.status === AppSettings.API_RESP_400 && error[this.DETAILS].length > 0) {
            const detail = error[this.DETAILS];
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                "secondary.portal.documents.api." + error.status + "." + error.code + "." + detail.field,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
        }
    }

    /**
     * Function to return partner account type
     */
    getPartnerAccountType(): void {
        this.isSpinnerLoading = true;
        this.accountService
            .getAccount(this.groupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response: Accounts) => {
                    this.isCompletePdaPartnerAccountType =
                        response.partnerAccountType === PartnerAccountType.UNION ||
                        response.partnerAccountType === PartnerAccountType.ASSOCIATION ||
                        response.partnerAccountType === PartnerAccountType.NONPAYROLL;
                    this.isSpinnerLoading = false;
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }

    /**
     * Lifecycle hook on component destroy
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
