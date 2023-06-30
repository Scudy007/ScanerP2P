const puppeteer = require('puppeteer');

const binanceUrls = [
  'https://p2p.binance.com/ru/trade/TinkoffNew/USDT?fiat=RUB',
];
const bybitUrls = [
  'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=14',
];
const urls = [...binanceUrls, ...bybitUrls];

const targetElements = [
  '.css-1jb7fpj a',
  '.css-1m1f8hn',
  '.css-dyl994',
  '.css-tlcbro',
  '.css-1v5oc77',
];

async function fetchDataFromUrl(page, url) {
  console.log(`Fetching data from ${url}`);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

  const dataPromises = targetElements.map((element) =>
    page
      .$eval(element, (el) => el.textContent.trim())
      .catch(() => null)
  );
  const data = await Promise.all(dataPromises);

  return data.filter((item) => item !== null);
}

async function main() {
  const browser = await puppeteer.launch({
    defaultViewport: null,
    args: ['--disable-web-security'],
  });

  await Promise.all(urls.map(async (url) => {
    const page = await browser.newPage();

    // Отключение загрузки шрифтов и изображений.
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (
        req.resourceType() === 'font' ||
        req.resourceType() === 'image'
      ) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const parsedData = await fetchDataFromUrl(page, url);

    console.log(parsedData);
    await page.close();
  }));
  
  await browser.close();
}

main().catch((error) => {
  console.error(`Error: ${error}`);
});