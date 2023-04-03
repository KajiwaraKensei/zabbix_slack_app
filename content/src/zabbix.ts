import Axios from "axios"
import { getTokenByUser } from "./token"

type ZabbixRes = {
    eventid: string
    source: string
    name: string
    acknowledged: string
    severity: string
}


// 障害取得
export const getProblem = async (token: string, url: string) => {
    return Axios.post(url + "/api_jsonrpc.php", {
        "jsonrpc": "2.0",
        "method": "problem.get",
        "params": {
            "output": "extend",
            "selectAcknowledges": "extend",
            "selectTags": "extend",
            "selectSuppressionData": "extend",
            "recent": "true",
            "sortfield": ["eventid"],
            "sortorder": "ASC"
        },
        "auth": token,
        "id": 1
    }).then((res) => {
        console.table(res.data.result)
        res.data.result.forEach((a: any) => {
        })
        if (res.data.result) {
            return res.data.result as ZabbixRes[]
        }
    })
}

// クローズ処理
export const closeProblem = (ids: string, user: string) => {
    const { token, url } = getTokenByUser(user)
    return Axios.post(url + "/api_jsonrpc.php", {
        "jsonrpc": "2.0",
        "method": "event.acknowledge",
        "params": {
            "eventids": ids,
            "action": 1,
        },
        "auth": token,
        "id": 1
    }).then(() => sleep(1.75))
}

// アクナレッジ処理
export const acknowledgeProblem = (ids: string, user: string) => {
    const { token, url } = getTokenByUser(user)

    return Axios.post(url + "/api_jsonrpc.php", {
        "jsonrpc": "2.0",
        "method": "event.acknowledge",
        "params": {
            "eventids": ids,
            "action": 2,
        },
        "auth": token,
        "id": 1
    }).then(() => sleep(1))
}

const sleep = (second: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, second * 1000)
    })
}