import { EmpoweredModalService } from "@empowered/common-services";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { MemberService, DependentContact } from "@empowered/api";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import { DependentAddEditComponent } from "./dependent-add-edit/dependent-add-edit.component";
import { Store, Select } from "@ngxs/store";
import { SetDependentList, SetWizardMenuTab, MemberWizardState } from "@empowered/ngxs-store";
import { Observable, Subscription, forkJoin, iif, defer, of } from "rxjs";
import { DateFormats, MemberCredential, MemberDependent } from "@empowered/constants";
import { Router } from "@angular/router";
import { DatePipe } from "@angular/common";
import { MatTableDataSource } from "@angular/material/table";
import { LanguageService } from "@empowered/language";
import { switchMapTo, filter, map, mergeMap, tap } from "rxjs/operators";
// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { RemoveDependentComponent } from "libs/members/src/lib/dependent-list/remove-dependent/remove-dependent.component";
import { DateService } from "@empowered/date";

type MemberDependentWithContactInfo = MemberDependent & { contact: DependentContact };

@Component({
    selector: "empowered-my-household-tab",
    templateUrl: "./my-household-tab.component.html",
    styleUrls: ["./my-household-tab.component.scss"],
})
export class MyHouseholdTabComponent implements OnInit, OnDestroy {
    @Select(MemberWizardState.GetUserData) userData$: Observable<any>;
    userData: MemberCredential;
    @Select(MemberWizardState.GetDependentList) depedentData$: Observable<any>;
    @Select(MemberWizardState.GetWizardTabMenu) wizardMenuTab$: Observable<any>;
    @Select(MemberWizardState.GetRelations) relations$: Observable<any>;
    depedentData: MatTableDataSource<any>;
    displayedColumns = ["name", "relationship", "age", "gender", "state", "zip", "manage"];
    isLoading: boolean;
    relations: any[];
    prevTab: any;
    nextTab: any;
    tabs: any[];
    languageStrings: Record<string, string>;
    isQLE: boolean;
    STR_ADD = "add";
    STR_EDIT = "edit";
    STR_MY_HOUSEHOLD = "my household";
    allSubscriptions: Subscription[];
    dependentDialog: MatDialogRef<DependentAddEditComponent>;
    hideShoppingButton = false;
    activeEmployee = true;

    constructor(
        private readonly mService: MemberService,
        private readonly dialog: MatDialog,
        private readonly language: LanguageService,
        private readonly store: Store,
        private readonly router: Router,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly datePipe: DatePipe,
        private readonly dateService: DateService,
    ) {}

    /**
     * Initializes necessary variables
     */
    ngOnInit(): void {
        this.allSubscriptions = [];
        this.isQLE = false;
        this.depedentData = new MatTableDataSource<any>([]);
        this.allSubscriptions.push(
            this.wizardMenuTab$.subscribe((tabs) => {
                if (tabs) {
                    this.tabs = tabs;
                    const idx = tabs.findIndex((x) => x.label.toLowerCase() === this.STR_MY_HOUSEHOLD);
                    this.nextTab = tabs[idx + 1];
                    this.prevTab = tabs[idx - 1];
                } else {
                    this.store.dispatch(new SetWizardMenuTab(this.mService.getMemberWizardTabMenu()));
                }
            }),
        );
        this.allSubscriptions.push(
            this.userData$.subscribe((uData) => {
                this.userData = uData;
                if (uData && Object.keys(uData.workInformation.termination).length !== 0) {
                    const terminationDate = new Date(
                        this.datePipe.transform(uData.workInformation.termination.terminationDate, DateFormats.YEAR_MONTH_DAY),
                    );
                    const today = new Date();
                    terminationDate.setHours(0, 0, 0);
                    today.setHours(0, 0, 0);
                    this.activeEmployee = terminationDate > today;
                }
                this.createDependentData();
            }),
        );
        this.allSubscriptions.push(
            this.depedentData$.subscribe((dData) => {
                this.depedentData.data = dData;
                this.createDependentData();
            }),
        );
        this.allSubscriptions.push(
            this.relations$.subscribe((rData) => {
                this.relations = rData;
            }),
        );
        this.getLanguageStrings();
        this.checkHireDate();
    }
    getLanguageStrings(): void {
        this.languageStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.enrollmentWizard.updateMsg",
            "primary.portal.enrollmentWizard.name",
            "primary.portal.enrollmentWizard.relationship",
            "primary.portal.enrollmentWizard.age",
            "primary.portal.enrollmentWizard.gender",
            "primary.portal.enrollmentWizard.state",
            "primary.portal.enrollmentWizard.zip",
            "primary.portal.enrollmentWizard.manage",
            "primary.portal.enrollmentWizard.edit",
            "primary.portal.enrollmentWizard.noDependentAvailable",
            "primary.portal.enrollmentWizard.addLifeEvent",
            "primary.portal.enrollmentWizard.hasLifeChangedLabel",
            "primary.portal.enrollmentWizard.hasLifeChangedMsg",
            "primary.portal.enrollmentWizard.birthday",
            "primary.portal.enrollmentWizard.addDependent",
            "primary.portal.enrollmentWizard.startShopping",
        ]);
    }
    /**
     * Prepares data to be displayed in the table
     */
    createDependentData(): void {
        let array = [];
        if (this.userData) {
            const user = Object.assign({}, this.userData, { dependentRelationId: -1 });
            const userIndex = this.depedentData.data.findIndex((x) => x.dependentRelationId === -1);
            if (userIndex === -1) {
                array = array.concat(user);
            } else {
                this.depedentData.data[userIndex] = user;
            }
        }
        if (this.depedentData && this.depedentData.data.length) {
            array = array.concat(this.depedentData.data);
        }
        this.depedentData.data = array;
        this.depedentData.data = this.depedentData.data.map((dependent) =>
            Object.assign({}, dependent, {
                manageMenuItems: [
                    {
                        value: "edit",
                        label: this.language.fetchPrimaryLanguageValue("primary.portal.common.edit"),
                        onClick: this.editDependent.bind(this),
                    },
                    {
                        value: "remove",
                        label: this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
                        onClick: this.deleteDependent.bind(this),
                    },
                ].filter((item) => (dependent.dependentRelationId === -1 ? item.value === "edit" : true)),
            }),
        );
    }
    /**
     * Opens the edit dependent modal
     * @param dependent table row
     */
    editDependent(dependent: MemberDependentWithContactInfo): void {
        this.dependentDialog = this.dialog.open(DependentAddEditComponent, {
            data: {
                mode: this.STR_EDIT,
                dependentData: dependent,
                userData: this.userData,
            },
        });
        this.allSubscriptions.push(
            this.dependentDialog.afterClosed().subscribe((data) => {
                this.isQLE = data;
            }),
        );
    }
    /**
     * Opens the delete dependent modal
     * @param dependent table row
     */
    deleteDependent(dependent: MemberDependentWithContactInfo): void {
        this.allSubscriptions.push(
            this.empoweredModal
                .openDialog(RemoveDependentComponent, {
                    data: { name: `${dependent.name.firstName} ${dependent.name.lastName}` },
                })
                .afterClosed()
                .pipe(
                    filter(Boolean),
                    tap(() => (this.isLoading = true)),
                    switchMapTo(
                        this.mService.deleteMemberDependent(this.userData.memberId, dependent.id.toString(), this.userData.groupId),
                    ),
                    switchMapTo(this.setMemberDependents()),
                )
                .subscribe(
                    (result) => {
                        this.isLoading = false;
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                ),
        );
    }
    addDepedent(): void {
        this.dependentDialog = this.dialog.open(DependentAddEditComponent, {
            data: { mode: this.STR_ADD, userData: this.userData },
        });
        this.allSubscriptions.push(
            this.dependentDialog.afterClosed().subscribe((data) => {
                this.isQLE = data;
            }),
        );
    }
    getAge(date: any): number {
        return this.dateService.getDifferenceInYears(this.dateService.toDate(date));
    }
    getRelationship(rId: number): string {
        if (rId === -1) {
            return "Self";
        }
        if (this.relations) {
            return this.relations.find((r) => r.id === rId).name;
        }
        return "";
    }
    goToTab(tab: any): void {
        this.mService.wizardCurrentTab$.next(this.tabs.findIndex((x) => x.label === tab.label));
        this.router.navigate(["member/" + tab.link]);
    }
    /**
     * This method will hide the shop button for member's future hire date.
     */
    checkHireDate(): void {
        this.allSubscriptions.push(
            this.mService.getMemberHireDate.subscribe((hireDate) => {
                if (hireDate === "" || this.dateService.checkIsAfter(this.dateService.toDate(hireDate))) {
                    this.hideShoppingButton = true;
                }
            }),
        );
    }
    /**
     * Gets dependents (with their contact info) and stores it in the store
     * @returns list of dependents with their contact info
     */
    setMemberDependents(): Observable<MemberDependentWithContactInfo[]> {
        return this.mService.getMemberDependents(this.userData.memberId, true, this.userData.groupId).pipe(
            mergeMap((dependents) =>
                iif(
                    () => dependents && dependents.length > 0,
                    defer(() =>
                        forkJoin(
                            dependents.map((dependent) =>
                                this.mService
                                    .getDependentContact(this.userData.memberId, dependent.id.toString(), this.userData.groupId)
                                    .pipe(map((contact) => ({ ...dependent, contact }))),
                            ),
                        ),
                    ),
                    of([]),
                ),
            ),
            tap((result) => this.store.dispatch(new SetDependentList(result))),
        );
    }
    ngOnDestroy(): void {
        this.allSubscriptions.forEach((sub) => sub.unsubscribe());
    }
}
