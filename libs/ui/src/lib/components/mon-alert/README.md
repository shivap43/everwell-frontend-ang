# Alert

### Author: Rupesh Jain

The Alert component is used to show a message to the user. The message can be of four different categories/types.

-   Information
-   Error
-   Warning
-   Success

## Default: Alert type: INFORMATION

#### Usage:

```html
    <mon-alert
        alertType="danger" //Default = "info"
        closeButton="true" //Default = false
        autoClose="false" //Default = false
        autoCloseAfter="5000" //Default = 5000
    >
        <span> Hello !!!</span>
    </mon-alert>
```
