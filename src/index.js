// index.js
import * as Auth from "./auth";

// DOMの読み込み完了後に実行
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, setting up event listeners");

    // ログ出力先の設定
    const logsElem = document.getElementById("logs");

    function log(msg) {
        console.log(msg);
        logsElem.textContent += msg + "\n";
        logsElem.scrollTop = logsElem.scrollHeight;
    }

    // ログコールバックを設定
    Auth.setLogCallback(log);

    // MFA用に保持するチャレンジユーザ
    let currentChallengeUser = null;

    log("Application initialized successfully");

    // 各ボタンのイベントリスナーを設定

    // SignUp
    document.getElementById("btnSignUp").addEventListener("click", async() => {
        const email = document.getElementById("signupEmail").value.trim();
        const pass = document.getElementById("signupPassword").value.trim();
        const phone = document.getElementById("signupPhone").value.trim();

        await Auth.doSignUp(email, pass, phone);
    });

    // Confirm Email
    document
        .getElementById("btnConfirmEmail")
        .addEventListener("click", async() => {
            const email = document.getElementById("confirmEmail").value.trim();
            const code = document.getElementById("confirmCode").value.trim();

            await Auth.doConfirmSignUp(email, code);
        });

    // Resend Email Code
    document
        .getElementById("btnResendEmailCode")
        .addEventListener("click", async() => {
            const email = document.getElementById("confirmEmail").value.trim();
            await Auth.doResendSignUpCode(email);
        });

    // SignIn
    document.getElementById("btnSignIn").addEventListener("click", async() => {
        const email = document.getElementById("signinEmail").value.trim();
        const pass = document.getElementById("signinPassword").value.trim();

        const result = await Auth.doSignIn(email, pass);
        if (result.success && result.requiresMFA) {
            currentChallengeUser = result.data;
        }
    });

    // Confirm MFA
    document
        .getElementById("btnConfirmMfa")
        .addEventListener("click", async() => {
            if (!currentChallengeUser) {
                log("No challenge user. SignIn with SMS_MFA first.");
                return;
            }

            const code = document.getElementById("mfaCode").value.trim();
            const result = await Auth.doConfirmMFA(code);

            if (result.success) {
                currentChallengeUser = null;
            }
        });

    // Facebook Login
    document
        .getElementById("btnFacebookLogin")
        .addEventListener("click", async() => {
            await Auth.doFederatedSignIn("Facebook");
        });

    // Cognito Hosted UI
    document
        .getElementById("btnCognitoHostedUI")
        .addEventListener("click", async() => {
            await Auth.doFederatedSignIn();
        });

    // Update Phone
    document
        .getElementById("btnUpdatePhone")
        .addEventListener("click", async() => {
            const phone = document.getElementById("phoneNumber").value.trim();
            if (!phone) {
                log("Phone is empty.");
                return;
            }

            await Auth.doUpdatePhone(phone);
        });

    // Verify Phone
    document
        .getElementById("btnVerifyPhone")
        .addEventListener("click", async() => {
            const code = document.getElementById("phoneCode").value.trim();
            if (!code) {
                log("No phone code entered.");
                return;
            }

            await Auth.doVerifyPhone(code);
        });

    // Resend Phone Code
    document
        .getElementById("btnResendPhoneCode")
        .addEventListener("click", async() => {
            await Auth.doResendPhoneCode();
        });

    // Check Current User
    document
        .getElementById("btnCheckUser")
        .addEventListener("click", async() => {
            const result = await Auth.doCheckCurrentUser();

            if (result.success) {
                log("CurrentUser: " + JSON.stringify(result.data.user, null, 2));
                log("Current session: " + JSON.stringify(result.data.session, null, 2));

                if (result.data.devices) {
                    log("User devices: " + JSON.stringify(result.data.devices, null, 2));
                }
            }
        });

    // Sign Out
    document.getElementById("btnSignOut").addEventListener("click", async() => {
        await Auth.doSignOut();
    });

    // Forgot Password
    document
        .getElementById("btnForgotPassword")
        .addEventListener("click", async() => {
            const email = document.getElementById("forgotEmail").value.trim();
            if (!email) {
                log("Email is required");
                return;
            }

            await Auth.doForgotPassword(email);
        });

    // Reset Password
    document
        .getElementById("btnResetPassword")
        .addEventListener("click", async() => {
            const email = document.getElementById("forgotEmail").value.trim();
            const code = document.getElementById("resetCode").value.trim();
            const password = document.getElementById("newPassword").value.trim();

            if (!email || !code || !password) {
                log("Email, code and new password are required");
                return;
            }

            await Auth.doResetPassword(email, code, password);
        });

    // デバッグ情報
    log("All event listeners set up successfully");
});