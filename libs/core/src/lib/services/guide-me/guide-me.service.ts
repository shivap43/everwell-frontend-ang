import { Injectable, Renderer2 } from "@angular/core";

@Injectable({ providedIn: "root" })
export class GuideMeService {
    /**
     * [myGuidePlayerSource](https://dev.myguide.org/docs/web/v1/how_to_embed_a_myguide_player_in_a_website/)
     * @param token token string
     * @param renderer renderer2
     */
    embedGuideMePlayer(token: string, renderer: Renderer2): void {
        if (!token) {
            return;
        }
        if (!window.guideMe) {
            window.guideMe = {};
        }
        window.guideMe.baseUrl = "//cdn.guideme.io/guideme-player/ent/";
        window.myGuideOrgKey = token;
        const script = renderer.createElement("script");
        script.type = "text/javascript";
        script.src = `${window.guideMe.baseUrl}guideme.js`;
        renderer.appendChild(document.body, script);
    }
}
