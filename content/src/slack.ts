

export const sendHomeTab = (e: any, blocks: any[]) => {
    return e.client.views.publish({
        // イベントに紐づけられたユーザー ID を指定
        user_id: e.event?.user,
        view: {
            // ホームタブはあらかじめアプリ設定ページで有効にしておく必要があります
            type: "home",
            blocks: [{
                "dispatch_action": true,
                "type": "input",
                "element": {
                    "type": "plain_text_input",
                    "action_id": "set_zabbix_token"
                },
                "label": {
                    "type": "plain_text",
                    "text": "zabbix token (Update with blank input)",
                    "emoji": true
                }
            },
            {
                "type": "divider"
            },
            ...blocks,]
        }
    });
}
