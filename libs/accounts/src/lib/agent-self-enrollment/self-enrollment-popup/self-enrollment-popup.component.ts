import { ProductType, DIGIT_ZERO, DIGIT_ONE } from "./../self-enrollment-constant";
import { SelfEnrollmentPersonalInfoComponent } from "./../self-enrollment-personal-info/self-enrollment-personal-info.component";
import { AddAccountInfo, SetPortal, SetRouteAfterLogin, SetURLNavigationAfterLogin, StaticUtilService } from "@empowered/ngxs-store";
import { EmpoweredModalService } from "@empowered/common-services";
import { FormControl, Validators } from "@angular/forms";
import { takeUntil, switchMap } from "rxjs/operators";
import { ProducerService, MemberService, AdminService, AuthenticationService, AccountService } from "@empowered/api";
import { Component, OnInit, OnDestroy } from "@angular/core";
import { UserService } from "@empowered/user";
import { Subject, combineLatest, EMPTY, forkJoin } from "rxjs";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { SELF_ENROLL_POPUP_LANG } from "../self-enrollment-constant";
import { Store } from "@ngxs/store";
import { Router } from "@angular/router";
import {
    ClientErrorResponseCode,
    MEMBER_HOME_ROUTE,
    MEMBER_PORTAL,
    CompanyCode,
    AppSettings,
    Portals,
    ProducerCredential,
    Admin,
} from "@empowered/constants";

export interface EnrollmentModal {
    companyCode: string;
    groupId: number;
    producerId: number[];
    adminData: Admin;
}

const EQUAL_SPLIT_KEY = "=";
const COMMA_KEY = ",";
const ACCOUNT_NUMBER_CONFIG = "aflac.producer.selfEnrollment.accountNumbers";
const US_NONLIFE_CONFIG = "aflac.producer.selfEnrollment.us_non_life";
const US_LIFE_CONFIG = "aflac.producer.selfEnrollment.us_life";
const NY_ONLY_CONFIG = "aflac.producer.selfEnrollment.ny";
const ACCOUNT_MAPPED_CONFIG = "aflac.producer.selfEnrollment.accountNumber.map";
const REPORTS_ID = "reportsToId";
const ERROR = "error";
const DETAILS = "details";
const EMAIL_ADDRESS = "emailaddresses";

@Component({
    selector: "empowered-self-enrollment-popup",
    templateUrl: "./self-enrollment-popup.component.html",
    styleUrls: ["./self-enrollment-popup.component.scss"],
})
export class SelfEnrollmentPopupComponent implements OnInit, OnDestroy {
    producerId: number;
    selectedLocation: FormControl;
    isUS = true;
    productType: FormControl;
    isNYStateLicensed = false;
    onlyNYStateLicensed = false;
    usNonLifeAccountNumber: string;
    usLifeAccountNumber: string;
    nyAccountNumber: string;
    isSpinnerLoading = false;
    nonProdLife = ProductType.NONLIFE;
    prodLife = ProductType.LIFE;
    newYorkOption = CompanyCode.NY;
    usOption = CompanyCode.US;
    mappedGroupId: string;
    mappedAccountConfig: string[] = [];
    getAdminData: Admin;
    showErrorMessage = false;
    errorMessage: string;
    private readonly unsubscribe$: Subject<void> = new Subject();
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues(SELF_ENROLL_POPUP_LANG);
    routeToMemberPortal = false;
    selectedProductType: string;

    constructor(
        private readonly producerService: ProducerService,
        private readonly userService: UserService,
        private readonly staticUtil: StaticUtilService,
        private readonly language: LanguageService,
        private readonly memberService: MemberService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly adminService: AdminService,
        private readonly store: Store,
        private readonly authenticationService: AuthenticationService,
        private readonly router: Router,
        private readonly user: UserService,
        private readonly accountService: AccountService,
    ) {}
    /**
     * Angular life cycle method to execute the code on initializing component
     */
    ngOnInit(): void {
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary.portal.*"));
        this.selectedLocation = new FormControl(null, Validators.required);
        this.productType = new FormControl(null, Validators.required);
        this.userService.credential$.pipe(takeUntil(this.unsubscribe$)).subscribe((credential: ProducerCredential) => {
            this.producerId = credential.producerId;
        });
        this.getProducerInformation();
    }

    /**
     * Get the producer information to map the licensed state of logged in producer
     * @returns void
     */
    getProducerInformation(): void {
        this.isSpinnerLoading = true;
        combineLatest([
            this.staticUtil.cacheConfigValue(ACCOUNT_NUMBER_CONFIG),
            this.staticUtil.cacheConfigValue(US_NONLIFE_CONFIG),
            this.staticUtil.cacheConfigValue(US_LIFE_CONFIG),
            this.staticUtil.cacheConfigValue(NY_ONLY_CONFIG),
            this.staticUtil.cacheConfigValue(ACCOUNT_MAPPED_CONFIG),
            this.producerService.getProducerInformation(this.producerId.toString()),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(([accountNumber, usNonlife, usLife, NY, accountMappedConfig, data]) => {
                this.mappedAccountConfig = accountMappedConfig.split(COMMA_KEY);
                this.isSpinnerLoading = false;
                this.usLifeAccountNumber = usLife;
                this.usNonLifeAccountNumber = usNonlife;
                this.nyAccountNumber = NY;
                if (data.licenses.length > DIGIT_ZERO) {
                    const nyLicence = data.licenses.filter((license) => license.state.abbreviation === CompanyCode.NY);
                    this.isNYStateLicensed = Boolean(nyLicence.length);
                    this.onlyNYStateLicensed = this.isNYStateLicensed && data.licenses.length === DIGIT_ONE;
                }
                this.selectedLocation.setValue(CompanyCode.US);
                this.productType.setValue(this.usNonLifeAccountNumber);
                this.selectedProductType = this.usNonLifeAccountNumber;
            });
    }
    /**
     * Set the form control based on the selection of location
     * @param value Selected location of enrollment
     */
    chooseLocation(selectedState: string): void {
        this.isUS = selectedState !== CompanyCode.NY;
        this.selectedLocation.setValue(selectedState);
        if (selectedState === CompanyCode.NY) {
            this.productType.setValue(this.nyAccountNumber);
        } else {
            this.productType.setValue(this.selectedProductType);
        }
    }
    /**
     * Set the form control based on product type selected by the producer
     * @param value Selected product type from enrolled product
     */
    chooseLifeProduct(selectedProductType: string): void {
        this.productType.setValue(selectedProductType);
        this.selectedProductType = selectedProductType;
    }

    /**
     * Continue button decide whether user will land on personal info modal or sso page
     * @returns void
     */
    continue(): void {
        if (this.onlyNYStateLicensed) {
            this.productType.setValue(this.nyAccountNumber);
            this.selectedLocation.setValue(CompanyCode.NY);
        }
        this.mappedGroupId = this.mappedAccountConfig
            .find((mappedConfig) => mappedConfig.toLowerCase().includes(this.productType.value.toLowerCase()))
            .split(EQUAL_SPLIT_KEY)[DIGIT_ONE];
        this.checkIfMemberAlreadyEnrolled();
    }

    /**
     * Function will decide whether producer is already enrolled as a member or not
     * @returns void
     */
    checkIfMemberAlreadyEnrolled(): void {
        this.isSpinnerLoading = true;
        this.adminService
            .getAdmin(this.producerId, REPORTS_ID)
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((response) => {
                    this.getAdminData = response;
                    return this.memberService.searchMembers({
                        payload: this.mappedGroupId,
                        searchHeaderObj: {
                            property: EMAIL_ADDRESS,
                            value: this.getAdminData.emailAddress,
                        },
                    });
                }),
                switchMap((customers) => {
                    if (customers.content.length === DIGIT_ZERO) {
                        this.empoweredModalService.closeDialog();
                        this.empoweredModalService
                            .openDialog(SelfEnrollmentPersonalInfoComponent, {
                                data: {
                                    companyCode: this.selectedLocation.value,
                                    groupId: this.mappedGroupId,
                                    producerId: [this.producerId],
                                    adminData: this.getAdminData,
                                },
                            })
                            .afterClosed();
                        return EMPTY;
                    }
                    return this.authenticationService.getAgentSelfEnrollmentToken(this.mappedGroupId);
                }),
                switchMap((response) => {
                    this.routeToMemberPortal = true;
                    return forkJoin([
                        this.authenticationService.agentSelfEnrollmentSSO(response),
                        this.accountService.getAccount(this.mappedGroupId),
                    ]);
                }),
            )
            .subscribe(
                ([cred, accountInfo]) => {
                    if (this.routeToMemberPortal) {
                        this.store.dispatch([
                            new SetPortal(Portals.MEMBER),
                            new SetRouteAfterLogin(MEMBER_PORTAL),
                            new SetURLNavigationAfterLogin(MEMBER_HOME_ROUTE),
                            new AddAccountInfo({
                                accountInfo,
                                mpGroupId: cred.groupId.toString(),
                            }),
                        ]);
                        this.user.setUserCredential(cred);
                        this.router.navigate([MEMBER_HOME_ROUTE]).then(() => {
                            this.empoweredModalService.closeDialog();
                            this.isSpinnerLoading = false;
                        });
                    }
                },
                (error) => {
                    this.isSpinnerLoading = false;
                    this.showErrorAlertMessage(error);
                },
            );
    }
    /**
     * Function to map the error code with their message from DB
     * @param err error object from API call
     * @returns void
     */
    showErrorAlertMessage(err: Error): void {
        this.showErrorMessage = true;
        const error = err[ERROR];
        if (error.status === AppSettings.API_RESP_400 && error[DETAILS].length > DIGIT_ZERO) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.members.api.400.badParameter.emailAddresses.${error.status}.${error.code}.${error[DETAILS][DIGIT_ZERO]}`,
            );
        } else if (error.status === ClientErrorResponseCode.RESP_403) {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(
                `secondary.portal.selfEnrollment.emailSearch.api.${error.status}.${error.code}`,
            );
        } else {
            this.errorMessage = this.language.fetchSecondaryLanguageValue(`secondary.portal.${error.status}.${error.code}`);
        }
    }
    /**
     * Implements Angular OnDestroy Life Cycle hook
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
