import CryptoJS from "crypto-js";

function decrypt(strToDecrypt: string, key: string, vector: string) {
  const reForPlus = /\*/g;
  const reForSlash = /\-/g;
  const charReplacedStringToDecrypt = strToDecrypt
    .replace(reForPlus, "+")
    .replace(reForSlash, "/");
  const keyParsed = CryptoJS.enc.Utf8.parse(key);
  const vectorParsed = CryptoJS.enc.Utf8.parse(vector);

  try {
    const decrypted = CryptoJS.AES.decrypt(
      charReplacedStringToDecrypt,
      keyParsed,
      {
        keySize: 128 / 8,
        iv: vectorParsed,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    );
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return "";
  }
}

export default decrypt;
