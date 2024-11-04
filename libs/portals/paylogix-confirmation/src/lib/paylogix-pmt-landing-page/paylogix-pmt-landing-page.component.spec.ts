import { RouterTestingModule } from "@angular/router/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { StaticUtilService } from "@empowered/ngxs-store";
import { NgxsModule } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { FormBuilder } from "@angular/forms";
import { Configuration } from "@empowered/api";
import { PaylogixPmtLandingPageComponent } from "./paylogix-pmt-landing-page.component";
import { mockStaticUtilService, mockLanguageService } from "@empowered/testing";
import { ActivatedRoute, Params, UrlSegment } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { CsrfService } from "@empowered/util/csrf";
import { LanguageService } from "@empowered/language";

const mockCsrf = {
    load: () => of("123"),
};

const mockRouteParams = new BehaviorSubject<Params>({
    memberId: 1,
    groupId: 12345,
    guid: "guid12345",
    isSuccess: 0,
});
const mockActivatedRoute = {
    queryParams: mockRouteParams.asObservable(),
    snapshot: { url: [{ path: "test1" }, { path: "test2" }, { path: "test3" }] as UrlSegment[] },
} as ActivatedRoute;

describe("PaylogixPmtLandingPageComponent", () => {
    let component: PaylogixPmtLandingPageComponent;
    let fixture: ComponentFixture<PaylogixPmtLandingPageComponent>;
    let route: ActivatedRoute;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [PaylogixPmtLandingPageComponent],
            imports: [HttpClientTestingModule, NgxsModule.forRoot([]), RouterTestingModule],
            schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
            providers: [
                FormBuilder,
                Configuration,
                { provide: StaticUtilService, useValue: mockStaticUtilService },
                { provide: CsrfService, useValue: mockCsrf },
                {
                    provide: ActivatedRoute,
                    useValue: mockActivatedRoute,
                },
                { provide: LanguageService, useValue: mockLanguageService },
            ],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(PaylogixPmtLandingPageComponent);
        component = fixture.componentInstance;
        route = TestBed.inject(ActivatedRoute);
    });

    it("should create", () => {
        expect(component).toBeTruthy();
    });

    it("check success", (done) => {
        expect.assertions(1);
        component.isSuccess().subscribe((result) => {
            expect(result).toBe(0);
            done();
        });
    });

    it("check title message", (done) => {
        fixture.detectChanges();
        expect.assertions(1);
        component.titleMsg$.subscribe((result) => {
            expect(result).toBe("primary.portal.applicationFlow.ebs.confirmation.paymentError");
            done();
        });
    });

    it("check payment error message", (done) => {
        fixture.detectChanges();
        expect.assertions(1);
        component.paymentErrorMsg$.subscribe((result) => {
            expect(result).toBe("primary.portal.applicationFlow.ebs.confirmation.paymentNotSaved");
            done();
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
