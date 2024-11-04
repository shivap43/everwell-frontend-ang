/* eslint-disable no-underscore-dangle */
import { OverlayContainer } from "@angular/cdk/overlay";

export class CustomOverlay extends OverlayContainer {
    _createContainer(): void {
        const container = document.createElement("div");
        container.classList.add("app-overlay");

        document.querySelector(".app-overlay-container").appendChild(container);
        this._containerElement = container;
    }
}
