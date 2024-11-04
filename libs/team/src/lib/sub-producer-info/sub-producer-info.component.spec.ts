import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService, ReplaceTagPipe } from "@empowered/language";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { SubProducerInfoComponent } from "./sub-producer-info.component";
import { MockReplaceTagPipe, mockDatePipe, mockLanguageService, mockMatDialogRef } from "@empowered/testing";
import { DatePipe } from "@angular/common";
import { Subscription } from "rxjs";
import { DateFormats } from "@empowered/constants";

const data = {
    producerInfo: {
        carrierAppointments: [
            {
                carrier: {
                    name: "name",
                },
                validity: {
                    effectiveStarting: "2023-01-01",
                    expiresAfter: "20123-02-02",
                },
            },
            {
                carrier: {
                    name: "name2",
                },
                validity: {
                    effectiveStarting: "2023-01-01",
                    expiresAfter: "20123-02-02",
                },
            },
        ],
    },
};

describe("SubProducerInfoComponent", () => {
    let component: SubProducerInfoComponent;
    let fixture: ComponentFixture<SubProducerInfoComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SubProducerInfoComponent, MockReplaceTagPipe],
            providers: [
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: data,
                },
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SubProducerInfoComponent);
        component = fixture.componentInstance;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("closePopup()", () => {
        it("should close the popup on click", () => {
            const spy1 = jest.spyOn(component["dialogRef"], "close");
            component.closePopup();
            expect(spy1).toHaveBeenCalled();
        });
    });

    describe("ngOnDestroy()", () => {
        it("Should unsubscribe from all subscriptions", () => {
            const subscriptionSpy = jest.spyOn(Subscription.prototype, "unsubscribe");
            component.subscription = [new Subscription()];
            component.ngOnDestroy();
            expect(subscriptionSpy).toHaveBeenCalled();
        });
    });

    describe("getLicenseData()", () => {
        it("Should get data related to license", () => {
            const event = {
                value: {
                    validity: {
                        effectiveStarting: "2023-01-01",
                        expiresAfter: "2023-12-12",
                    },
                },
            };
            component.getLicenseData(event);
            expect(component.effectiveDate).toEqual(
                mockDatePipe.transform(new Date(event.value.validity.effectiveStarting), DateFormats.MONTH_DAY_YEAR),
            );
            expect(component.expiration).toEqual(
                mockDatePipe.transform(new Date(event.value.validity.expiresAfter), DateFormats.MONTH_DAY_YEAR),
            );
        });
    });

    describe("removeDuplicateCarrierAppointments()", () => {
        it("should remove all the duplicate Carrier Appointments", () => {
            const appointments = [
                {
                    name: "name",
                    validity: {
                        effectiveStarting: "2023-01-01",
                        expiresAfter: "20123-02-02",
                    },
                },
                {
                    name: "name2",
                    validity: {
                        effectiveStarting: "2023-01-01",
                        expiresAfter: "20123-02-02",
                    },
                },
            ];
            component.removeDuplicateCarrierAppointments();
            expect(component.carrierAppointments).toEqual(appointments);
        });
    });
});
