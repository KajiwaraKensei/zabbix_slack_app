import { App, BlockButtonAction, BlockStaticSelectAction, LogLevel } from "@slack/bolt";
import { acknowledgeProblem, closeProblem } from "./zabbix";
import { deleteSelectHost, setSelectHost, setToken } from "./token";
import { sendHomeTab } from "./slack";
import { addZabbixServerModal } from "./template";

const app = new App({
    logLevel: LogLevel.INFO,
    socketMode: true,
    token: process.env.SLACK_BOT_TOKEN,
    appToken: process.env.SLACK_APP_TOKEN
});


// ホームタブを開くイベント
app.event("app_home_opened", async (e) => {
    const { event, logger } = e
    try {
        const result = await sendHomeTab(e, event.user)  //　ブロック送信
        logger.info(result);
    }
    catch (error) {
        logger.error(error);
    }
})

// モーダル
app.action<BlockButtonAction>("add_zabbix_host", async (e) => {

    e.client.views.open({
        trigger_id: e.body["trigger_id"],
        view: {
            "type": "modal",
            "callback_id": "submit_zabbix_host",
            "title": { "type": "plain_text", "text": "Add Zabbix Server" },
            "submit": { "type": "plain_text", "text": "Add" },
            "close": { "type": "plain_text", "text": "Cancel" },
            blocks: addZabbixServerModal
        }
    })
    e.ack()
});

app.view("submit_zabbix_host", async (e) => {
    const { zabbix_url, zabbix_token } = e.view.state.values;

    const user = e.body.user.id
    const hostname = setSelectHost(user, zabbix_url.zabbix_url.value,)

    setToken(user, hostname, zabbix_token.zabbix_token.value, zabbix_url.zabbix_url.value,)
    sendHomeTab(e, user)
    e.ack()
})

app.action<BlockStaticSelectAction>("select_zabbix_host", async (e) => {
    setSelectHost(e.body.user.id, e.payload.selected_option.value)
    sendHomeTab(e, e.body.user.id)
    e.ack()
})

app.action<BlockStaticSelectAction>("delete_zabbix_host", async (e) => {
    deleteSelectHost(e.body.user.id)
    sendHomeTab(e, e.body.user.id)
    e.ack()
})

app.action<BlockButtonAction>("acknowledge_problem", async (e) => {
    if (e.payload.value) {
        await acknowledgeProblem(e.payload.value, e.body.user.id)
    }
    sendHomeTab(e, e.body.user.id)
    e.ack()
});

app.action<BlockButtonAction>("close_problem", async (e) => {
    if (e.payload.value) {
        await closeProblem(e.payload.value, e.body.user.id)
    }
    sendHomeTab(e, e.body.user.id)
    e.ack()
});


(async () => {
    await app.start();
    console.log('⚡️ Bolt app started');
})();

