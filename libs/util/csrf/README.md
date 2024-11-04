# CSRF

This library contains all logic related to our CSRF protection strategy.

## What Is XSRF? (Cross-Site Request Forgery)

> Cross-site request forgery, also known as one-click attack or session riding and abbreviated as **CSRF** or **XSRF**, is a type of malicious exploit of a website where unauthorized commands are transmitted from a user that the web application trusts. There are many ways in which a malicious website can transmit such commands; specially-crafted image tags, hidden forms, and JavaScript XMLHttpRequests, for example, can all work without the user's interaction or even knowledge. Unlike cross-site scripting (XSS), which exploits the trust a user has for a particular site, CSRF exploits the trust that a site has in a user's browser.
>
> – <cite>[Wikipedia][1]</cite>

## Angular XSRF Protection

> By default the Angular v8+ Http service (from `@angular/common/http` `HttpClientModule`) had builtin support for the Cookies To Headers XSRF protection technique we just mentioned. If it detects a cookie with the name `XSRF-TOKEN`, it adds an HTTP header named `X-XSRF-TOKEN` with the same value to the next HTTP request you make.
>
> – <cite>[Meligy][2]</cite>

## Montoya CSRF Architecture

Our implementation of CSRF protection begins with an [API call to "/auth/csrf"][3].

Given that our contracts specify the use of `X-CSRF-TOKEN` vs Angular's default `X-XSRF-TOKEN`, we import `HttpClientXsrfModule.withOptions(…)` to specify our own custom settings.

The `CsrfService` serves as a simple wrapper for our `AuthenticationService` found within the `@empowered/api`. Whenever there is a successful response, we use [`ngx-cookie-service`][4] to store the token for `HttpClientXsrfModule`.

Finally, the module provides an `APP_INITIALIZER` injection token to ensure that our `CsrfService.load()` method is called **before** any of our application is fully loaded. This ensures that it is one of the first HTTP calls to be fired, regardless the URL used.

[1]: https://en.wikipedia.org/wiki/Cross-site_request_forgery
[2]: https://www.gurustop.net/blog/2017/10/17/little-known-xsrf-defence-support-in-angular-httpmodule-v2-5-httpclientmodule-v4-3/
[3]: https://api-contracts.empoweredbenefits.com/redoc.html?api=auth#operation/csrf
[4]: https://www.npmjs.com/package/ngx-cookie-service
