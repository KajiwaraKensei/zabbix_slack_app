import { table } from "console"

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


export const getToken = (key: string, host: string) => {
    return tokens[key]?.[host]
}


export const setToken = (key: string, host: string, token: string, url?: string) => {
    tokens[key] = {
        ...tokens[key],
        [host]: {
            url: url ? (url + "/api_jsonrpc.php") : tokens[key][host].url,
            token
        }
    }
    table(tokens[key])
    return getToken(key, host)

}


export const getTokenByUser = (user: string) => {
    return getToken(user, getSelectHost(user))
}

export const getHosts = (user: string) => {
    try {
        return Object.keys(tokens[user])

    } catch (error) {
        return []

    }
}

export const getSelectHost = (user: string) => {
    return selectHosts[user]
}


export const setSelectHost = (user: string, url: string) => {
    const hostname = url.replace("https://", "").replace("http://", "");
    selectHosts[user] = hostname
    table(selectHosts)
    return getSelectHost(user)
}

export const deleteSelectHost = (user: string) => {
    const selectHost = getSelectHost(user);
    delete selectHosts[user]
    delete tokens[user]?.[selectHost]
}