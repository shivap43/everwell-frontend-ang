import { InjectableRxStompConfig } from "@stomp/ng2-stompjs";

export const StompConfig: InjectableRxStompConfig = {
    // Which server?
    // dev jas001.mp.dev3.clt4.empoweredbenefits.com:8080/api,
    // test https://www.dev.everwellbenefits.com/api/;
    // ws://10.0.1.165:8085
    // For localhost please use below url
    // brokerURL: "ws://localhost/api/ws",
    brokerURL: "ws://localhost:15672/api/vhosts",

    // Headers
    // Typical keys: login, passcode, host
    connectHeaders: {
        login: "mpjava",
        passcode: "*******",
    },

    // How often to heartbeat?
    // Interval in milliseconds, set to 0 to disable
    heartbeatIncoming: 0, // Typical value 0 - disabled
    heartbeatOutgoing: 20000, // Typical value 20000 - every 20 seconds

    // Wait in milliseconds before attempting auto reconnect
    // Set to 0 to disable
    // Typical value 500 (500 milli seconds)
    reconnectDelay: 200,

    // Will log diagnostics on console
    // It can be quite verbose, not recommended in production
    // Skip this key to stop logging to console
};
