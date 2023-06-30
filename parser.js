const puppeteer = require("puppeteer");
const fs = require("fs");
const urls = [
  'https://p2p.binance.com/ru/trade/TinkoffNew/USDT?fiat=RUB',
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
  'https://p2p.binance.com/ru/trade/CitibankRussia/USDT?fiat=RUB',
  'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=14',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=1',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=532',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=102',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=44',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=64',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=66',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=185',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=533',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=377',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=382',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=71',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=75',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=271',
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=381',
];

const fetchMenuLinks = async (page, url) => {
  if (url.includes("binance.com")) {
    return await page.$$eval(".css-8f6za h2", (elems) =>
      elems.map((elem) => elem.textContent.trim())
    );
  } else if (url.includes("bybit.com")) {
    return await page.$$eval(".token-image", (elems) =>
      elems.map((elem) => elem.href)
    );
  } else {
    return [url];
  }
};

const fetchPageData = async (url) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
  const links = await fetchMenuLinks(page, url);
  const results = [];
  for (const link of links) {
    if (url.includes("binance.com")) {
      const crypto = link;
      if (crypto) {
        const updatedUrl = url.replace("USDT", crypto);
        await page.goto(updatedUrl, { waitUntil: "networkidle2", timeout: 60000 });
        const data = await page.evaluate(() => {
          const firstOrder = document.querySelector(".css-1q1sp11");
          if (!firstOrder) return null;
          const userName = firstOrder.querySelector(".css-1jb7fpj a").textContent.trim();
          const price = firstOrder.querySelector(".css-1m1f8hn").textContent.trim();
          const paymentMethods = firstOrder.querySelector(".css-10nf7hq").textContent.trim();
          const currency = firstOrder.querySelector(".css-dyl994").textContent.trim();
          const priceValue = parseFloat(price.replace(",", "."));
          const pageUrl = window.location.href;
          const cryptoStartIndex = pageUrl.lastIndexOf("/") + 1;
          const cryptoEndIndex = pageUrl.lastIndexOf("?");
          const crypto = pageUrl.substring(cryptoStartIndex, cryptoEndIndex);
          return { userName, currency, priceValue, paymentMethods, crypto, exchange: "Binance" };
        });
        if (data) {
          results.push({ link: url, data });
        }
      }
    } else if(url.includes("bybit.com")) {
      await page.goto(link, { waitUntil: "networkidle2", timeout: 60000 });
      const data = await page.evaluate(() => {
        const firstOrder = document.querySelector(".tipsBox:nth-of-type(1)");
        if (!firstOrder) return null;
        const userName = firstOrder.querySelector(".advertiser-name css-7o12g0 ant-tooltip-custom bds-theme-component-light").textContent.trim();
        const price = firstOrder.querySelector(".price-amount").textContent.trim();
        const paymentMethods = firstOrder.querySelector(".trade-list-tag").textContent.trim();
        const splitPrice = price.split(" ");
        const currency = firstOrder.querySelector(".css-dyl994").textContent.trim();
        const priceValue = parseFloat(splitPrice[0].replace(",", "."));
        const pageUrl = window.location.href;
        const urlParts = pageUrl.split("/");
        const crypto = (urlParts.slice(-2, -1)[0].split("-")[1] || "Unknown").toUpperCase();
        return { userName, currency, priceValue, paymentMethods, crypto, exchange: "Bybit" };
      });
      if (data) {
        results.push({ link, data });
      }
    } 
    }
    
    await browser.close();
    return results;
    };

const normalizePaymentMethod = (method) => {
  const lowerMethod = method.toLowerCase();
  if (lowerMethod.includes("тинькоф") || lowerMethod.includes("tinkoff")) {
    return "tinkoff";
  } else if (
    lowerMethod.includes("сбербанк") ||
    lowerMethod.includes("sberbank") ||
    lowerMethod.includes("росбанк") ||
    lowerMethod.includes("rosbank")
  ) {
    return "sberbank";
  } else {
    return method;
  }
};

const groupResults = (results) => {
  const groupedResults = new Map();
  results.forEach((result) => {
    const crypto = result.data.crypto.toUpperCase();
    const paymentMethod = normalizePaymentMethod(result.data.paymentMethods);
    const key = `${crypto}-${paymentMethod}`;
    if (!groupedResults.has(key)) {
      groupedResults.set(key, []);
    }
    groupedResults.get(key).push(result);
  });
  return groupedResults;
};

const findMinMaxAndDifference = (groupedResults) => {
  const newResults = [];
  groupedResults.forEach((value, key) => {
    const minResult = value.reduce((prev, current) =>
      prev.data.priceValue < current.data.priceValue ? prev : current
    );
    const maxResult = value.reduce((prev, current) =>
      prev.data.priceValue > current.data.priceValue ? prev : current
    );
    const percentDifference = parseFloat(
      (((maxResult.data.priceValue - minResult.data.priceValue) /
        maxResult.data.priceValue) *
        100).toFixed(2)
    );
    newResults.push({ minResult, maxResult, percentDifference });
  });
  return newResults;
};

const updateConsole = (results) => {
  const groupedResults = groupResults(results);
  const newResults = findMinMaxAndDifference(groupedResults);

  const filteredResults = newResults.filter(
    (result) => result.percentDifference !== 0
  );

  const rows = filteredResults
    .map((result) => ({
      minExchange: result.minResult.data.exchange,
      maxExchange: result.maxResult.data.exchange,
      minUserName: result.minResult.data.userName,
      maxUserName: result.maxResult.data.userName,
      crypto: result.minResult.data.crypto,
      price: `${result.minResult.data.priceValue} / ${result.maxResult.data.priceValue}`,
      currency: result.minResult.data.currency,
      paymentMethods: result.minResult.data.paymentMethods,
      percentDifference: `${result.percentDifference}%`
    }));

  console.table(rows);
};

const main = async () => {
  const promises = urls.map((url) => fetchPageData(url));
  const results = [].concat(...(await Promise.all(promises)));
  updateConsole(results);
};

// Выполнить функцию main() сначала сразу
main();

// Затем повторять выполнение каждые 60 секунд (60000 миллисекунд)
setInterval(main, 60000); 