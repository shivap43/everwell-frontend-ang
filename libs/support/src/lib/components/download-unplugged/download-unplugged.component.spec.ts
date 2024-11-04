import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AppTakerService } from "@empowered/api";
import { SharedService } from "@empowered/common-services";
import { InstalledOS } from "@empowered/constants";
import { LanguageService } from "@empowered/language";
import { StaticUtilService } from "@empowered/ngxs-store";
import { mockLanguageService, mockSharedService, mockStaticUtilService } from "@empowered/testing";
import { of } from "rxjs";
import { DownloadUnpluggedComponent } from "./download-unplugged.component";

describe("DownloadUnpluggedComponent", () => {
    let component: DownloadUnpluggedComponent;
    let fixture: ComponentFixture<DownloadUnpluggedComponent>;
    let staticUtilService: StaticUtilService;
    let appTakerService: AppTakerService;
    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [DownloadUnpluggedComponent],
            providers: [
                {
                    provide: LanguageService,
                    useValue: mockLanguageService,
                },
                {
                    provide: StaticUtilService,
                    useValue: mockStaticUtilService,
                },
                {
                    provide: SharedService,
                    useValue: mockSharedService,
                },
                {
                    provide: AppTakerService,
                    useValue: { getUnpluggedDownloadURL: () => of({}) },
                },
                HttpClientTestingModule,
            ],
            schemas: [CUSTOM_ELEMENTS_SCHEMA],
        }).compileComponents();
    });
    beforeEach(() => {
        fixture = TestBed.createComponent(DownloadUnpluggedComponent);
        component = fixture.componentInstance;
        staticUtilService = TestBed.inject(StaticUtilService);
        appTakerService = TestBed.inject(AppTakerService);
    });
    it("should create", () => {
        expect(component).toBeTruthy();
    });
    describe("ngAfterViewInit()", () => {
        it("should call getConfigurationSpecifications function", () => {
            const spy1 = jest.spyOn(component, "getConfigurationSpecifications");
            component.ngAfterViewInit();
            expect(spy1).toBeCalledTimes(1);
        });
    });
    describe("getOperatingSystem()", () => {
        it("should set selectedIndex as 0 if appVersion is Windows", () => {
            component.showMacDownload = true;
            jest.spyOn(window.navigator, "appVersion", "get").mockReturnValue("Windows");
            component.getOperatingSystem();
            expect(component.selectedIndex).toBe(0);
        });
    });
    describe("getConfigurationSpecifications()", () => {
        it("should call  cacheConfigEnabled twice", () => {
            const spy1 = jest.spyOn(staticUtilService, "cacheConfigEnabled");
            component.getConfigurationSpecifications();
            expect(spy1).toBeCalledTimes(2);
        });
    });
    describe("downloadUnplugged()", () => {
        it("should call appTakerService.getUnpluggedDownloadURL", () => {
            const spy1 = jest.spyOn(appTakerService, "getUnpluggedDownloadURL");
            component.downloadUnplugged(InstalledOS.WINDOWS);
            expect(spy1).toBeCalledTimes(1);
        });
    });
});
