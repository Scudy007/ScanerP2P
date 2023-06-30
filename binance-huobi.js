const puppeteer = require("puppeteer");
const fs = require("fs");
const urls = [
  'https://p2p.binance.com/ru/trade/TinkoffNew/USDT?fiat=RUB',
  'https://p2p.binance.com/ru/trade/RosBankNew/USDT?fiat=RUB',
  'https://www.huobi.com/ru-ru/fiat-crypto/trade/buy-usdt-rub/',
];

const fetchMenuLinks = async (page, url) => {
  if (url.includes("binance.com")) {
    return await page.$$eval(".css-8f6za h2", (elems) =>
      elems.map((elem) => elem.textContent.trim())
    );
  } else if (url.includes("huobi.com")) {
    return await page.$$eval(".trade-coin-change a", (elems) =>
      elems.map((elem) => elem.href)
    );
  } else {
    return [url];
  }
};

const fetchPageData = async (url) => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120000 });
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

          // Handling price value conversion
          const priceWithoutCommas = price.replace(/,/g, "");
          const priceValue = parseFloat(priceWithoutCommas.replace(".", ""));

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
    } else if(url.includes("huobi.com")) {
      await page.goto(link, { waitUntil: "networkidle2", timeout: 60000 });
      const data = await page.evaluate(() => {
        const firstOrder = document.querySelector(".trade-list-in");
        if (!firstOrder) return null;
        const userName = firstOrder.querySelector(".name h3").textContent.trim();
        const price = firstOrder.querySelector(".price").textContent.trim();
        const paymentMethods = Array.from(
          firstOrder.querySelectorAll(".way .payment-block")
        )
          .map((elem) => elem.textContent.trim())
          .join(", ");
        const splitPrice = price.split(" ");
        const currency = splitPrice[1];

        // Handling price value conversion
        const priceWithoutCommas = splitPrice[0].replace(/,/g, "");
        const priceValue = parseFloat(priceWithoutCommas.replace(".", ""));

        const pageUrl = window.location.href;
        const urlParts = pageUrl.split("/");
        const crypto = (urlParts.slice(-2, -1)[0].split("-")[1] || "Unknown").toUpperCase();
        return { userName, currency, priceValue, paymentMethods, crypto, exchange: "Huobi" };
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
};   const groupResults = (results) => {
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
      (result) => result.percentDifference !== 0 && result.minResult.data.exchange !== result.maxResult.data.exchange
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