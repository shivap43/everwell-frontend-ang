import { Injectable } from "@angular/core";

@Injectable({
    providedIn: "root",
})
export class LoadExternalJsService {
    constructor() {}
    /**
     * This function is used to load the external javascript from url
     * @param mashupUrl is of type string consist if external url of javascript file
     */
    loadScript(mashupUrl: string): void {
        // isFound is used to checked whether script tag found or not
        let isFound = false;
        const scripts = document.getElementsByTagName("script");
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < scripts.length; ++i) {
            if (scripts[i].getAttribute("src") != null && scripts[i].getAttribute("src").includes("loader")) {
                isFound = true;
            }
        }

        if (!isFound) {
            const node = document.createElement("script");
            node.src = mashupUrl;
            node.type = "text/javascript";
            node.async = false;
            document.getElementsByTagName("head")[0].appendChild(node);
        }
    }
}
