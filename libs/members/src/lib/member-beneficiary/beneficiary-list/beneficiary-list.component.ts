import { Component, OnInit, ViewChild, OnDestroy } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatSort } from "@angular/material/sort";
import { MatTableDataSource } from "@angular/material/table";
import { MemberService, StaticService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { Subscription, of, defer, Subject } from "rxjs";
import { ActivatedRoute, Router } from "@angular/router";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { UserService } from "@empowered/user";
import { map, take, takeUntil, tap } from "rxjs/operators";
import {
    Permission,
    ConfigName,
    ProductNames,
    ClientErrorResponseCode,
    BeneficiaryAction,
    BeneficiaryListColumns,
    BeneficiaryType,
    UserPermissionList,
    AppSettings,
    MemberCredential,
    MemberBeneficiary,
    MemberBeneficiaryDisplay,
} from "@empowered/constants";
import {
    AddMemberBeneficiaryValidators,
    SetBeneficiariesMemberGroupId,
    SetBeneficiariesMemberId,
    MemberBeneficiaryService,
    SharedState,
    StaticUtilService,
    UtilService,
} from "@empowered/ngxs-store";
import { MonDialogComponent, MonDialogData, BeneficiaryAddComponent } from "@empowered/ui";

@Component({
    selector: "empowered-beneficiary-list",
    templateUrl: "./beneficiary-list.component.html",
    styleUrls: ["./beneficiary-list.component.scss"],
})
export class BeneficiaryListComponent implements OnInit, OnDestroy {
    data: MatTableDataSource<MemberBeneficiary>;
    memberId: number;
    templateFlag: boolean;
    MpGroup: number;
    showErrorMessage: boolean;
    errorMessage: string;
    isLoading: boolean;
    ERROR = "error";
    BADPARAMETER = "badParameter";
    DETAILS = "details";
    FIELD = "field";
    CHARITY = "CHARITY";
    errorMessageArray = [];
    langStrings = {};
    displayedColumnsArray = [
        BeneficiaryListColumns.NAME,
        BeneficiaryListColumns.TYPE,
        BeneficiaryListColumns.RELATIONSHIP,
        BeneficiaryListColumns.ALLOCATION,
        BeneficiaryListColumns.MANAGE,
    ];
    tempAction = BeneficiaryAction;
    beneficiaryObj: MemberBeneficiary;
    beneficiaryObjType: string;
    beneficiaryObjId: number;
    estateBeneficiary: MemberBeneficiary;
    beneficiaryType = BeneficiaryType;
    private readonly unsubscribe$ = new Subject<void>();
    activeCol: string;
    portal: string;
    isMemberPortal: boolean;
    canUpdateAllocation: boolean;
    @ViewChild(MatSort) sort: MatSort;
    hasPrivilege$ = of(false);
    hasPrivilegeToAddBeneficiary$ = of(false);
    canRemoveBeneficiary: boolean;
    readonly PRODUCT = ProductNames;

    // flag indicating whether CR MON-63034 changes are enabled
    relationshipToInsuredEnabled: boolean;

    /**
     * Get config indicating whether relationship to insured feature is enabled.
     */
    private readonly relationshipToInsuredEnabled$ = defer(() =>
        this.staticUtil.cacheConfigEnabled(ConfigName.RELATIONSHIP_TO_INSURED_ENABLE).pipe(
            take(1),
            tap((enabled) => (this.relationshipToInsuredEnabled = enabled)),
        ),
    );

    constructor(
        private readonly service: MemberService,
        private readonly dialog: MatDialog,
        private readonly store: Store,
        private readonly staticService: StaticService,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly language: LanguageService,
        private readonly memberSharedService: MemberBeneficiaryService,
        private readonly userService: UserService,
        private readonly staticUtil: StaticUtilService,
        private readonly utilService: UtilService,
    ) {
        this.templateFlag = true;
        this.hideErrorAlertMessage();
        this.getLanguageStrings();

        const [my, estate] = (this.langStrings["primary.portal.coverage.beneficiary.myEstate"] as string).split(" ");

        this.estateBeneficiary = {
            type: estate?.toUpperCase(),
            name: {
                firstName: my,
                lastName: estate,
            },
            relationshipToMember: this.langStrings["primary.portal.dashboard.hyphen"],
            details: null,
            allocations: [],
            contact: null,
        };
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.*"));
    }
    /**
     * Life cycle hook to initialize the component.
     * Initialize side nav, getting required data as well as check and set flags.
     * @returns void
     */
    ngOnInit(): void {
        this.relationshipToInsuredEnabled$.subscribe();
        this.portal = this.store.selectSnapshot(SharedState.portal);
        this.isMemberPortal = this.portal === AppSettings.PORTAL_MEMBER;
        if (this.isMemberPortal) {
            this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: MemberCredential) => {
                if (credential.groupId && credential.memberId) {
                    this.MpGroup = credential.groupId;
                    this.memberId = credential.memberId;

                    this.setValuesToStore();
                    this.getConfigurations();
                    this.listOfBeneficiaries(this.memberId, this.MpGroup);
                }
            });
        } else {
            const params = this.route.parent.parent.snapshot.params;
            this.MpGroup = +params["mpGroupId"] ? +params["mpGroupId"] : +params["mpGroup"];
            this.memberId = +params["memberId"] ? +params["memberId"] : +params["customerId"];

            this.setValuesToStore();
            this.getConfigurations();
            this.listOfBeneficiaries(this.memberId, this.MpGroup);
        }
        this.hasPrivilege$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.TPP_RESTRICTED_PERMISSION, this.MpGroup.toString())
            .pipe(map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)));
        this.hasPrivilegeToAddBeneficiary$ = this.utilService
            .checkDisableForRole12Functionalities(Permission.RESTRICT_CREATE_BENEFICIARY, this.MpGroup.toString())
            .pipe(map(([isRestricted, accountData]) => !(isRestricted && accountData.thirdPartyPlatformsEnabled)));
        this.staticUtil
            .cacheConfigEnabled(ConfigName.COVERAGE_SUMMARY_BENEFICIARY_UPDATE_ALLOCATION)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((resp) => {
                this.canUpdateAllocation = resp;
            });
        this.store
            .select(SharedState.hasPermission(UserPermissionList.REMOVE_BENEFICIARY))
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((canRemoveBeneficiary) => (this.canRemoveBeneficiary = canRemoveBeneficiary));
    }
    setValuesToStore(): void {
        this.store.dispatch(new SetBeneficiariesMemberId(this.memberId));
        this.store.dispatch(new SetBeneficiariesMemberGroupId(this.MpGroup));
        this.memberSharedService.mpGroup.next(this.MpGroup);
        this.memberSharedService.memberId.next(this.memberId);
    }
    getConfigurations(): void {
        this.staticService
            .getConfigurations("portal.member.form.beneficiary.*", this.MpGroup)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                this.store.dispatch(new AddMemberBeneficiaryValidators(Response));
                this.memberSharedService.validators.next(Response);
            });
    }

    /**
     * Get language for specific keys and set locally.
     */
    getLanguageStrings(): void {
        this.langStrings = this.language.fetchPrimaryLanguageValues([
            "primary.portal.members.beneficiaryList.title",
            "primary.portal.common.addBeneficiary",
            "primary.portal.common.ariaShowMenu",
            "primary.portal.members.beneficiaryList.relationshipToInsured",
            "primary.portal.coverage.beneficiary.myEstate",
            "primary.portal.coverage.estate",
            "primary.portal.dashboard.hyphen",
            "primary.portal.setPrices.percentage",
        ]);
    }

    /**
     * Method to get the list of beneficiaries
     * @param memberId - id of the member
     * @param MpGroup  - member group
     */
    listOfBeneficiaries(memberId: number, MpGroup: number): void {
        this.isLoading = true;
        this.service
            .getMemberBeneficiaries(memberId, MpGroup, true)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                (data: MemberBeneficiaryDisplay[]) => {
                    this.isLoading = false;
                    const estateBeneficiaryIndex = data.map((beneficiary) => beneficiary.type).indexOf(this.estateBeneficiary.type);
                    data.forEach((beneficiary) => (beneficiary.actions = this.getAction(beneficiary)));
                    if (estateBeneficiaryIndex > -1) {
                        data = data.map((beneficiary) =>
                            beneficiary.type === this.estateBeneficiary.type ? { ...this.estateBeneficiary, ...beneficiary } : beneficiary,
                        );
                    } else {
                        data.push(this.estateBeneficiary);
                    }
                    if (this.relationshipToInsuredEnabled) {
                        data.forEach((beneficiary) => {
                            const juvenileAllocation = beneficiary.allocations.find(
                                (allocation) =>
                                    (allocation.product === ProductNames.JUVENILE_TERM_LIFE ||
                                        allocation.product === ProductNames.JUVENILE_WHOLE_LIFE) &&
                                    beneficiary.type !== this.langStrings["primary.portal.coverage.estate"].toUpperCase(),
                            );
                            if (juvenileAllocation && juvenileAllocation.nameOfInsured) {
                                beneficiary.juvenileInsured = true;
                                beneficiary.relationshipToInsured = juvenileAllocation.relationshipToInsured || "";
                                beneficiary.fullNameOfJuvenileInsured = juvenileAllocation.nameOfInsured
                                    ? `${juvenileAllocation.nameOfInsured.firstName} ${juvenileAllocation.nameOfInsured.lastName}`
                                    : "";
                            }
                        });
                    }
                    this.data = new MatTableDataSource(data);
                    this.data.sort = this.sort;
                },
                (Error) => {
                    this.isLoading = false;
                    this.data = new MatTableDataSource([this.estateBeneficiary]);
                    this.data.sort = this.sort;
                    this.showErrorAlertMessage(Error);
                },
            );
    }

    /**
     * Method to return beneficiary actions
     * @param element beneficiary details
     * @return Action to manage beneficiary
     */
    getAction(element: MemberBeneficiary): string[] {
        if (this.beneficiaryType[element.type] === this.beneficiaryType.INDIVIDUAL && !!element.dependentId && this.canUpdateAllocation) {
            return [this.tempAction.UPDATE];
        }
        if (this.canRemoveBeneficiary && !this.canUpdateAllocation && !element.dependentId) {
            return [this.tempAction.EDIT, this.tempAction.REMOVE];
        }
        if (this.canRemoveBeneficiary && this.canUpdateAllocation) {
            return [this.tempAction.EDIT, this.tempAction.UPDATE, this.tempAction.REMOVE];
        }
        return [];
    }

    takeAction(action: string, element: any): void {
        switch (action) {
            case this.tempAction.REMOVE:
                this.removeBeneficiary(element);
                break;
            case this.tempAction.EDIT:
                this.editBeneficiary(element);
                break;
            case this.tempAction.UPDATE:
                this.goToCovrageSummary(element);
                break;
            default:
        }
    }
    goToCovrageSummary(element: any): void {
        const url = "../enrollment/benefit-summary/coverage-summary";
        this.router.navigate([url], { relativeTo: this.route });
    }

    editBeneficiary(beneficiary: any): void {
        this.beneficiaryObjType = beneficiary.type;
        this.beneficiaryObjId = beneficiary.id;
        this.templateFlag = false;
    }

    addNewBeneficiary(): void {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.minWidth = "100%";
        dialogConfig.height = "100%";
        dialogConfig.panelClass = "add-beneficiary";
        const dialogRef = this.dialog.open(BeneficiaryAddComponent, dialogConfig);
        dialogRef
            .afterClosed()
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((Response) => {
                if (Response === "Submit") {
                    this.listOfBeneficiaries(this.memberId, this.MpGroup);
                }
            });
    }

    doneEdit($event: any): void {
        this.templateFlag = true;
        this.listOfBeneficiaries(this.memberId, this.MpGroup);
    }

    removeBeneficiary(element: any): void {
        let dialogData: MonDialogData;
        const name =
            this.beneficiaryType[element.type] === this.beneficiaryType.INDIVIDUAL
                ? element.name.firstName + " " + element.name.lastName
                : element.name;
        if (!element.allocations.length) {
            if (this.data.data.length === 2) {
                dialogData = {
                    title: this.language
                        .fetchPrimaryLanguageValue("primary.portal.members.removeBeneficiary.scenerio1Title")
                        .replace("#name", name),
                    content: this.language.fetchPrimaryLanguageValue("primary.portal.members.removeBeneficiary.scenerio1Content"),
                    primaryButton: {
                        buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
                        buttonAction: this.OnRemoveConfirm.bind(this, element),
                    },
                    secondaryButton: {
                        buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
                    },
                };
            } else {
                dialogData = {
                    title: this.language
                        .fetchPrimaryLanguageValue("primary.portal.members.removeBeneficiary.scenerio3Title")
                        .replace("#name", name),
                    content: "",
                    primaryButton: {
                        buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.remove"),
                        buttonAction: this.OnRemoveConfirm.bind(this, element),
                    },
                    secondaryButton: {
                        buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.cancel"),
                    },
                };
            }
        } else {
            dialogData = {
                title: this.language.fetchPrimaryLanguageValue("primary.portal.members.removeBeneficiary.scenerio2Title"),
                content: this.language.fetchPrimaryLanguageValue("primary.portal.members.removeBeneficiary.scenerio2Content"),
                primaryButton: {
                    buttonTitle: this.language.fetchPrimaryLanguageValue("primary.portal.common.gotIt"),
                    buttonClass: "mon-btn-primary",
                },
            };
        }
        this.dialog.open(MonDialogComponent, {
            data: dialogData,
            width: "40rem",
        });
    }
    OnRemoveConfirm(element: any): void {
        this.service
            .deleteMemberBeneficiary(this.memberId, this.MpGroup, element.id)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((data) => {
                this.listOfBeneficiaries(this.memberId, this.MpGroup);
            });
    }
    hideErrorAlertMessage(): void {
        this.errorMessage = "";
        this.showErrorMessage = false;
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
    sortData(event: any): void {
        this.activeCol = event.active;
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
