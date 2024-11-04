import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { NotificationQueueService } from "./notification-queue.service";
import { WebsocketService } from "../websocket.service";
import { of } from "rxjs";

describe("NotificationQueueService", () => {
    let service: NotificationQueueService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [NotificationQueueService, WebsocketService],
            imports: [RouterTestingModule],
        });

        service = TestBed.inject(NotificationQueueService);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("NotificationQueueService", () => {
        it("should create service", () => {
            expect(service).toBeTruthy();
        });
    });

    describe("getStompClient()", () => {
        it("should check brokerURL when stompClient is null", (done) => {
            expect.assertions(1);
            service["getStompClient"]().subscribe((data) => {
                expect(service.stompClient.stompClient.brokerURL).toBe("http://localhost/api/ws");
                done();
            });
        });

        it("should deactivate stomp client", (done) => {
            service["getStompClient"]().subscribe((data) => {
                service.stompClient.deactivate();
                expect(service.stompClient.active).toBe(false);
                done();
            });
        });

        it("should activate stomp client", (done) => {
            service["getStompClient"]().subscribe((stomp) => {
                service.stompClient.activate();
                expect(service.stompClient.active).toBe(true);
                done();
            });
        });

        it("should verify stompClient value is correct", (done) => {
            service["getStompClient"]().subscribe((stomp) => {
                expect(stomp).toBe(service.stompClient);
                done();
            });
        });
    });

    describe("getGroupNotifications()", () => {
        it("should check /topic/groupNotification/${groupId}/${producerId} output", (done) => {
            const producerId = 456;
            const groupId = 789;
            expect.assertions(1);
            jest.spyOn(service, "getGroupNotifications").mockReturnValueOnce(
                of({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                }),
            );
            service.getGroupNotifications(producerId, groupId).subscribe((data) => {
                expect(data).toStrictEqual({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                });
                done();
            });
        });
    });

    describe("getMemberListNotifications()", () => {
        it("should check /topic/memberList/${adminId}/${groupId} output", (done) => {
            const adminId = 123;
            const groupId = 456;
            expect.assertions(1);
            jest.spyOn(service, "getMemberListNotifications").mockReturnValueOnce(
                of({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                }),
            );
            service.getMemberListNotifications(adminId, groupId).subscribe((data) => {
                expect(data).toStrictEqual({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                });
                done();
            });
        });
    });

    describe("getMemberNotifications()", () => {
        it("should check /topic/memberNotification/${groupId}/${subscriberId} output", (done) => {
            const groupId = 456;
            const subscriberId = 789;
            expect.assertions(1);
            jest.spyOn(service, "getMemberNotifications").mockReturnValueOnce(
                of({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                }),
            );
            service.getMemberNotifications(groupId, subscriberId).subscribe((data) => {
                expect(data).toStrictEqual({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                });
                done();
            });
        });
    });

    describe("getProducerNotifications()", () => {
        it("should check /topic/memberNotification/${subscriberId} output", (done) => {
            const producerId = 789;
            expect.assertions(1);
            jest.spyOn(service, "getProducerNotifications").mockReturnValueOnce(
                of({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                }),
            );
            service.getProducerNotifications(producerId).subscribe((data) => {
                expect(data).toStrictEqual({
                    "92675": [
                        {
                            directAccount: false,
                            type: "MULTIPLE",
                            category: "CTA",
                            displayText: "Accounts with applications ready to send",
                            dismissable: false,
                            link: "",
                            linkText: "",
                            code: { id: 5, code: "ENROLLMENTS_PENDING_TRANSMITTAL", displayText: "Applications to send" },
                            count: 4,
                            groupId: 92675,
                        },
                    ],
                });
                done();
            });
        });
    });

    describe("publish()", () => {
        it("should publish stomp client", (done) => {
            const publishStomp = jest.spyOn(service, "publish");
            service["getStompClient"]().subscribe((stomp) => {
                service.publish("/test/testing", { testKey: "testVal" });
                expect(publishStomp).toBeCalled();
                done();
            });
        });
    });

    describe("deactivate()", () => {
        it("should deactivate stomp client", (done) => {
            const deactivaateStomp = jest.spyOn(service, "deactivate");
            service["getStompClient"]().subscribe((stomp) => {
                service.deactivate();
                expect(deactivaateStomp).toBeCalled();
                done();
            });
        });
    });
});
