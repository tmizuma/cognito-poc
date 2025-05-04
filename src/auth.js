// auth.js
import { Amplify } from "aws-amplify";
import {
  signUp,
  confirmSignUp,
  resendSignUpCode,
  confirmSignIn,
  fetchAuthSession,
  getCurrentUser,
  updateUserAttributes,
  signIn,
  confirmUserAttribute,
  resetPassword,
  confirmResetPassword,
  rememberDevice,
  updateMFAPreference,
  signOut,
  fetchDevices,
  signInWithRedirect,
} from "aws-amplify/auth";
import awsconfig from "./aws-exports";

// Amplifyの設定
Amplify.configure(awsconfig);

// ログ出力用ヘルパー関数
let logCallback = (msg) => console.log(msg);

export function setLogCallback(callback) {
  logCallback = callback;
}

function log(msg) {
  logCallback(msg);
}

// 認証関連の関数をエクスポート
export async function doSignUp(email, password, phone) {
  try {
    const userAttributes = { email };
    if (phone) {
      userAttributes.phone_number = phone;
    }

    const result = await signUp({
      username: email,
      password,
      options: {
        userAttributes,
      },
    });
    log("SignUp success: " + JSON.stringify(result, null, 2));
    return { success: true, data: result };
  } catch (err) {
    log("SignUp error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doConfirmSignUp(email, code) {
  try {
    const res = await confirmSignUp({
      username: email,
      confirmationCode: code,
    });

    log("ConfirmSignUp success: " + JSON.stringify(res));
    return { success: true, data: res };
  } catch (err) {
    log("ConfirmSignUp error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doResendSignUpCode(email) {
  try {
    await resendSignUpCode({
      username: email,
    });

    log("Resend email code success");
    return { success: true };
  } catch (err) {
    log("Resend email code error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doSignIn(username, password) {
  try {
    console.log(username, password);
    const signInResult = await signIn({
      username,
      password,
    });

    log("SignIn initiated. Next step: " + signInResult.nextStep.signInStep);

    if (signInResult.nextStep.signInStep === "CONFIRM_SIGN_IN_WITH_SMS_CODE") {
      return {
        success: true,
        requiresMFA: true,
        data: signInResult,
      };
    } else if (signInResult.isSignedIn) {
      return {
        success: true,
        requiresMFA: false,
        data: signInResult,
      };
    }

    return { success: true, data: signInResult };
  } catch (err) {
    if (err.code === "UserNotConfirmedException") {
      log("UserNotConfirmed: Please confirm the email first.");
      return {
        success: false,
        error: "UserNotConfirmedException",
        message: "Please confirm the email first.",
      };
    } else {
      log("SignIn error: " + err.message);
      return { success: false, error: err.message };
    }
  }
}

export async function doConfirmMFA(code) {
  const result = await confirmSignIn({ challengeResponse: code });
  log("MFA confirmed");

  try {
    await rememberDevice();
    log("Device remembered after MFA");
  } catch (e) {
    log("rememberDevice failed: " + e.message);
  }

  return { success: true, data: result };
}

export async function doFederatedSignIn(provider = null) {
  try {
    const options = provider ? { provider } : undefined;
    await signInWithRedirect(options);

    log(`Redirecting to ${provider || "Cognito Hosted UI"}...`);
    return { success: true };
  } catch (err) {
    log(`${provider || "Hosted UI"} login error: ` + err.message);
    return { success: false, error: err.message };
  }
}

export async function doUpdateEmail(email) {
  try {
    await updateUserAttributes({
      userAttributes: {
        email: email,
      },
    });

    log("Email updated. Verification code sent to " + email);

    return { success: true };
  } catch (err) {
    log("Update email error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doVerifyEmail(code) {
  try {
    await confirmUserAttribute({
      userAttributeKey: "email",
      confirmationCode: code,
    });

    log("Email verify success!");
    return { success: true };
  } catch (err) {
    log("Email verify error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doResendEmailVerificationCode() {
  try {
    await confirmUserAttribute({
      userAttributeKey: "email",
    });

    log("Resend email verification code success");
    return { success: true };
  } catch (err) {
    log("Resend email verification code error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doUpdatePhone(phoneNumber) {
  try {
    await updateUserAttributes({
      userAttributes: {
        phone_number: phoneNumber,
      },
    });

    log("Phone updated. Verification code sent to " + phoneNumber);

    return { success: true };
  } catch (err) {
    log("Update phone error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doVerifyPhone(code) {
  try {
    await confirmUserAttribute({
      userAttributeKey: "phone_number",
      confirmationCode: code,
    });

    log("Phone verify success!");

    await updateMFAPreference({ sms: "PREFERRED" });
    log("Preferred MFA set to SMS");

    return { success: true };
  } catch (err) {
    log("Phone verify error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doResendPhoneCode() {
  try {
    await confirmUserAttribute({
      userAttributeKey: "phone_number",
    });

    log("Resend phone code success");
    return { success: true };
  } catch (err) {
    log("Resend phone code error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doCheckCurrentUser() {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();

    try {
      const devices = await fetchDevices();
      return {
        success: true,
        data: { user, session, devices },
      };
    } catch (devErr) {
      log("Unable to list devices: " + devErr.message);
      return {
        success: true,
        data: { user, session },
        deviceError: devErr.message,
      };
    }
  } catch (err) {
    log("No current user. " + err);
    return { success: false, error: err.message };
  }
}

export async function doRefreshToken() {
  try {
    log("Attempting to refresh token using refresh token...");
    const session = await fetchAuthSession({ forceRefresh: true });

    log("Token refreshed successfully");
    return {
      success: true,
      data: session,
    };
  } catch (err) {
    log("Token refresh error: " + err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

export async function doSignOut() {
  try {
    await signOut();
    log("SignOut success");
    return { success: true };
  } catch (err) {
    log("SignOut error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doForgotPassword(email) {
  try {
    await resetPassword({
      username: email,
    });

    log("Reset code sent to " + email);
    return { success: true };
  } catch (err) {
    log("Send reset code error: " + err.message);
    return { success: false, error: err.message };
  }
}

export async function doResetPassword(email, code, newPassword) {
  try {
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });

    log(
      "Password reset successful. You can now sign in with the new password."
    );
    return { success: true };
  } catch (err) {
    log("Reset password error: " + err.message);
    return { success: false, error: err.message };
  }
}
