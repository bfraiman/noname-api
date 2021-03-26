const AWS = require("aws-sdk");
const jwt_decode = require("jwt-decode");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
let cognitoAttributeList = [];

const poolData = {
  UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
  ClientId: process.env.AWS_COGNITO_CLIENT_ID,
};

const attributes = (key, value) => {
  return {
    Name: key,
    Value: value,
  };
};

function setCognitoAttributeList(email, agent) {
  let attributeList = [];
  attributeList.push(attributes("email", email));
  attributeList.forEach((element) => {
    cognitoAttributeList.push(
      new AmazonCognitoIdentity.CognitoUserAttribute(element)
    );
  });
}

function getCognitoAttributeList() {
  return cognitoAttributeList;
}

function getCognitoUser(email) {
  const userData = {
    Username: email,
    Pool: getUserPool(),
  };

  return new AmazonCognitoIdentity.CognitoUser(userData);
}

function getUserPool() {
  return new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

function getAuthDetails(email, password) {
  var authenticationData = {
    Username: email,
    Password: password,
  };

  return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
}

function initAWS(
  region = process.env.AWS_COGNITO_REGION,
  identityPoolId = process.env.AWS_COGNITO_IDENTITY_POOL_ID
) {
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
  });
}

function decodeJWTToken(token) {
  const { auth_time, email, exp, sub: uid, token_use } = jwt_decode(
    token.idToken
  );

  return { auth_time, email, exp, uid, token, token_use };
}

function signUp(email, password, agent = "none") {
  return new Promise((resolve) => {
    initAWS();
    setCognitoAttributeList(email, agent);
    getUserPool().signUp(
      email,
      password,
      getCognitoAttributeList(),
      null,
      function (err, result) {
        if (err) {
          return resolve({ statusCode: 422, response: err });
        }

        const response = {
          username: result.user.username,
          userConfirmed: result.userConfirmed,
          userAgent: result.user.client.userAgent,
        };
        return resolve({ statusCode: 201, response: response });
      }
    );
  });
}

function verify(email, code) {
  return new Promise((resolve) => {
    getCognitoUser(email).confirmRegistration(code, true, (err, result) => {
      if (err) {
        return resolve({ statusCode: 422, response: err });
      }
      return resolve({ statusCode: 400, response: result });
    });
  });
}

function signIn(email, password) {
  return new Promise((resolve) => {
    getCognitoUser(email).authenticateUser(getAuthDetails(email, password), {
      onSuccess: (result) => {
        const token = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        };
        return resolve({
          statusCode: 200,
          response: decodeJWTToken(token),
        });
      },

      onFailure: (err) => {
        return resolve({
          statusCode: 400,
          response: err.message || JSON.stringify(err),
        });
      },
    });
  });
}

module.exports = {
  signUp,
  verify,
  signIn,
};
