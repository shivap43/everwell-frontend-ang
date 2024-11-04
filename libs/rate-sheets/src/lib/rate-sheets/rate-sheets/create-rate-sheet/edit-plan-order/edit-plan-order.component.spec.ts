import { ComponentFixture, TestBed } from "@angular/core/testing";
import { EditPlanOrderComponent } from "./edit-plan-order.component";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { LanguageService } from "@empowered/language";
import { UtilService } from "@empowered/ngxs-store";
import { moveItemInArray, CdkDragDrop } from "@angular/cdk/drag-drop";
import { PlanOrderElement } from "@empowered/constants";
import { mockLanguageService, mockUtilService } from "@empowered/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

const mockMatDialogRef = {
    close: () => {},
} as MatDialogRef<EditPlanOrderComponent>;

const mockData = [
    {
        product: "product 1",
        plan: "plan a",
        riders: 1,
        planId: 1234,
        planSeriesId: 1,
    },
    {
        product: "product 2",
        plan: "plan b",
        riders: 0,
        planId: 5678,
        planSeriesId: 2,
    },
] as PlanOrderElement[];

const mockEvent = {
    previousIndex: 0,
    currentIndex: 1,
} as CdkDragDrop<string[]>;

describe("EditPlanOrderComponent", () => {
    let component: EditPlanOrderComponent;
    let fixture: ComponentFixture<EditPlanOrderComponent>;
    let matDialogRef: MatDialogRef<EditPlanOrderComponent>;
    let languageService: LanguageService;
    let utilService: UtilService;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [EditPlanOrderComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: UtilService,
                    useValue: mockUtilService,
                },
                {
                    provide: MatDialogRef,
                    useValue: mockMatDialogRef,
                },
                {
                    provide: MAT_DIALOG_DATA,
                    useValue: mockData,
                },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(EditPlanOrderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        matDialogRef = TestBed.inject(MatDialogRef);
        languageService = TestBed.inject(LanguageService);
        utilService = TestBed.inject(UtilService);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("ngOnInit()", () => {
        it("should initialize language strings", () => {
            const spy = jest.spyOn(component, "initializeLanguageStrings");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
        it("should copy planOrder array", () => {
            const spy = jest.spyOn(utilService, "copy");
            component.ngOnInit();
            expect(spy).toBeCalled();
        });
    });

    describe("initializeLanguageStrings", () => {
        it("should get language strings", () => {
            const spy = jest.spyOn(languageService, "fetchPrimaryLanguageValues");
            component.initializeLanguageStrings();
            expect(spy).toBeCalled();
        });
    });

    describe("onDrop", () => {
        it("should swap elements in array", () => {
            moveItemInArray(mockData, mockEvent.previousIndex, mockEvent.currentIndex);
            expect(mockData).toStrictEqual([
                {
                    product: "product 2",
                    plan: "plan b",
                    riders: 0,
                    planId: 5678,
                    planSeriesId: 2,
                },
                {
                    product: "product 1",
                    plan: "plan a",
                    riders: 1,
                    planId: 1234,
                    planSeriesId: 1,
                },
            ]);
        });
    });

    describe("savePlanOrder", () => {
        it("should close modal", () => {
            const spy = jest.spyOn(matDialogRef, "close");
            component.savePlanOrder();
            expect(spy).toBeCalled();
        });
    });
});
