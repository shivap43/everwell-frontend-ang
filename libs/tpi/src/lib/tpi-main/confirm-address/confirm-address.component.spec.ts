import { ComponentFixture, TestBed, fakeAsync, tick } from "@angular/core/testing";
import { ConfirmAddressComponent } from "./confirm-address.component";
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { of, throwError } from "rxjs";
import { AccountService, MemberService, ProducerInformation, ProducerService, StaticService } from "@empowered/api";
import {
    VerifiedAddress,
    PersonalAddress,
    PlanOffering,
    MemberContact,
    MemberDependent,
    EnrollmentMethod,
    Configurations,
    AddressConfig,
} from "@empowered/constants";
import { EmpoweredModalService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { MatDialogConfig, MatDialogRef } from "@angular/material/dialog";
import { CUSTOM_ELEMENTS_SCHEMA, TemplateRef } from "@angular/core";
import { ComponentType } from "@angular/cdk/portal";
import { NgxsModule, Store } from "@ngxs/store";
import { Router } from "@angular/router";
import { TPIState, StaticUtilService } from "@empowered/ngxs-store";
import { GroupAttribute } from "@empowered/constants";
import { mockLanguageService, mockRouter, mockStaticService, mockTpiService } from "@empowered/testing";
import { TpiServices } from "@empowered/common-services";
import { AddressVerificationComponent, DependentAddressUpdateModalComponent } from "@empowered/ui";

describe("ConfirmAddressComponent", () => {
    let component: ConfirmAddressComponent;
    let fixture: ComponentFixture<ConfirmAddressComponent>;
    let store: Store;
    let memberService: MemberService;
    let producerService: ProducerService;
    let accountService: AccountService;
    let staticUtilService: StaticUtilService;
    let staticService: StaticService;
    let router: Router;
    let empoweredModalService: EmpoweredModalService;

    const mockEmpoweredModalService = {
        openDialog: (componentOrTemplateRef: ComponentType<any> | TemplateRef<any>, config?: MatDialogConfig<any>, refocus?: HTMLElement) =>
            ({
                afterClosed: () => of(undefined),
            } as MatDialogRef<any>),
    } as EmpoweredModalService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ConfirmAddressComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([TPIState]), ReactiveFormsModule],
            providers: [
                FormBuilder,
                Store,
                MemberService,
                ProducerService,
                AccountService,
                StaticUtilService,
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: TpiServices,
                    useValue: mockTpiService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConfirmAddressComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        producerService = TestBed.inject(ProducerService);
        accountService = TestBed.inject(AccountService);
        staticUtilService = TestBed.inject(StaticUtilService);
        staticService = TestBed.inject(StaticService);
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            TPIState: {
                tpiSSODetail: {
                    user: {
                        id: 1,
                        groupId: 111,
                        memberId: 1,
                    },
                },
                planOffering: [
                    {
                        agentAssistanceRequired: true,
                    } as PlanOffering,
                ],
            },
        });
        component.addressForm = new FormGroup({
            stateControl: new FormControl("GA", [Validators.required]),
            cityControl: new FormControl("atlanta", [Validators.required]),
            street1Control: new FormControl("street", [Validators.required]),
            street2Control: new FormControl(""),
            zipControl: new FormControl("31001", [Validators.required]),
            acknowledgeControl: new FormControl(false, [Validators.requiredTrue]),
        });
        fixture.detectChanges();
        router = TestBed.inject(Router);
        empoweredModalService = TestBed.inject(EmpoweredModalService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("enableBackButton()", () => {
        it("hideBackButton should be true", () => {
            component.enableBackButton(undefined);
            expect(component.hideBackButton).toBeUndefined();
            store.reset({
                ...store.snapshot(),
                TPIState: {
                    planOffering: [
                        {
                            agentAssistanceRequired: false,
                        } as PlanOffering,
                    ],
                },
            });
            component.enableBackButton(1);
            expect(component.hideBackButton).toBeUndefined();
            component.enableBackButton(undefined);
            expect(component.hideBackButton).toBe(true);
        });
    });

    describe("getStatesList()", () => {
        it("getProducerInformation() should be called", () => {
            const spy1 = jest.spyOn(producerService, "getProducerInformation").mockReturnValue(
                of({
                    licenses: [
                        {
                            state: {
                                name: "Georgia",
                                abbreviation: "GA",
                            },
                        },
                        {
                            state: {
                                name: "New York",
                                abbreviation: "NY",
                            },
                        },
                    ],
                } as ProducerInformation),
            );
            const spy2 = jest.spyOn(component, "getAddress");
            component.getStatesList("1");
            expect(spy1).toBeCalled();
            expect(component.states$).toStrictEqual([
                {
                    name: "Georgia",
                    abbreviation: "GA",
                },
            ]);
            expect(spy2).toBeCalled();
        });
    });
    describe("getAddress()", () => {
        it("getMemberContact() should be called", (done) => {
            expect.assertions(4);
            const spy1 = jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "GA",
                        },
                    },
                }),
            );
            const spy2 = jest.spyOn(component, "createForm");
            component.getAddress().subscribe(() => {
                expect(spy1).toBeCalledTimes(1);
                expect(component.memberContact).toStrictEqual({ address: { state: "GA" } });
                expect(component.address).toStrictEqual({ state: "GA" });
                expect(spy2).toBeCalledTimes(1);
                done();
            });
        });
        it("state$ be set with new york data when state is NY", (done) => {
            expect.assertions(2);
            const spy3 = jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                of({
                    body: {
                        address: {
                            state: "NY",
                        },
                    },
                }),
            );
            component.getAddress().subscribe(() => {
                expect(spy3).toBeCalledTimes(1);
                expect(component.states$).toStrictEqual([{ name: "New York", abbreviation: "NY" }]);
                done();
            });
        });
        it("getAddress() should return error for api failure as response", (done) => {
            expect.assertions(1);
            const spy = jest.spyOn(memberService, "getMemberContact").mockReturnValue(
                throwError({
                    error: { message: "api error message" },
                }),
            );
            component.getAddress().subscribe((data) => {
                expect(data).toStrictEqual({ error: { message: "api error message" } });
                done();
            });
        });
    });
    describe("getConfig()", () => {
        it("cacheConfigValue should be called", () => {
            const spy = jest.spyOn(staticUtilService, "cacheConfigs").mockReturnValue(
                of([
                    { value: "TRUE", dataType: "BOOLEAN" },
                    { value: "TRUE", dataType: "BOOLEAN" },
                ] as Configurations[]),
            );
            component.getConfig();
            expect(spy).toBeCalledWith([AddressConfig.ADDRESS_VALIDATION, AddressConfig.ENABLE_DEPENDENT_ADDRESS_MODAL]);
            expect(component.addressValidationSwitch).toBe(true);
            expect(component.enableDependentUpdateAddressModal).toBe(true);
        });
    });
    describe("handleVerifyAddressError()", () => {
        it("address messages for 400 status", () => {
            component.memberContact = {
                name: "name",
            } as MemberContact;
            const error = {
                error: {
                    status: 400,
                    details: [
                        {
                            message: "errorDetails",
                        },
                    ],
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleVerifyAddressError(error);
            expect(component.memberContact.addressValidationDate.toDateString()).toStrictEqual(new Date().toDateString());
            expect(component.addressMessages).toStrictEqual(["errorDetails"]);
            const error2 = {
                error: {
                    status: 400,
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleVerifyAddressError(error2);
            expect(component.addressMessages).toContainEqual("secondary.portal.directAccount.invalidAdressdata");
        });
        it("addressMessages for api error status 500 and for other status", () => {
            const error = {
                error: {
                    status: 500,
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleVerifyAddressError(error);
            expect(component.addressMessages).toContainEqual("secondary.portal.accountPendingEnrollments.internalServer");
            const error2 = {
                error: {
                    status: 401,
                    code: "value",
                },
                name: "error name",
                message: "api error message",
            } as Error;
            component.handleVerifyAddressError(error2);
            expect(component.addressMessages).toContainEqual("secondary.api.401.value");
        });
    });
    describe("nextAfterVerifyAddress()", () => {
        beforeEach(() => {
            component.memberContact = {
                name: "jest",
            } as MemberContact;
            component.memberId = 1;
            component.mpGroup = "111";
        });
        it("address should be suggested address", (done) => {
            expect.assertions(3);
            const modalData = {
                isVerifyAddress: true,
                selectedAddress: "suggestedAddress",
            };
            const response = {
                matched: true,
                suggestedAddress: {
                    state: "GA",
                } as PersonalAddress,
            } as VerifiedAddress;
            const spy1 = jest.spyOn(staticService, "validateStateZip").mockReturnValue(of(void {}));
            const spy2 = jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            component.nextAfterVerifyAddress(modalData, response).subscribe(() => {
                expect(component.memberContact.address).toStrictEqual({ state: "GA" });
                expect(spy1).toBeCalledWith("GA", "31001");
                expect(spy2).toBeCalledWith(1, "HOME", { address: { state: "GA" }, name: "jest" } as MemberContact, "111");
                done();
            });
        });
        it("validateStateZip and saveMemberContact should be called", (done) => {
            expect.assertions(3);
            const modalData = {
                isVerifyAddress: true,
                selectedAddress: "address",
            };
            const response = {
                matched: true,
                suggestedAddress: {
                    state: "GA",
                } as PersonalAddress,
            } as VerifiedAddress;
            const spy1 = jest.spyOn(staticService, "validateStateZip");
            const spy2 = jest.spyOn(memberService, "saveMemberContact").mockReturnValue(of(void {}));
            const spy3 = jest.spyOn(component, "onSuccess");
            component.nextAfterVerifyAddress(modalData, response).subscribe(() => {
                expect(spy1).toBeCalledWith("GA", "31001");
                expect(spy2).toBeCalledWith(1, "HOME", { name: "jest" } as MemberContact, "111");
                expect(spy3).toBeCalled();
                done();
            });
        });
        it("zip control should be set with error", (done) => {
            expect.assertions(2);
            const modalData = {
                isVerifyAddress: true,
                selectedAddress: "address",
            };
            const response = {
                matched: true,
                suggestedAddress: {
                    state: "GA",
                } as PersonalAddress,
            } as VerifiedAddress;
            const spy1 = jest.spyOn(staticService, "validateStateZip").mockReturnValue(
                throwError({
                    error: { message: "some api error message" },
                }),
            );
            component.nextAfterVerifyAddress(modalData, response).subscribe(() => {
                expect(spy1).toBeCalledWith("GA", "31001");
                expect(component.addressForm.controls["zipControl"].errors).toStrictEqual({ pattern: true });
                done();
            });
        });
    });
    describe("checkAGAccount()", () => {
        it("should call getGroupAttributesByName()", () => {
            const spy = jest
                .spyOn(accountService, "getGroupAttributesByName")
                .mockReturnValue(of([{ id: 1, value: "true" }] as GroupAttribute[]));
            component.checkAGAccount();
            expect(spy).toBeCalledWith(["is_hq_account"], 111);
            expect(component.isAGAccount).toBe(true);
        });
    });
    describe("onSubmit()", () => {
        beforeEach(() => {
            component.memberContact = { address: { state: "GA" } } as MemberContact;
        });
        it("should call verifyAddressDetails()", () => {
            component.addressValidationSwitch = true;
            const spy = jest.spyOn(component, "verifyAddressDetails");
            component.addressForm.controls.zipControl.setValue("31001");
            component.onSubmit();
            expect(spy).toBeCalled();
        });
        it("should call nextAfterVerifyAddress()", () => {
            component.addressValidationSwitch = false;
            const spy = jest
                .spyOn(component, "nextAfterVerifyAddress")
                .mockReturnValue(of({ isVerifyAddress: true, selectedAddress: "address" }));
            component.onSubmit();
            expect(spy).toBeCalled();
        });
    });
    describe("verifyAddressDetails()", () => {
        beforeEach(() => {
            component.memberContact = { address: { state: "GA" } } as MemberContact;
        });
        it("should call verifyMemberAddress() and nextAfterVerifyAddress()", () => {
            const spy1 = jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: true } as VerifiedAddress));
            const spy2 = jest
                .spyOn(component, "nextAfterVerifyAddress")
                .mockReturnValue(of({ isVerifyAddress: true, selectedAddress: "address" }));
            component.verifyAddressDetails();
            expect(spy1).toBeCalledWith({ state: "GA" });
            expect(spy2).toBeCalledTimes(1);
        });
        it("should call openModal()", () => {
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(of({ matched: false } as VerifiedAddress));
            const spy = jest.spyOn(component, "openModal").mockReturnValue(of({ isVerifyAddress: true, selectedAddress: "address" }));
            component.verifyAddressDetails();
            expect(spy).toBeCalledWith("bothOption", { state: "GA" }, { matched: false });
        });
        it("should call handleVerifyAddressError() for api error response", () => {
            const error = {
                error: { message: "api error message" },
                status: 400,
            };
            jest.spyOn(memberService, "verifyMemberAddress").mockReturnValue(throwError(error));
            const spy = jest.spyOn(component, "handleVerifyAddressError");
            component.verifyAddressDetails();
            expect(spy).toBeCalledWith(error);
        });
    });

    describe("getMemberDependentCount()", () => {
        it("should set the dependent count of the member", fakeAsync(() => {
            const spy = jest
                .spyOn(memberService, "getMemberDependents")
                .mockImplementation(() => of([{ name: "Dep One" } as MemberDependent]));
            component.getMemberDependentCount();
            tick();
            expect(component.dependentCount).toBe(1);
        }));
    });

    describe("back()", () => {
        it("should navigate to tpi/enrollment-initiate when enrollmentMethod is SELF_SERVICE", () => {
            component.enrollmentMethod = EnrollmentMethod.SELF_SERVICE;
            const spy = jest.spyOn(router, "navigate");
            component.back();
            expect(spy).toHaveBeenCalledWith(["tpi/enrollment-initiate"]);
        });
        it("should navigate to tpi/enrollment-method when enrollmentMethod is F2F", () => {
            component.enrollmentMethod = EnrollmentMethod.FACE_TO_FACE;
            const spy = jest.spyOn(router, "navigate");
            component.back();
            expect(spy).toHaveBeenCalledWith(["tpi/enrollment-method"]);
        });
    });

    describe("onExit()", () => {
        it("should navigate to tpi/exit when exit button is clicked", () => {
            const spy = jest.spyOn(router, "navigate");
            component.onExit();
            expect(spy).toHaveBeenCalledWith(["tpi/exit"]);
        });
    });

    describe("openModal()", () => {
        it("should open AddressVerificationComponent when function is called", () => {
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            const address: PersonalAddress = {
                state: "GA",
                zip: "30001",
            };
            component.address = address;
            component.addressResp = false;
            component.openModal("bothOption", address);
            expect(spy).toHaveBeenCalledWith(AddressVerificationComponent, {
                data: {
                    suggestedAddress: null,
                    providedAddress: address,
                    addressResp: false,
                    addressMessage: [],
                    option: "bothOption",
                    errorStatus: undefined,
                },
            });
        });
    });

    describe("openDependentAddressUpdateModal()", () => {
        it("should open DependentAddressUpdateModalComponent when function is called", () => {
            const memberAddress: PersonalAddress = {
                state: "GA",
                zip: "30001",
            };
            component.memberId = 123;
            const mpGroupId = 1234;
            const spy = jest.spyOn(empoweredModalService, "openDialog");
            component.openDependentAddressUpdateModal(memberAddress, mpGroupId);
            expect(spy).toHaveBeenCalledWith(DependentAddressUpdateModalComponent, {
                data: {
                    memberId: 123,
                    memberAddress,
                    mpGroupId,
                },
            });
        });
    });

    describe("onSuccess()", () => {
        it("should navigate to tpi/partial-census", () => {
            const spy = jest.spyOn(router, "navigate");
            component.onSuccess();
            expect(spy).toHaveBeenCalledWith(["tpi/partial-census"]);
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
