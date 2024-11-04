import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AccountService } from "@empowered/api";
import { LanguageService } from "@empowered/language";
import { Router } from "@angular/router";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { mockAccountService, mockLanguageService, mockRouter, mockTpiService, mockUtilService } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { TpiNpnSearchComponent } from "./tpi-npn-search.component";
import { DatePipe } from "@angular/common";
import { TPIState, UtilService } from "@empowered/ngxs-store";
import { of } from "rxjs";
import { RouterTestingModule } from "@angular/router/testing";
import { AccountProducer, TpiUserDetail } from "@empowered/constants";
import { TpiServices } from "@empowered/common-services";

describe("TpiNpnSearchComponent", () => {
    let component: TpiNpnSearchComponent;
    let fixture: ComponentFixture<TpiNpnSearchComponent>;
    let router: Router;
    let store: Store;
    let accountService: AccountService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [TpiNpnSearchComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([TPIState]), RouterTestingModule],
            providers: [
                DatePipe,
                Store,
                { provide: Router, useValue: mockRouter },
                { provide: AccountService, useValue: mockAccountService },
                { provide: LanguageService, useValue: mockLanguageService },
                { provide: TpiServices, useValue: mockTpiService },
                { provide: UtilService, useValue: mockUtilService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TpiNpnSearchComponent);
        component = fixture.componentInstance;
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
            },
        });
        accountService = TestBed.inject(AccountService);
        router = TestBed.inject(Router);
        component.mpGroup = 111;
    });

    beforeEach(() => {
        jest.resetAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onExit", () => {
        it("Should close the modal on click of 'Exit' button", () => {
            const spy = jest.spyOn(router, "navigate");
            const EXIT = "tpi/exit";
            component.onExit();
            expect(spy).toBeCalledWith([EXIT]);
        });
    });

    describe("checkPendingJoiningFlag", () => {
        it("should fetch the pending joining flag", () => {
            const spy = jest.spyOn(accountService, "getAccountProducer").mockReturnValue(
                of({
                    role: "PRIMARY_PRODUCER",
                    producer: {
                        name: {
                            firstName: "john",
                            lastName: "richie",
                        },
                        phoneNumber: "1234567890",
                        emailAddress: "john12@gmail.com",
                    },
                } as AccountProducer),
            );
            component.checkPendingJoiningFlag("111");
            expect(spy).toBeCalled();
        });
    });

    describe("enableProducerAssistedTpiSSO", () => {
        it("should switch the enabling authentication from selfservice to agent assisted flow", () => {
            const spy = jest.spyOn(accountService, "enableProducerAssistedTpiSSO").mockReturnValue(
                of({
                    id: 111,
                    username: "user",
                    name: {},
                    partnerId: 222,
                    consented: false,
                    memberId: 333,
                    groupId: 111,
                    modal: false,
                    producerId: 111,
                } as TpiUserDetail),
            );
            component.enableProducerAssistedTpiSSO(111);
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spyForNext = jest.spyOn(component["unsubscribe$"], "next");
            const spyForComplete = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spyForNext).toBeCalledTimes(1);
            expect(spyForComplete).toBeCalledTimes(1);
        });
    });
});
