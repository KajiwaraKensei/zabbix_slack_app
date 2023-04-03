import { App, AttachmentAction, BlockButtonAction, BlockStaticSelectAction, ButtonAction, LogLevel } from "@slack/bolt";
import { acknowledgeProblem, closeProblem, getZabbixProblem } from "./zabbix";
import { deleteSelectHost, setSelectHost, setToken } from "./token";
import { sendHomeTab } from "./slack";

const app = new App({
    logLevel: LogLevel.WARN,
    socketMode: true,
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN
});


// ホームタブを開くイベント
app.event("app_home_opened", async (e) => {
    const { event, logger } = e
    try {
        const block = await getZabbixProblem(event.user) // ブロック取得
        const result = await sendHomeTab(e, block)  //　ブロック送信
        logger.info(result);
    }
    catch (error) {
        logger.error(error);
    }
})

// トークンを入力イベント
app.action("set_zabbix_token", async (e: any) => {

    // 入力内容がある時だけセット
    if (e.payload?.value) {
        setToken(e.body.user.id, "null", e.payload.value)
    }
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
});

app.action<BlockButtonAction>("add_zabbix_host", async (e) => {

    e.client.views.open({
        trigger_id: e.body["trigger_id"],
        view: {
            "type": "modal",
            "callback_id": "submit_zabbix_host",
            "title": { "type": "plain_text", "text": "Add Zabbix Server" },
            "submit": { "type": "plain_text", "text": "Add" },
            "close": { "type": "plain_text", "text": "Cancel" },
            blocks: [
                {
                    "dispatch_action": false,
                    "type": "input",
                    "block_id": "zabbix_url",
                    "element": {
                        "type": "plain_text_input",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "https://zabbix.example.com",
                            "emoji": true
                        },
                        "action_id": "zabbix_url",
                    },
                    "label": {
                        "type": "plain_text",
                        "text": "zabbix url",
                        "emoji": true
                    }
                },
                {
                    "dispatch_action": false,
                    "type": "input",
                    "block_id": "zabbix_token",
                    "element": {
                        "type": "plain_text_input",
                        "placeholder": {
                            "type": "plain_text",
                            "text": "be5f5afaeb161c027239700a82b1bb5...",
                            "emoji": true
                        },
                        "action_id": "zabbix_token",

                    },
                    "label": {
                        "type": "plain_text",
                        "text": "zabbix token",
                        "emoji": true
                    }
                },
            ]
        }
    })
    // 入力内容がある時だ
    e.ack()
});

app.view("submit_zabbix_host", async (e) => {
    const { zabbix_url, zabbix_token } = e.view.state.values;

    const user = e.body.user.id
    const hostname = setSelectHost(user, zabbix_url.zabbix_url.value,)

    setToken(user, hostname, zabbix_token.zabbix_token.value, zabbix_url.zabbix_url.value,)
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
})

app.action<BlockStaticSelectAction>("select_zabbix_host", async (e) => {
    setSelectHost(e.body.user.id, e.payload.selected_option.value)
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
})

app.action<BlockStaticSelectAction>("delete_zabbix_host", async (e) => {
    deleteSelectHost(e.body.user.id)
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
})

app.action("acknowledge_problem", async (e: any) => {
    if (e.payload.value) {
        await acknowledgeProblem(e.payload.value, e.body.user.id)
    }
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
});

app.action("close_problem", async (e: any) => {
    if (e.payload.value) {
        await closeProblem(e.payload.value, e.body.user.id)
    }
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
});


(async () => {
    await app.start();
    console.log('⚡️ Bolt app started');
})();

