const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const currency = require('currency.js');
const TelegramBot = require('node-telegram-bot-api');
const token = '2050529872:AAEKQzgJfq1T6qk9PtqdHwFMHJepSFPvy-g';
const bot = new TelegramBot(token, {polling: true});


const data = {
  updateTerakhir: '',
  hargaSekarang: '',
  hargaSebelumnya: '',
  perubahanHarga: ''
}
let sendingData = 'Update Harga\n\n';

async function getPrice() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
  await page.goto('https://www.logammulia.com/id', {waitUntil: 'domcontentloaded'});
  await page.screenshot({ path: 'example.png' });

  const content = await page.content();
  const $ = cheerio.load(content);

  $('.child-4 .content p .text').slice(0, 5).each((idx, elem) => {
    const text = $(elem).text();
    if(text) Object.assign(data, { ...data, updateTerakhir: text.split(' ').slice(2).join(' ') });
  });

  $('.child-2 .content p').slice(0, 5).each((idx, elem) => {
    let text = $(elem).text();
    if(text) {      
      text = text.split('\n').filter(String);
      if(text.length == 2) Object.assign(data, { ...data, hargaSekarang: text[0].split(' ').slice(1).join('').split(',').slice(0, 1).join('').replace('.',',') });
      if(text.length == 1) Object.assign(data, { ...data, hargaSebelumnya: text[0].split(': ').slice(1).join('').split(',').slice(0, 1).join('').replace('.',',') });
      
      let status = currency(data.hargaSekarang).value - currency(data.hargaSebelumnya).value;
      Object.assign(data, { ...data, perubahanHarga: currency(status, { symbol: 'Rp', precision: 0 }).format() });
    }
  });

  for (let key in data) sendingData += `${key}: ${data[key]} \n`;
  await browser.close();
}


// TELEGRAM BOT
bot.onText(/\/cekharga/, async (msg) => {
  const chatId = msg.chat.id;
  sendingData = 'Update Harga\n\n'
  await getPrice();
  bot.sendMessage(chatId, sendingData)
});