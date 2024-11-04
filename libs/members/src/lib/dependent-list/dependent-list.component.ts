import { Component, OnInit, OnDestroy, ViewChild } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { AccountService, MemberService, StaticService, AuthenticationService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { MatTableDataSource } from "@angular/material/table";
import { MatSort } from "@angular/material/sort";
import { Subscription, Observable, combineLatest, forkJoin, of, Subject } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UserService } from "@empowered/user";
import { filter, switchMapTo, switchMap, tap, catchError, map, shareReplay, takeUntil } from "rxjs/operators";
import { RemoveDependentComponent } from "./remove-dependent/remove-dependent.component";
import {
    ClientErrorResponseCode,
    Permission,
    ConfigName,
    BooleanConst,
    UserPermissionList,
    AppSettings,
    DependentListAction,
    DependentListColumns,
    VerificationStatus,
    MemberCredential,
    MemberProfile,
    Relations,
    MemberDependent,
} from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";

import {
    SetDependentRelations,
    SetDependentsMemberId,
    SetMemberGroupId,
    AccountInfoState,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { TPIRestrictionsForHQAccountsService, EmpoweredModalService } from "@empowered/common-services";
import { DateService } from "@empowered/date";

const PROSPECT = "prospect";
const HQ_ACCOUNT = "is_hq_account";
const TRUE_VALUE = "TRUE";
@Component({
    selector: "empowered-dependent-list",
    templateUrl: "./dependent-list.component.html",
    styleUrls: ["./dependent-list.component.scss"],
})
export class DependentListComponent implements OnInit, OnDestroy {
    displayedColumns: string[];
    datasource: MatTableDataSource<MemberDependent>;
    private readonly unsubscribe$ = new Subject<void>();
    data: MemberDependent[] = [];
    memberFullName: string;
    dependentManageAction;
    private memberId: number;
    private MpGroup;
    customDateFormat = AppSettings.DATE_FORMAT_MM_DD_YYYY;
    subscriber: Subscription[] = [];
    sort: MatSort;
    verificationStatus = VerificationStatus;
    activeCol: string;
    portal: string;
    isMemberPortal: boolean;
    showErrorMessage: boolean;
    errorMessage: string;
    isLoading: boolean;
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    errorMessageArray = [];
    canAccessAflacHQAc = true;
    isHqAccount = false;
    isTpiAccount = false;
    showDependentsConfig = true;
    showAddDependents = true;
    restrictAddDependents = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.common.addDependent",
        "primary.portal.common.ariaShowMenu",
        "primary.portal.members.dependentList.edit",
        "primary.portal.members.dependentList.verify",
        "primary.portal.members.dependentList.reset",
        "primary.portal.members.dependentList.remove",
        "primary.portal.members.dependentList.verifiedDependent",
        "primary.portal.members.dependentList.unverifiedDependent",
        "primary.portal.members.dependentList.title",
        "primary.portal.members.dependentList.ageColumn",
    ]);
    hasPrivilege$ = of(false);

    constructor(
        private readonly router: Router,
        private readonly memberService: MemberService,
        private readonly store: Store,
        private readonly accountService: AccountService,
        private readonly route: ActivatedRoute,
        private readonly language: LanguageService,
        private readonly userService: UserService,
        private readonly staticUtil: StaticUtilService,
        private readonly tpiRestrictions: TPIRestrictionsForHQAccountsService,
        private readonly empoweredModal: EmpoweredModalService,
        private readonly utilService: UtilService,
        private readonly staticService: StaticService,
        private readonly authenticationService: AuthenticationService,
        private readonly dateService: DateService,
    ) {
        this.dependentManageAction = DependentListAction;
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }

    /**
     * Initializes necessary variables
     * @returns nothing
     */
    ngOnInit(): void {
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
        if (this.isMemberPortal) {
            this.isLoading = true;
            this.userService.credential$
                .pipe(
                    filter((credential: MemberCredential) => !!credential.groupId && !!credential.memberId),
                    tap((credential: MemberCredential) => {
                        this.MpGroup = credential.groupId;
                        this.memberId = credential.memberId;
                        this.setUpStoreValues();
                    }),
                    switchMap((credential) => this.getMemberDependents(credential.memberId, credential.groupId)),
                    takeUntil(this.unsubscribe$),
                )
                .subscribe(
                    (result) => {
                        this.isLoading = false;
                    },
                    (error) => {
                        this.isLoading = false;
                    },
                );
        } else {
            const params = this.route.parent.parent.snapshot.params;
            this.MpGroup = +params["mpGroupId"] ? +params["mpGroupId"] : +params["mpGroup"];
            this.memberId = +params["memberId"] ? +params["memberId"] : +params["customerId"];
            if (this.router.url.includes(PROSPECT)) {
                this.MpGroup = this.store.selectSnapshot(AccountInfoState.getMpGroupId);
            }
            this.setUpStoreValues();
            this.getMemberDependents(this.memberId, this.MpGroup).pipe(takeUntil(this.unsubscribe$)).subscribe();
        }
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.MpGroup.toString())
            .pipe(
                map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)),
                shareReplay(1),
            );
        if (this.portal === AppSettings.PORTAL_PRODUCER) {
            this.tpiRestrictions
                .canAccessTPIRestrictedModuleInHQAccount(Permission.DEPENDENTS_READONLY, null, this.MpGroup)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => {
                    this.canAccessAflacHQAc = res;
                });
        }
        if (this.portal === AppSettings.PORTAL_MEMBER) {
            combineLatest([
                this.tpiRestrictions.canAccessTPIRestrictedModuleInHQAccount(),
                this.staticUtil.cacheConfigEnabled("aflac_hq.member.portal.info.edit"),
            ])
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(([isNotHQAccount, response]) => {
                    this.canAccessAflacHQAc = isNotHQAccount || response;
                });
        }
        this.showAddDependentButton();
    }
    setUpStoreValues(): void {
        this.store.dispatch(new SetDependentsMemberId(this.memberId));
        this.store.dispatch(new SetMemberGroupId(this.MpGroup));
    }
    /**
     * Gets member dependents and initializes relevant variables
     * @param memberId member's ID
     * @param groupId member's group ID
     * @returns observable of member's dependents
     */
    getMemberDependents(memberId: number, groupId: number): Observable<MemberDependent[]> {
        this.displayedColumns = this.getDisplayColumns();
        return forkJoin(
            [
                this.memberService.getMember(memberId, false, groupId.toString()),
                this.accountService.getDependentRelations(groupId),
                this.memberService.getMemberDependents(memberId, true, groupId),
            ].map((observable: Observable<HttpResponse<MemberProfile> | Relations[] | MemberDependent[]>) =>
                observable.pipe(
                    catchError((error) => {
                        this.showErrorAlertMessage(error);
                        this.isLoading = false;
                        return of(null);
                    }),
                ),
            ),
        ).pipe(
            tap(([member, dependentRelations, dependents]: [HttpResponse<MemberProfile>, Relations[], MemberDependent[]]) => {
                if (member) {
                    this.retriveMemberData(member.body);
                }
                if (dependents && dependents.length > 0) {
                    this.data = dependents;
                } else {
                    this.data = [];
                    this.datasource = new MatTableDataSource(this.data);
                }
                if (dependentRelations && dependentRelations.length > 0) {
                    this.formatTableDataSource(dependentRelations);
                }
                this.store.dispatch(new SetDependentRelations(dependentRelations));
            }),
            map(([, , dependents]) => dependents),
        );
    }

    formatTableDataSource(relations: Relations[]): void {
        this.datasource = new MatTableDataSource(
            this.data.map((row) => ({
                name: row.name.firstName + " " + row.name.lastName,
                relation: relations.find((x) => x.id === row.dependentRelationId).name,
                birthDate: row.birthDate,
                age: this.calculateAge(row.birthDate),
                gender: row.gender ? row.gender.slice(0, 1) : "",
                verificationStatus: row.profile.verified,
                id: row.id,
                state: row.state,
            })),
        );
        this.datasource.sort = this.sort;
    }
    /**
     * function to set the error message based on API response
     * @param err Error stack
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        const error = err[this.ERROR];
        if (error.status === ClientErrorResponseCode.RESP_400 && error[this.DETAILS].length > 0) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.${error.status}.${error.code}.${error[this.DETAILS][0].field}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
        this.showErrorMessage = true;
    }
    getDisplayColumns(): string[] {
        const list: string[] = [DependentListColumns.NAME, DependentListColumns.RELATIONSHIP];
        list.push(this.isMemberPortal ? DependentListColumns.AGE : DependentListColumns.DOB);
        return list.concat([DependentListColumns.GENDER, DependentListColumns.VERIFIED, DependentListColumns.MANAGE]);
    }
    /**
     * Returns string array of actions a member can perform on a table row
     * @param element data row
     * @returns array of actions
     */
    getManageAction(element: any): string[] {
        let hasPermission;

        this.store
            .select(SharedState.hasPermission(UserPermissionList.REMOVE_DEPENDENT))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((response) => {
                hasPermission = response ? true : false;
            });
        return this.isMemberPortal
            ? [DependentListAction.RESET, DependentListAction.EDIT, DependentListAction.VERIFICATION, DependentListAction.REMOVE]
            : hasPermission
                ? [DependentListAction.EDIT, DependentListAction.REMOVE]
                : [DependentListAction.EDIT];
    }
    onActionClick(action: string, element: any): void {
        switch (action) {
            case this.dependentManageAction.EDIT:
                this.editDependent(element.id);
                break;
            case this.dependentManageAction.REMOVE:
                this.onDependentRemoveClick(element);
                break;
            case this.dependentManageAction.VERIFICATION:
                break;
            case this.dependentManageAction.RESET:
                break;
            default:
        }
    }
    getAriaLabelandLanguageForActions(action: string, isLanguage: boolean): string | undefined {
        switch (action) {
            case this.dependentManageAction.EDIT:
                return isLanguage
                    ? "primary.portal.members.dependentList.edit"
                    : this.languageStrings["primary.portal.members.dependentList.edit"];
                break;
            case this.dependentManageAction.REMOVE:
                return isLanguage
                    ? "primary.portal.members.dependentList.remove"
                    : this.languageStrings["primary.portal.members.dependentList.remove"];
                break;
            case this.dependentManageAction.VERIFICATION:
                return isLanguage
                    ? "primary.portal.members.dependentList.verify"
                    : this.languageStrings["primary.portal.members.dependentList.verify"];
                break;
            case this.dependentManageAction.RESET:
                return isLanguage
                    ? "primary.portal.members.dependentList.reset"
                    : this.languageStrings["primary.portal.members.dependentList.reset"];
                break;
            default:
        }
        return undefined;
    }
    @ViewChild(MatSort) set matSort(ms: MatSort) {
        this.sort = ms;
        if (this.datasource) {
            this.datasource.sort = this.sort;
        }
    }
    calculateAge(birthDate: string): number | undefined {
        if (birthDate) {
            const timeDiff = Math.abs(Date.now() - this.dateService.toDate(birthDate).getTime());
            return Math.floor(timeDiff / (1000 * 3600 * 24) / 365.25);
        }
        return undefined;
    }
    retriveMemberData(data: MemberProfile): void {
        this.memberFullName = data.name.firstName + " " + data.name.lastName;
    }
    /**
     * Opens the remove dependent confirmation dialog
     * @param element data row
     */
    onDependentRemoveClick(element: any): void {
        this.empoweredModal
            .openDialog(RemoveDependentComponent, {
                data: { name: element.name },
            })
            .afterClosed()
            .pipe(
                filter(Boolean),
                tap(() => (this.isLoading = true)),
                switchMapTo(this.memberService.deleteMemberDependent(this.memberId, element.id.toString(), this.MpGroup)),
                switchMapTo(this.getMemberDependents(this.memberId, this.MpGroup)),
                takeUntil(this.unsubscribe$),
            )
            .subscribe(
                (result) => {
                    this.isLoading = false;
                },
                (error) => {
                    this.isLoading = false;
                },
            );
    }
    addDependent(): void {
        const url = `${this.router.url}/add`;
        this.router.navigate([url]);
    }
    editDependent(element: number): void {
        const url = `${this.router.url}/${element}`;
        this.router.navigate([url]);
    }
    /**
     * This function hides or shows the add Dependents button based on permissions and other conditions
     */
    showAddDependentButton(): void {
        forkJoin([
            this.accountService.getAccount(this.MpGroup),
            this.staticService.getConfigurations(ConfigName.PRODUCER_PERMISSION_TPP_RESTRICT_CREATE_DEPENDENTS, this.MpGroup),
            this.accountService.getGroupAttributesByName([HQ_ACCOUNT], this.MpGroup),
            this.authenticationService.permissions$,
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([accountInfo, permissionConfig, groupAttribute, permissions]) => {
                this.isTpiAccount = accountInfo.thirdPartyPlatformsEnabled;
                this.showDependentsConfig = permissionConfig[0].value === TRUE_VALUE;
                this.isHqAccount = groupAttribute[0].attribute === HQ_ACCOUNT && groupAttribute[0].value === BooleanConst.TRUE;
                if (permissions.length > 0) {
                    this.restrictAddDependents = Boolean(permissions.some((d) => String(d) === Permission.RESTRICT_ADD_DEPENDENTS));
                }
                this.showAddDependents = !(
                    this.isTpiAccount &&
                    !this.isHqAccount &&
                    this.restrictAddDependents &&
                    this.showDependentsConfig
                );
            });
    }

    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
    sortData(event: any): void {
        this.activeCol = event.active;
    }
}
