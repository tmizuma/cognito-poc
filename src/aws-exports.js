// aws-exports.js
// ここにCognitoの設定を入れる。User Pool ID, App Client ID, Hosted UI Domainなど

const awsConfig = {
    aws_project_region: "ap-northeast-1",
    aws_cognito_region: "ap-northeast-1",
    aws_user_pools_id: "ap-northeast-1_s2MfBAunm",
    aws_user_pools_web_client_id: "cbljp4bc7uqisgaspp7h0o171",
    // aws_cognito_identity_pool_id: "<YOUR_IDENTITY_POOL_ID>", // Facebook連携に必要(Identity Pool)
    // aws_mandatory_sign_in: "false",

    // Hosted UI 設定
    oauth: {
        domain: "ap-northeast-1bhjsyriee.auth.ap-northeast-1.amazoncognito.com", // e.g. my-app.auth.ap-northeast-1.amazoncognito.com
        scope: [
            "openid",
            "email",
            "phone",
            "aws.cognito.signin.user.admin",
            "profile",
        ],
        redirectSignIn: "http://localhost:3000/",
        redirectSignOut: "http://localhost:3000/",
        responseType: "code",
    },

    // Facebookログインを使う場合
    aws_social_providers: ["FACEBOOK"],
};

export default awsConfig;