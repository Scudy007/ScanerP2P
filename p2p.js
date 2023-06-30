const puppeteer = require("puppeteer");
const binanceUrls = ['https://p2p.binance.com/ru/trade/TinkoffNew/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/RosBankNew/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/RaiffeisenBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/PostBankNew/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/MTSBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/HomeCreditBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/AkBarsBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/UralsibBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/BCSBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/RenaissanceCredit/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/RussianStandardBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/BankSaintPetersburg/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/UniCreditRussia/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/CreditEuropeBank/USDT?fiat=RUB',
'https://p2p.binance.com/ru/trade/CitibankRussia/USDT?fiat=RUB',];
const targetElements = [
  '.C2Cofferlistsell_link_merchant',
  '.css-1m1f8hn',
  '.css-dyl994',
  '.css-4cffwv',
  '.css-tlcbro',
];


const fetchDataFromElements = async (page, elements) => { /* ... */ };

const fetchPageData = async (browser, url) => {
  const page = await browser.newPage();
  // Настройка обработчика перехвата запросов
  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (request.resourceType() === "image" || request.resourceType() === "font") {
      request.abort();
    } else {
      request.continue();
    }
  });

  console.log(`Fetching data for ${url}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 300000 });

  try {
    const data = await fetchDataFromElements(page, targetElements);
    console.log(`Data for ${url}: `, data);
    await page.close();
    return { url, data };
  } catch (error) {
    console.log(`Error fetching data for ${url}: `, error.message);
    await page.close();
    return { url, error };
  }
};

const main = async () => {
  const browser = await puppeteer.launch({ headless: true });

  while (true) {
    const promises = binanceUrls.map((url) => fetchPageData(browser, url));
    const results = await Promise.all(promises);

    console.log("All results: ", results);

    await new Promise((resolve) =>
      setTimeout(resolve, 300000)
    ); // Пауза на 5 минут (300000 мс) перед повторением цикла
  }

  // Опционально: закрыть браузер, но это не будет выполнено в случае бесконечного цикла
  // await browser.close();
};

main();