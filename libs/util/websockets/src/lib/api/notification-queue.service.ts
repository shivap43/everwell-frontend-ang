import { Injectable } from "@angular/core";
import { RxStomp } from "@stomp/rx-stomp";
import { filter, map, startWith, switchMap, tap } from "rxjs/operators";
import { WebsocketService } from "../websocket.service";
import { Observable, of } from "rxjs";
import { AbstractNotificationModel } from "@empowered/constants";

const NOTIFICATION_WS_URL = "/api/ws";

export interface WSAccountListNotifications {
    [key: number]: AbstractNotificationModel[];
}

@Injectable({
    providedIn: "root",
})
export class NotificationQueueService {
    constructor(private websocketService: WebsocketService) {}

    stompClient: RxStomp = null;

    /**
     * Returns the correct instance of stomp client
     * @returns Instance of RxStomp
     */
    private getStompClient(): Observable<RxStomp> {
        return of(this.stompClient).pipe(
            switchMap((client) => {
                if (client === null) {
                    return of(this.websocketService.generateStompClient(NOTIFICATION_WS_URL)).pipe(
                        tap((stompClient: RxStomp) => {
                            this.stompClient = stompClient;
                        }),
                    );
                } else if (!client.active) {
                    this.stompClient.activate();
                    return of(this.stompClient);
                } else {
                    return of(this.stompClient);
                }
            }),
        );
    }

    /**
     *
     * @param adminId admin Id for receiving data specific to the producer
     * @returns Observable of the response sent from the backend
     */
    getNotifications(adminId: number, body: string): Observable<WSAccountListNotifications> {
        return this.getStompClient().pipe(
            tap(() => {
                this.publish(`/app/admin/${adminId}`, body);
            }),
            switchMap((client) => client.watch(`/topic/admin/${adminId}`)),
            filter((res) => !!res),
            map((res) => JSON.parse(res.body)),
        );
    }

    /**
     * Publish message to get the latest notification for the account-list
     * @param adminId - producer/admin ID
     * @param body - message content of the WebsSocket message
     */
    getLatestAccountListNotifications(adminId: number, body: string): void {
        this.publish(`/app/admin/${adminId}`, body);
    }

    /**
     *
     * Function to fetch group level notifications
     * @param groupId group Id for receiving data specific to the producer account
     * @param producerId admin Id for receiving data specific to the producer
     * @returns Observable of the response sent from the backend
     */
    getGroupNotifications(producerId: number, groupId: number): Observable<any> {
        return this.getStompClient().pipe(
            tap(() => {
                this.publish(`/app/groupNotification/${groupId}/${producerId}`, "");
            }),
            switchMap((client) => client.watch(`/topic/groupNotification/${groupId}/${producerId}`)),
            filter((res) => !!res),
            map((res) => JSON.parse(res.body)),
        );
    }

    /**
     *
     * @param groupId group Id for receiving data specific to the producer
     * @param adminId admin Id for receiving data specific to the producer
     * @returns Observable of the response sent from the backend
     */
    getMemberListNotifications(adminId: number, groupId: number): Observable<any> {
        return this.getStompClient().pipe(
            tap(() => {
                this.publish(`/app/memberList/${groupId}/${adminId}`, "");
            }),
            switchMap((client) => client.watch(`/topic/memberList/${groupId}/${adminId}`)),
            map((res) => this.isJsonParsable(res.body)),
        );
    }

    /**
     * @param groupId group Id for receiving data specific to the producer
     * @param subscriberId member Id for receiving data specific to the member
     * @returns Observable of the response sent from the backend
     */
    getMemberNotifications(groupId: number, subscriberId: number): Observable<any> {
        return this.getStompClient().pipe(
            tap(() => {
                this.publish(`/app/memberNotification/${groupId}/${subscriberId}`, "");
            }),
            switchMap((client) => client.watch(`/topic/memberNotification/${groupId}/${subscriberId}`)),
            filter((res) => !!res),
            map((res) => JSON.parse(res.body)),
        );
    }

    /**
     * @param producerId admin Id for receiving data specific to the producer
     * @returns Observable of the response sent from the backend
     */
    getProducerNotifications(producerId: number): Observable<any> {
        return this.getStompClient().pipe(
            tap(() => {
                this.publish(`/app/notifications/${producerId}`, "");
            }),
            switchMap((client) => client.watch(`/topic/notifications/${producerId}`)),
            filter((res) => !!res),
            map((res) => JSON.parse(res.body)),
        );
    }

    /**
     *
     */
    publish(destination: string, body: any): void {
        if (this.stompClient === null) {
            return;
        }
        this.stompClient.publish({ destination, body });
    }

    /**
     * Method to deactivate stomp client
     */
    deactivate(): void {
        if (this.stompClient === null) {
            return;
        }
        this.stompClient.deactivate();
    }

    /**
     * Method to check if stomp is connected
     */
    isWebSocketConnected(): boolean {
        if (this.stompClient === null) {
            return false;
        }
        return this.stompClient.connected();
    }

    private isJsonParsable(data: string): unknown {
        try {
            const res = JSON.parse(data);
            return res;
        } catch (e) {
            return {};
        }
    }
}
