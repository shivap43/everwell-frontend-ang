import { ActivatedRoute, Params } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { mockLanguageService } from "@empowered/testing";
import { AccountMessagesComponent } from "./account-messages.component";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { LanguageService } from "@empowered/language";
import { Store } from "@ngxs/store";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";

const mockRouteParams = new BehaviorSubject<Params>({ id: "" });

const mockRoute = {
    params: mockRouteParams.asObservable(),
} as ActivatedRoute;

const mockStore = {
    selectSnapshot: () => of(""),
} as unknown as Store;

describe("AccountMessagesComponent", () => {
    let component: AccountMessagesComponent;
    let fixture: ComponentFixture<AccountMessagesComponent>;
    let router: ActivatedRoute;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockRoute,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
            ],
            declarations: [AccountMessagesComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AccountMessagesComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        router = TestBed.inject(ActivatedRoute);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should assign 'exists' to accountMessage", () => {
            component.ngOnInit();
            router.params.subscribe((params) => {
                expect(component.accountMessage).toEqual("exists");
            });
        });

        it("should assign 'invalid' to accountMessage", () => {
            mockRouteParams.next({ id: "invalid" });
            component.ngOnInit();
            router.params.subscribe((params) => {
                expect(component.accountMessage).toEqual("invalid");
            });
        });

        it("should assign 'success' to accountMessage", () => {
            mockRouteParams.next({ id: "success" });
            component.ngOnInit();
            router.params.subscribe((params) => {
                expect(component.accountMessage).toEqual("success");
            });
        });
    });
});
