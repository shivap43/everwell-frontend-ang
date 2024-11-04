import { TestBed } from "@angular/core/testing";
import { LanguageModel } from "@empowered/api";
import { ReplaceTagPipe } from "./replace-tag.pipe";
import { NgxsModule, Store } from "@ngxs/store";

describe("ReplaceTagPipe", () => {
    let pipe: ReplaceTagPipe;
    let store: Store;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [NgxsModule.forRoot([])],
            providers: [ReplaceTagPipe],
        });

        pipe = TestBed.inject(ReplaceTagPipe);
        store = TestBed.inject(Store);
    });

    it("should create an instance", () => {
        expect(pipe).toBeTruthy();
    });

    describe("transform()", () => {
        let languageList: LanguageModel[];
        let secondaryLanguageList: LanguageModel[];
        let mapObj: Record<string, string>;
        let result: string;

        beforeEach(() => {
            languageList = [
                {
                    tagName: "primary.##key1##",
                    value: "Value for ##key1##",
                } as never,
            ];

            secondaryLanguageList = [
                {
                    tagName: "secondary.##key2##",
                    value: "Value for ##key2##",
                } as never,
            ];

            mapObj = {
                "##key1##": "primary",
                "##key2##": "secondary",
            };

            jest.spyOn(store, "selectSnapshot").mockReturnValue(languageList);
        });

        describe("When the value starts with primary", () => {
            beforeEach(() => {
                result = pipe.transform("primary.##key1##", mapObj);
            });

            it("should return the primary value", () => {
                expect(result).toEqual("Value for primary");
            });
        });

        describe("When the value starts with secondary", () => {
            beforeEach(() => {
                jest.spyOn(store, "selectSnapshot").mockReturnValue(secondaryLanguageList);
                result = pipe.transform("secondary.##key2##", mapObj);
            });

            it("should return the secondary value", () => {
                expect(result).toEqual("Value for secondary");
            });
        });

        describe("When the value does not start with primary or secondary", () => {
            beforeEach(() => {
                result = pipe.transform("test", mapObj);
            });

            it("should return the value", () => {
                expect(result).toEqual("test");
            });
        });

        describe("When the value is falsy", () => {
            beforeEach(() => {
                result = pipe.transform("", mapObj);
            });

            it("should return empty string", () => {
                expect(result).toEqual("");
            });
        });
    });
});
