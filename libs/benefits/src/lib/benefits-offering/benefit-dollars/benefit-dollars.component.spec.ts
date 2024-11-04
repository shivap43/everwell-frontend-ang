import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import { NgxsModule, Store } from "@ngxs/store";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from "@angular/material/dialog";
import {
    mockDatePipe,
    mockLanguageService,
    mockMatDialog,
    mockMatDialogData,
    mockMatDialogRef,
    mockStaticUtilService,
    MockReplaceTagPipe,
} from "@empowered/testing";
import { BenefitDollarsComponent } from "./benefit-dollars.component";
import { DatePipe } from "@angular/common";
import { AccountInfoState, AccountListState, BenefitsOfferingState, StaticUtilService } from "@empowered/ngxs-store";
import { AccountService, BenefitsOfferingService } from "@empowered/api";
import { StoreModule } from "@ngrx/store";

@Directive({
    selector: "[hasAnyPermission]",
})
class MockHasAnyPermissionDirective {
    @Input("hasAnyPermission") permission: string;
}

describe("BenefitDollarsComponent", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let component: BenefitDollarsComponent;
    let fixture: ComponentFixture<BenefitDollarsComponent>;
    let store: Store;
    let accountService: AccountService;
    let benefitOfferingService: BenefitsOfferingService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [BenefitDollarsComponent, MockReplaceTagPipe, MockHasAnyPermissionDirective],
            providers: [
                FormBuilder,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
            ],
            imports: [
                HttpClientTestingModule,
                ReactiveFormsModule,
                NgxsModule.forRoot([BenefitsOfferingState, AccountInfoState, AccountListState]),
                StoreModule.forRoot({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            productOffering: {
                offeringSteps: {},
                allProducts: [],
                mpGroup: 12345,
            },
            accountInfo: {
                accountInfo: {
                    situs: {
                        state: {},
                    },
                },
            },
            accounts: {
                selectedGroup: {
                    id: 1,
                },
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(BenefitDollarsComponent);
        component = fixture.componentInstance;
        accountService = TestBed.inject(AccountService);
        benefitOfferingService = TestBed.inject(BenefitsOfferingService);
        TestBed.inject(MatDialogRef);
        TestBed.inject(Store);
        jest.resetAllMocks();
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("getPayFrequency()", () => {
        it("should call the getPayFrequencies", () => {
            const spy = jest.spyOn(accountService, "getPayFrequencies");
            component.getPayFrequencies();
            expect(spy).toBeCalled();
        });
    });

    describe("getPayFrequencyId()", () => {
        it("should call getAccount", () => {
            component.mpGroup = 12345;
            const spy = jest.spyOn(accountService, "getAccount");
            component.getPayFrequencyId();
            expect(spy).toBeCalled();
        });
    });

    describe("getApprovalRequests()", () => {
        it("should call getApprovalRequests", () => {
            const spy = jest.spyOn(benefitOfferingService, "getApprovalRequests");
            component.getApprovalRequests();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy1 = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
            fixture.destroy();
            expect(spy1).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
