import CryptoJS from 'crypto-js';
import forge from 'node-forge';
import { readJSONFile, writeJSONFile } from './fs';

const PRIVATE_KEY_FILE = "private_keys.json"

const generateRSAKey = () => {
    // RSA鍵ペアの生成
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // 秘密鍵と公開鍵の取得
    const privateKey = forge.pki.privateKeyToPem(keys.privateKey);
    const publicKey = forge.pki.publicKeyToPem(keys.publicKey);
    return {
        privateKey,
        publicKey
    }
}

// トークン暗号化
export const EncryptionToken = (user: string, host: string, token: string) => {
    const { publicKey, privateKey } = generateRSAKey()                          // 鍵のペアを生成
    savePrivateKey(user + host, privateKey)                                     // 秘密鍵を保存
    return forge.pki.publicKeyFromPem(publicKey).encrypt(token, 'RSA-OAEP');    // トークンを暗号化
}

// 暗号化したトークンの復号
export const DecryptionToken = (user: string, host: string, encryptedToken: string) => {
    const privateKey = getPrivateKey(user + host);                              // 復号に使用する秘密鍵を取得
    return forge.pki.privateKeyFromPem(privateKey).decrypt(encryptedToken, 'RSA-OAEP')  // 秘密鍵から復号
}

// 保存している秘密鍵を取得
const getPrivateKey = (keyword: string) => {
    const privateKeys = readJSONFile(PRIVATE_KEY_FILE)
    return CryptoJS.AES.decrypt(
        privateKeys[keyword], process.env.PRIVATE_KEY_DECRYPTION_PASSPHRASE).toString(CryptoJS.enc.Utf8);
}

// 秘密鍵を暗号化して保存
const savePrivateKey = (keyword: string, value: string) => {
    writeJSONFile(PRIVATE_KEY_FILE, {
        ...readJSONFile(PRIVATE_KEY_FILE),
        [keyword]: encryptionPrivateKey(value)
    });
}

// 秘密鍵を暗号化
const encryptionPrivateKey = (privateKey: string) => {
    return CryptoJS.AES.encrypt(privateKey, process.env.PRIVATE_KEY_DECRYPTION_PASSPHRASE).toString();

}