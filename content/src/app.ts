import { App, LogLevel } from "@slack/bolt";
import { acknowledgeProblem, closeProblem, getZabbixProblem } from "./zabbix";
import { setToken } from "./token";
import { sendHomeTab } from "./slack";

const app = new App({
    logLevel: LogLevel.WARN,
    socketMode: true,
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
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
        setToken(e.body.user.id, e.payload.value)
    }
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
});

app.action("acknowledge_problem", async (e: any) => {
    if (e.payload.value) {
        await acknowledgeProblem(e.payload.value)
    }
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
});

app.action("close_problem", async (e: any) => {
    if (e.payload.value) {
        await closeProblem(e.payload.value)
    }
    const block = await getZabbixProblem(e.body.user.id)
    sendHomeTab({ ...e, event: { user: e.body.user.id } }, block)
    e.ack()
});


(async () => {
    await app.start();
    console.log('⚡️ Bolt app started');
})();

