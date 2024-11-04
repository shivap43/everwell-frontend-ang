import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { Store } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { AppSettings, MemberCredential } from "@empowered/constants";
import { MemberService, PdaForm } from "@empowered/api";
import { ActivatedRoute } from "@angular/router";
import { UserService } from "@empowered/user";
import { SafeResourceUrl, DomSanitizer } from "@angular/platform-browser";
import { LanguageService } from "@empowered/language";
import { Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

export interface CompletedForms {
    formName: string;
    dateSigned: string | Date;
    view: number;
}

const ELEMENT_DATA: CompletedForms[] = [{ formName: "", dateSigned: "Hydrogen", view: 1.0079 }];

@Component({
    selector: "empowered-completed-forms",
    templateUrl: "./completed-forms.component.html",
    styleUrls: ["./completed-forms.component.scss"],
})
export class CompletedFormsComponent implements OnInit, OnDestroy {
    memberInfo: any;
    memberId: number;
    mpGroupId: number;
    MpGroup: number;
    portal: string;
    hasForm = false;
    dateToday = new Date();
    isMemberPortal: boolean;
    isLoading: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.members.completedForms.title",
        "primary.portal.members.completedForms.noCompletedError",
        "primary.portal.members.completedForms.form",
        "primary.portal.members.completedForms.dateSigned",
        "primary.portal.members.completedForms.manage",
        "primary.portal.common.view",
    ]);

    displayedColumns: string[] = ["Form", "Date", "Manage"];
    dataSource: MatTableDataSource<CompletedForms>;
    safeUrl: SafeResourceUrl;
    manualAddData: CompletedForms[] = [];
    private readonly unsubscribe$: Subject<void> = new Subject<void>();

    constructor(
        private readonly memberService: MemberService,
        private readonly userService: UserService,
        private readonly language: LanguageService,
        private readonly sanitizer: DomSanitizer,
        private readonly route: ActivatedRoute,
        private readonly store: Store,
    ) {}

    /**
     * Life cycle hook to initialize the component. fetching the completed PDA based on member ID
     * @returns void
     */
    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
        this.dataSource = new MatTableDataSource<CompletedForms>(this.manualAddData);
        if (this.isMemberPortal) {
            this.userService.credential$.subscribe((credential: MemberCredential) => {
                if (credential.groupId && credential.memberId) {
                    this.MpGroup = credential.groupId;
                    this.memberId = credential.memberId;
                }
            });
        } else {
            this.MpGroup = this.route.snapshot.parent.parent.params.mpGroupId;
            this.memberId = this.route.parent.snapshot.parent.params.memberId;
        }
        this.fetchCompletedPDA();
    }

    /** Fetches the completed PDA form
     * @returns void
     */
    fetchCompletedPDA(): void {
        this.isLoading = true;
        this.memberService
            .getAllCompletedForms(this.memberId, this.MpGroup.toString())
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (response) => {
                    if (response.PDA && response.PDA.length > 0) {
                        this.hasForm = true;
                        const pdaFormList = response.PDA;
                        this.setDataSource(pdaFormList);
                    }
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }

    /**
     * Function set the data source into mat table
     * @param form completed PDA form fetched from API
     * @returns void
     */
    setDataSource(form: PdaForm[]): void {
        form.forEach((element) => {
            this.dataSource.data.push({
                formName: element.formType,
                dateSigned: element.validity.effectiveStarting,
                view: element.id,
            });
        });
        this.dataSource = new MatTableDataSource(this.dataSource.data);
    }
    /**
     * Download Pda Form
     * @param formType PDA Form Type
     * @param formId ID of PDA Form
     */
    downloadForm(formType: string, formId: number): void {
        this.isLoading = true;
        this.memberService.downloadMemberForm(this.memberId, formType, formId, this.MpGroup.toString()).subscribe(
            (response: any) => {
                this.isLoading = false;
                const formBlob = new Blob([response], {
                    type: "text/html",
                });
                const fileUrl = window.URL.createObjectURL(formBlob);

                /*
                source: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/msSaveOrOpenBlob
                msSaveorOpenBlob() and msSaveBlob() are non-standard. It is warned not to use these in production sites.
                Typescript won't know this is a thing, so we have to use Type Assertion
                */
                if (window.navigator && (window.navigator as any).msSaveOrOpenBlob) {
                    (window.navigator as any).msSaveOrOpenBlob(formBlob);
                } else {
                    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fileUrl);
                    window.open(fileUrl, "_blank");
                }
            },
            (error: any) => {
                this.isLoading = false;
            },
        );
    }

    /**
     * Life cycle hook to unsubscribe the subscriptions
     * @returns void
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
