// script.js

// 1) window.aws_amplify から Amplify, Auth を取り出す
const { Amplify, Auth } = window.aws_amplify;

// 2) Amplify.configure(...) で Cognito設定を適用
Amplify.configure(window._awsConfig);

// 3) log出力先
const logsElem = document.getElementById("logs");

function log(msg) {
  console.log(msg);
  logsElem.textContent += msg + "\n";
  logsElem.scrollTop = logsElem.scrollHeight;
}

// 4) DOM要素の取得
const signupEmail = document.getElementById("signupEmail");
const signupPassword = document.getElementById("signupPassword");
const signupPhone = document.getElementById("signupPhone");
const btnSignUp = document.getElementById("btnSignUp");

const confirmEmail = document.getElementById("confirmEmail");
const confirmCode = document.getElementById("confirmCode");
const btnConfirmEmail = document.getElementById("btnConfirmEmail");
const btnResendEmail = document.getElementById("btnResendEmailCode");

const signinEmail = document.getElementById("signinEmail");
const signinPassword = document.getElementById("signinPassword");
const btnSignIn = document.getElementById("btnSignIn");
const mfaCode = document.getElementById("mfaCode");
const btnConfirmMfa = document.getElementById("btnConfirmMfa");

const btnFacebookLogin = document.getElementById("btnFacebookLogin");

const phoneNumber = document.getElementById("phoneNumber");
const phoneCode = document.getElementById("phoneCode");
const btnUpdatePhone = document.getElementById("btnUpdatePhone");
const btnVerifyPhone = document.getElementById("btnVerifyPhone");
const btnResendPhone = document.getElementById("btnResendPhoneCode");

const btnCheckUser = document.getElementById("btnCheckUser");
const btnSignOut = document.getElementById("btnSignOut");

// MFA用に保持するチャレンジユーザ
let currentChallengeUser = null;

// 5) SignUp
btnSignUp.addEventListener("click", async () => {
  const email = signupEmail.value.trim();
  const pass = signupPassword.value.trim();
  const phone = signupPhone.value.trim(); // +81...

  try {
    const attributes = { email: email };
    // 必須の場合のみ phone_number を追加
    if (phone) {
      attributes.phone_number = phone;
    }
    const result = await Auth.signUp({
      username: email,
      password: pass,
      attributes,
    });
    log("SignUp success: " + JSON.stringify(result, null, 2));
  } catch (err) {
    log("SignUp error: " + err.message);
  }
});

// 6) Confirm Email
btnConfirmEmail.addEventListener("click", async () => {
  const email = confirmEmail.value.trim();
  const code = confirmCode.value.trim();
  try {
    const res = await Auth.confirmSignUp(email, code);
    log("ConfirmSignUp success: " + JSON.stringify(res));
  } catch (err) {
    log("ConfirmSignUp error: " + err.message);
  }
});

btnResendEmail.addEventListener("click", async () => {
  const email = confirmEmail.value.trim();
  try {
    await Auth.resendSignUp(email);
    log("Resend email code success");
  } catch (err) {
    log("Resend email code error: " + err.message);
  }
});

// 7) SignIn + SMS MFA
btnSignIn.addEventListener("click", async () => {
  const email = signinEmail.value.trim();
  const pass = signinPassword.value.trim();
  try {
    const user = await Auth.signIn(email, pass);
    log("SignIn success. challengeName=" + user.challengeName);

    if (user.challengeName === "SMS_MFA") {
      currentChallengeUser = user;
      log("MFA required. Enter the code & press [Confirm MFA].");
    } else {
      // MFA不要ならログイン完了
      await Auth.rememberDevice();
      log("SignIn complete (no MFA). Device remembered.");
    }
  } catch (err) {
    if (err.code === "UserNotConfirmedException") {
      log("UserNotConfirmed: Please confirm the email first.");
    } else {
      log("SignIn error: " + err.message);
    }
  }
});

btnConfirmMfa.addEventListener("click", async () => {
  if (!currentChallengeUser) {
    log("No challenge user. SignIn with SMS_MFA first.");
    return;
  }
  const code = mfaCode.value.trim();
  try {
    const res = await Auth.confirmSignIn(currentChallengeUser, code, "SMS_MFA");
    log("MFA confirm success: " + JSON.stringify(res));
    await Auth.rememberDevice();
    log("MFA login complete & device remembered.");
    currentChallengeUser = null;
  } catch (err) {
    log("ConfirmMFA error: " + err.message);
  }
});

// 8) Facebook Login (Hosted UI)
btnFacebookLogin.addEventListener("click", async () => {
  try {
    // Facebook IdP
    await Auth.federatedSignIn({ provider: "Facebook" });
    log("Redirecting to Facebook...");
  } catch (err) {
    log("Facebook login error: " + err.message);
  }
});

// 9) Update/Verify Phone
btnUpdatePhone.addEventListener("click", async () => {
  const phone = phoneNumber.value.trim();
  if (!phone) {
    log("Phone is empty.");
    return;
  }
  try {
    // すでにログインしているユーザーを取得
    const currentUser = await Auth.currentAuthenticatedUser();
    // phone_number を更新 => SMSコード送付
    await Auth.updateUserAttributes(currentUser, {
      phone_number: phone,
    });
    log("Phone updated. Verification code sent to " + phone);
  } catch (err) {
    log("Update phone error: " + err.message);
  }
});

btnVerifyPhone.addEventListener("click", async () => {
  const code = phoneCode.value.trim();
  if (!code) {
    log("No phone code entered.");
    return;
  }
  try {
    await Auth.verifyCurrentUserAttributeSubmit("phone_number", code);
    log("Phone verify success!");
  } catch (err) {
    log("Phone verify error: " + err.message);
  }
});

btnResendPhone.addEventListener("click", async () => {
  try {
    await Auth.verifyCurrentUserAttribute("phone_number");
    log("Resend phone code success");
  } catch (err) {
    log("Resend phone code error: " + err.message);
  }
});

// 10) Check current user & sign out
btnCheckUser.addEventListener("click", async () => {
  try {
    const user = await Auth.currentAuthenticatedUser();
    log("CurrentUser: " + JSON.stringify(user, null, 2));
  } catch (err) {
    log("No current user. " + err);
  }
});

btnSignOut.addEventListener("click", async () => {
  try {
    await Auth.signOut();
    log("SignOut success");
  } catch (err) {
    log("SignOut error: " + err.message);
  }
});
