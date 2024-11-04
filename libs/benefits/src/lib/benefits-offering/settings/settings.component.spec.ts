import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { SettingsComponent } from "./settings.component";
import { mockAuthenticationService, mockEmpoweredModalService, mockMatDialog } from "@empowered/testing";
import { FormBuilder } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { AuthenticationService } from "@empowered/api";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { EmpoweredModalService, SharedService } from "@empowered/common-services";
import { StoreModule } from "@ngrx/store";
import { AccountImportTypes, Accounts, PartnerAccountType, ProspectType, RatingCode, StatusTypeValues } from "@empowered/constants";
import { takeUntil } from "rxjs/operators";
import { of, Subject } from "rxjs";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
@Directive({
    selector: "[hasPermission]",
})
class MockHasPermissionDirective {
    @Input("hasPermission") permission: string;
}

@Directive({
    selector: "[configEnabled]",
})
class MockConfigEnableDirective {
    @Input("configEnabled") configKey: string;
}
const MOCK_ACCOUNT_DATA: Accounts = {
    id: 181654,
    name: "CLAXTON HOBBS PHARMACY - NQH6",
    accountNumber: "dev-NQH6",
    ratingCode: RatingCode.STANDARD,
    primaryContact: {
        address: {
            address1: "131 W TAYLOR ST",
            address2: "",
            city: "COLUMBUS",
            state: "GA",
            zip: "31907",
        },
        emailAddresses: [],
        phoneNumbers: [
            {
                phoneNumber: "7702272428",
                type: "WORK",
                isMobile: false,
            },
        ],
        primary: true,
        name: "CLAXTON HOBBS PHARMACY - NQH6",
        typeId: 1,
    },
    situs: {
        state: {
            abbreviation: "GA",
            name: "Georgia",
        },
        zip: "31907",
    },
    payFrequencyId: 5,
    type: ProspectType.CLIENT,
    status: StatusTypeValues.ACTIVE,
    partnerAccountType: PartnerAccountType.PAYROLL,
    partnerId: 2,
    importType: AccountImportTypes.AFLAC_INDIVIDUAL,
    enrollmentAssistanceAgreement: false,
    thirdPartyPlatformsEnabled: true,
    checkedOut: false,
    contact: {},
    prospectInformation: { sicIrNumber: "dfdgfd", taxId: " dfdfs" },
    subordinateProducerId: 0,
    typeId: 0,
    employeeCount: 0,
    productsCount: 0,
    daysToEnroll: 0,
};
describe("SettingsComponent", () => {
    let store: Store;
    let component: SettingsComponent;
    let fixture: ComponentFixture<SettingsComponent>;
    let empoweredModalService: EmpoweredModalService;
    let matDialog: MatDialog;
    let ngrxStore = {onAsyncValue: jest.fn(), dispatch: jest.fn()};
    let unsubscribe$: Subject<void>;
    let sharedService: SharedService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SettingsComponent, MockHasPermissionDirective, MockConfigEnableDirective],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule, MatAutocompleteModule, StoreModule.forRoot({})],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                { provide: NGRXStore, useValue: ngrxStore },
                FormBuilder,
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SettingsComponent);
        component = fixture.componentInstance;
        empoweredModalService = TestBed.inject(EmpoweredModalService);
        matDialog = TestBed.inject(MatDialog);
        unsubscribe$ = new Subject<void>();
        store = TestBed.inject(Store);
        sharedService = TestBed.inject(SharedService);
    });

    describe("SettingsComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });
    describe("isStateSelected()", () => {
        it("should return true if the selected state is present in the statesList", () => {
            component.statesList = ["SampleState1", "SampleState", "SampleState2"];
            expect(component.isStateSelected("SampleState")).toBe(true);
        });
    });
    describe("openModal()", () => {
        it("should open the modal", () => {
            const spy = jest.spyOn(matDialog, "open");
            component.openModal();
            expect(spy).toBeCalledWith(component.censusModal);
        });
    });
    describe("closeModal()", () => {
        it("should close the modal", () => {
            const spy = jest.spyOn(matDialog, "closeAll");
            component.closeModal();
            expect(spy).toBeCalled();
        });
    });

    describe("ngOnInit()", () => {
        it("should fetch the data of account from ngrx store", (done) => {
            const mpGroupId = '123';
            const mockAccount : Accounts  = { ...MOCK_ACCOUNT_DATA, id: 1 };
            component.unsubscribe$ = unsubscribe$;
            ngrxStore.onAsyncValue.mockReturnValue(of(mockAccount));
            jest.spyOn(component, "fetchAccountStatus").mockReturnValue(null);
            component.ngOnInit();
            expect(ngrxStore.dispatch).toHaveBeenCalled();
            expect(ngrxStore.onAsyncValue).toHaveBeenCalled();
            component.account$.pipe(takeUntil(component.unsubscribe$)).subscribe((resp) => {
                expect(resp).toEqual(mockAccount);
                expect(component.companyCode).toEqual(mockAccount.companyCode);
            })
            done();
        });
    });
    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
