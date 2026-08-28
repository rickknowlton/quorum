import { customAlphabet } from "nanoid";

const urlAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const publicIdGenerator = customAlphabet(urlAlphabet, 12);
const tokenGenerator = customAlphabet(urlAlphabet, 48);

export function createPublicId() {
  return publicIdGenerator();
}

export function createSecretToken() {
  return tokenGenerator();
}
