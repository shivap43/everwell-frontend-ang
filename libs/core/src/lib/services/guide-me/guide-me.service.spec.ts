import { Renderer2 } from "@angular/core";
import { GuideMeService } from "./guide-me.service";

describe("guideMeService", () => {
    let guideMeService: GuideMeService;
    let renderer: Renderer2;

    beforeEach(() => {
        guideMeService = new GuideMeService();
        renderer = {
            createElement: (name: string) => ({ name }),
            appendChild: (parent: any, newChild: any) => {},
        } as Renderer2;
    });

    describe("embedGuideMePlayer()", () => {
        it("should exit early if no token", () => {
            const spy = jest.spyOn(renderer, "createElement");
            const spy2 = jest.spyOn(renderer, "appendChild");
            guideMeService.embedGuideMePlayer("", renderer);
            expect(window.myGuideOrgKey).toBeUndefined();
            expect(spy).not.toBeCalled();
            expect(spy2).not.toBeCalled();
        });

        it("should initialize window.guideMe", () => {
            expect(window.guideMe).toBeUndefined();
            guideMeService.embedGuideMePlayer("mockToken", renderer);
            expect(window.guideMe).toStrictEqual({
                baseUrl: "//cdn.guideme.io/guideme-player/ent/",
            });
        });

        it("should embed guideMe script if token", () => {
            const spy = jest.spyOn(renderer, "createElement");
            const spy2 = jest.spyOn(renderer, "appendChild");
            guideMeService.embedGuideMePlayer("mockToken", renderer);
            expect(window.myGuideOrgKey).toBe("mockToken");
            expect(spy).toBeCalledWith("script");
            expect(spy2).toBeCalledWith(document.body, {
                name: "script",
                src: "//cdn.guideme.io/guideme-player/ent/guideme.js",
                type: "text/javascript",
            });
        });
    });
});
