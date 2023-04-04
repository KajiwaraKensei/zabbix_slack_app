import { table } from "console"
import { DecryptionToken, EncryptionToken } from "./rsa"
import { readJSONFile, writeJSONFile } from "./fs"

const TOKENS_FILENAME = "tokens.json"
const SELECT_HOSTS_FILENAME = "select_hosts.json"

// トークン取得
export const getToken = (key: string, host: string) => {
    const tokens = readJSONFile(TOKENS_FILENAME)

    if (!tokens[key] || !tokens[key]?.[host]) {
        return null
    }
    const { url, token } = tokens[key]?.[host]
    return {
        url,
        token: DecryptionToken(key, host, token) // トークンを復号
    }
}

// トークン保存
export const setToken = (key: string, host: string, token: string, url?: string) => {
    let tokens = readJSONFile(TOKENS_FILENAME)

    const encryptToken = EncryptionToken(key, host, token)  // トークンを暗号化
    tokens[key] = {
        ...tokens[key],
        [host]: {
            url: url || tokens[key][host].url,
            token: encryptToken
        }
    }
    writeJSONFile(TOKENS_FILENAME, tokens);

    return getToken(key, host)

}

// ユーザー名から選択しているZabbixのトークンを取得
export const getTokenByUser = (user: string) => {
    return getToken(user, getSelectHost(user))
}

// 設定したホストを取得
export const getHosts = (user: string) => {
    try {
        const tokens = readJSONFile(TOKENS_FILENAME)

        return Object.keys(tokens[user])

    } catch (error) {
        return []

    }
}

// 選択中のホストを取得
export const getSelectHost = (user: string) => {
    const selectHosts = readJSONFile(SELECT_HOSTS_FILENAME)
    return selectHosts[user]
}

// 選択するホストを設定
export const setSelectHost = (user: string, url: string) => {
    const hostname = url.replace("https://", "").replace("http://", "");
    let selectHosts = readJSONFile(SELECT_HOSTS_FILENAME)
    selectHosts[user] = hostname
    table(selectHosts)
    writeJSONFile(SELECT_HOSTS_FILENAME, selectHosts)
    return getSelectHost(user)
}

// 選択しているホストの設定を削除
export const deleteSelectHost = (user: string) => {
    let tokens = readJSONFile(TOKENS_FILENAME)
    let selectHosts = readJSONFile(SELECT_HOSTS_FILENAME)
    const selectHost = getSelectHost(user);
    delete selectHosts[user]
    delete tokens[user]?.[selectHost]
    writeJSONFile(TOKENS_FILENAME, tokens)
    writeJSONFile(SELECT_HOSTS_FILENAME, selectHosts)
}