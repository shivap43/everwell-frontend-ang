import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder } from "@angular/forms";
import { MPGroupAccountService } from "@empowered/common-services";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";
import {
    mockAccountService,
    mockCoreService,
    MockCoverageNamePipe,
    MockCurrencyPipe,
    mockFlexDollarPipe,
    mockLanguageService,
    mockMemberService,
    mockMpGroupAccountService,
    MockReplaceTagPipe,
    mockRouter,
    mockShoppingCartDisplayService,
    mockShoppingService,
    mockStore,
    mockUtilService,
} from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { PlanSelectionComponent } from "./plan-selection.component";
import { Router } from "@angular/router";
import { CoreService, ShoppingService, ShoppingCartDisplayService, MemberService, AccountService } from "@empowered/api";
import { DateService } from "@empowered/date";
import { of, Subscription } from "rxjs";

describe("PlanSelectionComponent", () => {
    let component: PlanSelectionComponent;
    let fixture: ComponentFixture<PlanSelectionComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([])],
            declarations: [PlanSelectionComponent, MockReplaceTagPipe, MockCoverageNamePipe, MockCurrencyPipe, mockFlexDollarPipe],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Store,
                    useValue: mockStore,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: AccountService,
                    useValue: mockAccountService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: CoreService,
                    useValue: mockCoreService,
                },
                {
                    provide: ShoppingService,
                    useValue: mockShoppingService,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: MPGroupAccountService,
                    useValue: mockMpGroupAccountService,
                },
                DateService,
                FormBuilder,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PlanSelectionComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe all subscriptions during component destruction", () => {
            const spy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [of(null).subscribe()];
            component.ngOnDestroy();
            expect(spy).toHaveBeenCalled();
        });
    });
});
