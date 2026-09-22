import CryptoJS from "crypto-js";

function encrypt(strToEncrypt: string, secretKey: string, vector: string) {
  const keyParsed = CryptoJS.enc.Utf8.parse(secretKey);
  const vectorParsed = CryptoJS.enc.Utf8.parse(vector);
  let encrypted;

  try {
    encrypted = CryptoJS.AES.encrypt(strToEncrypt, keyParsed, {
      keySize: 128,
      iv: vectorParsed,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
  } catch (ex) {
    encrypted = null;
  }

  const encryptedString = encrypted.toString();

  const reForPlus = /\+/g;
  const reForSlash = /\//g;
  return encryptedString.replace(reForPlus, "*").replace(reForSlash, "-");
}

export default encrypt;
