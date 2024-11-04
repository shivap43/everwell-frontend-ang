import { Component, OnInit, ViewChild, Inject, OnDestroy } from "@angular/core";
import { MatStepper } from "@angular/material/stepper";
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { MemberService, AdminService } from "@empowered/api";
import { Store, Select } from "@ngxs/store";
import { SharedState } from "@empowered/ngxs-store";
import { AppSettings } from "@empowered/constants";
import { Subscription, Observable, Subject } from "rxjs";
import { LanguageService } from "@empowered/language";
import { takeUntil } from "rxjs/operators";
import { Router } from "@angular/router";
import { AccountListState } from "@empowered/ngxs-store";

const BACK_BUTTON = "Back";
@Component({
    selector: "empowered-add-admin-via-census",
    templateUrl: "./add-admin-via-census.component.html",
    styleUrls: ["./add-admin-via-census.component.scss"],
})
export class AddAdminViaCensusComponent implements OnInit, OnDestroy {
    @ViewChild(MatStepper, { static: true }) matStepper: MatStepper;

    stepOneForm: FormGroup;
    stepTwoForm: FormGroup;
    fullMemberListResponseSubscription: Subscription;
    displayedColumns: string[] = ["name", "email", "select"];
    mpGroupId: number;
    membersList: any;
    lastName: string;
    emailAddress: any;
    roleId: number;
    matchedMembersData = [];
    memberFoundFlag = false;
    zeroConstant = 0;
    adminRoles: any;
    memberName: string;
    memberEmail: string;
    admin: any = {};
    promoteSubscription: Subscription;
    errorResponse: boolean;
    isLoading: boolean;
    errorMessage = "";
    selectedMember: any;
    validationRegex: any;
    private unsubscribe$ = new Subject<void>();
    @Select(SharedState?.regex) regex$: Observable<any>;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.administrators.stepOne",
        "primary.portal.administrators.searchByLastName",
        "primary.portal.administrators.email",
        "primary.portal.administrators.stepTwo",
        "primary.portal.administrators.setAdminRole",
        "primary.portal.commission.producer.single.addSplit.selectRole",
        "primary.portal.common.requiredField",
        "primary.portal.administrators.enterValidName",
        "primary.portal.common.next",
        "primary.portal.common.cancel",
        "primary.portal.administrators.searchForEmployee",
        "primary.portal.administrators.terminatedEmployee.error",
        "primary.portal.administrators.alreadyadmin.error",
        "primary.portal.administrators.filterRole",
        "primary.portal.common.close",
        "primary.portal.common.search",
        "primary.portal.common.back",
        "primary.portal.common.select",
        "primary.portal.administrators.addAdministrator",
        "primary.portal.administrators.noEmployeeEmail",
    ]);
    errorFlag = false;
    isOffering = false;
    constructor(
        private readonly fb: FormBuilder,
        private readonly store: Store,
        private readonly memberService: MemberService,
        private readonly adminService: AdminService,
        private readonly language: LanguageService,
        private readonly router: Router,
        private readonly dialogRef: MatDialogRef<AddAdminViaCensusComponent>,
        @Inject(MAT_DIALOG_DATA) readonly data: any,
    ) {}

    ngOnInit(): void {
        if (this.router.url.includes("benefits/offering")) {
            this.isOffering = true;
        }
        this.regex$.pipe(takeUntil(this.unsubscribe$)).subscribe((data) => {
            if (data) {
                this.validationRegex = data;
            }
        });
        this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);

        this.stepOneForm = this.fb.group(
            {
                lastName: [
                    "",
                    [Validators.required, Validators.pattern(this.validationRegex.NAME), this.searchMemberUsingLastName.bind(this)],
                ],
            },
            { updateOn: "submit" },
        );
        this.stepTwoForm = this.fb.group(
            {
                roleId: ["", Validators.required],
                reportsTo: [""],
            },
            { updateOn: "blur" },
        );
        this.serviceCalls();
    }
    serviceCalls(): void {
        const mpGroup = { payload: this.mpGroupId };
        this.memberService
            .searchMembers(mpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (res) => {
                    this.membersList = res.content;
                },
                () => {},
                () => {},
            );
        this.adminService
            .getAccountAdminRoles(this.mpGroupId)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (resp) => {
                    this.adminRoles = resp;
                },
                () => {},
                () => {},
            );
    }
    searchMemberUsingLastName(control: any, occurence?: string): any {
        this.memberFoundFlag = false;
        let matchedMemberListLength = this.zeroConstant;
        if (control.value !== "") {
            this.membersList.forEach((res) => {
                if (res.lastName.toLowerCase().includes(control.value.toLowerCase())) {
                    if (occurence === "onSearch") {
                        this.matchedMembersData[matchedMemberListLength] = res;
                    }
                    matchedMemberListLength++;
                    this.memberFoundFlag = true;
                }
            });
        }
        return this.memberFoundFlag ? null : { incorrect: true };
    }
    getMemberNotFoundError(): string {
        return this.stepOneForm.get("lastName").hasError("incorrect")
            ? "primary.portal.assignAdmin.addViaCensus.lastNameNotFoundError"
            : "primary.portal.assignAdmin.addManually.emailInUseError";
    }
    onSearch(lastName: any): void {
        this.matchedMembersData = [];
        this.memberFoundFlag = false;
        this.searchMemberUsingLastName(lastName, "onSearch");
    }

    goToStep(step: number, element: any): void {
        this.matStepper.selectedIndex = step;
        this.memberName = element.firstName + " " + element.lastName;
        this.memberEmail = element.email;
        this.selectedMember = element;
    }

    /**
     * Method triggered when an employee is tried to be made an admin
     */
    promoteMember(): void {
        if (this.stepTwoForm.invalid) {
            return;
        }
        this.roleId = this.stepTwoForm.controls.roleId.value;
        this.admin.roleId = this.roleId;
        this.admin.memberId = this.selectedMember.id;
        this.admin.reportsToId = this.stepTwoForm.controls.reportsTo.value;

        this.promoteSubscription = this.adminService.promoteMember(this.mpGroupId, this.admin).subscribe(
            () => {
                this.dialogRef.close(true);
                this.adminService.updateAdminList(true);
            },
            (error) => {
                this.isLoading = false;
                this.errorFlag = true;
                if (error.status === AppSettings.API_RESP_400) {
                    this.errorMessage = this.languageStrings["primary.portal.administrators.terminatedEmployee.error"];
                } else if (error.status === AppSettings.API_RESP_409) {
                    this.errorMessage = this.languageStrings["primary.portal.administrators.alreadyadmin.error"];
                } else {
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.api." + error.status + "." + error.code);
                }
            },
        );
    }

    closeForm(): void {
        this.dialogRef.close(false);
    }
    onBack(): void {
        this.dialogRef.close(BACK_BUTTON);
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
