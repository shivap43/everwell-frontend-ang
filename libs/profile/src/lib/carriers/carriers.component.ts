import { OnInit, Component, OnDestroy } from "@angular/core";
import {
    AccountService,
    ProducerService,
    AccountDetails,
    DashboardService,
    STATUS,
    AflacService,
    BenefitsOfferingService,
    ApprovalRequestStatus,
    ApprovalRequest,
    CarrierInfo,
    CarrierContact,
    CarriersList,
    AccountCallCenter,
    StaticService,
    AflacGroupInfo,
    BillingAccount,
    Agents,
    CallCenter,
} from "@empowered/api";
import { Observable, Subject, Subscription, combineLatest, of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { MatTableDataSource } from "@angular/material/table";
import { ActivatedRoute, Router } from "@angular/router";
import {
    MonDialogComponent,
    MonDialogData,
    OpenToast,
    ToastModel,
    AddUpdateContactInfoComponent,
    AgRefreshService,
    AflacGroupOfferingQuasiComponent,
} from "@empowered/ui";
import { ImportAccountComponent } from "../import-account/import-account.component";
import { Store } from "@ngxs/store";
import { UserService } from "@empowered/user";
import { map, filter, tap, switchMap, takeUntil, catchError, finalize } from "rxjs/operators";
import { HqAdminReviewBoComponent } from "../hq-admin-review-bo/hq-admin-review-bo.component";
import {
    Permission,
    DateFormats,
    PagePrivacy,
    AppSettings,
    ToastType,
    CarrierId,
    Address,
    ProducerCredential,
    AddUpdateContactDialogData,
    RefreshEligibleInfo,
    StatusTypeValues,
} from "@empowered/constants";
import { AgRemovePopupComponent } from "../ag-remove-popup/ag-remove-popup.component";
import { AccountInfoState, AddAccountInfo, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { AccountNameUpdateService, SharedService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";

const AI_ONLY = "AFLAC_INDIVIDUAL";
const AG_ONLY = "AFLAC_GROUP";
const SHARED_CASE = "SHARED_CASE";
const GROUP_ENABLE_INDEX = 0;
const GROUP_CREATE_INDEX = 1;
const GROUP_CREATE_LINK_INDEX = 2;
const RADIX_TEN = 10;
const MBO_GROUP_ATTRIBUTE_NAME = "INITIAL_BO_STATUS";
const COMPLETE = "COMPLETE";
const NOTIFICATION_PARAM_VALUE = "true";

@Component({
    selector: "empowered-carriers",
    templateUrl: "./carriers.component.html",
    styleUrls: ["./carriers.component.scss"],
})
export class CarriersComponent implements OnInit, OnDestroy {
    CarrierId = CarrierId;
    displayColumns: string[];
    carriersList = [];
    mpGroupId: string;
    isSpinnerLoading = false;
    langStrings: Record<string, string>;
    showErrorMessage = false;
    errorMessage = null;
    columns = {
        NAME: "name",
        ADDRESS: "address",
        PHONE: "phone",
        EMAIL: "email",
        PRIMARY: "primary",
        MANAGE: "manage",
    };
    carrierAttributeType = {
        SIC_CODE: "SIC code",
        INDUSTRY_CODE: "Industry code",
        EMP_ID: "Employee ID",
        DEPARTMENT: "Department",
    };
    isRole93: boolean;
    subscriber: Subscription[] = [];
    CARRIER = "CARRIER";
    country = AppSettings.COUNTRY_US;
    totalCarriersList: any[];
    isAIOnly = false;
    isAGOnly = false;
    isSharedAccount = false;
    canImportAg = false;
    hasAflacImportAccess = false;
    aflacGroupInfo: AflacGroupInfo;

    agentInfo = {
        WRITING_AGENT: "writingAgent",
        WRITING_NUMBER: "writingNumber",
        AGENT_EMAIL: "agentEmail",
    };
    billingAccountInfo = {
        BILLING_ACCOUNT_NUMBER: "billingAccountNumber",
        DEDUCTION_REGISTER: "deductionRegister",
        FIRST_DEDUCTION: "firstDeduction",
        CREATED_ON: "createdOn",
    };

    displayAgentInfo: string[];
    displayBillingAccountInfo: string[];

    agentInfoSource: MatTableDataSource<Agents>;
    billingInfoSource: MatTableDataSource<BillingAccount>;
    private readonly unsubscribe$: Subject<void> = new Subject<void>();
    currentAccount: AccountDetails;
    recentApprovalRequest: ApprovalRequest;
    userPermissions = Permission;
    agRefreshStatus$: Observable<boolean>;
    benefitOfferingStatus = false;
    approvalRequestTypes = ApprovalRequestStatus;
    dateFormat = DateFormats.MONTH_DAY_YEAR;
    isRefreshEligible: RefreshEligibleInfo;
    canUnlink$: Observable<boolean>;
    isApprovalPending: boolean;
    isEnroller: boolean;
    isPrivacyOnForEnroller: boolean;
    // to check if user has permission to read aflac account
    hasReadAflacAccountPermission$: Observable<boolean> = this.staticUtilService.hasPermission(Permission.READ_AFLAC_ACCOUNT);
    constructor(
        private readonly accountService: AccountService,
        private readonly languageService: LanguageService,
        private readonly dialog: MatDialog,
        private readonly route: ActivatedRoute,
        private readonly router: Router,
        private readonly store: Store,
        private readonly user: UserService,
        private readonly producerService: ProducerService,
        private readonly dashboardService: DashboardService,
        private readonly staticUtilService: StaticUtilService,
        private readonly aflacService: AflacService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly benefitsOfferingService: BenefitsOfferingService,
        private readonly utilService: UtilService,
        private readonly accountNameUpdate: AccountNameUpdateService,
        private readonly empoweredSheetService: EmpoweredSheetService,
        private readonly agRefreshService: AgRefreshService,
        private readonly staticService: StaticService,
        private readonly sharedService: SharedService,
    ) {
        this.fetchLanguageStrings();
        const params = this.route.parent.parent.snapshot.params;
        const queryParam = this.route.snapshot.queryParams;
        this.mpGroupId = this.router.url.indexOf("prospect") !== -1 ? params["prospectId"] : params["mpGroupId"];

        this.displayAgentInfo = [this.agentInfo.WRITING_AGENT, this.agentInfo.WRITING_NUMBER, this.agentInfo.AGENT_EMAIL];

        this.displayBillingAccountInfo = [
            this.billingAccountInfo.BILLING_ACCOUNT_NUMBER,
            this.billingAccountInfo.DEDUCTION_REGISTER,
            this.billingAccountInfo.FIRST_DEDUCTION,
            this.billingAccountInfo.CREATED_ON,
        ];
        this.fetchAccount();
        this.subscriber.push(
            this.benefitsOfferingService.reviewBenefitsOfferingFlag$
                .pipe(
                    filter((res) => res),
                    switchMap((res) => this.reviewBenefitsOffering()),
                )
                .subscribe(),
        );
        this.subscriber.push(this.fetchApprovalRequests().subscribe());
        if (queryParam && queryParam.notification === NOTIFICATION_PARAM_VALUE) {
            this.subscriber.push(this.reviewBenefitsOffering().subscribe());
        }

        this.isEnroller = this.store.selectSnapshot(SharedState.getPrivacyForEnroller);
        if (this.isEnroller) {
            this.isPrivacyOnForEnroller = this.sharedService.getPrivacyConfigforEnroller(PagePrivacy.ACCOUNT_CARRIERS);
        }
    }

    /**
     * Implements Angular's OnInit Life Cycle hook
     */
    ngOnInit(): void {
        this.displayColumns = [
            this.columns.NAME,
            this.columns.ADDRESS,
            this.columns.PHONE,
            this.columns.EMAIL,
            this.columns.PRIMARY,
            this.columns.MANAGE,
        ];
        this.user.credential$
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((credential: ProducerCredential) => this.hasAgImportAccess(credential)),
            )
            .subscribe();
        this.isRole93 = this.store.selectSnapshot(SharedState.hasPermission(Permission.READ_AFLAC_ACCOUNT));
        this.subscriber.push(
            combineLatest([
                this.accountService.getGroupAttributesByName([MBO_GROUP_ATTRIBUTE_NAME]),
                this.benefitsOfferingService.getApprovalRequests(parseInt(this.mpGroupId, RADIX_TEN)),
            ]).subscribe(([attributeByNameResponse, approvalRequest]) => {
                this.benefitOfferingStatus = Boolean(
                    attributeByNameResponse && attributeByNameResponse.length && attributeByNameResponse[0].value === COMPLETE,
                );
                this.isApprovalPending = approvalRequest.some((approval) => approval.status === ApprovalRequestStatus.SUBMITTED_TO_HR);
            }),
        );
        this.subscriber.push(this.accountType().subscribe());
        this.subscriber.push(this.loadAccountcarrierList().subscribe());
        this.subscriber.push(this.loadAGInfo().subscribe());

        this.subscriber.push(
            combineLatest([
                this.staticUtilService.cacheConfigValue("general.aflac_groups.enable"),
                this.staticUtilService.hasPermission("aflac.account.group.create"),
                this.staticUtilService.hasPermission("aflac.account.group.create.link"),
            ]).subscribe((resp) => {
                const aflacAccess = resp[GROUP_ENABLE_INDEX] && resp[GROUP_ENABLE_INDEX].toLowerCase() === AppSettings.TRUE.toLowerCase();
                const canCreate = resp[GROUP_CREATE_INDEX];
                const canLink = resp[GROUP_CREATE_LINK_INDEX];
                this.hasAflacImportAccess = canCreate && canLink && aflacAccess;
            }),
        );
        this.canUnlink$ = this.aflacService.getAflacGroupUnlinkPermit(this.mpGroupId);
    }

    /**
     * Method to call Aflac Group Info API
     * @returns Observable of Aflac Group Info
     */
    loadAGInfo(): Observable<AflacGroupInfo> {
        this.isSpinnerLoading = true;
        return this.aflacService.getAflacGroupInformation().pipe(
            tap((response) => {
                this.isSpinnerLoading = false;
                this.aflacGroupInfo = response;
                this.agentInfoSource = new MatTableDataSource(this.aflacGroupInfo.agents);
                this.billingInfoSource = new MatTableDataSource(this.aflacGroupInfo.billingAccounts);
            }),
            catchError((error) => {
                this.isSpinnerLoading = false;
                return of(null);
            }),
        );
    }

    /**
     * This method is used to refreshAflacGroupAccount
     */
    refreshAflacGroupAccount(): void {
        this.isSpinnerLoading = true;
        this.agRefreshService
            .refreshAgOffering(this.currentAccount, this.isRefreshEligible, true)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((res) => this.loadAGInfo()),
                switchMap((res) => this.loadAccountcarrierList()),
                switchMap((res) => this.accountType()),
                finalize(() => {
                    this.isSpinnerLoading = false;
                }),
            )
            .subscribe();
    }

    /**
     * Method to call Account Carriers API
     * @returns Observable Array of Carriers
     */
    loadAccountcarrierList(): Observable<Array<CarriersList>> {
        this.isSpinnerLoading = true;
        this.hideErrorAlertMessage();
        return this.getAccountCarriers().pipe(
            tap((resp) => {
                this.isSpinnerLoading = false;
                this.carriersList = Array.from(new Set(resp.map((val) => val.id))).map((id) => resp.find((value) => value.id === id));
            }),
            catchError((error) => {
                this.isSpinnerLoading = false;
                this.showErrorAlertMessage(error);
                return of(null);
            }),
        );
    }
    /**
     * Method to get account carriers information
     * @returns Observable<Array<any>>
     */
    getAccountCarriers(): Observable<Array<any>> {
        // eslint-disable-next-line no-underscore-dangle, @typescript-eslint/no-this-alias
        const _this = this;
        const returnFlag = new Subject<any>();
        this.subscriber.push(
            this.accountService.getAccountCarriers(this.mpGroupId).subscribe(
                (carrierList) => {
                    if (carrierList && carrierList.carriers) {
                        this.totalCarriersList = carrierList.carriers.filter((x) => x.carrier.id === CarrierId.AFLAC);

                        this.totalCarriersList.forEach((element) => {
                            if (element.carrier.id) {
                                this.subscriber.push(
                                    this.accountService.getCarrierContacts(this.mpGroupId, element.carrier.id).subscribe(
                                        (list) => {
                                            element["carrierContacts"] = this.setDataSource(list);
                                            returnFlag.next(_this.totalCarriersList);
                                        },
                                        (Error) => {
                                            element["carrierContacts"] = [];
                                        },
                                    ),
                                );
                            }
                            if (element.carrierAttributes) {
                                element.carrierAttributes[this.carrierAttributeType.DEPARTMENT] =
                                    element.carrierAttributes[this.carrierAttributeType.DEPARTMENT] === "true"
                                        ? this.langStrings["primary.portal.profile.carriers.requiredText"]
                                        : this.langStrings["primary.portal.profile.carriers.optionalText"];

                                element.carrierAttributes[this.carrierAttributeType.EMP_ID] =
                                    element.carrierAttributes[this.carrierAttributeType.EMP_ID] === "true"
                                        ? this.langStrings["primary.portal.profile.carriers.requiredText"]
                                        : this.langStrings["primary.portal.profile.carriers.optionalText"];
                            }
                            returnFlag.next(_this.totalCarriersList);
                        });
                        returnFlag.next(_this.totalCarriersList);
                    }
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            ),
        );
        return returnFlag.asObservable();
    }
    setDataSource(data: any): any {
        return new MatTableDataSource(
            data.map((row) => ({
                id: row.id,
                name: row.name,
                address: this.getAddressDisplayText(row.address),
                phoneNumber: row.phoneNumbers.length ? row.phoneNumbers[0].phoneNumber : null,
                email: row.emailAddresses.length ? row.emailAddresses[0].email : null,
                isPrimary: row.primary,
            })),
        );
    }

    getAddressDisplayText(address: Address): string {
        const addressArray = [];
        if (address.address1 && address.address1 !== "") {
            addressArray.push(address.address1);
        }
        if (address.address2 && address.address2 !== "") {
            addressArray.push(address.address2);
        }
        const cityStateArray = [];
        if (address.city && address.city !== "") {
            cityStateArray.push(address.city);
        }
        cityStateArray.push(`${address.state} ${address.zip}`);
        return `${addressArray.join(", ")}<br/>${cityStateArray.join(", ")}`;
    }
    removeCarrierContact(carrierId: string, contactId: string): void {
        const dialogData: MonDialogData = {
            title: this.langStrings["primary.portal.profile.carriers.removeTitle"],
            content: this.langStrings["primary.portal.profile.carriers.removeDesc"],
            primaryButton: {
                buttonTitle: this.langStrings["primary.portal.common.remove"],
                buttonAction: this.onConfirmRemoveCarrierContact.bind(this, carrierId, contactId),
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
    /**
     * Method invoked to remove carrier contact
     * @param carrierId string
     * @param contactId string
     */
    onConfirmRemoveCarrierContact(carrierId: string, contactId: string): void {
        this.subscriber.push(
            this.accountService
                .deleteAccountCarrierContact(this.mpGroupId, carrierId, contactId)
                .pipe(switchMap(() => this.loadAccountcarrierList()))
                .subscribe(
                    () => {},
                    (error) => this.showErrorAlertMessage(error),
                ),
        );
    }
    /**
     * Method to Add Carrier Contact
     * @param carrier Carrier information
     * @param hasData boolean
     */
    addCarrierContact(carrier: CarrierInfo, hasData: boolean): void {
        const isAdd = true;
        const data: AddUpdateContactDialogData = {
            parentMode: this.CARRIER,
            isAdd: isAdd,
            isPrimary: isAdd && !hasData,
            mpGroupId: this.mpGroupId,
            carrier: carrier,
            replacePrimary: hasData ? this.getReplacePrimaryContact(carrier.id) : undefined,
            allowEditingAddress: true,
            allowEditingContactName: true,
            allowEditingPhoneNumber: true,
            allowEditingEmailAddress: true,
        };
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            maxWidth: "600px",
            panelClass: "add-carrier-contact",
            data: data,
        };
        const dialogRef = this.dialog.open(AddUpdateContactInfoComponent, dialogConfig);
        this.subscriber.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((response) => response),
                    switchMap(() => this.loadAccountcarrierList()),
                )
                .subscribe(),
        );
    }
    /**
     * Method invoked to replace primary contact
     * @param carrierId string
     * @returns contact name
     */
    getReplacePrimaryContact(carrierId: string): string | undefined {
        const carrierObj = this.carriersList.find((x) => x.carrier.id === carrierId);
        if (carrierObj) {
            const contactList = carrierObj.carrierContacts.data;
            if (contactList.length) {
                const contact = contactList.find((x) => x.isPrimary === true);
                return contact ? contact.name : undefined;
            }
        }
        return undefined;
    }
    /**
     * Method invoked to edit Carrier contact
     * @param carrierContact carrier contact information
     * @param carrier Carrier Information
     * @param hasData boolean
     */
    EditCarrierContact(carrierContact: CarrierContact, carrier: CarrierInfo, hasData: boolean): void {
        const data: AddUpdateContactDialogData = {
            parentMode: this.CARRIER,
            isAdd: false,
            isPrimary: carrierContact.isPrimary,
            mpGroupId: this.mpGroupId,
            carrier: carrier,
            carrierContact: carrierContact,
            replacePrimary: !carrierContact.isPrimary ? this.getReplacePrimaryContact(carrier.id) : undefined,
            allowEditingAddress: true,
            allowEditingContactName: true,
            allowEditingPhoneNumber: true,
            allowEditingEmailAddress: true,
        };
        const dialogConfig = {
            disableClose: false,
            autoFocus: true,
            maxWidth: "600px",
            panelClass: "edit-carrier-contact",
            data: data,
        };
        const dialogRef = this.dialog.open(AddUpdateContactInfoComponent, dialogConfig);
        this.subscriber.push(
            dialogRef
                .afterClosed()
                .pipe(
                    filter((res) => res),
                    switchMap((res) => this.loadAccountcarrierList()),
                )
                .subscribe(),
        );
    }
    /**
     * Method to update flags to hide alert message
     */
    hideErrorAlertMessage(): void {
        this.showErrorMessage = false;
        this.errorMessage = null;
    }
    /**
     * Method to show Alert Message
     * @param err Error Information
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err["error"];
        if (error.status === AppSettings.API_RESP_400 && error["details"].length > 0) {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(
                `secondary.portal.profile.carrier.api.${error.status}.${error.code}.${error["details"].field}`,
            );
        } else {
            this.errorMessage = this.languageService.fetchSecondaryLanguageValue(`secondary.api.${error.status}.${error.code}`);
        }
    }
    /**
     * This method is used to fetch all primary language strings from language service
     */
    fetchLanguageStrings(): void {
        this.langStrings = this.languageService.fetchPrimaryLanguageValues([
            "primary.portal.profile.carriers.title",
            "primary.portal.profile.carriers.contacts.title",
            "primary.portal.profile.carriers.contacts.addContact",
            "primary.portal.profile.carriers.contacts.name",
            "primary.portal.profile.carriers.contacts.address",
            "primary.portal.profile.carriers.contacts.phone",
            "primary.portal.profile.carriers.contacts.email",
            "primary.portal.profile.carriers.contacts.primary",
            "primary.portal.profile.carriers.contacts.manage",
            "primary.portal.profile.carriers.contacts.noResultFound",
            "primary.portal.profile.carriers.removeTitle",
            "primary.portal.profile.carriers.removeDesc",
            "primary.portal.profile.carriers.sicCode",
            "primary.portal.profile.carriers.requiredText",
            "primary.portal.profile.carriers.optionalText",
            "primary.portal.profile.carriers.industryCode",
            "primary.portal.profile.carriers.empId",
            "primary.portal.profile.carriers.department",
            "primary.portal.profile.carriers.notAvailable",
            "primary.portal.common.remove",
            "primary.portal.common.cancel",
            "primary.portal.common.edit",
            "primary.portal.common.moreMenuOption",
            "primary.portal.benefitsOffering.aflac",
            "primary.portal.aflacgroup.importaccount.aflacGroup",
            "primary.portal.aflacgroup.importaccount.importAflacGroup",
            "primary.portal.aflacgroup.importaccount.aflacGroupImported",
            "primary.portal.aflacgroup.importaccount.importAflacAccount",
            "primary.portal.aflacgroup.importaccount.aflacAccountImported",
            "primary.portal.aflacgroup.carrier.aflacGroup",
            "primary.portal.aflacgroup.carrier.refreshAGInfo",
            "primary.portal.aflacgroup.carrier.removeAflacGroup",
            "primary.portal.aflacgroup.carrier.generalInfo",
            "primary.portal.aflacgroup.carrier.organization",
            "primary.portal.aflacgroup.carrier.AGNumber",
            "primary.portal.aflacgroup.carrier.AGFileName",
            "primary.portal.aflacgroup.carrier.employeeIDType",
            "primary.portal.aflacgroup.carrier.situsState",
            "primary.portal.aflacgroup.carrier.hoursPerweek",
            "primary.portal.aflacgroup.carrier.writingAgent",
            "primary.portal.aflacgroup.carrier.writingNumber",
            "primary.portal.aflacgroup.carrier.email",
            "primary.portal.aflacgroup.carrier.billingAccountInfo",
            "primary.portal.aflacgroup.carrier.agentInfo",
            "primary.portal.aflacgroup.carrier.billingAccountNumber",
            "primary.portal.aflacgroup.carrier.deductionRegister",
            "primary.portal.aflacgroup.carrier.firstDeduction",
            "primary.portal.aflacgroup.carrier.createdOn",
            "primary.portal.aflacgroup.carrier.locationInfo",
            "primary.portal.aflacgroup.carrier.city",
            "primary.portal.aflacgroup.carrier.primaryContact",
            "primary.portal.aflacgroup.carrier.locationCode",
            "primary.portal.aflacgroup.carrier.stateProvince",
            "primary.portal.aflacgroup.carrier.billingAccountNumber",
            "primary.portal.aflacgroup.carrier.address1",
            "primary.portal.aflacgroup.carrier.address2",
            "primary.portal.aflacgroup.carrier.zipPostalCode",
            "primary.portal.aflacgroup.carrier.locationName",
            "primary.portal.profile.accountInfo.eaaStatus.notAvailable",
            "primary.portal.aflacGroup.offering.updateComplete",
            "primary.portal.aflacGroup.offering.reviewBenefit",
            "primary.portal.aflacgroup.importaccount.importAflacGroup.tooltip",
            "primary.portal.profile.carriers.zeroState",
        ]);
    }

    /**
     * @description Function to open Aflac Individual import popup
     * @param isGroup boolean value which tell if group Account will be imported
     * @memberof CarriersComponent
     */
    importAccount(isGroup: boolean): void {
        const importAccountDialog = this.dialog.open(ImportAccountComponent, {
            backdropClass: "backdrop-blur",
            panelClass: "import-account",
            width: "600px",
            data: { route: this.route, isGroup: isGroup, mpGroup: parseInt(this.mpGroupId, RADIX_TEN) },
        });
        let toastModel: ToastModel;
        this.subscriber.push(
            importAccountDialog
                .afterClosed()
                .pipe(
                    switchMap((response) => {
                        if (response && response.altGroupNumber) {
                            this.isAIOnly = false;
                            this.isSharedAccount = true;
                            toastModel = {
                                message: this.langStrings["primary.portal.aflacgroup.importaccount.aflacGroupImported"].replace(
                                    "##groupNumber##",
                                    response.altGroupNumber,
                                ),
                                toastType: ToastType.SUCCESS,
                            };
                            if (this.benefitOfferingStatus && !this.isApprovalPending) {
                                return this.empoweredSheetService
                                    .openSheet(AflacGroupOfferingQuasiComponent, {
                                        data: { opensFrom: "carriersTab" },
                                    })
                                    .afterDismissed();
                            }
                            return of(true);
                        }
                        if (response && response.linkAccountError) {
                            toastModel = {
                                message: this.languageService.fetchPrimaryLanguageValue(response.linkAccountError),
                                toastType: ToastType.DANGER,
                            };
                            return this.store.dispatch(new OpenToast(toastModel));
                        }
                        if (response && response.newHireError) {
                            toastModel = {
                                message: response.newHireError,
                                toastType: ToastType.DANGER,
                            };
                            return this.store.dispatch(new OpenToast(toastModel));
                        }
                        if (response && response.isIndividualLinkSuccess) {
                            this.isAGOnly = false;
                            toastModel = {
                                message: this.langStrings["primary.portal.aflacgroup.importaccount.aflacAccountImported"].replace(
                                    "##groupNumber##",
                                    response.isIndividualLinkSuccess,
                                ),
                                toastType: ToastType.SUCCESS,
                            };
                            this.isSharedAccount = true;
                            return of(true);
                        }
                        return undefined;
                    }),
                    switchMap((res) => {
                        this.store.dispatch(new OpenToast(toastModel));
                        return this.loadAGInfo();
                    }),
                    switchMap((res) => this.loadAccountcarrierList()),
                    switchMap((res) => {
                        this.canUnlink$ = this.aflacService.getAflacGroupUnlinkPermit(this.mpGroupId);
                        return this.accountType();
                    }),
                )
                .subscribe(),
        );
    }

    /**
     * Method to determine the type of account
     * AI only or AG only or shared
     * @returns Observable of AccountDetails
     */
    accountType(): Observable<AccountDetails> {
        this.isSpinnerLoading = true;
        return this.dashboardService.getAccount(this.mpGroupId.toString()).pipe(
            tap((accountDetailResponse: AccountDetails) => {
                this.isSpinnerLoading = false;
                this.accountNameUpdate.accountName$.next(accountDetailResponse.name);
                this.store.dispatch(
                    new AddAccountInfo({
                        accountInfo: accountDetailResponse,
                        mpGroupId: this.mpGroupId.toString(),
                    }),
                );
                if (accountDetailResponse.status !== StatusTypeValues.INACTIVE) {
                    this.isAIOnly = accountDetailResponse.importType === AI_ONLY;
                    this.isAGOnly = accountDetailResponse.importType === AG_ONLY;
                    this.isSharedAccount = accountDetailResponse.importType === SHARED_CASE;
                }
                if (this.isSharedAccount || this.isAGOnly) {
                    this.agRefreshStatus$ = this.aflacService.getAflacGroupRefreshStatus(parseInt(this.mpGroupId, RADIX_TEN)).pipe(
                        map((refreshStatus) => {
                            this.isRefreshEligible = this.utilService.copy(refreshStatus);
                            return refreshStatus.refreshAllowed || refreshStatus.requiresBenefitOfferingRenewal;
                        }),
                    );
                }
            }),
        );
    }

    /**
     * This method will verify user have access to import ag account or not.
     * @param credential ProducerCredential
     * @returns Observable of call-center details response if logged in user is call-center agent else returns null
     */
    hasAgImportAccess(credential: ProducerCredential): Observable<AccountCallCenter | CallCenter> {
        this.isSpinnerLoading = true;
        return this.producerService.getProducerInformation(credential.producerId.toString()).pipe(
            switchMap((producerInfo) => {
                this.canImportAg = producerInfo.carrierAppointments.some((carrierInfo) => carrierInfo.carrier.id === CarrierId.AFLAC_GROUP);
                if (credential.producerId && credential.callCenterId) {
                    return this.staticService.getCallCenter(credential.callCenterId).pipe(
                        tap((callCenterResponse) => {
                            this.canImportAg = this.canImportAg && callCenterResponse.aflacGroupEnrollmentAllowed;
                        }),
                    );
                }
                return of(null);
            }),
            finalize(() => (this.isSpinnerLoading = false)),
        );
    }

    /**
     * This method is used get current account details
     */
    fetchAccount(): void {
        this.currentAccount = this.store.selectSnapshot(AccountInfoState.getAccountInfo);
    }

    /**
     * Function to open dialog when user clicks on review benefit
     * @returns observable of approval request array
     */
    reviewBenefitsOffering(): Observable<ApprovalRequest[]> {
        const dialogConfig = new MatDialogConfig();
        dialogConfig.disableClose = true;
        dialogConfig.autoFocus = true;
        dialogConfig.minWidth = "100%";
        dialogConfig.height = "100%";
        dialogConfig.panelClass = "add-beneficiary";
        dialogConfig.data = this.mpGroupId;
        return this.dialog
            .open(HqAdminReviewBoComponent, dialogConfig)
            .afterClosed()
            .pipe(
                filter((isUpdated) => isUpdated),
                switchMap((res) => this.fetchApprovalRequests()),
                tap((res) => {
                    this.agRefreshStatus$ = this.aflacService.getAflacGroupRefreshStatus(parseInt(this.mpGroupId, RADIX_TEN)).pipe(
                        map((refreshStatus) => {
                            this.isRefreshEligible = this.utilService.copy(refreshStatus);
                            return refreshStatus.refreshAllowed || refreshStatus.requiresBenefitOfferingRenewal;
                        }),
                    );
                }),
            );
    }
    /**
     * This method is used to fetch approval requests
     * @returns observable of ApprovalRequest array
     */
    fetchApprovalRequests(): Observable<ApprovalRequest[]> {
        this.isSpinnerLoading = true;
        return this.benefitsOfferingService.getApprovalRequests(+this.mpGroupId).pipe(
            tap((approvalRequests) => {
                this.isSpinnerLoading = false;
                this.recentApprovalRequest = this.utilService.copy(approvalRequests).pop();
            }),
        );
    }
    /**
     * method call to get review benefit dialog
     */
    reviewFlow(): void {
        this.subscriber.push(this.reviewBenefitsOffering().subscribe());
    }

    /**
     * This method is used to open remove popup modal
     * If Role 93, navigate to account list page after modal gets close
     */
    removeAflacAccount(): void {
        this.empoweredModalService
            .openDialog(AgRemovePopupComponent, {
                data: {
                    mpGroup: this.mpGroupId,
                    benefitOfferingStatus: this.benefitOfferingStatus,
                },
            })
            .afterClosed()
            .pipe(
                takeUntil(this.unsubscribe$),
                filter((res) => res),
                switchMap(() => {
                    if (this.isRole93) {
                        this.router.navigate(["../../../../../payroll"], { relativeTo: this.route });
                        return of(null);
                    }
                    this.isSharedAccount = false;
                    this.isAIOnly = true;
                    this.isAGOnly = false;
                    return this.loadAccountcarrierList().pipe(switchMap(() => this.accountType()));
                }),
            )
            .subscribe();
    }

    ngOnDestroy(): void {
        this.subscriber.forEach((sub) => {
            if (sub) {
                sub.unsubscribe();
            }
        });
    }
}
