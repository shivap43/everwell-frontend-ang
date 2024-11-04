import { UserService, UserState } from "@empowered/user";
import { Component, OnInit, Input, OnDestroy } from "@angular/core";
import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { AuthenticationService, EnrollmentService } from "@empowered/api";
import { CsrfService } from "@empowered/util/csrf";
import { Store } from "@ngxs/store";
import { Subject } from "rxjs";
import { retry, takeUntil, tap } from "rxjs/operators";
import { ReviewFlowService } from "../services/review-flow.service";
import { EDeliveryPromptComponent } from "@empowered/enrollment";
import { ConfigName, ActivityPageCode, RegistrationStatus, MemberCredential, CorrespondenceType } from "@empowered/constants";
import { MemberInfoState, SetRouteAfterLogin, StaticUtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredModalService } from "@empowered/common-services";

const API_RETRY = 3;

@Component({
    selector: "empowered-confirmation",
    templateUrl: "./confirmation.component.html",
    styleUrls: ["./confirmation.component.scss"],
})
export class ConfirmationComponent implements OnInit, OnDestroy {
    thirdFormGroup: FormGroup;
    private unsubscribe$ = new Subject<void>();
    @Input() userDetails: any;
    memberId: any;
    groupId: any;
    isPayroll = false;
    loadSpinner: boolean;
    isAgentSelfEnrolled: boolean;
    mmpRouteUrl: string;
    constructor(
        private _formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private auth: AuthenticationService,
        private csrfService: CsrfService,
        private router: Router,
        private store: Store,
        private enrollmentService: EnrollmentService,
        private userService: UserService,
        private reviewFlowService: ReviewFlowService,
        private readonly empoweredModalService: EmpoweredModalService,
        private readonly staticUtilService: StaticUtilService,
        private readonly sharedService: SharedService,
    ) {
        this.staticUtilService
            .cacheConfigValue(ConfigName.MMP_LOGOUT_REDIRECT_LINK)
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe((routeUrl) => {
                this.mmpRouteUrl = routeUrl;
            });
    }
    /**
     * method to initiate component variables and launch the E-Delivery prompt based on delivery preference
     */
    ngOnInit(): void {
        this.route.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe((params) => {
            if (params["memberId"]) {
                this.isPayroll = true;
            }
        });
        this.memberId = this.userDetails.memberId;
        this.groupId = this.userDetails.groupId;
        // eslint-disable-next-line no-underscore-dangle
        this.thirdFormGroup = this._formBuilder.group({
            thirdCtrl: ["", Validators.required],
        });
        this.reviewFlowService.reviewCompleted$.next(true);
        // To set the isAgentSelfEnrolled flag
        this.sharedService.checkAgentSelfEnrolled().pipe(
            takeUntil(this.unsubscribe$),
            tap((isAgentSelfEnrolled) => (this.isAgentSelfEnrolled = isAgentSelfEnrolled)),
        );
        const memberInfo = this.store.selectSnapshot(MemberInfoState.getMemberInfo);
        const deliveryPreference = memberInfo?.profile?.correspondenceType;
        if (deliveryPreference === CorrespondenceType.PAPER && !this.isAgentSelfEnrolled) {
            const memberData = {
                account: {
                    id: this.groupId,
                },
                info: memberInfo,
            };
            this.empoweredModalService.openDialog(EDeliveryPromptComponent, { data: memberData });
        }
        if (
            (!memberInfo?.registrationStatus ||
                !(
                    memberInfo.registrationStatus === RegistrationStatus.CIAM_BASIC ||
                    memberInfo.registrationStatus === RegistrationStatus.CIAM_FULL
                )) &&
            deliveryPreference === CorrespondenceType.ELECTRONIC &&
            !this.isAgentSelfEnrolled
        ) {
            this.loadSpinner = true;
            this.enrollmentService
                .registerCustomer(ActivityPageCode.CONFIRMATION_COMPONENT, this.memberId, this.groupId)
                .pipe(takeUntil(this.unsubscribe$))
                .subscribe(
                    (response) => (this.loadSpinner = false),
                    (error) => (this.loadSpinner = false),
                );
        }
    }

    logout(): void {
        this.enrollmentService.pendingEnrollments$.next(false);
        if (this.store.selectSnapshot(UserState).authCode) {
            this.router.navigate(["member/login"]);
        } else {
            this.csrfService
                .logOut()
                .pipe(retry(API_RETRY), takeUntil(this.unsubscribe$))
                .subscribe(() => {
                    window.location.href = this.mmpRouteUrl;
                });
        }
    }

    goToCoverageSummary(): void {
        this.enrollmentService.pendingEnrollments$.next(false);
        const credential = JSON.parse(sessionStorage.getItem("user"));
        credential.isPendingEnrollments = false;
        this.userService.setUserCredential(credential);
        this.store.dispatch(new SetRouteAfterLogin("/member"));
        this.router.navigate(["member/coverage/enrollment/benefit-summary/coverage-summary"]);
    }
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
