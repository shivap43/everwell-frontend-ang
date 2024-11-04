Feature: Send Enrollment Summary
    Background:
        Given the user has completed the enrollment process
        And the "Send Enrollment Summary" modal is open

    Scenario: Modal opens with correct title and help text
        Then the modal title should be "Send enrollment summary"
        And the help text should be "We recommend sending the applicant a summary of their elections. How would you like to send it?"
    
    Scenario: Email options are displayed correctly
        Then the email options should be displayed
        And each email option should show the email address
    
    Scenario: Phone options are displayed correctly
        Then the phone options should be displayed
        And each phone option should show the formatted phone number
    
    Scenario: User selects an email option
        When the user selects an email option
        Then the selected email option should be checked
        And the "Send to email not on file" option should be unchecked
        And the email input field should not be visible
   
    Scenario: User selects a phone option
        When the user selects a phone option
        Then the selected phone option should be checked
        And the "Text to mobile number not on file" option should be unchecked
        And the phone input field should not be visible

    Scenario: User selects the "Send to email not on file" option
        When the user selects the "Send to email not on file" option
        Then the "Send to email not on file" option should be checked
        And the email input field should be visible

    Scenario: User selects the "Text to mobile number not on file" option
        When the user selects the "Text to mobile number not on file" option
        Then the "Text to mobile number not on file" option should be checked
        And the phone input field should be visible

    Scenario: User enters an email address
        Given the user has selected the "Send to email not on file" option
        When the user enters an email address
        Then the entered email address should be displayed in the email input field
        And there should be no error message

    Scenario: User enters a mobile number
        Given the user has selected the "Text to mobile number not on file" option
        When the user enters a mobile number
        Then the entered mobile number should be displayed in the phone input field
        And there should be no error message

    Scenario: User submits the form with a valid email option selected
        Given the user has selected a valid email option
        When the user clicks on the "Send" button
        Then the form should be submitted successfully
        And the modal should close

    Scenario: User submits the form with a valid phone option selected
        Given the user has selected a valid phone option
        When the user clicks on the "Send" button
        Then the form should be submitted successfully
        And the modal should close

    Scenario: User submits the form with a valid email entered
        Given the user has selected the "Send to email not on file" option
        And the user has entered a valid email address
        When the user clicks on the "Send" button
        Then the form should be submitted successfully
        And the modal should close

    Scenario: User submits the form with a valid mobile number entered
        Given the user has selected the "Text to mobile number not on file" option
        And the user has entered a valid mobile number
        When the user clicks on the "Send" button
        Then the form should be submitted successfully
        And the modal should close

    Scenario: User submits the form without selecting an option
        When the user clicks on the "Send" button without selecting an option
        Then the form should not be submitted
        And an error message "Selection required" should be displayed

    Scenario: User submits the form with an invalid email address
        Given the user has selected the "Send to email not on file" option
        And the user has entered an invalid email address
        When the user clicks on the "Send" button
        Then the form should not be submitted
        And an error message "Required field" should be displayed for the email input

    Scenario: User submits the form with an invalid mobile number
        Given the user has selected the "Text to mobile number not on file" option
        And the user has entered an invalid mobile number
        When the user clicks on the "Send" button
        Then the form should not be submitted
        And an error message "Required field" should be displayed for the phone input

    Scenario: User closes the modal using the close button
        When the user clicks on the close button in the modal header
        Then the modal should close
        And no action should be taken

    Scenario: User closes the modal using the escape key
        When the user presses the escape key
        Then the modal should close
        And no action should be taken

    Scenario: User skips sending the summary
        When the user clicks on the "Skip" button
        Then the modal should close
        And no summary should be sent