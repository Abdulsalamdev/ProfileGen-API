const { generateCodeVerifier, generateCodeChallenge } = require('../utils/pkce');

const verifier = generateCodeVerifier();
const challenge = generateCodeChallenge(verifier);

console.log(verifier, challenge);