import Axios from "axios"
import moment from "moment"
import { getHosts, getSelectHost, getTokenByUser } from "./token"

const SEVERITY = ["未分類", "情報", "警告", "軽度の障害", "重度の障害", "致命的な障害"]


const FIELD: { [key: string]: (i: any) => any } = {
    acknowledged: i => `アクナレッジ: ${i === "1" ? "済み" : "未"}`,
    clock: i => `障害発生: ${moment(new Date(1000 * Number(i))).format('LLLL')}`,
    r_clock: i => (i !== "0" ? `*\n*復旧済み: ${moment(new Date(1000 * Number(i))).format('LLLL')}` : ""),
    severity: i => `深刻度: ${SEVERITY[Number(i)] || "不明"}`
}


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

// クローズ
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

// アクナレッジ
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

// Zabbixの障害を取得
export const getZabbixProblem = async (user: string) => {
    try {
        const token = getTokenByUser(user)

        // トークンがない場合
        if (!token) {
            return [{
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": `\nトークンを設定してください`
                }
            }]
        }

        const prom = await getProblem(token.token, token.url);
        return createProblemCard(prom)

    } catch (error) {
        console.error(error);

        return [{
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `データの取得に失敗しました`
            }
        }]
    }
}

const createProblemCard = (prom: any) => {
    const row: any = []

    prom.forEach((i: any) => {
        const block = {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*${FIELD["clock"](i["clock"])}${FIELD["r_clock"](i["r_clock"])}*\n*${i.name}*\n` + String(["severity", "acknowledged"].map((key) => {
                    return FIELD[key] ? FIELD[key](i[key]) : `${key}: ${String(i[key])}`
                }))
            }
        }
        row.push(block)
        i.r_clock === "0" && row.push({
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "close problem"
                    },
                    "style": "primary",
                    "value": i.eventid,
                    "action_id": "close_problem"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "acknowledge event"
                    },
                    "style": "danger",
                    "value": i.eventid,
                    "action_id": "acknowledge_problem"
                }
            ]
        })
        row.push({
            "type": "divider"
        })
    })

    if (row.length < 1) {
        row.push({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `現在障害は発生してません`

            }
        })
    }
    return row
}



export const createSelectHost = (user: string) => {
    const selectHostName = getSelectHost(user);
    const token = getTokenByUser(user)
    const hosts = mapHosts(user)
    let temp: { [key: string]: any } = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": selectHostName ? `*<${token?.url}|${selectHostName}>*` : "ホストが選択されていません\n..."
        },


    }

    const accessory = hosts.length ? {
        "type": "static_select",
        "action_id": "select_zabbix_host",
        "placeholder": {
            "type": "plain_text",
            "emoji": true,
            "text": "change zabbix server"
        },
        "options": [
            ...mapHosts(user)
        ]
    } : null;

    if (accessory) {
        temp["accessory"] = accessory
    }

    return [
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "add zabbix server",
                        "emoji": true
                    },
                    "style": "primary",
                    "value": "add_host",
                    "action_id": "add_zabbix_host"
                },
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "text": "delete selected zabbix sever",
                        "emoji": true
                    },
                    "style": "danger",
                    "value": "delete_host",
                    "action_id": "delete_zabbix_host"
                }
            ]
        },
        temp,

    ]
}

const mapHosts = (user: string) => {
    return getHosts(user).map(hostname => ({
        "text": {
            "type": "plain_text",
            "emoji": true,
            "text": hostname
        },
        "value": hostname

    }))
}


const sleep = (second: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, second * 1000)
    })
}