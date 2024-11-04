import { TestBed } from "@angular/core/testing";
import { NgxsModule, Store } from "@ngxs/store";
import { of } from "rxjs";
import { NGXSExpandedCartHelperService } from "./ngxs-expanded-cart-helper.service";

const mockStore = {
    dispatch: () => of({}),
};

describe("ExpandedShoppingCartHelperService", () => {
    let service: NGXSExpandedCartHelperService;
    let ngxsStore: Store;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot()],
            providers: [{ provide: Store, useValue: mockStore }],
        });
        service = TestBed.inject(NGXSExpandedCartHelperService);
        ngxsStore = TestBed.inject(Store);
    });

    it("should be created", () => {
        expect(service).toBeTruthy();
    });

    describe("setQLEAndOpenEnrollment()", () => {
        it("should set open enrollment and isQLE store data", () => {
            const spy = jest.spyOn(ngxsStore, "dispatch");
            service.setQLEAndOpenEnrollment(1, 1);
            expect(spy).toBeCalledTimes(2);
        });
    });
});
