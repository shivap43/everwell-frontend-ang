import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NO_ERRORS_SCHEMA } from "@angular/core";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { SelfEnrollmentPopupComponent } from "./self-enrollment-popup.component";
import { LanguageService } from "@empowered/language";
import { UserService } from "@empowered/user";
import { AuthenticationService, ProducerService } from "@empowered/api";
import { Router } from "@angular/router";
import { FormControl, Validators } from "@angular/forms";
import {
    mockLanguageService,
    mockUserService,
    mockProducerService,
    mockMatDialog,
    mockAuthenticationService,
    mockStaticUtilService,
} from "@empowered/testing";
import { EmpoweredModalService } from "@empowered/common-services";
import { StaticUtilService } from "@empowered/ngxs-store";

describe("SelfEnrollmentPopupComponent", () => {
    let component: SelfEnrollmentPopupComponent;
    let fixture: ComponentFixture<SelfEnrollmentPopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SelfEnrollmentPopupComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: UserService,
                    useValue: mockUserService,
                },
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: ProducerService, useValue: mockProducerService },
                {
                    provide: EmpoweredModalService,
                    useValue: mockMatDialog,
                },
                {
                    provide: AuthenticationService,
                    useValue: mockAuthenticationService,
                },
                {
                    provide: Router,
                    useValue: {},
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SelfEnrollmentPopupComponent);
        component = fixture.componentInstance;
        component.productType = new FormControl(null, Validators.required);
        component.selectedLocation = new FormControl(null, Validators.required);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("chooseLocation()", () => {
        it("should set NY account number when NY location is selected", () => {
            component.nyAccountNumber = "111";
            component.chooseLocation("NY");
            expect(component.isUS).toBeFalsy();
            expect(component.selectedLocation.value).toBe("NY");
            expect(component.productType.value).toBe("111");
        });
        it("should set selected product type when US location is selected", () => {
            component.selectedProductType = "product";
            component.chooseLocation("US");
            expect(component.isUS).toBeTruthy();
            expect(component.selectedLocation.value).toBe("US");
            expect(component.productType.value).toBe("product");
        });
    });

    describe("chooseLifeProduct()", () => {
        it("should set product type  based on user selection", () => {
            component.chooseLifeProduct("product");
            expect(component.productType.value).toBe("product");
            expect(component.selectedProductType).toBe("product");
        });
    });

    describe("showErrorAlertMessage()", () => {
        it("should display bad parameter error when error status is 400", () => {
            const errorMessage = {
                error: {
                    status: 400,
                    code: "incorrect parameter",
                    details: ["missing info"],
                },
            } as unknown as Error;
            component.showErrorAlertMessage(errorMessage);
            expect(component.errorMessage).toBe(
                "secondary.portal.members.api.400.badParameter.emailAddresses.400.incorrect parameter.missing info",
            );
        });
        it("should display forbidden error when error status is 403", () => {
            const errorMessage = {
                error: {
                    status: 403,
                    code: "incorrect parameter",
                    details: ["incorrect email"],
                },
            } as unknown as Error;
            component.showErrorAlertMessage(errorMessage);
            expect(component.errorMessage).toBe("secondary.portal.selfEnrollment.emailSearch.api.403.incorrect parameter");
        });
        it("should display generic error when error status is not 400 or 403", () => {
            const errorMessage = {
                error: {
                    status: 500,
                    code: "generic",
                    details: ["error"],
                },
            } as unknown as Error;
            component.showErrorAlertMessage(errorMessage);
            expect(component.errorMessage).toBe("secondary.portal.500.generic");
        });
    });

    describe("continue()", () => {
        beforeEach(() => {
            component.productType = new FormControl(null, Validators.required);
            component.selectedLocation = new FormControl(null, Validators.required);
        });
        it("should decide whether user will land on personal info modal or sso page on click of continue button", () => {
            component.onlyNYStateLicensed = true;
            component.nyAccountNumber = "NY111";
            component.mappedAccountConfig = ["NY111", "US222"];
            const spy1 = jest.spyOn(component, "checkIfMemberAlreadyEnrolled");
            component.continue();
            expect(component.productType.value).toBe("NY111");
            expect(component.selectedLocation.value).toBe("NY");
            expect(spy1).toBeCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("should clean up subscriptions", () => {
            const spy = jest.spyOn(component["unsubscribe$"], "next");
            const spy2 = jest.spyOn(component["unsubscribe$"], "complete");

            fixture.destroy();

            expect(spy).toBeCalledTimes(1);
            expect(spy2).toBeCalledTimes(1);
        });
    });
});
