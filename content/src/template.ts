import { Block, KnownBlock } from "@slack/bolt"

export const addZabbixServerModal: (Block | KnownBlock)[] = [
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