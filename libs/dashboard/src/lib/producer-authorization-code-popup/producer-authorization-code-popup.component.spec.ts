import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { UserService } from "@empowered/user";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { ProducerAuthorizationCodePopupComponent } from "./producer-authorization-code-popup.component";

const SAMPLE_PRODUCER_CHECKOUT_DATA = { id: 1, checkedOutDate: "sample_checkout_date" };

const mockDialogData = {
    producerCheckoutData: [SAMPLE_PRODUCER_CHECKOUT_DATA],
};
const mockMatDialogRef = { close: () => {} };

const mockUserService = {
    credential$: of({
        producerId: null,
    }),
} as UserService;

describe("ProducerAuthorizationCodePopupComponent", () => {
    let component: ProducerAuthorizationCodePopupComponent;
    let fixture: ComponentFixture<ProducerAuthorizationCodePopupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ProducerAuthorizationCodePopupComponent],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            providers: [
                { provide: MAT_DIALOG_DATA, useValue: mockDialogData },
                { provide: MatDialogRef, useValue: mockMatDialogRef },
                { provide: UserService, useValue: mockUserService },
            ],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ProducerAuthorizationCodePopupComponent);
        component = fixture.componentInstance;
    });

    describe("ProducerAuthorizationCodePopupComponent", () => {
        it("should create", () => {
            expect(component).toBeTruthy();
        });

        describe("close()", () => {
            it("Should close the dialog", () => {
                const closeSpy = jest.spyOn(component["matDialogref"], "close");
                component.close();
                expect(closeSpy).toHaveBeenCalledTimes(1);
            });
        });

        describe("setProducerInfo()", () => {
            it("should populate producerInfo", () => {
                component.setProducerInfo();
                expect(component.producerInfo).toEqual({ producerId: null });
            });
        });

        describe("setProducersToDisplay()", () => {
            it("should populate producersToDisplay if producer has checkedOutDate property", () => {
                component.setProducersToDisplay();
                expect(component.producersToDisplay).toEqual([SAMPLE_PRODUCER_CHECKOUT_DATA]);
            });

            it("should close the dialog if producer doesn't have checkedOutDate property", () => {
                const closeMethodSpy = jest.spyOn(component, "close");
                component["data"].producerCheckoutData = [{ id: 2 }];
                component.setProducersToDisplay();
                expect(closeMethodSpy).toHaveBeenCalledTimes(1);
            });
        });
    });
});
