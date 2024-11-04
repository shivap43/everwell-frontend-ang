import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { EnrollmentInfoPopupComponent } from "./enrollment-info-popup.component";
import { AuthenticationService, StaticService } from "@empowered/api";
import { CountryState } from "@empowered/constants";
import { of } from "rxjs";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef } from "@angular/material/dialog";
import { RouterTestingModule } from "@angular/router/testing";
import { AccountListState, SharedState } from "@empowered/ngxs-store";
import { MatMenuModule } from "@angular/material/menu";

const STATES: CountryState[] = [
    { abbreviation: "GA", name: "Georgia" },
    { abbreviation: "NY", name: "New York" },
];

const mockAuthenticationService = {
    login: (
        portal: string,
        credential?: {
            username: string;
            password: string;
        },
        mpGroup?: string,
    ) => of({ user: { username: credential?.username } }),
} as AuthenticationService;

const mockDialogRef = {
    close: () => {},
} as MatDialogRef<EnrollmentInfoPopupComponent>;

const mockStaticService = {
    getConfigurations: (names: string, mpGroup?: number, partnerId?: string) =>
        of([{ name: "general.data.minimum_subscriber_age", value: "18", dataType: "string" }]),
    getStates: () => of(STATES),
} as StaticService;

describe("EnrollmentInfoPopupComponent", () => {
    let component: EnrollmentInfoPopupComponent;
    let fixture: ComponentFixture<EnrollmentInfoPopupComponent>;
    let store: Store;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EnrollmentInfoPopupComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                { provide: AuthenticationService, useValue: mockAuthenticationService },
                FormBuilder,
                { provide: MatDialogRef, useValue: mockDialogRef },
                { provide: StaticService, useValue: mockStaticService },
            ],
            imports: [
                NgxsModule.forRoot([SharedState, AccountListState]),
                HttpClientTestingModule,
                RouterTestingModule,
                ReactiveFormsModule,
                MatMenuModule,
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EnrollmentInfoPopupComponent);
        component = fixture.componentInstance;
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            core: {
                regex: {},
            },
            accounts: {
                selectedGroup: {},
            },
        });
    });

    describe("EnrollmentInfoPopupComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("getEmployeeState()", () => {
            it("should get employee state", () => {
                component.getEmployeeState();
                expect(component.employeeStates).toEqual(STATES);
            });
        });

        describe("closePopup()", () => {
            it("should close popup", () => {
                const closeSpy = jest.spyOn(component["EnrollmentInfoDialogRef"], "close");
                component.closePopup();
                expect(closeSpy).toHaveBeenCalledTimes(1);
            });
        });

        describe("getConfig()", () => {
            it("should get config", () => {
                component.getConfig();
                expect(component.minimumSubscriberAge).toEqual("18");
            });
        });

        describe("getErrorMessages()", () => {
            beforeEach(() => {
                component.ngOnInit();
                component.isFormSubmit = true;
            });
            it("should return required field error", () => {
                expect(component.getErrorMessages("city")).toEqual("primary.portal.common.requiredField");
            });
        });

        describe("onBack", () => {
            it("should hide enrollment info popup", () => {
                jest.spyOn(component.backClickEvent, "emit");
                component.onBack();
                expect(component.backClickEvent.emit).toBeCalledWith(false);
            });
        });

        describe("ngOnDestroy()", () => {
            it("should clean up subscriptions", () => {
                const spy1 = jest.spyOn(component["unsubscribe$"], "next");
                const spy2 = jest.spyOn(component["unsubscribe$"], "complete");
                fixture.destroy();
                expect(spy1).toHaveBeenCalled();
                expect(spy2).toHaveBeenCalled();
            });
        });
    });
});
