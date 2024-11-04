# Core Interceptors

### MP Group

The MP Group interceptor is used in the API module to intercept API requests, and append the appropriate MP Group ID to the headers.

The ID will only be appended if:

- The URL starts with the base path outlined in the configuration (at the time of writing this, "/api")
- The request has the header "MP-Group"
- The "MP-Group" contains an empty string

If the request does not meet the above criteria, then it will not be intercepted.

The group ID is found by traversing the following heirarchy:

1.  "mpGroupId" path parameter
2.  "accountId" path parameter
3.  "groupId" feild in the member credential

If the ID is not found, then a empty string is inserted as the value, and an error will be logged to the console.

#### Known Challenges:

Because of the nature of the observable returned from the interceptor, it does not emit the complete event like a normal HttpClient response would. To circumvent this, use the take 1 operator to force the complete emission after the first emission.

```
	return this.httpClient.get<any>(
			"URL GOES HERE",
			{ headers: headers })
		.pipe(take(1));
```
