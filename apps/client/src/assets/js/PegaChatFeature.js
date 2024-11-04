var PegaChatValue;
function displayChatButton(userPortalType) {
    PegaChatValue = userPortalType;
    getUserEmail();
    var isElementAvailable = document.getElementById("launcherminimized");
    if (isElementAvailable && userPortalType === "public") {
        setStyleForChatButton();
    }
    // Close 'Chat with us' widget when user logged out.
    const chatWidget = window.PegaUnifiedChatWidget;
    if (
        Boolean(chatWidget) &&
        typeof chatWidget.endChat === "function" &&
        (window.location.href.indexOf("login") > -1 ||
            userPortalType === "public")
    ) {
        chatWidget.endChat();
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const currentUrl = window.location.origin;
    let src = "";
    let id = "";
    if (currentUrl.includes("everwellbenefits")) {
        //NON-PRD URL like www.<env>.everwellbenefits.com
        //PROD URL like www.everwellbenefits.com
        if (currentUrl.includes(".dev.")) {
            id = "pega-wm-chat";
            src =
                "https://widget.use1.chat.pega.digital/b9928244-6c80-4277-88f6-b88e4717a21c/widget.js";
        } else if (currentUrl.includes(".intg.")) {
            id = "pega-wm-chat";
            src =
                "https://widget.use1.chat.pega.digital/3e238bf9-4e5b-424a-ad58-c75ff057bea5/widget.js";
        } else if (
            currentUrl.includes(".syst.") ||
            currentUrl.includes(".staging.")
        ) {
            id = "pega-wm-chat";
            src =
                "https://widget.use1.chat.pega.digital/0b4cc431-088a-4be2-845a-cc28fcd3a837/widget.js";
        } else if (currentUrl.includes(".uat.")) {
            // Update this once gets the value for UAT
            id = "";
            src = "";
        } else if (currentUrl.includes(".trn.")) {
            // Update this once gets the value for TRN
            id = "";
            src = "";
        } else {
            // This is for prod
            id = "pega-wm-chat";
            src =
                "https://widget.use1.chat.pega.digital/7b23aed4-4063-46d0-a5aa-e51a50695a3b/widget.js";
        }
    } else {
        // using it for local host remove if not needed
        id = "pega-wm-chat";
        src =
            "https://widget.use1.chat.pega.digital/3e238bf9-4e5b-424a-ad58-c75ff057bea5/widget.js";
    }
    var csBot = document.createElement("script");
    csBot.id = id;
    csBot.async = true;
    csBot.src = src;
    document.head.appendChild(csBot);
});

document.addEventListener("DOMContentLoaded", function () {
    var intervalId = setInterval(function () {
        if (window.PegaUnifiedChatWidget) {
            if (typeof PegaUnifiedChatWidget.toggleWidget === "function") {
                var isElementAvailable =
                    document.getElementById("launcherminimized");
                if (!isElementAvailable) {
                    setStyleForChatButton();
                }
                clearInterval(intervalId);
                document
                    .getElementById("launcherminimized")
                    .addEventListener("click", () => {
                        PegaUnifiedChatWidget.toggleWidget();
                    });
            }
        }
    }, 300);
});

document.addEventListener("DOMContentLoaded", function () {
    var isScriptAvailable = document.getElementById("PegaChatTags");
    // Runs when there is no script with id = PegaChatTags available
    if (!isScriptAvailable || window.location.href.indexOf("login") > -1) {
        // Create a new script element
        var script = document.createElement("script");
        script.type = "text/javascript";
        script.textContent = `
                var PegaChatTags = {
                    "UserInfo": "Not available"
                };
            `;
        script.id = "PegaChatTags";
        // Append the script element to the head of the document
        document.head.appendChild(script);
    }
});

// get specific email variable.
function getUserEmail() {
    var userData = JSON.parse(sessionStorage.getItem("userInfo"));
    var username;
    if (userData && userData.username) {
        username = userData.username.toString();
    } else {
        username = undefined;
    }
    var isScriptAvailable = document.getElementById("PegaChatTags");
    // Runs when there is script with id = PegaChatTags available
    if (isScriptAvailable && window.location.href.indexOf("login") == -1) {
        // Remove the old script
        isScriptAvailable.parentNode.removeChild(isScriptAvailable);
        // Create a new script element
        var newScript = document.createElement("script");
        newScript.type = "text/javascript";
        if (window.location.href.indexOf("login") > -1) {
            newScript.textContent = `
                var PegaChatTags = {
                    "UserInfo": "Not available"
                };
            `;
        } else {
            newScript.textContent =
                `var PegaChatTags = {"UserInfo":"` + username + `"}`;
        }
        // Give the new script element the same ID
        newScript.id = "PegaChatTags";
        // Append the new script element to the head of the document
        document.head.appendChild(newScript);
    }
}
/*
 * Function to show 'chat with us' button after login and hide on login page.
 */
function setStyleForChatButton() {
    if (window.location.href.indexOf("login") > -1) {
        document.getElementById("launcherminimized").style.display = "none";
    } else {
        document.getElementById("launcherminimized").style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", function (event) {
    /* Load the cobrowse assets */
    window.fireflyAPI = {};
    var script = document.createElement("script");
    script.type = "text/javascript";
    fireflyAPI.token = "31efd552-7147-430f-b0e5-c66d59461fce";
    fireflyAPI.serverHostUrl = "https://us.cobrowse.pega.com";
    script.src = "https://us.cobrowse.pega.com/cobrowse/loadScripts";
    script.async = true;
    document.head.appendChild(script);
});
