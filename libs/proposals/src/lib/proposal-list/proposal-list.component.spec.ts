import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialog } from "@angular/material/dialog";
import { AccountDetails, AflacService, AuthenticationService, BenefitsOfferingService, Proposal } from "@empowered/api";
import { ProductsPlansQuasiService } from "@empowered/benefits";
import { LanguageService } from "@empowered/language";
import { AccountInfoState, SharedState, UtilService } from "@empowered/ngxs-store";
import { SharedService, EmpoweredSheetService, EmpoweredModalService } from "@empowered/common-services";
import {
    MockHasPermissionDirective,
    mockAflacService,
    mockAuthenticationService,
    mockDatePipe,
    mockEmpoweredModalService,
    mockEmpoweredSheetService,
    mockLanguageService,
    mockMatDialog,
    mockProductsPlansQuasiService,
    mockSharedService,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";

import { ProposalListComponent } from "./proposal-list.component";
import { DatePipe } from "@angular/common";
import { of, throwError } from "rxjs";
import { MatBottomSheetRef } from "@angular/material/bottom-sheet";
import { CreateProposalComponent } from "../create-proposal/create-proposal.component";
import { ProposalStatus } from "@empowered/constants";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { HasPermissionDirective, MaterialModule } from "@empowered/ui";

const proposal = {
    id: 101,
    name: "test",
    coverageStartDate: "02/02/2023",
    eligibleEmployeeEstimate: 123,
    payrollFrequencyId: 1,
    status: ProposalStatus.COMPLETE,
    createdBy: {
        producerId: 123,
        name: "test",
        fullName: {
            firstName: "string",
            middleName: "string",
            lastName: "string",
            suffix: "string",
            maidenName: "string",
            nickname: "string",
        },
    },
};

describe("ProposalListComponent", () => {
    let component: ProposalListComponent;
    let fixture: ComponentFixture<ProposalListComponent>;
    let store: Store;
    let utilService: UtilService;
    let benefitsOfferingService: BenefitsOfferingService;
    let empoweredSheetService: EmpoweredSheetService;
    let aflacService: AflacService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProposalListComponent, MockHasPermissionDirective, HasPermissionDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState, AccountInfoState]), MaterialModule],
            providers: [
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: EmpoweredSheetService,
                    useValue: mockEmpoweredSheetService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: ProductsPlansQuasiService,
                    useValue: mockProductsPlansQuasiService,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: DatePipe,
                    value: mockDatePipe,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProposalListComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        utilService = TestBed.inject(UtilService);
        benefitsOfferingService = TestBed.inject(BenefitsOfferingService);
        store.reset({
            ...store.snapshot(),
            core: {
                isEnroller: true,
            },
            accountInfo: {
                accountInfo: {
                    situs: {
                        state: {
                            abbreviation: "GA",
                        },
                    },
                },
            },
        });
        component.mpGroup = 111;
        empoweredSheetService = TestBed.inject(EmpoweredSheetService);
        aflacService = TestBed.inject(AflacService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("validateZip()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should call validateZip and set validZip if account detail are there", () => {
            component.accountDetails = { situs: { state: { abbreviation: "GA" }, zip: "31001" } } as AccountDetails;
            const spy = jest.spyOn(utilService, "validateZip");
            component.validateZip();
            expect(spy).toBeCalledWith("GA", "31001");
            expect(component.validZip).toBe(true);
        });
        it("should not call if account detail are not there", () => {
            const spy = jest.spyOn(utilService, "validateZip");
            component.validateZip();
            expect(spy).toBeCalledTimes(0);
        });
    });
    describe("accountRefreshErrorAlertMessage()", () => {
        it("should set isServerError when response code 503", () => {
            const errorMessage = {
                error: {
                    status: 503,
                    code: "errorMessage",
                },
            } as unknown as Error;
            component.accountRefreshErrorAlertMessage(errorMessage);
            expect(component.isServerError).toBe(true);
        });
        it("should set isAccountRefreshFailure when response code is other than 503", () => {
            const errorMessage = {
                error: {
                    status: 400,
                    code: "errorMessage",
                },
            } as unknown as Error;
            component.accountRefreshErrorAlertMessage(errorMessage);
            expect(component.isAccountRefreshFailure).toBe(true);
        });
    });
    describe("setMessageForEditOrResume()", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it("should set language string for message when resultAction is saved", () => {
            component.setMessageForEditOrResume("saved", { status: "IN_PROGRESS" } as Proposal, true);
            expect(component.message).toStrictEqual("primary.portal.proposals.savedMessage");
            component.setMessageForEditOrResume("saved", { status: "COMPLETE" } as Proposal, true);
            expect(component.message).toStrictEqual("primary.portal.proposals.savedMessageForCompleted");
            expect(component.showAlertType).toStrictEqual("success");
        });
        it("should set language string for message when resultAction is completed", () => {
            component.setMessageForEditOrResume("completed", {} as Proposal, true);
            expect(component.message).toStrictEqual("primary.portal.proposals.completedMessage");
            component.setMessageForEditOrResume("completed", {} as Proposal, false);
            expect(component.message).toStrictEqual("primary.portal.proposals.updatedMessage");
            expect(component.showAlertType).toStrictEqual("success");
        });
        it("should set showAlertType as empty string when no result action is given", () => {
            component.setMessageForEditOrResume("", {} as Proposal, true);
            expect(component.showAlertType).toStrictEqual("");
            expect(component.message).toBeUndefined();
        });
    });

    describe("createProposal()", () => {
        it("should set message when result is not showEmployeeCountMsg", () => {
            const spy1 = jest.spyOn(empoweredSheetService, "openSheet").mockReturnValue({
                afterDismissed: () => of({ action: "saved" }),
            } as MatBottomSheetRef<any>);
            const spy2 = jest.spyOn(store, "dispatch");
            component.createProposal();
            expect(spy1).toBeCalledWith(CreateProposalComponent);
            expect(spy2).toBeCalledTimes(6);
            expect(component.showAlertType).toStrictEqual("success");
            expect(component.message).toStrictEqual("primary.portal.proposals.savedMessage");
            jest.spyOn(empoweredSheetService, "openSheet").mockReturnValue({
                afterDismissed: () => of({ action: "completed" }),
            } as MatBottomSheetRef<any>);
            component.createProposal();
            expect(component.message).toStrictEqual("primary.portal.proposals.completedMessage");
        });
        it("should set isRefreshInProgress when result is showEmployeeCountMsg and should call refreshAccount", () => {
            jest.spyOn(empoweredSheetService, "openSheet").mockReturnValue({
                afterDismissed: () => of("showEmployeeCountMsg"),
            } as MatBottomSheetRef<any>);
            const spy = jest.spyOn(aflacService, "refreshAccount").mockReturnValue(of({}));
            component.createProposal();
            expect(component.isRefreshInProgress).toBe(false);
            expect(spy).toBeCalled();
        });
        it("should call accountRefreshErrorAlertMessage when api return error", () => {
            jest.spyOn(empoweredSheetService, "openSheet").mockReturnValue({
                afterDismissed: () => of("showEmployeeCountMsg"),
            } as MatBottomSheetRef<any>);
            const spy = jest.spyOn(aflacService, "refreshAccount").mockReturnValue(
                throwError({
                    message: "api error message",
                    status: 400,
                }),
            );
            component.createProposal();
            expect(component.isAccountRefreshFailure).toBe(true);
        });
    });
    describe("storeAllEligiblePlans()", () => {
        it("should dispatch all other actions when group id is there", () => {
            const spy = jest.spyOn(store, "dispatch");
            component.storeAllEligiblePlans().subscribe();
            expect(spy).toBeCalledTimes(6);
        });
        it("should dispatch SetBenefitsStateMPGroup along with all other actions when group id is not there", () => {
            const spy = jest.spyOn(store, "dispatch");
            store.reset({
                ...store.snapshot(),
                accountInfo: {
                    accountInfo: {
                        id: 111,
                        situs: {
                            state: {
                                abbreviation: "GA",
                            },
                        },
                    },
                },
            });
            component.storeAllEligiblePlans().subscribe();
            expect(spy).toBeCalledTimes(7);
        });
    });

    describe("getBenefitOfferingDefaultStates()", () => {
        it("should call getBenefitOfferingDefaultStates", () => {
            expect.assertions(1);
            const spy1 = jest.spyOn(benefitsOfferingService, "getBenefitOfferingDefaultStates");
            component.getBenefitOfferingDefaultStates();
            expect(spy1).toBeCalled();
        });
    });
});
