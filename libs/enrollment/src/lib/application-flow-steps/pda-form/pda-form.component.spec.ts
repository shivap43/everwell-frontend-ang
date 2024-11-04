import { DatePipe } from "@angular/common";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatTableModule } from "@angular/material/table";
import { RouterTestingModule } from "@angular/router/testing";
import { AccountService, PdaForm } from "@empowered/api";
import { AccountProducer, PayFrequency, ProducerDetails } from "@empowered/constants";
import { mockDatePipe } from "@empowered/testing";
import { MaterialModule, PhoneFormatConverterPipe } from "@empowered/ui";
import { NgxsModule } from "@ngxs/store";
import { of } from "rxjs";
import { PdaFormComponent } from "./pda-form.component";
import { provideMockStore } from "@ngrx/store/testing";

describe("PdaFormComponent", () => {
    let component: PdaFormComponent;
    let fixture: ComponentFixture<PdaFormComponent>;
    let accountService: AccountService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PdaFormComponent, PhoneFormatConverterPipe],
            imports: [
                HttpClientTestingModule,
                NgxsModule.forRoot([]),
                RouterTestingModule,
                MaterialModule,
                FormsModule,
                ReactiveFormsModule,
            ],
            providers: [
                FormBuilder,
                {
                    provide: DatePipe,
                    useValue: mockDatePipe,
                },
                provideMockStore({}),
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PdaFormComponent);
        component = fixture.componentInstance;
        accountService = TestBed.inject(AccountService);
        component.mpGroup = 12345;
        component.producerId = 12345;
    });

    describe("PdaFormComponent", () => {
        it("should create component", () => {
            expect(component).toBeTruthy();
        });
    });

    describe("getProducerDetails()", () => {
        it("should set the producer details such as telephone number", () => {
            const spy = jest.spyOn(accountService, "getAccountProducer").mockReturnValue(
                of({
                    producer: {
                        phoneNumber: "07441",
                    },
                } as AccountProducer),
            );
            component.getProducerDetails();
            expect(spy).toBeCalledWith("12345", 12345);
            expect(component.telephoneNumber).toStrictEqual("07441");
        });
    });
    describe("getPayFrequency()", () => {
        it("should set payroll mode as 'Yearly'", () => {
            const spy = jest.spyOn(accountService, "getPayFrequencies").mockReturnValue(
                of([
                    {
                        id: 999,
                        name: "Yearly",
                    },
                ] as PayFrequency[]),
            );
            component.pdaFormData = { payFrequencyId: 999 } as PdaForm;
            component.getPayFrequency();
            expect(spy).toBeCalledWith("12345");
            expect(component.payrollMode).toStrictEqual("Yearly");
        });
        it("should set payroll mode as undefined", () => {
            const spy = jest.spyOn(accountService, "getPayFrequencies").mockReturnValue(
                of([
                    {
                        id: 1,
                    },
                ] as PayFrequency[]),
            );
            component.pdaFormData = { payFrequencyId: 999 } as PdaForm;
            component.getPayFrequency();
            expect(spy).toBeCalledWith("12345");
            expect(component.payrollMode).toStrictEqual(undefined);
        });
    });
    describe("populateProducerDetail()", () => {
        it("should populate the producer details such as producer name", () => {
            component.populateProducerDetail({
                name: {
                    firstName: "No",
                    lastName: "Name",
                },
            } as ProducerDetails);
            expect(component.producerName).toStrictEqual("No Name");
        });
    });
});
