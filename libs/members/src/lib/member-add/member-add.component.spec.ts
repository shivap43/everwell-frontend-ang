import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MemberAddComponent } from "./member-add.component";
import { NgxsModule, Store } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { Subject, of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { MemberQualifierType, MemberService } from "@empowered/api";
import { MemberProfile } from "@empowered/constants";
import { HttpResponse } from "@angular/common/http";
import { mockLanguageService, mockMemberService, mockRouter } from "@empowered/testing";
import { AddMemberInfo, MemberInfoState } from "@empowered/ngxs-store";
import { MaterialModule } from "@empowered/ui";
import { HasPermissionDirective } from "@empowered/ui";

const mockRouteParams = new Subject<Params>();
const mockRoute = {
    snapshot: { params: mockRouteParams.asObservable() },
    parent: { parent: { parent: { parent: { params: mockRouteParams.asObservable() } } } },
};

describe("MemberAddComponent", () => {
    let component: MemberAddComponent;
    let fixture: ComponentFixture<MemberAddComponent>;
    let store: Store;
    let memberService: MemberService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [MemberAddComponent, HasPermissionDirective],
            imports: [NgxsModule.forRoot([MemberInfoState]), HttpClientTestingModule, MaterialModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                RouterTestingModule,
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(MemberAddComponent);
        component = fixture.componentInstance;
        memberService = TestBed.inject(MemberService);
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            MemberAdd: {
                activeMemberId: 18,
                configurations: {
                    payload: {},
                },
                memberInfo: {
                    birthDate: "1963-05-13",
                    gender: "MALE",
                    id: 18,
                    name: {
                        firstName: "JEFFREYY",
                        lastName: "ANDERSON",
                    },
                    verificationInformation: {
                        zipCode: "32606",
                        verifiedEmail: "test@gmail",
                    },
                },
                errorMessage: null,
                mpGroupId: "12345",
            },
        });
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call getLanguageStrings() and displayEmailAlert()", () => {
            const spy1 = jest.spyOn(component, "getLanguageStrings");
            const spy2 = jest.spyOn(component, "displayEmailAlert");
            component.ngOnInit();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });

    describe("getMemberDetails()", () => {
        it("should run first if block when tabId is non-zero", () => {
            component.memberId = 1;
            component.mpGroupId = 101;
            const spy = jest.spyOn(component, "fetchMemberData");
            component.getMemberDetails(1);
            expect(component.isLoading).toBe(false);
            expect(spy).toBeCalled();
        });
        it("should run else-if block and NOT nested if when tabId is 0, isDirect is false, and memberId is null", () => {
            component.isDirect = false;
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component, "checkTermination");
            component.getMemberDetails(0);
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalledTimes(0);
        });
        it("should run else-if block and nested if when tabId is 0, isDirect is false, and memberId is not null", () => {
            component.memberId = 1;
            component.mpGroupId = 101;
            component.isDirect = false;
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component, "checkTermination");
            component.getMemberDetails(0);
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
        it("should run else block if when tabId is 0, isDirect is true, and memberId is not null", () => {
            component.memberId = 1;
            component.mpGroupId = 101;
            component.isDirect = true;
            const spy = jest.spyOn(component, "checkTermination");
            component.getMemberDetails(0);
            expect(spy).toBeCalled();
        });
    });

    describe("setMemberIdinState()", () => {
        it("should set member id and mpGroup in state and get member details if member id exists ", () => {
            component.memberId = 1;
            component.mpGroupId = 101;
            const member = {
                memberInfo: {},
                activeMemberId: 1,
                mpGroupId: 101,
            };
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component, "checkTermination");
            component.setMemberIdinState();
            expect(spy1).toBeCalledWith(new AddMemberInfo(member));
            expect(spy2).toBeCalled();
        });
        it("should set only mpGroup in state if member id does not exists ", () => {
            component.memberId = null;
            component.mpGroupId = 101;
            const member = {
                memberInfo: {},
                activeMemberId: null,
                mpGroupId: 101,
            };
            const spy1 = jest.spyOn(store, "dispatch");
            const spy2 = jest.spyOn(component, "checkTermination");
            component.setMemberIdinState();
            expect(spy1).toBeCalledWith(new AddMemberInfo(member));
            expect(spy2).not.toBeCalled();
        });
    });

    describe("enableAll()", () => {
        it("should enable contact and work info tab", () => {
            component.enableAll(true);
            expect(component.disableContact).toBeFalsy();
            expect(component.disableWork).toBeFalsy();
        });
    });

    describe("enableWork()", () => {
        it("should enable work info tab and disable contact info tab", () => {
            component.enableWork(true);
            expect(component.disableContact).toBeTruthy();
            expect(component.disableWork).toBeFalsy();
        });
    });

    describe("enableContact()", () => {
        it("should enable contact tab", () => {
            component.enableContact(true);
            expect(component.disableContact).toBeFalsy();
        });
    });

    describe("showTab()", () => {
        it("should display personal tab when selected index is 0", () => {
            const id = {
                index: 0,
            };
            component.showTab(id);
            expect(component.type).toEqual(component.MemberAddTabs.PERSONAL);
        });
        it("should display work tab when selected index is 1", () => {
            const id = {
                index: 1,
            };
            component.showTab(id);
            expect(component.type).toEqual(component.MemberAddTabs.WORK);
        });
        it("should display contact tab when selected index is 2", () => {
            const id = {
                index: 2,
            };
            component.showTab(id);
            expect(component.type).toEqual(component.MemberAddTabs.CONTACT);
        });
    });

    describe("checkTermination()", () => {
        it("should set termination status true for a test employee", () => {
            component.memberId = 111;
            component.mpGroupId = 222;
            const memberData = {
                body: {
                    profile: {
                        test: true,
                    },
                },
            } as HttpResponse<MemberProfile>;
            const spy1 = jest.spyOn(memberService, "getMember").mockReturnValue(of(memberData));
            component.checkTermination();
            expect(spy1).toBeCalledWith(111, true, "222");
            expect(component.isTestEmployee).toBeTruthy();
        });
    });

    describe("displayEmailAlert()", () => {
        it("should set emailAlertDismissed$ true if MemberQualifier", (done) => {
            expect.assertions(3);
            component.memberId = 1;
            component.mpGroupId = 12345;
            const spy1 = jest
                .spyOn(memberService, "getMemberQualifierTypes")
                .mockReturnValue(of([{ id: 1, memberType: "SUBSCRIBER", qualifierCode: "DISMISS_EMAIL" }] as MemberQualifierType[]));
            const spy2 = jest.spyOn(memberService, "getMemberQualifier").mockReturnValue(
                of([
                    {
                        id: 1,
                        value: "true",
                        validity: { effectiveStarting: "2023-10-04" },
                    },
                ]),
            );
            component.displayEmailAlert();
            expect(spy1).toBeCalled();
            component.emailAlertDismissed$.subscribe((x) => {
                expect(spy2).toBeCalled();
                expect(x).toBe(true);
                done();
            });
        });
        it("should set emailAlertDismissed$ false if no MemberQualifier", (done) => {
            expect.assertions(3);
            component.memberId = 1;
            component.mpGroupId = 12345;
            const spy1 = jest
                .spyOn(memberService, "getMemberQualifierTypes")
                .mockReturnValue(of([{ id: 1, memberType: "SUBSCRIBER", qualifierCode: "DISMISS_EMAIL" }] as MemberQualifierType[]));
            const spy2 = jest.spyOn(memberService, "getMemberQualifier").mockReturnValue(of([]));
            component.displayEmailAlert();
            expect(spy1).toBeCalled();
            component.emailAlertDismissed$.subscribe((x) => {
                expect(spy2).toBeCalled();
                expect(x).toBe(false);
                done();
            });
        });
        it("should set emailOnFile$ true if email", (done) => {
            expect.assertions(1);
            component.displayEmailAlert();
            component.emailOnFile$.subscribe((emailOnFile) => {
                expect(emailOnFile).toBe(true);
                done();
            });
        });
        it("should set emailOnFile$ false if no email", (done) => {
            expect.assertions(1);
            store.reset({
                ...store.snapshot(),
                MemberAdd: {
                    activeMemberId: 18,
                    configurations: {
                        payload: {},
                    },
                    memberInfo: {
                        birthDate: "1963-05-13",
                        gender: "MALE",
                        id: 18,
                        name: {
                            firstName: "JEFFREYY",
                            lastName: "ANDERSON",
                        },
                    },
                    errorMessage: null,
                    mpGroupId: "12345",
                },
            });
            component.displayEmailAlert();
            component.emailOnFile$.subscribe((emailOnFile) => {
                expect(emailOnFile).toBe(false);
                done();
            });
        });
    });

    describe("dismissEmailAlert()", () => {
        it("should call saveMemberQualifier()", () => {
            component.memberId = 6;
            component.mpGroupId = 220577;
            component.dismissEmailQualifierId = 1;
            const spy = jest.spyOn(memberService, "saveMemberQualifier");
            component.dismissEmailAlert();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalled();
            expect(spy2).toBeCalled();
        });
    });
});
