import { createSelectHost } from "./zabbix";


export const sendHomeTab = (e: any, blocks: any[]) => {

    return e.client.views.publish({
        // イベントに紐づけられたユーザー ID を指定
        user_id: e.event?.user,
        view: {
            // ホームタブはあらかじめアプリ設定ページで有効にしておく必要があります
            type: "home",
            blocks: [
                ...createSelectHost(e.event?.user),

                {
                    "type": "divider"
                },
                ...blocks,]
        }
    });
}
