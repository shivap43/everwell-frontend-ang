import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AccountService, AflacService, CommissionSplit, SitCode } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { SentEnrollmentsComponent } from "./sent-enrollments.component";
import { mockDatePipe, mockDomSanitizer, mockLanguageService, mockUserService } from "@empowered/testing";
import { DatePipe } from "@angular/common";
import { NgxsModule, Store } from "@ngxs/store";
import { of, throwError } from "rxjs";
import { DomSanitizer } from "@angular/platform-browser";
import { SharedService } from "@empowered/common-services";
import { UserService } from "@empowered/user";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { BusinessState } from "@empowered/ngxs-store";
import { WritingNumber, Accounts } from "@empowered/constants";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { MaterialModule } from "@empowered/ui";

describe("SentEnrollmentsComponent", () => {
    let component: SentEnrollmentsComponent;
    let fixture: ComponentFixture<SentEnrollmentsComponent>;
    let store: Store;
    let stateForNgxsStore: Store;
    let accountService: AccountService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([BusinessState]), MaterialModule],
            declarations: [SentEnrollmentsComponent],
            providers: [
                AflacService,
                AccountService,
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: DomSanitizer,
                    useValue: mockDomSanitizer,
                },

                SharedService,

                {
                    provide: UserService,
                    useValue: mockUserService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(SentEnrollmentsComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        stateForNgxsStore = {
            ...store.snapshot(),
            accountEnrollments: {
                mpGroupId: "111",
            },
        };
        store.reset(stateForNgxsStore);
        accountService = TestBed.inject(AccountService);
        component.commissionSplitList = [
            {
                id: 1,
                name: "CommissionSplit1",
            },
            {
                id: 2,
                name: "CommissionSplit2",
                assignments: [
                    {
                        producer: {
                            producerId: 1,
                            name: "Chris evans",
                        },
                        sitCodeId: 1,
                        percent: 100,
                    },
                ],
            },
        ] as CommissionSplit[];
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("initialize()", () => {
        it("should set mpGroup and call getAccountInfo()", () => {
            const spy = jest.spyOn(component, "getAccountInfo");
            component.selfEnrollmentFlag = true;
            component.initialize();
            expect(component.mpGroup).toStrictEqual("222");
            expect(spy).toBeCalledWith("222");
            component.selfEnrollmentFlag = false;
            component.initialize();
            expect(component.mpGroup).toStrictEqual("111");
            expect(spy).toBeCalledWith("111");
        });
    });
    describe("getAccountInfo()", () => {
        it("should call getAccount() and getEnrollmentData()", () => {
            const spy1 = jest
                .spyOn(accountService, "getAccount")
                .mockReturnValue(of({ situs: { state: { abbreviation: "GA", name: "Georgea" } } } as Accounts));
            const spy2 = jest.spyOn(component, "hideErrorAlertMessage");
            const spy3 = jest.spyOn(component, "getEnrollmentData");
            component.getAccountInfo("111");
            expect(spy1).toBeCalledWith("111");
            expect(spy2).toBeCalled();
            expect(spy3).toBeCalled();
        });
        it("should call showErrorAlertMessage() for api error response", () => {
            const error = {
                message: "api error message",
                status: 400,
            };
            jest.spyOn(accountService, "getAccount").mockReturnValue(throwError(error));
            const spy = jest.spyOn(component, "showErrorAlertMessage");
            component.getAccountInfo("111");
            expect(spy).toBeCalledWith(error);
        });
    });
    describe("getCommissionTooltip()", () => {
        it("should return tooltip for commission splits", () => {
            component.sitCodes = [
                { id: 1, code: "U" },
                { id: 2, code: "A" },
            ] as SitCode[];
            component.writingNumbers = [
                {
                    // eslint-disable-next-line id-denylist
                    number: "123",
                    sitCodes: component.sitCodes,
                },
            ] as WritingNumber[];
            const tooltip = component.getCommissionTooltip(2, component.commissionSplitList[1]);
            expect(tooltip).toStrictEqual("<div class='commissions-split-tooltip-content'><span>100% Chris evans U 123</span></div>");
        });
    });
    describe("getNotesTooltip", () => {
        it("should return tooltip for notes", () => {
            const tooltip = component.getNotesTooltip("notes", "johny", "11-09-2022");
            expect(tooltip).toStrictEqual("<div>notes</div></br><div>johny</div><div>11-09-2022</div>");
        });
    });
});
