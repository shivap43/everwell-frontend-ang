/* passing parameters dynamically - start */
// Set Pega params
function preparePegaAParams(gadgetName) {
    var pegaAParamObj = {};
    /* Custom04 getCookie lines removed below */
    pegaAParamObj.CustomerURL = window.location.href.replace(
        /(http|https):\/\//,
        ""
    );
    pegaAParamObj.Language = window.navigator.language;
    // new param for email
    pegaAParamObj.Email = getUserEmail();
    return pegaAParamObj;
}
/* Custom04 lines removed below */

/* Set cookies. To be overwritten locally */
/* TODO - Cookie logic revisit */

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000);
    var expires = "expires=" + d.toGMTString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ") {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
//static-content-hash-trigger-YUI

// Access local storage by var
function getStorage(key) {
    try {
        return (sessiondata = JSON.parse(sessionStorage.getItem(key)));
    } catch {
        console.log("error pulling session data");
        return null;
    }
}

// Set local storage vars
function setStorage(key, val) {
    try {
        sessionStorage.setItem(key, val);
    } catch {
        console.log("error setting session data");
    }
}

// get specific email variable.
function getUserEmail() {
    var userData = getStorage("userInfo");
    if (userData.hasOwnProperty("username")) {
        return userData.username;
    } else {
        console.log("No username defined in session storage");
        return null;
    }
}
