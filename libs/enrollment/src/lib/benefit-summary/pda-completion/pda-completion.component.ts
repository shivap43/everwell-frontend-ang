import { Component, OnInit, OnDestroy } from "@angular/core";

import { FormGroup, FormBuilder } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { MatDialogRef } from "@angular/material/dialog";
import { Store } from "@ngxs/store";
import { takeUntil } from "rxjs/operators";
import { combineLatest, Subject } from "rxjs";
import { ConfigName, EnrollmentMethod, Permission } from "@empowered/constants";
import { AuthenticationService, ShoppingService, StaticService } from "@empowered/api";
import { MemberInfoState, TPIState, AccountListState, StaticUtilService } from "@empowered/ngxs-store";
import { Router } from "@angular/router";

const HYBRID_CALL_CENTER_AGENT = "HYBRID_AGENT";
const NOT_HYBRID_CALL_CENTER_AGENT = "NOT_HYBRID_AGENT";
const FALSE = "false";
const HEADSET_API_VALUE = "HEADSET";
const FACE_TO_FACE_API_VALUE = "FACE_TO_FACE";
const CALL_CENTER = "CALL_CENTER";
const TPI_ROUTER_PATH = "tpi";

@Component({
    selector: "empowered-pda-completion",
    templateUrl: "./pda-completion.component.html",
    styleUrls: ["./pda-completion.component.scss"],
})
export class PdaCompletionComponent implements OnInit, OnDestroy {
    pdaForm: FormGroup;
    mpGroupId: number;
    memberId: number;
    enrollmentMethodType = EnrollmentMethod;
    enrollmentType: string;
    isSpinnerLoading = false;

    private readonly unsubscribe$ = new Subject<void>();

    languageStrings: Record<string, string> = this.language.fetchPrimaryLanguageValues([
        "primary.portal.coverage.completePDA",
        "primary.portal.coverage.selectPDATitle",
        "primary.portal.coverage.pdaSelectionType",
        "primary.portal.coverage.pdaSelectionType.faceToFace",
        "primary.portal.coverage.pdaSelectionType.headset",
        "primary.portal.coverage.pdaSelectionType.pinSignature",
        "primary.portal.coverage.pdaSelectionType.virtualF2f",
        "primary.portal.common.next",
    ]);
    enrollMethods: string[] = [];
    isTpi = false;

    constructor(
        private readonly dialogRef: MatDialogRef<PdaCompletionComponent>,
        private readonly language: LanguageService,
        private readonly formBuilder: FormBuilder,
        private readonly store: Store,
        private readonly authService: AuthenticationService,
        private readonly shoppingService: ShoppingService,
        private readonly staticService: StaticService,
        private readonly staticUtil: StaticUtilService,
        private readonly router: Router,
    ) {}

    /**
     * Angular life cycle hook
     */
    ngOnInit(): void {
        this.pdaForm = this.formBuilder.group({
            enrollmentMethod: [this.enrollmentMethodType.FACE_TO_FACE],
        });

        this.mpGroupId = this.store.selectSnapshot(AccountListState.getMpGroupId);
        this.memberId = this.store.selectSnapshot(MemberInfoState.getMemberInfo)
            ? this.store.selectSnapshot(MemberInfoState.getMemberInfo).id
            : null;
        this.enrollmentType = this.enrollmentMethodType.FACE_TO_FACE;
        this.isTpi = this.router.url.indexOf(TPI_ROUTER_PATH) >= 0;
        if (this.isTpi) {
            this.getEnrollmentMethods();
        }
    }

    /**
     * function to get the enrollment methods
     */
    getEnrollmentMethods(): void {
        this.isSpinnerLoading = true;
        let hybridCallCenterAgent: string;
        const tpiSSODetail = this.store.selectSnapshot(TPIState).tpiSSODetail;
        const callCenterId = tpiSSODetail.user.callCenterId || 0;
        this.authService.permissions$.pipe(takeUntil(this.unsubscribe$)).subscribe((permission) => {
            hybridCallCenterAgent = permission.some((data) => String(data) === Permission.HYBRID_USER)
                ? HYBRID_CALL_CENTER_AGENT
                : NOT_HYBRID_CALL_CENTER_AGENT;
        });
        combineLatest([
            this.shoppingService.getEnrollmentMethods(+tpiSSODetail.user.groupId),
            this.staticUtil.cacheConfigEnabled(ConfigName.TPI_CALL_CENTER_ENROLLMENT_ENABLE),
            this.staticService.getConfigurations(ConfigName.TPI_HEADSET_ENROLLMENT_ENABLE, +tpiSSODetail.user.groupId),
        ])
            .pipe(takeUntil(this.unsubscribe$))
            .subscribe(
                ([enrollment, isTpiCallCenterConfigEnabled, isTpiHeadsetEnabled]) => {
                    this.isSpinnerLoading = false;

                    const tpiCallCenterEnrollmentEnabled = isTpiCallCenterConfigEnabled;
                    const methodArray = enrollment.map((enrollmentMethod) => enrollmentMethod.name);
                    this.enrollMethods = methodArray.filter((value) => {
                        if (isTpiHeadsetEnabled[0].value.toLowerCase() === FALSE) {
                            return value === FACE_TO_FACE_API_VALUE;
                        }
                        return (
                            value === FACE_TO_FACE_API_VALUE ||
                            value === HEADSET_API_VALUE ||
                            value === this.enrollmentMethodType.PIN_SIGNATURE
                        );
                    });
                    if (callCenterId > 0 && tpiCallCenterEnrollmentEnabled && hybridCallCenterAgent) {
                        const isCallCentreAdded = methodArray.some((value) => value === CALL_CENTER);
                        if (isCallCentreAdded) {
                            this.callCenterAgentEnrollMethodsFilter(methodArray, hybridCallCenterAgent, tpiCallCenterEnrollmentEnabled);
                        }
                    }
                },
                (error) => {
                    this.isSpinnerLoading = false;
                },
            );
    }
    /**
     * Method to filter the enrollment methods for call center agents
     * @param enrollmentMethods list of enrollment methods available
     * @param hybridCallCenterAgent is used to know whether agent is hybrid call center agent or not
     * @param tpiCallCenterEnrollmentEnabled is used to know whether tpi call center enrollment is allowed or not
     */
    callCenterAgentEnrollMethodsFilter(
        enrollmentMethods: string[],
        hybridCallCenterAgent: string,
        tpiCallCenterEnrollmentEnabled: boolean,
    ): void {
        if (hybridCallCenterAgent !== HYBRID_CALL_CENTER_AGENT) {
            this.enrollMethods = [];
        }
        if (tpiCallCenterEnrollmentEnabled) {
            this.pdaForm.controls.enrollmentMethod.setValue(CALL_CENTER);
            const callCenterEnrollmentMethod = enrollmentMethods.find((value) => value === CALL_CENTER);
            if (callCenterEnrollmentMethod) {
                this.enrollMethods.push(callCenterEnrollmentMethod);
            }
        }
    }

    /**
     * Method used to assign value to enrollment type
     * @param event html input element to listen to radio button
     */
    onClickEnrollmentMethod(event: HTMLInputElement): void {
        this.enrollmentType = event.value;
    }

    /**
     * It returns response, enrollment type  value to coverage summary when modal gets closed
     */
    nextToPDACompletion(): void {
        this.dialogRef.close(this.enrollmentType);
    }

    /**
     * ng life cycle hook
     * method used to unsubscribe all subscriptions
     */
    ngOnDestroy(): void {
        this.unsubscribe$.next();
        this.unsubscribe$.complete();
    }
}
