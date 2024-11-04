import { TestBed } from "@angular/core/testing";
import { AccountPermissionGuard } from "./account-permission.guard";
import { NgxsModule, Store } from "@ngxs/store";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { TpiServices } from "@empowered/common-services";
import { mockTpiService } from "@empowered/testing";
import { UserService } from "@empowered/user";
import { StaticUtilService } from "@empowered/ngxs-store";
import { NGRXStore } from "@empowered/ngrx-store/app.ngrx.facade";
import { AccountService } from "@empowered/api";
import { Router } from "@angular/router";
import { of } from "rxjs";

describe("AccountPermissionGuard", () => {
    let service: AccountPermissionGuard;
    let staticService = {hasPermission: jest.fn().mockReturnValue(of(true)), cacheConfigValue: jest.fn().mockReturnValue(of("1,2,3"))};
    let accountService = {getAccountProducers: jest.fn().mockReturnValue(of([{producer:{id:1}}]))};
    let userService = {credential$: jest.fn().mockReturnValue(of({producerId:1}))};
    let router = {navigate: jest.fn()};
    let store = {selectSnapshot: jest.fn(), dispatch: jest.fn()};
    let ngrxStore = {onAsyncValue: jest.fn(), dispatch: jest.fn()};

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot(), HttpClientTestingModule],
            providers: [{ provide: StaticUtilService, useValue: staticService },
                { provide: AccountService, useValue: accountService },
                { provide: UserService, useValue: userService },
                { provide: Router, useValue: router },
                { provide: Store, useValue: store },
                { provide: NGRXStore, useValue: ngrxStore },

            ],
        });
        service = TestBed.inject(AccountPermissionGuard);
        
    });

    describe("AccountPermissionGuard", () => {
        it("should be defined", () => {
            expect(service).toBeTruthy();
        });

    });
    describe("canActivate()", () => {
        it("should return false and stop traversing to the route if it's LnL mode", () => {

            service.canActivate({params:{mpGroupId:1}} as any,{url:'test'} as any);
            expect(ngrxStore.dispatch).toHaveBeenCalled();
            expect(ngrxStore.onAsyncValue).toHaveBeenCalled();
        });
    });
});
