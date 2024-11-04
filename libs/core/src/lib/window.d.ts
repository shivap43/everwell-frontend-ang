export {};

declare global {
    interface Window {
        /**
         * You need myGuideOrgKey to enable auto login for your users.
         *
         * You can statically set myGuideOrgKey in your embed code once (as shown in the example above).
         *
         * You can dynamically set the window.myGuideOrgKey variable on page load.
         * In this case, you will only need the first embed code and MyGuide code will automatically read 'myGuideOrgKey' from the 'window'
         * variable. This option secures the org key and secret key.
         */
        myGuideOrgKey?: string;
        /**
         * guideMe object has baseUrl which is the base url for the guideme.js
         * This is used to inject a script tag at runtime.
         */
        guideMe: { baseUrl?: string };
    }
}
