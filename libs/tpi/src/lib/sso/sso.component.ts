import { Component, OnInit, OnDestroy } from "@angular/core";
import { ActivatedRoute, Router, NavigationEnd } from "@angular/router";
import { AccountService, ACOOUNT_PRODUCER_ROLE, AuthenticationService, MemberService } from "@empowered/api";
import { Store } from "@ngxs/store";
import { LanguageService, LoadSecondaryLandingLanguage } from "@empowered/language";
import { PageLogService } from "@empowered/common-services";
import { Subject, combineLatest, of, EMPTY, Observable, forkJoin } from "rxjs";
import { CsrfService } from "@empowered/util/csrf";
import { takeUntil, delay, tap, switchMap, filter, map } from "rxjs/operators";
import { SetMPGroup, SetMemberId, SetRegex, SetTPISSODetail, StaticUtilService } from "@empowered/ngxs-store";
import { UserService } from "@empowered/user";
import { HttpErrorResponse } from "@angular/common/http";
import {
    ClientErrorResponseType,
    ClientErrorResponseCode,
    TpiSSOModel,
    UserPermissionList,
    AppSettings,
    ServerErrorResponseCode,
    ClientErrorResponseDetailCodeType,
    Credential,
    ProducerDetails,
    MemberProfile,
    ContactType,
    SSOError,
} from "@empowered/constants";
import { TpiServices } from "@empowered/common-services";
import { PhoneFormatConverterPipe } from "@empowered/ui";
const TPI_VERSION = "1.1";
const DELAY_SPIN = 2000;
const PRODUCER_CONSENT_URL = "/producer/login/consent";
const PRODUCER_PAYROLL_URL = "/producer/payroll";
const PRODUCER_DIRECT_URL = "/producer/direct";
const USER_INFO_STORAGE = "userInfo";
const PRODUCER = "producerId";
const EMPTY_STRING = "";
const DIRECT_PERMISSION = 2;
const PAYROLL_PERMISSION = 3;
const SERVER_DOWN_ERROR = "Sorry, the site is temporarily unavailable. We're working to fix the issue. Please try again later";
@Component({
    selector: "empowered-sso",
    templateUrl: "./sso.component.html",
    styleUrls: ["./sso.component.scss"],
})
export class SsoComponent implements OnInit, OnDestroy {
    loadSpinner = true;
    encData: string;
    errorMessage: string;
    tpiSSODetail: TpiSSOModel;
    version = TPI_VERSION;
    approvalPending: string;
    duplicateMember: string;
    internalServerErrorSpecificMessage: string;
    memberData: MemberProfile;
    primaryProducer: ProducerDetails;
    private readonly unsubscribe$: Subject<void> = new Subject();
    tpiModalMode = false;
    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.interimProcess.everwell",
        "primary.portal.interimProcess.aflac",
        "primary.portal.tpi.allOfferings.approvalPending.agentAssisted",
        "primary.portal.tpiEnrollment.exit",
    ]);
    producerSsoFlag = true;
    tpiSsoInnerSubscriptionFlag = false;
    directPermission: boolean;
    preferredContactErrorMessage: string[] = [];

    constructor(
        private readonly route: ActivatedRoute,
        private readonly authService: AuthenticationService,
        private readonly store: Store,
        private readonly language: LanguageService,
        private readonly router: Router,
        private readonly csrfService: CsrfService,
        private readonly tpiService: TpiServices,
        private readonly user: UserService,
        private readonly staticUtil: StaticUtilService,
        private readonly pageLogService: PageLogService,
        private readonly memberService: MemberService,
        private readonly accountService: AccountService,
    ) {}

    /**
     * In this lifecycle hook we are validating the active route url to determine if it is a tpi flow or producer sso flow
     */
    ngOnInit(): void {
        if (this.router.url.indexOf(AppSettings.TPI) > 0) {
            this.producerSsoFlag = false;
        }
        this.store.dispatch(new LoadSecondaryLandingLanguage("secondary*"));
        this.loadTpiSsoData();
    }

    /**
     *  this method will subscribe to corresponding api calls for tpi and sso
     */
    loadTpiSsoData(): void {
        combineLatest([
            this.route.queryParams,
            this.csrfService.load(),
            this.staticUtil.hasPermission(UserPermissionList.DIRECT),
            this.staticUtil.hasPermission(UserPermissionList.PAYROLL),
        ])
            .pipe(
                takeUntil(this.unsubscribe$),
                switchMap((resp) => {
                    this.encData = resp[0].encData;
                    this.directPermission = resp[DIRECT_PERMISSION] && !resp[PAYROLL_PERMISSION];
                    if (this.producerSsoFlag) {
                        return this.authService.producerSSO(this.encData);
                    }
                    return this.authService.tpiSSO(this.encData);
                }),
                switchMap((response) => {
                    if (this.producerSsoFlag) {
                        return this.producerSSO(response as Credential);
                    }
                    return this.getTpiSSO(response as TpiSSOModel);
                }),
                switchMap(() => this.accountService.getAccountProducers(this.tpiSSODetail.user.groupId.toString())),
                tap(
                    (producer) =>
                        (this.primaryProducer = producer.find(
                            (primary) => primary.role === ACOOUNT_PRODUCER_ROLE.PRIMARY_PRODUCER,
                        )?.producer),
                ),
                switchMap(() =>
                    forkJoin([
                        this.memberService.getMember(this.tpiSSODetail.user.memberId, true, this.tpiSSODetail.user.groupId.toString()),
                        this.memberService.getMemberContact(
                            this.tpiSSODetail.user.memberId,
                            ContactType.HOME,
                            this.tpiSSODetail.user.groupId.toString(),
                        ),
                    ]),
                ),
                tap(([memberData, memberContact]) => {
                    this.memberData = {
                        ...memberData.body,
                        address: memberContact.body.address,
                        ssn: "",
                    };
                    if (memberData.body.verificationInformation?.verifiedPhone) {
                        this.memberData.phoneNumber = memberData.body.verificationInformation.verifiedPhone;
                    }
                    if (memberData.body.verificationInformation?.verifiedEmail) {
                        this.memberData.email = memberData.body.verificationInformation?.verifiedEmail;
                    }
                }),
                switchMap(() => this.memberService.validateMember(this.memberData, this.tpiSSODetail.user.groupId.toString(), true)),
                delay(this.tpiSsoInnerSubscriptionFlag ? DELAY_SPIN : 0),
                filter(() => this.tpiSsoInnerSubscriptionFlag),
                tap(
                    () => {
                        this.tpiSsoInnerSubscriptionFlag = false;
                        this.router.navigate([AppSettings.TPI]);
                    },
                    (error) => {
                        this.loadSpinner = false;
                        if (!this.producerSsoFlag) {
                            this.handleTpiErrorResponse(error);
                        }
                    },
                ),
                switchMap(() => this.router.events),
                filter((event) => event instanceof NavigationEnd),
                map((event) => event as NavigationEnd),
                switchMap((navigationEnd) =>
                    this.pageLogService.updatePageLog({ uri: navigationEnd.urlAfterRedirects }, this.tpiSSODetail.user.groupId.toString()),
                ),
            )
            .subscribe();
    }
    /**
     * This method will process the producer sso login in tpi flow with set of business rules
     * @param data which tpi holds the tpi sso data to authenticate user
     * @returns Observable<string>
     */
    getTpiSSO(data: TpiSSOModel): Observable<string> | undefined {
        if (this.encData) {
            this.loadSpinner = true;
            this.tpiSSODetail = data;
            this.store.dispatch(new SetTPISSODetail(this.tpiSSODetail));
            this.store.dispatch(new SetMPGroup(this.tpiSSODetail.user.groupId));
            this.store.dispatch(new SetMemberId(this.tpiSSODetail.user.memberId));
            this.store.dispatch(new SetRegex());
            this.tpiModalMode = this.tpiService.isLinkAndLaunchMode();
            this.loadSpinner = false;
            this.tpiSsoInnerSubscriptionFlag = true;
            return of(EMPTY_STRING);
        }
        return undefined;
    }

    /**
     * This method will process the producer login with sso
     * @param data which holds credentials data received from producer sso end point
     * @returns Observable<never>
     */
    producerSSO(data: Credential): Observable<never> {
        this.loadSpinner = false;
        sessionStorage.setItem(USER_INFO_STORAGE, JSON.stringify(data));
        this.user.setUserCredential(data);
        if (!data.consented) {
            this.router.navigate([PRODUCER_CONSENT_URL], {
                relativeTo: this.route,
            });
        } else if (this.directPermission) {
            this.router.navigate([PRODUCER_DIRECT_URL], {
                relativeTo: this.route,
            });
        } else {
            this.router.navigate([PRODUCER_PAYROLL_URL], {
                relativeTo: this.route,
            });
        }
        return EMPTY;
    }
    /**
     * this will handle error response from a tpi endpoints
     * @param error error response from tpi sso endpoint
     */
    handleTpiErrorResponse(error: HttpErrorResponse): void {
        if (error.status === ClientErrorResponseCode.RESP_401 && error.error.details) {
            for (const detail of error.error.details) {
                if (detail.field === SSOError.PRODUCER_ID && error.error.code === ClientErrorResponseType.NOT_AUTHORIZED) {
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.tpiEnrollment.incorrectLicense.message",
                    );
                } else if (detail.field === SSOError.NPN && error.error.code === ClientErrorResponseType.NOT_AUTHORIZED) {
                    this.errorMessage = this.language.fetchSecondaryLanguageValue("secondary.portal.tpiEnrollment.wrongNPNEmail.message");
                } else if (detail.field === SSOError.MEMBER_ID && error.error.code === ClientErrorResponseType.NOT_AUTHORIZED) {
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        "secondary.portal.tpiEnrollment.subscriberNotFound.message",
                    );
                } else {
                    this.errorMessage = this.language.fetchSecondaryLanguageValue(
                        `secondary.portal.tpiEnrollment.${error.error.code}.${error.error.status}.${detail.field}`,
                    );
                }
            }
        } else if (error.status === ClientErrorResponseCode.RESP_400) {
            const errors = new Set<string>(error.error?.details?.length ? [...error.error.details.map((err) => err.field)] : []);
            errors.forEach((field) => {
                switch (field) {
                    case SSOError.PHONE_NUMBER:
                        this.preferredContactErrorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.tpiEnrollment.invalidPhone"),
                        );
                        break;
                    case SSOError.EMAIL:
                        this.preferredContactErrorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.tpiEnrollment.invalidEmail"),
                        );
                        break;
                    case SSOError.CITY:
                        this.preferredContactErrorMessage.push(
                            this.language.fetchSecondaryLanguageValue("secondary.portal.tpiEnrollment.invalidCity"),
                        );
                        break;
                    default:
                        this.errorMessage = this.language.fetchSecondaryLanguageValue(
                            `secondary.portal.tpiEnrollment.${error.error.status}.${error.error.code}`,
                        );
                }
            });
        } else if (error.status === ClientErrorResponseCode.RESP_403 && error.error.code === ClientErrorResponseType.CSRF_MISMATCH) {
            this.csrfService
                .load()
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe((res) => this.loadTpiSsoData());
        } else if (
            error.status === ServerErrorResponseCode.RESP_503 &&
            error.error.code === ClientErrorResponseDetailCodeType.GROUP_MAINTENANCE
        ) {
            this.approvalPending = this.languageStrings["primary.portal.tpi.allOfferings.approvalPending.agentAssisted"];
        } else if (error.status === ClientErrorResponseCode.RESP_409 && error.error.code === ClientErrorResponseType.DUPLICATE) {
            this.duplicateMember = this.tpiSSODetail.user?.producerId
                ? this.language.fetchSecondaryLanguageValue("secondary.portal.tpiAgentEnrollment.DuplicateMember.message")
                : this.language
                    .fetchSecondaryLanguageValue("secondary.portal.tpiSelfEnrollment.DuplicateMember.message")
                    .replace("##AgentFirstName##", this.primaryProducer.name.firstName)
                    .replace("##AgentLastName##", this.primaryProducer.name.lastName)
                    .replace("##<XXX-XXX-XXXX>##", new PhoneFormatConverterPipe().transform(this.primaryProducer.phoneNumber))
                    .replace("##EmailAddress##", this.primaryProducer.emailAddress);
        } else if (error.status === ServerErrorResponseCode.RESP_500) {
            this.internalServerErrorSpecificMessage = this.language.fetchSecondaryLanguageValue(
                "secondary.portal.tpiEnrollment.500.displayText",
            );
        } else {
            this.errorMessage = SERVER_DOWN_ERROR;
        }
    }

    /**
     * Function called on click of 'Exit' button and is used to exit from TPI flow
     */
    onExit(): void {
        this.router.navigate(["tpi/exit"]);
    }

    /**
     * To avoid memory leakage this will destroy all the subscription for the component
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
