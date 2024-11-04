import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { LanguageService } from "@empowered/language";
import { mockLanguageService, mockRouter, mockTpiService } from "@empowered/testing";
import { NgxsModule } from "@ngxs/store";
import { CommisionSplitComponent } from "./commision-split.component";
import { TpiServices } from "@empowered/common-services";

describe("CommisionSplitComponent", () => {
    let component: CommisionSplitComponent;
    let fixture: ComponentFixture<CommisionSplitComponent>;
    let languageService: LanguageService;
    let router: Router;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [CommisionSplitComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: Router,
                    useValue: mockRouter,
                },
                { provide: TpiServices, useValue: mockTpiService },
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
            imports: [NgxsModule.forRoot(), HttpClientTestingModule, ReactiveFormsModule],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(CommisionSplitComponent);
        component = fixture.componentInstance;
        languageService = TestBed.inject(LanguageService);
        router = TestBed.inject(Router);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    describe("onExit()", () => {
        it("should navigate to tpi home page", () => {
            const spy = jest.spyOn(router, "navigate");
            component.onExit();
            expect(spy).toBeCalledWith(["tpi/exit"]);
        });
    });

    describe("showErrorAlertMessage()", () => {
        it("should set error message when api response is 400", () => {
            const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValue");
            const err = {
                error: { status: 400, code: "badParameter", details: [{ field: "missingId" }] },
            } as unknown as Error;
            component.showErrorAlertMessage(err);
            expect(spy).toBeCalled();
            expect(component.errorMessage).toBe("secondary.portal.commission.api.400.badParameter.missingId");
        });

        it("should set error message when api error response is 409", () => {
            const spy = jest.spyOn(languageService, "fetchSecondaryLanguageValue");
            const err = {
                error: { status: 409, code: "duplicate", details: [{ field: "existingData" }] },
            } as unknown as Error;
            component.showErrorAlertMessage(err);
            expect(spy).toBeCalled();
            expect(component.errorMessage).toBe("secondary.portal.commission.api.409.duplicate");
        });
    });

    describe("ngOnDestroy()", () => {
        it("should cleanup subscriptions", () => {
            const next = jest.spyOn(component["unsubscribe$"], "next");
            const complete = jest.spyOn(component["unsubscribe$"], "complete");
            component.ngOnDestroy();
            expect(next).toBeCalledTimes(1);
            expect(complete).toBeCalledTimes(1);
        });
    });
});
