# zabbix_slack_app

Slack APP の Homeタブ で現在発生しているZabbixの障害を表示  
Zabbix API を使用して障害のクローズやアクナレッジが可能  
トークンは設定ごとに公開鍵・秘密鍵を生成し、トークンと秘密鍵は暗号化して保存してます。  

<img width=750 src="./img/slack_home.png" />  

## 使用方法

1. クローンとビルド

```bash
    git clone https://github.com/KajiwaraKensei/zabbix_slack_app.git
    cd zabbix_slack_app
    make init
```

2. `./manifest.yml`からSlack Appを作成しワークスペースにインストール  
`./compose.yml`にTokenを設定  
SLACK_APP_TOKENはApp-Level Tokensから手動で作成

<img  width=750 src="./img/app_level.png" />

compose.yml

```yml  
      SLACK_BOT_TOKEN: ""
      SLACK_APP_TOKEN: ""
```

3. コンテナ起動

watch

```bash
    make up
```

start

```bash
    make prod-up
```

詳細はMakefile確認  


4. Slack App のホームタブを開き、メッセージが表示されたら正常に動作してます  

<img  width=750 src="./img/home_init.png" />  

add zabbix server から設定追加  

<img  width=750 src="./img/add_zabbix_server.png" />

