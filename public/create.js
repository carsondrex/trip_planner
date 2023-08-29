const MDCTextField = mdc.textField.MDCTextField;
const MDCTextFieldHelperText = mdc.textField.MDCTextFieldHelperText;

const usernameField = MDCTextField.attachTo(document.querySelector('.username'));
const usernameLabel = MDCTextFieldHelperText.attachTo(document.querySelector('#create-username-helper-text'));

const passwordField = MDCTextField.attachTo(document.querySelector('.password'));
const passwordLabel = MDCTextFieldHelperText.attachTo(document.querySelector('#create-password-helper-text'));

let createButton = $('#create-account-button');

createButton.on('click', () => {
    // Disable button
    createButton.addClass("mdc-text-field--disabled").attr("disabled", true);

    // Hide any error message
    usernameLabel.foundation.setContent('');
    usernameField.foundation.setValid(true);
    passwordLabel.foundation.setContent('');
    passwordField.foundation.setValid(true);

    // Get create information
    let username = usernameField.value;
    let password = passwordField.value;

    // If there is already an error
    if (!usernameField.foundation.isValid || !passwordField.foundation.isValid) {
        createButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
        return;
    }

    // If no values are inputted
    if (username.length === 0) {
        usernameField.focus();
        usernameField.foundation.setValid(false);
        usernameLabel.foundation.setContent("Username is empty");
        createButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
        return;
    } else if (password.length === 0) {
        passwordField.focus();
        passwordField.foundation.setValid(false);
        passwordLabel.foundation.setContent("Password is empty");
        createButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
        return;
    }

    // Call server create
    fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'username': username, 'password': password})
    }).then((res) => {
       switch(res.status) {
           case 200:
               window.location.href = "http://localhost:3000/";
               break;
           case 400:
               usernameField.focus();
               usernameLabel.foundation.setValid(false);
               usernameLabel.foundation.setContent("Invalid username/password");
               break;
       }
    });

    createButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
});