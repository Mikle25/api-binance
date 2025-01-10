import Express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import * as dotenv from "dotenv";
import { P2p } from "./p2p.js";
import { Spot } from "./spot.js";
import schedule from "node-schedule";
import { Telegraf, Markup } from "telegraf";
import axios from "axios";

dotenv.config();

const app = new Express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const p2p = new P2p(app);
p2p.postP2p();

const spot = new Spot(app);
spot.getPairExchange();

app.listen(process.env.PORT || 3002, () => {
  console.log("Start server");
});

// const API_URL = `${process.env.BINANCE_P2P_URL}/friendly/c2c/adv/search`;
const PAYLOAD = JSON.stringify({
  proMerchantAds: false,
  page: 1,
  rows: 5,
  payTypes: ["Monobank"],
  countries: [],
  publisherType: null,
  asset: "USDT",
  fiat: "UAH",
  tradeType: "SELL",
});

// Список подписчиков
const subscribers = new Set();

// Функция для получения данных из API Binance
const fetchBinanceData = async () => {
  try {
    const respons = axios.post(
      `${process.env.BINANCE_P2P_URL}/friendly/c2c/adv/search`,
      PAYLOAD,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = await respons;
    return result.data.data;
  } catch (error) {
    console.error(`Error fetching Binance data: ${error.message}`);
    return null;
  }
};

const formatData = (data) => {
  if (!data) {
    return "\u26A0\ufe0f Не удалось получить данные о курсе.";
  }

  return data
    .map((item) => {
      const price = item.adv.price;
      return `${price} UAH`;
    })
    .join("\n\n");
};

// Задача для отправки уведомлений
const notifyUsers = async (bot) => {
  const data = await fetchBinanceData();
  const message = formatData(data);

  for (const chatId of subscribers) {
    await bot.telegram.sendMessage(chatId, "Price");
    await bot.telegram.sendMessage(chatId, message);
  }
};

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.start((ctx) => {
  const chatId = ctx.chat.id;
  subscribers.add(chatId);
  ctx.reply(
    "\u2705 Вы подписаны на уведомления о курсе.",
    Markup.inlineKeyboard([
      [Markup.button.callback("Показать курс", "show_rate")],
    ])
  );
});

// Команда /stop для отписки
bot.command("stop", (ctx) => {
  const chatId = ctx.chat.id;
  if (subscribers.has(chatId)) {
    subscribers.delete(chatId);
    ctx.reply("\u2705 Вы отписались от уведомлений.");
  } else {
    ctx.reply("\u26A0\ufe0f Вы не подписаны на уведомления.");
  }
});

bot.action("show_rate", async (ctx) => {
  const data = await fetchBinanceData();
  const message = formatData(data);
  await ctx.reply(
    message,
    Markup.inlineKeyboard([
      [Markup.button.callback("Показать курс", "show_rate")],
    ])
  );
});

// Запуск планировщика для уведомлений
schedule.scheduleJob("*/30 * * * *", () => {
  notifyUsers(bot);
});

// Запускаем бота
bot.launch().then(() => {
  console.log("Bot is running...");
});

// Обработка остановки
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
