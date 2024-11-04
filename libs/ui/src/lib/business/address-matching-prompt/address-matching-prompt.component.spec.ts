import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { AddressMatchingPromptComponent } from "./address-matching-prompt.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { AccountService, AuthenticationService, MemberService, StaticService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { AddressMatchingService, EmpoweredModalService } from "@empowered/common-services";
import { ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { StaticUtilService, SharedState, MOCK_REGEX_DATA } from "@empowered/ngxs-store";
import { Subscription, of } from "rxjs";
import { MatRadioChange } from "@angular/material/radio";
import { HttpErrorResponse, HttpResponse } from "@angular/common/http";
import { Address, ClientErrorResponseCode, PersonalAddress, ServerErrorResponseCode, MemberProfile } from "@empowered/constants";
import {
    mockAddressMatchingService,
    mockLanguageService,
    mockMembersBusinessService,
    mockMemberService,
    mockStaticService,
} from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MembersBusinessService } from "../../services/members-business.service";
import { MatMenuModule } from "@angular/material/menu";

const data = {
    isDirect: true,
    isTPILnlAgentAssisted: true,
    isTPILnlSelfService: true,
    mpGroupId: 1,
    memberId: 1,
    address: {},
};

const mockMatDialog = {
    close: () => null,
} as MatDialogRef<AddressMatchingPromptComponent, any>;

describe("AddressMatchingPromptComponent", () => {
    let component: AddressMatchingPromptComponent;
    let fixture: ComponentFixture<AddressMatchingPromptComponent>;
    let store: Store;
    let addressMatchingService: AddressMatchingService;
    let mockDialog: MatDialogRef<AddressMatchingPromptComponent, any>;
    let memberService: MemberService;
    let membersBusinessService: MembersBusinessService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddressMatchingPromptComponent],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialog,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: AddressMatchingService,
                    useValue: mockAddressMatchingService,
                },
                {
                    provide: StaticService,
                    useValue: mockStaticService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: {},
                },
                {
                    provide: MembersBusinessService,
                    useValue: mockMembersBusinessService,
                },
                {
                    provide: AccountService,
                    useValue: {},
                },
                {
                    provide: AuthenticationService,
                    useValue: {},
                },
            ],
            imports: [NgxsModule.forRoot([SharedState]), HttpClientTestingModule, ReactiveFormsModule, MatMenuModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { ...MOCK_REGEX_DATA },
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddressMatchingPromptComponent);
        mockDialog = TestBed.inject(MatDialogRef);
        component = fixture.componentInstance;
        addressMatchingService = TestBed.inject(AddressMatchingService);
        memberService = TestBed.inject(MemberService);
        membersBusinessService = TestBed.inject(MembersBusinessService);
        component.mpGroupId = 111;
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onUpdateAddressFormChange()", () => {
        it("should update the address from based on selection", () => {
            const eventData = {
                value: "updateAddress",
            } as MatRadioChange;
            component.onUpdateAddressFormChange(eventData);
            expect(component.showUpdateAddressForm).toBeTruthy();
            expect(component.isError).toBeFalsy();
        });
    });

    describe("onNext()", () => {
        it("should go to step2 if step1 is true", () => {
            component.isAgent.setValue(false);
            component.onNext();
            expect(component.step1).toBeFalsy();
            expect(component.step3).toBeFalsy();
            expect(component.step2).toBeTruthy();
        });
        it("should go to step3 if step2 is true", () => {
            component.step1 = false;
            component.isRelatedToAgent.setValue(true);
            component.step2 = true;
            component.onNext();
            expect(component.step3).toBeTruthy();
            expect(component.step4).toBeFalsy();
            expect(component.step2).toBeFalsy();
        });
    });

    describe("handleError()", () => {
        beforeEach(() => {
            component.isSpinnerLoading = false;
            component.addressVerifyMessage = [];
        });
        it("should display all the error messages for each control", () => {
            const error = {
                status: ClientErrorResponseCode.RESP_400,
                error: {
                    details: [
                        {
                            message: "firstNameError",
                        },
                        {
                            message: "secondNameError",
                        },
                    ],
                },
            } as HttpErrorResponse;
            component.handleError(error);
            expect(component.addressVerifyMessage).toEqual(["firstNameError", "secondNameError"]);
        });
        it("should display generic error messages when there is no details", () => {
            const error = {
                status: ClientErrorResponseCode.RESP_400,
            } as HttpErrorResponse;
            component.handleError(error);
            expect(component.addressVerifyMessage).toEqual(["secondary.portal.directAccount.invalidAdressdata"]);
        });
        it("should display internal server error for 500 error", () => {
            const error = {
                status: ServerErrorResponseCode.RESP_500,
            } as HttpErrorResponse;
            component.handleError(error);
            expect(component.addressVerifyMessage).toEqual(["secondary.portal.accountPendingEnrollments.internalServer"]);
        });
        it("should display internal server error for 500 error", () => {
            const error = {
                error: {
                    details: [
                        {
                            message: "Error",
                        },
                    ],
                },
            } as HttpErrorResponse;
            component.handleError(error);
            expect(component.addressVerifyMessage).toEqual(["Error"]);
        });
        it("should not set any error if api returns unknown error", () => {
            const error = {
                status: ClientErrorResponseCode.RESP_401,
                error: {},
            } as HttpErrorResponse;
            component.handleError(error);
            expect(component.addressVerifyMessage).toEqual([]);
        });
    });

    describe("onBack()", () => {
        it("should go back to step 1 if user clicks back in step 2", () => {
            component.step2 = true;
            component.onBack();
            expect(component.step1).toBeTruthy();
            expect(component.step2).toBeFalsy();
            expect(component.isRelatedToAgent.value).toBeFalsy();
        });
        it("should go back to step 1 if user clicks back in step 3 and user is an agent", () => {
            component.step2 = false;
            component.step3 = true;
            component.isAgent.setValue(true);
            component.onBack();
            expect(component.step1).toBeTruthy();
            expect(component.step3).toBeFalsy();
        });
        it("should go back to step 2 if user clicks back in step 3 and user is related to agent", () => {
            component.step2 = false;
            component.step3 = true;
            component.isAgent.setValue(false);
            component.isRelatedToAgent.setValue(true);
            component.onBack();
            expect(component.step2).toBeTruthy();
            expect(component.step3).toBeFalsy();
        });
        it("should go back to step 2 if user clicks back in step 4", () => {
            component.step4 = true;
            component.step3 = false;
            component.onBack();
            expect(component.step2).toBeTruthy();
            expect(component.step4).toBeFalsy();
        });
    });

    describe("onContinue()", () => {
        it("should save account contact and close pop up", () => {
            component.isAgent.setValue(true);
            component.mpGroupId = 111;
            component.memberId = 222;
            const spy1 = jest.spyOn(addressMatchingService, "saveAccountContactOrAccountProducerConfirmation").mockReturnValue(of(null));
            const spy2 = jest.spyOn(component["dialogRef"], "close");
            component.onContinue();
            expect(spy1).toBeCalledWith(111, 222, true);
            expect(spy2).toBeCalledWith({ routeToAppFlow: true });
            expect(component.isSpinnerLoading).toBeFalsy();
        });
    });

    describe("onGotIt()", () => {
        it("should not save account contact and route to app flow on closing pop-up", () => {
            component.mpGroupId = 101;
            component.memberId = 202;
            const spy1 = jest.spyOn(addressMatchingService, "saveAccountContactOrAccountProducerConfirmation").mockReturnValue(of(null));
            const spy2 = jest.spyOn(component["dialogRef"], "close");
            component.onGotIt();
            expect(spy1).toBeCalledWith(101, 202, false);
            expect(spy2).toBeCalledWith({ routeToAppFlow: true });
            expect(component.isSpinnerLoading).toBeFalsy();
        });
    });

    describe("ngOnInit()", () => {
        it("should initialize component", () => {
            const spy1 = jest.spyOn(memberService, "getMemberContact");
            component.subscriptions = [new Subscription()];
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(component.isAgent.value).toBeFalsy();
            expect(component.isRelatedToAgent.value).toBeFalsy();
        });
    });

    describe("getCifNumber()", () => {
        it("should call getMember()", () => {
            component.mpGroupId = 111;
            component.memberId = 222;
            component.subscriptions = [new Subscription()];
            const profileData = {
                body: {
                    customerInformationFileNumber: 222,
                },
            } as unknown as HttpResponse<MemberProfile>;
            const spy = jest.spyOn(memberService, "getMember").mockReturnValue(of(profileData));
            component.getCifNumber();
            expect(spy).toBeCalledWith(222, true, "111");
            expect(component.hasCifNumber).toBeTruthy();
        });
    });

    describe("verifyAddressDetails()", () => {
        it("should call verifyAddressDetails() atleast once", () => {
            const result = {
                state: "GA",
                zip: "30005",
            } as unknown as Address | PersonalAddress;
            const spy = jest.spyOn(membersBusinessService, "verifyAddress").mockReturnValue(of(result));
            component.verifyAddressDetails(result);
            expect(spy).toBeCalledTimes(1);
            expect(component.isSpinnerLoading).toBeFalsy();
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
