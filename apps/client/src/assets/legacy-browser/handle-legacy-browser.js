// Check for IE
if (/MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
    // Redirect IE 11 to microsoft support page and opens Edge to go to application
    window.location = "microsoft-edge:" + window.location;

    // To support using microsoft-edge handler, we need to allow the browser to attempt to navigate first.
    // Then after browser has successfully launched 'microsoft-edge:<location>',
    // Navigate the current browser (IE 11) to a microsoft support page
    setTimeout(function () {
        window.location =
            "https://support.microsoft.com/en-us/topic/we-recommend-viewing-this-website-in-microsoft-edge-160fa918-d581-4932-9e4e-1075c4713595?ui=en-us&rs=en-us&ad=us";
    }, 0);
} else {
    // sources:
    // https://developer.mozilla.org/en-US/docs/Web/API/Location/replace
    // https://developer.mozilla.org/en-US/docs/Web/API/Location/origin
    // The current page will not be saved in session History,
    // meaning the user won't be able to use the back button to navigate to it.

    // If we detect some other kind of browser that's not IE 11, navigate to a no legacy browser support page
    window.location.replace(window.location.origin + "/assets/legacy-browser");
}
