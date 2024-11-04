import { Injectable } from "@angular/core";
import { RxStomp, RxStompConfig } from "@stomp/rx-stomp";

@Injectable({
    providedIn: "root",
})
export class WebsocketService {
    constructor() {}

    /**
     * It will generate the client and return to the respective queue service
     * @param brokerEndpoint - Broker URL after domain name, example:- ""
     * @param clientConfigs - specific config required to pass to the client
     * @returns Stomp Client
     * @example generateStompClient("api/ws", {connectHeaders: { sample: "header"}})
     */
    generateStompClient(brokerEndpoint: string, clientConfigs?: RxStompConfig): RxStomp {
        const stompClient = new RxStomp();
        clientConfigs = {
            ...clientConfigs,
            brokerURL: this.setBrokerURL(brokerEndpoint),
        };
        stompClient.configure(clientConfigs);
        stompClient.activate();
        return stompClient;
    }

    /**
     * Returns the broker URL for the WS connection
     * @param brokerEndpoint - endpoint after our domain
     * @returns full URL for the websocket connection
     */
    private setBrokerURL(brokerEndpoint: string): string {
        return window.location.origin.replace("https", "wss") + brokerEndpoint;
    }
}
