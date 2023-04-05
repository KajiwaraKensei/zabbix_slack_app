import moment from "moment";
import { getHosts, getSelectHost, getTokenByUser } from "./token";
import { getProblem } from "./zabbix";

const SEVERITY = [
  "未分類 :grey_question: ",
  "情報 :iphone: ",
  "警告 :eyes: ",
  "軽度の障害 :zap: ",
  "重度の障害 :rotating_light: ",
  "致命的な障害 :skull_and_crossbones: ",
];
moment.locale("ja");

// Zabbix日本語対応
const FIELD: { [key: string]: (i: any) => any } = {
  acknowledged: (i) =>
    `アクナレッジ: ${i === "1" ? ":white_check_mark:" : ":x:"}`,
  clock: (i) => `発生: ${moment(new Date(1000 * Number(i))).format("LLLL")}`,
  r_clock: (i) =>
    i !== "0"
      ? `復旧: ${moment(new Date(1000 * Number(i))).format("LLLL")} :tada:`
      : "復旧: :face_with_spiral_eyes:",
  severity: (i) => `深刻度: ${SEVERITY[Number(i)] || "不明"}`,
};

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
          type: "divider",
        },
        ...(await getZabbixProblem(user)),
      ],
    },
  });
};

// Zabbixの障害を取得
export const getZabbixProblem = async (user: string) => {
  try {
    const token = getTokenByUser(user);

    // トークンがない場合
    if (!token) {
      return [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\nトークンを設定してください`,
          },
        },
      ];
    }

    const prom = await getProblem(token.token, token.url);
    return createProblemCard(prom);
  } catch (error) {
    console.error(error);

    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `データの取得に失敗しました`,
        },
      },
    ];
  }
};

// 障害の表示
const createProblemCard = (prom: any) => {
  const row: any = [];

  prom.forEach((i: any) => {
    row.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*トリガー名: ${i.name}*\n`,
      },
    });
    const block = {
      type: "context",
      elements: [
        ...["clock", "r_clock", "severity", "acknowledged"].map((key) => {
          return {
            type: "mrkdwn",
            text: FIELD[key] ? FIELD[key](i[key]) : `${key}: ${String(i[key])}`,
          };
        }),
      ],
    };
    row.push(block);
    i.r_clock === "0" &&
      row.push({
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "close problem",
            },
            style: "primary",
            value: i.eventid,
            action_id: "close_problem",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "acknowledge event",
            },
            style: "danger",
            value: i.eventid,
            action_id: "acknowledge_problem",
          },
        ],
      });
    row.push({
      type: "divider",
    });
  });

  // 0件の場合
  if (row.length < 1) {
    row.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `現在障害は発生してません`,
      },
    });
  }

  return row;
};

// _______________________________________________________________
// 選択中のホストを表示

export const createSelectHost = (user: string) => {
  const selectHostName = getSelectHost(user);
  const token = getTokenByUser(user);
  const hosts = mapHosts(user);
  const menu: { [key: string]: any }[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: selectHostName
          ? `*<${token?.url}|${selectHostName}>*`
          : "ホストが選択されていません",
      },
      accessory: {
        type: "overflow",
        options: [
          {
            text: {
              type: "plain_text",
              text: ":hatched_chick: Add Zabbix Server",
              emoji: true,
            },
            value: "add_host",
          },
        ],
        action_id: "menu_select",
      },
    },
  ];

  if (selectHostName) {
    menu[0].accessory.options.push({
      text: {
        type: "plain_text",
        text: `:wastebasket: Delete ${selectHostName}`,
        emoji: true,
      },
      value: `delete_host`,
    });
  }

  const temp: { [key: string]: any } = {
    type: "actions",
    elements: [
      {
        type: "static_select",
        placeholder: {
          type: "plain_text",
          emoji: true,
          text: "Change Zabbix Server",
        },
        options: [...mapHosts(user)],
        action_id: "select_zabbix_host",
      },
    ],
  };

  if (hosts.length > 0) {
    menu.push(temp);
  }

  // 一番初めに、追加と削除ボタンを表示
  return menu;
};

// ドロップダウンリストのアイテム
const mapHosts = (user: string) => {
  return getHosts(user).map((hostname) => ({
    text: {
      type: "plain_text",
      emoji: true,
      text: hostname,
    },
    value: hostname,
  }));
};
