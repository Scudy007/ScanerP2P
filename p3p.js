const puppeteer = require("puppeteer");
const bybitUrls = ['https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=14',
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
'https://www.bybit.com/fiat/trade/otc/?actionType=1&token=USDT&fiat=RUB&paymentMethod=381',];
const targetSelectors = [
  '.advertiser-name',
  '.price-amount',
  '.price-unit',
  '.ql-value',
  '.trade-list-tag',
];

const fetchDataFromElements = async (page) => {
  const data = await page.$$eval('.otc-offerblock', (blocks) =>
    blocks.map((block) => ({
      advertiserName: block.querySelector(targetSelectors[0])?.textContent.trim() || null,
      priceAmount: block.querySelector(targetSelectors[1])?.textContent.trim() || null,
      priceUnit: block.querySelector(targetSelectors[2])?.textContent.trim() || null,
      qlValue: block.querySelector(targetSelectors[3])?.textContent.trim() || null,
      tradeListTag: block.querySelector(targetSelectors[4])?.textContent.trim() || null,
    }))
  );
  return data;
};

const fetchByUrl = async (browser, url) => {
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (req) => {
    if (req.resourceType() === 'font' || req.resourceType() === 'image') {
      req.abort();
    } else {
      req.continue();
    }
  });

  console.log(`Fetching data for ${url}`);
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

  try {
    const data = await fetchDataFromElements(page);
    console.log(`Data for ${url}: `, data);
  } catch (error) {
    console.log(`Error fetching data for ${url}: `, error.message);
  }

  await page.close();
};

const main = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--blink-settings=imagesEnabled=false,fontsEnabled=false',
    ],
  });

  while (true) {
    const promises = bybitUrls.map((url) => fetchByUrl(browser, url));

    await Promise.all(promises);

    await new Promise((resolve) => setTimeout(resolve, 60000)); // Пауза на 5 минут (300000 мс) перед повторением цикла
  }

  // Опционально: закрыть браузер, но это не будет выполнено в случае бесконечного цикла
  // await browser.close();
};

main();