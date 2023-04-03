import moment from "moment";
import { getHosts, getSelectHost, getTokenByUser } from "./token";
import { getProblem } from "./zabbix";

const SEVERITY = ["未分類", "情報", "警告", "軽度の障害", "重度の障害", "致命的な障害"]
moment.locale('ja');

// Zabbix日本語対応
const FIELD: { [key: string]: (i: any) => any } = {
    acknowledged: i => `アクナレッジ: ${i === "1" ? "済み" : "未"}`,
    clock: i => `障害発生: ${moment(new Date(1000 * Number(i))).format('LLLL')}`,
    r_clock: i => (i !== "0" ? `*\n*復旧済み: ${moment(new Date(1000 * Number(i))).format('LLLL')}` : ""),
    severity: i => `深刻度: ${SEVERITY[Number(i)] || "不明"}`
}

export const sendHomeTab = async (e: any, user: string) => {
    return e.client.views.publish({
        // イベントに紐づけられたユーザー ID を指定
        user_id: user,
        view: {
            // ホームタブはあらかじめアプリ設定ページで有効にしておく必要があります
            type: "home",
            blocks: [
                ...createSelectHost(user),

                {
                    "type": "divider"
                },
                ...await getZabbixProblem(user),]
        }
    });
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

// 障害の表示
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

    // 0件の場合
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

// _______________________________________________________________
// 選択中のホストを表示

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

    // ドロップダウンリスト
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

    // ホストの設定がない場合、ドロップダウンリストは表示しない
    if (accessory) {
        temp["accessory"] = accessory
    }

    // 一番初めに、追加と削除ボタンを表示
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

// ドロップダウンリストのアイテム
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

