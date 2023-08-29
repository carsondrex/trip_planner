const MDCTextField = mdc.textField.MDCTextField;
const MDCTextFieldHelperText = mdc.textField.MDCTextFieldHelperText;

const usernameField = MDCTextField.attachTo(document.querySelector('.username'));
const usernameLabel = MDCTextFieldHelperText.attachTo(document.querySelector('#login-username-helper-text'));

const passwordField = MDCTextField.attachTo(document.querySelector('.password'));
const passwordLabel = MDCTextFieldHelperText.attachTo(document.querySelector('#login-password-helper-text'));

let loginButton = $('#login-button');

document.getElementById('login-button').addEventListener('click', () => {
    // Disable button
    loginButton.addClass("mdc-text-field--disabled").attr("disabled", true);

    // Hide any error message
    usernameLabel.foundation.setContent('');
    usernameField.foundation.setValid(true);
    passwordLabel.foundation.setContent('');
    passwordField.foundation.setValid(true);

    // Get login information
    let username = usernameField.value;
    let password = passwordField.value;

    // If there is already an error
    if (!usernameField.foundation.isValid || !passwordField.foundation.isValid) {
        loginButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
        return;
    }

    // If no values are inputted
    if (username.length === 0) {
        usernameField.focus();
        usernameField.foundation.setValid(false);
        usernameLabel.foundation.setContent("Username is empty");
        loginButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
        return;
    } else if (password.length === 0) {
        passwordField.focus();
        passwordField.foundation.setValid(false);
        passwordLabel.foundation.setContent("Password is empty");
        loginButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
        return;
    }

    // Call server login
    fetch('/login', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({'username': username, 'password': password})
    }).then((res) => {
        switch (res.status) {
            case 200:
                window.location.href = "http://localhost:3000";
                break;
            case 400:
                break;
            case 401:
                usernameField.focus();
                usernameField.foundation.setValid(false);
                usernameLabel.foundation.setContent("Account not found");
                break;
            case 402:
                passwordField.focus();
                passwordField.foundation.setValid(false);
                passwordLabel.foundation.setContent("Invalid password");
                break;
        }

        // Enable button
        loginButton.removeClass("mdc-text-field--disabled").attr("disabled", false);
    });
});
