import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { mockMatDialog, mockStore, mockSharedService } from "@empowered/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { of, Subject } from "rxjs";
import { provideMockStore } from "@ngrx/store/testing";
import { AccountImportTypes, Accounts, PartnerAccountType, ProspectType, RatingCode, StatusTypeValues } from "@empowered/constants";
import { SettingsTabComponent } from "./settings-tab.component";
import { takeUntil } from "rxjs/operators";
import { ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { MatDialog } from "@angular/material/dialog";
import { SharedService } from "@empowered/common-services";


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
describe("SettingsTabComponent", () => {
    let store: Store;
    let ngrxStore = {onAsyncValue: jest.fn(), dispatch: jest.fn()};
    let component: SettingsTabComponent;
    let fixture: ComponentFixture<SettingsTabComponent>;
    let unsubscribe$: Subject<void>;
    let sharedService: SharedService;
    let router: any = {parent: {snapshot:{parent:{parent:{params:{mpGroupId:"123"}}}}}};
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [SettingsTabComponent],
            imports: [NgxsModule.forRoot([]),HttpClientTestingModule, RouterTestingModule],
            providers: [
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                { provide: NGRXStore, useValue: ngrxStore },
                { provide: ActivatedRoute, useValue: router },
                DatePipe,
                provideMockStore({}),
            ],
        }).compileComponents();
    });
    beforeEach(() => {
        unsubscribe$ = new Subject<void>();
        store = TestBed.inject(Store);
        sharedService = TestBed.inject(SharedService);
        jest.spyOn(store, "selectSnapshot").mockReturnValue({situs: {state:{abbreviation:"value"}}});
        jest.spyOn(sharedService, "getPrivacyConfigforEnroller").mockReturnValue(true);
        fixture = TestBed.createComponent(SettingsTabComponent);
        component = fixture.componentInstance;
    });
   

    describe("ngOnInit()", () => {
        it("should fetch the data of account from ngrx store", (done) => {
            const mpGroupId = '123';
            const mockAccount : Accounts  = { ...MOCK_ACCOUNT_DATA, id: 1 };
            component.unsubscribe$ = unsubscribe$;
            ngrxStore.onAsyncValue.mockReturnValue(of(mockAccount));
            jest.spyOn(component, "serviceCalls").mockReturnValue(null);
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
});
