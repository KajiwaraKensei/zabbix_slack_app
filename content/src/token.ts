import { table } from "console"
import { DecryptionToken, EncryptionToken } from "./rsa"

let tokens: {
    [key: string]: {
        [host: string]: {
            url: string,
            token: string
        }
    }
} = {}

let selectHosts: {
    [key: string]: string
} = {}


// トークン取得
export const getToken = (key: string, host: string) => {
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
    const encryptToken = EncryptionToken(key, host, token)  // トークンを暗号化
    tokens[key] = {
        ...tokens[key],
        [host]: {
            url: url || tokens[key][host].url,
            token: encryptToken
        }
    }
    return getToken(key, host)

}

// ユーザー名から選択しているZabbixのトークンを取得
export const getTokenByUser = (user: string) => {
    return getToken(user, getSelectHost(user))
}

// 設定したホストを取得
export const getHosts = (user: string) => {
    try {

        return Object.keys(tokens[user])

    } catch (error) {
        return []

    }
}

// 選択中のホストを取得
export const getSelectHost = (user: string) => {
    return selectHosts[user]
}

// 選択するホストを設定
export const setSelectHost = (user: string, url: string) => {
    const hostname = url.replace("https://", "").replace("http://", "");
    selectHosts[user] = hostname
    table(selectHosts)
    return getSelectHost(user)
}

// 選択しているホストの設定を削除
export const deleteSelectHost = (user: string) => {
    const selectHost = getSelectHost(user);
    delete selectHosts[user]
    delete tokens[user]?.[selectHost]
}