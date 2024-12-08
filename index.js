require('dotenv').config()
const {RestClientV5, WebsocketClient, DefaultLogger} = require('bybit-api')
const { Bot } = require('grammy')
const { WebSocket } = require('ws') 
  const useTestnet = false
  const client = new RestClientV5({
    key: process.env.API_KEY,
    secret: process.env.API_SECRET,
    testnet: useTestnet, 
  }
  )

  let arrTheSearch = {
      max: '100070',
      min: '80000'
  }
const bot  = new Bot(process.env.API_BOT)

bot.api.setMyCommands([
  {command:'start', description:'Start the bot'},
  {command:'wallet', description:'Chekend the bot'},
  {command: 'position', description:'data of position'}
])
let strBuy = ''
let strBtc = ''
let pos = 'Пусто ни чего не набрал'
const url = "wss://stream.bybit.com/v5/public/spot"
const connection =  new WebSocket(url)
const logger = {
  ...DefaultLogger,
  silly: (...params) => console.log('silly', ...params),
};
const wsClient = new WebsocketClient(
  {
    market: 'v5',
  },
  logger,
);
// Функция покупки
async function getOrder() {
  client
  .submitOrder({
    category: 'spot',
    symbol: '1INCHUSDT',
    side: 'Buy',
    orderType: 'Market',
    qty: '420',
  })
  .then((response) => {
    pos = response.result.orderId
    console.log(response.result.orderId);
  })
  .catch((error) => {
    console.error(error);
  });
}
wsClient.on('update', (data) => {
  // Условие входа в сделку
  if (Number(data.data[0].close) < arrTheSearch.min) {
    getOrder()
  }
});
const topics = 'kline.5.BTCUSDT';
wsClient.subscribeV5(topics, 'spot');
async function getBtcDate() {
  client
  .getServerTime()
  .then((response) => {
    client
    .getKline({
      category: 'spot',
      symbol: 'BTCUSDT',
      interval: '1',
      start: response.time,
      end: response.time,
  })
  .then((response) => {
    strBtc = response.result.list[0][4] 
  })})
}
getBtcDate()
bot.command('start', async (ctx) => {
  await ctx.reply(strBtc + ' ' + 'USDT')
})
// Работа Бота: Данные по балансу
async function getBalance() {
  client
    .getWalletBalance({
        accountType: 'UNIFIED',
        coin: 'USDT',
    })
    .then((response) => {
      strBuy = Math.floor(response.result.list[0].coin[0].walletBalance)
    })
    .catch((error) => {
        console.error(error);
    });
}
getBalance()
bot.command('wallet', async (ctx) => {
  await ctx.reply(strBuy + '_' + 'USDT')
  let user = ctx.msg.from.id
})
bot.command('position', async (ctx) => {
  await ctx.reply(`Новый оредер ${pos}`)
})
bot.start()
