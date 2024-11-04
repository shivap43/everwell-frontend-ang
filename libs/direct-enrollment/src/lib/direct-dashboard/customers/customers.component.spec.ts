import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormControl } from "@angular/forms";
import { MatDialog } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthenticationService, MemberService, SearchMembers } from "@empowered/api";
import { MemberListItem, MemberListItemStatus } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import {
    mockActivatedRoute,
    mockEmpoweredModalService,
    mockLanguageService,
    mockMatDialog,
    mockStaticUtilService,
    mockUserService,
} from "@empowered/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { NgxsModule, Store } from "@ngxs/store";
import { of, Subscription } from "rxjs";
import { CustomersComponent } from "./customers.component";
import { AccountInfoState, SharedState, StaticUtilService } from "@empowered/ngxs-store";
import { NotificationQueueService } from "@empowered/util/websockets";
import { UserService } from "@empowered/user";
import { ActivatedRoute } from "@angular/router";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { DatePipe } from "@angular/common";

describe("CustomersComponent", () => {
    let component: CustomersComponent;
    let fixture: ComponentFixture<CustomersComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CustomersComponent],
            imports: [RouterTestingModule, HttpClientTestingModule, NgxsModule.forRoot([SharedState])],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MatDialog,
                    useValue: mockMatDialog,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: EmpoweredModalService,
                    useValue: mockEmpoweredModalService,
                },
                {
                    provide: AuthenticationService,
                    useValue: {},
                },
                {
                    provide: NotificationQueueService,
                    useValue: {},
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                MemberService,
                DatePipe,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: { EMAIL: "SAMPLE_REGEX" },
            },
        });
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(CustomersComponent);
        component = fixture.componentInstance;
        component.regex = {
            EMAIL: "@gmail.com",
        };
        component.customers = {
            content: [
                {
                    id: 1,
                    products: {
                        names: "Term Life",
                    },
                    email: "steve@gmail.com",
                    firstName: "Steve",
                    lastName: "Smith",
                },
                {
                    id: 2,
                    products: {
                        names: "Term Life",
                    },
                    email: "johny@gmail.com",
                    firstName: "Johny",
                    lastName: "Bairstow",
                },
            ] as MemberListItem[],
            totalElements: 4,
        } as SearchMembers;
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("getCoverageFilterOptions()", () => {
        it("should return unique product names array", () => {
            expect(component.getCoverageFilterOptions()).toStrictEqual(["Term Life"]);
        });
    });
    describe("getSearchFilterValue()", () => {
        it("should return phone number to be displayed on filter ", () => {
            component.searchControl = new FormControl("999999999");
            expect(component.getSearchFilterValue()).toBe("phone:999999999");
        });
        it("should return email to be displayed on filter ", () => {
            component.searchControl = new FormControl("abc@gmail.com");
            expect(component.getSearchFilterValue()).toBe("emailAddresses:abc@gmail.com");
        });
        it("should return customer name to be displayed on filter ", () => {
            component.searchControl = new FormControl("abc");
            expect(component.getSearchFilterValue()).toBe("firstName:abc|lastName:abc");
        });
    });
    describe("searchCustomers()", () => {
        it("should call getCustomers() when totalElements is greater than maxNumberOfRowsToBeShown", (done) => {
            expect.assertions(2);
            component.allCustomersResponse = component.customers;
            component.maxNumberOfRowsToBeShown = 3;
            jest.spyOn(component, "getFilterText").mockReturnValue("firstName:steve|lastName:steve");
            const spy = jest.spyOn(component, "getCustomers").mockReturnValue(
                of([
                    {
                        id: 1,
                    },
                ] as MemberListItem[]),
            );
            component.searchCustomers("steve").subscribe((members) => {
                expect(spy).toHaveBeenCalledWith({ filter: "firstName:steve|lastName:steve" });
                expect(members).toStrictEqual([{ id: 1 }]);
                done();
            });
        });
        it("should return customers", (done) => {
            expect.assertions(1);
            component.allCustomersResponse = component.customers;
            component.maxNumberOfRowsToBeShown = 5;
            component.searchCustomers("steve").subscribe((members) => {
                expect(members).toStrictEqual([component.allCustomersResponse.content[0]]);
                done();
            });
        });
    });
    describe("filterByCoveredProducts()", () => {
        it("should set customersToDisplay as customers when there are no selectedCoverageFilterOptions", () => {
            component.selectedCoverageFilterOptions = [];
            component.filterByCoveredProducts();
            expect(component.customersToDisplay).toStrictEqual(component.customers.content);
        });
    });
    describe("coverageOptionSelect()", () => {
        it("should set disableCoverageProducts and disableOptionNoBenefits based on selectedCoverageFilterOptions", () => {
            component.selectedCoverageFilterOptions = [];
            component.coverageOptionSelect();
            expect(component.disableCoverageProducts).toBe(false);
            expect(component.disableOptionNoBenefits).toBe(false);
            component.selectedCoverageFilterOptions = ["TermLife"];
            component.coverageOptionSelect();
            expect(component.disableCoverageProducts).toBe(false);
            expect(component.disableOptionNoBenefits).toBe(true);
            component.selectedCoverageFilterOptions = ["TermLife", "None"];
            component.coverageOptionSelect();
            expect(component.disableCoverageProducts).toBe(true);
            expect(component.disableOptionNoBenefits).toBe(false);
        });
    });

    describe("selectAllProducts()", () => {
        it("should set products to be displayed for the customer", () => {
            component.customerCoverageProducts = ["Accident", "Cancer"];
            component.selectAllProducts();
            expect(component.selectedCoverageFilterOptions).toStrictEqual(["Accident", "Cancer"]);
        });
    });

    describe("getCustomers()", () => {
        it("should check return data", (done) => {
            const mockmemberListItem = [
                {
                    id: 2,
                    employeeId: "123",
                    firstName: "TestFirstName1",
                    lastName: "TestLastName2",
                    registered: true,
                    status: MemberListItemStatus.ACTIVE,
                    products: {
                        names: "test1",
                        totalCost: 5,
                        pendingProducts: "desk",
                    },
                    dependents: [
                        {
                            firstName: "first1",
                            lastName: "last1",
                            relation: "father",
                        },
                    ],
                },
            ];
            const memberListItems = mockmemberListItem as MemberListItem[];
            component.hasPermissionToAccount = true;
            const spyCustomers = jest.spyOn(component, "getCustomers").mockReturnValue(of(memberListItems));
            component.getCustomers().subscribe((customers) => {
                expect(spyCustomers).toBeCalled();
                expect(customers).toStrictEqual([
                    {
                        dependents: [{ firstName: "first1", lastName: "last1", relation: "father" }],
                        employeeId: "123",
                        firstName: "TestFirstName1",
                        id: 2,
                        lastName: "TestLastName2",
                        products: { names: "test1", pendingProducts: "desk", totalCost: 5 },
                        registered: true,
                        status: "ACTIVE",
                    },
                ]);
                done();
            });
            component.ngOnInit();
        });
    });

    describe("ngOnInit", () => {
        it("should check if user has Permission To Account from store", () => {
            const spyStore = jest.spyOn(store, "selectSnapshot").mockReturnValue(true);
            const hasPermission = store.selectSnapshot(AccountInfoState.getPermissionToAccount);
            component.ngOnInit();
            expect(spyStore).toBeCalled();
            expect(hasPermission).toBe(true);
            expect(component.isSpinnerLoading).toBe(true);
        });

        it("should throw error if user does not Have Permission To Account", () => {
            component.ngOnInit();
            expect(component.isSpinnerLoading).toBe(false);
            expect(component.errorMessage).toBe("primary.portal.census.manualEntry.sorryPermissionDenied");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscriptions = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });
});
