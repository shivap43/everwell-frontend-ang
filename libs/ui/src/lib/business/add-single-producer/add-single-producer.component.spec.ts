import { CUSTOM_ELEMENTS_SCHEMA, Directive, Input } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NgxsModule } from "@ngxs/store";
import { RouterTestingModule } from "@angular/router/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ActivatedRoute, Router } from "@angular/router";
import { of } from "rxjs";
import { LanguageService } from "@empowered/language";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { DatePipe } from "@angular/common";
import { BenefitsOfferingService, ProducerService, SearchProducer, StaticService } from "@empowered/api";
import { AddSingleProducerComponent } from "./add-single-producer.component";
import { mockActivatedRoute, mockLanguageService, mockMatDialogRef, mockRouter } from "@empowered/testing";
import { Configurations } from "@empowered/constants";
import { MatTableModule } from "@angular/material/table";
import { StoreModule } from "@ngrx/store";

export const mockMatDialogData = {
    mpGroupId: 167891,
};

@Directive({
    // eslint-disable-next-line @angular-eslint/directive-selector
    selector: "[richTooltip]",
})
class MockRichTooltipDirective {
    @Input() richTooltip!: string;
}

describe("AddSingleProducerComponent", () => {
    let component: AddSingleProducerComponent;
    let fixture: ComponentFixture<AddSingleProducerComponent>;
    let producerService: ProducerService;
    let staticService: StaticService;
    let benefitOfferingService: BenefitsOfferingService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [AddSingleProducerComponent, MockRichTooltipDirective],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                RouterTestingModule,
                FormBuilder,
                DatePipe,
                ProducerService,
                BenefitsOfferingService,
                StaticService,
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockMatDialogData,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule, MatTableModule, StoreModule.forRoot({})],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(AddSingleProducerComponent);
        component = fixture.componentInstance;
        producerService = TestBed.inject(ProducerService);
        staticService = TestBed.inject(StaticService);
        benefitOfferingService = TestBed.inject(BenefitsOfferingService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("search()", () => {
        it("should invoke the search producer api and set prod count as zero", () => {
            const spy = jest.spyOn(producerService, "producerSearch").mockReturnValue(
                of({
                    content: [] as SearchProducer[],
                    totalElements: 0,
                }),
            );
            component.search(
                {
                    producerData: {
                        searchProd: null,
                    },
                },
                true,
            );
            expect(spy).toBeCalledTimes(1);
            expect(component.prodCount).toBe(0);
        });

        it("should not invoke search api as valid flag is false", () => {
            const spy = jest.spyOn(producerService, "producerSearch").mockReturnValue(of({}));
            component.search(
                {
                    producerData: {
                        searchProd: null,
                    },
                },
                false,
            );
            expect(spy).toBeCalledTimes(0);
        });
    });
    describe("getConfigurations()", () => {
        it("should set config count as four as per max display producer count", () => {
            component.mpGroupId = 412908;
            jest.spyOn(staticService, "getConfigurations").mockReturnValue(
                of([
                    {
                        name: "group.producers.carrier_and_license_display.max_producers",
                        value: "4",
                    } as Configurations,
                ]),
            );
            component.getConfigurations();
            expect(component.configCount).toBe(4);
        });
    });

    describe("getBenefitOfferingStates()", () => {
        it("should return the benefit offering state", () => {
            jest.spyOn(benefitOfferingService, "getBenefitOfferingSettings").mockReturnValue(
                of({
                    states: [
                        {
                            abbreviation: "NY",
                            name: "NewYork",
                        },
                    ],
                }),
            );
            component.getBenefitOfferingStates();
            expect(component.benefitOfferingStatesData[0].abbreviation).toBe("NY");
        });
    });
});
