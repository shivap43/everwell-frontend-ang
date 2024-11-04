import { Component, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import { AccountService, MemberDependentList, MemberService, AuthenticationService } from "@empowered/api";
import { Relations, MemberDependent } from "@empowered/constants";
import { Store } from "@ngxs/store";
import { Subscription, combineLatest } from "rxjs";

import {
    SetDependents,
    SetRelations,
    SetRegistrationMemberId,
    SetGroupId,
    RegistrationState,
    SetIncompleteRegistrationAlert,
    StaticUtilService,
} from "@empowered/ngxs-store";
import { LanguageService } from "@empowered/language";
import { TPIRestrictionsForHQAccountsService } from "@empowered/common-services";

const AFLAQ_HQ_REGISTRATION_EDIT = "aflac_hq.member.registration.info.edit";

@Component({
    selector: "empowered-manage-dependents",
    templateUrl: "./manage-dependents.component.html",
    styleUrls: ["./manage-dependents.component.scss"],
})
export class ManageDependentsComponent implements OnInit, OnDestroy {
    @ViewChild("dependentOption") mySelect;
    memberId: number;
    MpGroup: number;
    dependents = false;
    displayedColumns = ["name", "relation", "age", "gender", "config"];
    RelationshipOptions = [];
    subscriptions: Subscription[] = [];
    errorMsg = "";
    error = false;
    nameToRemove = "";
    remove = false;
    dependentToRemove = null;
    dataSource = new MatTableDataSource<MemberDependentList>();
    saveError = false;
    loadSpinner = false;
    isAflacReadOnly = false;
    incompleteRegistrationError: string;
    hideDependentTab: boolean;
    hideContactTab: boolean;
    hidePersonalInfoTab: boolean;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.ariaShowMenu",
        "primary.portal.register.dependents.edit",
        "primary.portal.register.dependents.remove",
        "primary.portal.register.dependentsAddDependentsLink",
        "primary.portal.common.finishRegistration",
        "primary.portal.common.cancel",
        "primary.portal.common.remove",
        "primary.portal.common.back",
    ]);

    constructor(
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly accountService: AccountService,
        private readonly router: Router,
        private readonly route: ActivatedRoute,
        private readonly auth: AuthenticationService,
        private readonly language: LanguageService,
        private readonly staticUtilService: StaticUtilService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
    ) {
        const currentNavigationState = this.router.getCurrentNavigation().extras.state;
        if (currentNavigationState && currentNavigationState.multipleAccountMode) {
            this.store.dispatch(new SetRegistrationMemberId(currentNavigationState.memberId));
            this.store.dispatch(new SetGroupId(currentNavigationState.groupId));
        }
    }

    /**
     * ngOnInit function is one of an Angular component's life-cycle methods
     * This function is used to initialize all the values and functions at the time of component loading.
     */
    ngOnInit(): void {
        // It is used to not route user directly to other page of registration
        if (this.auth.formValue.value < 7) {
            this.saveError = true;
            this.store.dispatch(new SetIncompleteRegistrationAlert(this.saveError));
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
        this.memberId = this.store.selectSnapshot(RegistrationState.memberId);
        this.MpGroup = this.store.selectSnapshot(RegistrationState.groupId);
        // TODO - remove the below routing after portal validation is in place
        if (!this.memberId || !this.MpGroup) {
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
        this.loadSpinner = true;
        this.subscriptions.push(
            this.accountService.getDependentRelations(this.MpGroup).subscribe((x: Relations[]) => {
                this.store.dispatch(new SetRelations(x));
            }),
        );
        this.getMemberDependents();
        this.getConfiguration();

        this.subscriptions.push(
            combineLatest(
                this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(null, null, this.MpGroup),
                this.staticUtilService.cacheConfigEnabled(AFLAQ_HQ_REGISTRATION_EDIT),
            ).subscribe(([isNotHQAccount, response]) => {
                this.isAflacReadOnly = !isNotHQAccount && !response;
                this.loadSpinner = false;
            }),
        );
    }

    /**
     * This function is used to get member's dependents
     */
    getMemberDependents(): void {
        this.loadSpinner = true;
        this.subscriptions.push(
            this.memberService.getMemberDependents(this.memberId, true, this.MpGroup).subscribe(
                (resp) => {
                    this.loadSpinner = false;
                    if (resp.length !== 0) {
                        this.dependents = true;
                        this.store.dispatch(new SetDependents(resp));
                        this.bindDatatoTable(resp);
                    } else {
                        this.dependents = false;
                    }
                },
                (error) => {
                    this.loadSpinner = false;
                    if (error.status === 403) {
                        // TODO : server down should be handled globally
                        this.errorMsg = "server down";
                    }
                    // TODO: should be replaced with Mon-alert
                },
            ),
        );
    }
    /**
     * Method to bind data to Table
     * @param data : To bind Member dependent data to table
     */
    bindDatatoTable(data: MemberDependent[]): void {
        const tableData = [];
        const relations = this.store.selectSnapshot(RegistrationState.relations);
        data.forEach((row) => {
            const relationName = relations.filter((x) => x.id === row.dependentRelationId).pop();
            const timedifference = Math.abs(Date.now() - new Date(row.birthDate).getTime());
            const calculatedAge = Math.floor(timedifference / (1000 * 3600 * 24) / 365.25);
            tableData.push({
                name: row.name,
                birthDate: row.birthDate,
                gender: row.gender,
                age: calculatedAge,
                relation: relationName.name,
                id: row.id,
            });
        });
        this.dataSource.data = tableData;
    }

    // funtion to trigger on edit button click
    onEditClick(dependentId: number): void {
        this.auth.formValue.next(8);
        this.router.navigate([`../dependents/${dependentId}`], { relativeTo: this.route });
    }
    onAddDependentsClick(): void {
        this.auth.formValue.next(8);
    }

    onDeleteClick(dependent: any): void {
        this.auth.formValue.next(8);
        this.remove = true;
        this.dependentToRemove = dependent;
    }
    onCancelClick(): void {
        this.remove = false;
        this.dependentToRemove = null;
    }

    /**
     * This function is used to delete dependent
     */
    deleteDependent(): void {
        this.loadSpinner = true;
        this.subscriptions.push(
            this.memberService.deleteMemberDependent(this.memberId, this.dependentToRemove.id.toString(), this.MpGroup).subscribe(
                (x) => {
                    this.loadSpinner = false;
                    this.dependentToRemove = null;
                    this.getMemberDependents();
                    this.remove = false;
                },
                (errorResp) => {
                    this.loadSpinner = false;
                    this.error = true;
                    if (errorResp.status === 403) {
                        if (errorResp.error.code === "prerequisiteFailed") {
                            this.errorMsg = "secondary.portal.register.dependents.prerequisiteFailed";
                        } else {
                            // TODO : server down should be handled globally
                            this.errorMsg = "server down";
                        }
                    }
                },
            ),
        );
    }
    /**
     * This function is used to get config from DB.
     */
    getConfiguration(): void {
        this.subscriptions.push(
            combineLatest(
                this.staticUtilService.cacheConfigEnabled("member.registration.skip.personal.info"),
                this.staticUtilService.cacheConfigEnabled("member.registration.skip.contact.info"),
                this.staticUtilService.cacheConfigEnabled("member.registration.skip.add.dependent"),
            ).subscribe(([personalFlag, contactFlag, dependentFlag]) => {
                this.hidePersonalInfoTab = personalFlag;
                this.hideContactTab = contactFlag;
                this.hideDependentTab = dependentFlag;
            }),
        );
    }

    /**
     * This function is used to navigate back
     */
    clickOnBack(): void {
        if (!this.hideContactTab) {
            this.router.navigate(["../contact-info"], { relativeTo: this.route });
        } else if (!this.hidePersonalInfoTab) {
            this.router.navigate(["../personal-info"], { relativeTo: this.route });
        } else {
            this.router.navigate(["../../login"], { relativeTo: this.route });
        }
    }

    /**
     * This function is used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        if (this.subscriptions.length) {
            this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        }
    }

    moreOption(): void {
        this.mySelect.open();
    }
}
