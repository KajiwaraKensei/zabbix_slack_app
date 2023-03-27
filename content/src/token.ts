
let tokens: {
    [key: string]: string
} = {}


export const getToken = (key: string) => {
    return tokens[key]
}


export const setToken = (key: string, token: string) => {
    tokens[key] = token
    return getToken(key)

}