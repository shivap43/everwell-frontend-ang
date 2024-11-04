import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ConversionComponent } from "./conversion.component";
import { NgxsModule, Store } from "@ngxs/store";
import { FormBuilder, Validators } from "@angular/forms";
import { LanguageService } from "@empowered/language";
import {
    mockAflacService,
    mockAppFlowService,
    mockLanguageService,
    mockMemberService,
    mockShoppingCartDisplayService,
    mockStaticUtilService,
    mockUtilService,
} from "@empowered/testing";
import { AflacService, Configuration, EnrollmentService, MemberService, ShoppingCartDisplayService } from "@empowered/api";
import { AppFlowService, EnrollmentState, SharedState, StaticUtilService, UtilService } from "@empowered/ngxs-store";
import { DatePipe } from "@angular/common";
import { DateService } from "@empowered/date";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ConstraintValue, EnrollmentMethod, Enrollments, MemberQualifyingEvent, StepData, StepType } from "@empowered/constants";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";

export const mockEnrollmentService = {
    getEnrollments: (memberId: number, mpGroup: number) => of([{ memberCost: 1 } as Enrollments]),
};

describe("ConversionComponent", () => {
    let component: ConversionComponent;
    let fixture: ComponentFixture<ConversionComponent>;
    let store: Store;
    let enrollmentService: EnrollmentService;
    let staticUtilService: StaticUtilService;
    let memberService: MemberService;
    let aflacService: AflacService;
    let fb: FormBuilder;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HttpClientTestingModule, NgxsModule.forRoot([SharedState, EnrollmentState]), RouterTestingModule],
            declarations: [ConversionComponent],
            providers: [
                FormBuilder,
                Store,
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: MemberService,
                    useValue: mockMemberService,
                },
                {
                    provide: AflacService,
                    useValue: mockAflacService,
                },
                {
                    provide: AppFlowService,
                    useValue: mockAppFlowService,
                },
                {
                    provide: ShoppingCartDisplayService,
                    useValue: mockShoppingCartDisplayService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                DatePipe,
                DateService,
                Configuration,
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },

                {
                    provide: EnrollmentService,
                    useValue: mockEnrollmentService,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        store = TestBed.inject(Store);
        store.reset({
            ...store.snapshot(),
            enrollment: {
                mpGroup: 12345,
                memberId: 1,
                enrollmentState: "GA",
                enrollmentMethod: EnrollmentMethod.FACE_TO_FACE,
                isOpenEnrollment: true,
                isQLEPeriod: false,
                memberData: {
                    info: {
                        birthDate: "10/10/1987",
                    },
                },
                appResponseItems: [],
                constraints: [{ flowId: 1, constraint: {} as ConstraintValue, cartId: 12 }],
                payments: [],
                aflacAlways: [],
            },
            core: {
                regex: { EMAIL: "SAMPLE_REGEX" },
            },
        });
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(ConversionComponent);
        component = fixture.componentInstance;
        enrollmentService = TestBed.inject(EnrollmentService);
        staticUtilService = TestBed.inject(StaticUtilService);
        memberService = TestBed.inject(MemberService);
        aflacService = TestBed.inject(AflacService);
        fb = TestBed.inject(FormBuilder);
        component.planObject = {
            application: {
                appData: { planId: 1, id: 1 },
                carrierId: 65,
                cartData: {},
            },
            steps: [{ id: 1 }],
        } as StepData;
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should call onInit on ngOnInit", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled").mockReturnValue(of(true));
            const spy2 = jest.spyOn(memberService, "getMemberQualifyingEvents").mockReturnValue(of([{ id: 1 }] as MemberQualifyingEvent[]));
            const spy = jest.spyOn(enrollmentService, "getEnrollments").mockReturnValue(of([{ id: 1, planId: 11 }] as Enrollments[]));
            component.ngOnInit();
            expect(spy).toBeCalledTimes(1);
            expect(component.enrollments).toEqual([{ id: 1, planId: 11 }]);
            expect(component.currentQualifyingEvents).toEqual([{ id: 1 }]);
        });
    });

    describe("validatePolicy()", () => {
        it("should call policyLookup on validatePolicy when import is required and type is conversion", () => {
            component.importRequired = true;
            component.stepData = {
                type: StepType.CONVERSION,
            };
            component.form = fb.group({
                policy: ["123456S", Validators.required],
            });
            const spy = jest.spyOn(aflacService, "policyLookup");
            component.validatePolicy();
            expect(spy).toBeCalledTimes(1);
        });

        it("should call saveApplicationResp on validatePolicy when step type is downgrade", () => {
            component.stepData = {
                type: StepType.DOWNGRADE,
            };
            component.form = fb.group({
                policy: ["123456S", Validators.required],
            });
            component.radioValue = "true";
            component.stepId = 1;
            const spy = jest.spyOn(component, "saveApplicationResp");
            spy.mockReturnValue();
            component.validatePolicy();
            expect(spy).toBeCalled();
        });

        it("should not call saveApplicationResp on validatePolicy when step type is downgrade", () => {
            component.stepData = {
                type: StepType.CONVERSION,
            };
            component.form = fb.group({
                policy: ["123456S", Validators.required],
            });
            component.radioValue = "true";
            component.stepId = 1;
            const spy = jest.spyOn(component, "saveApplicationResp");
            spy.mockReturnValue();
            component.validatePolicy();
            expect(spy).toBeCalledTimes(0);
        });
    });
});
