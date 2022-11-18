const puppeteer = require("puppeteer");
const fs = require("fs");
const { parse } = require("csv-parse");
const ObjectsToCsv = require("objects-to-csv");

// sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

//Read Urls
const urls = [];
fs.createReadStream("./scrappedData/urls.csv")
  .pipe(parse({ delimiter: ",", from_line: 2 }))
  .on("data", (row) => {
    urls.push(...row);
  });

(async () => {
  // record script completion time
  const startTime = new Date().getTime();
  const browser = await puppeteer.launch({
    devtools: false,
    headless: false,
    args: ["--start-maximized"],
  });
  //   const context = await browser.createIncognitoBrowserContext();
  //   const page = await context.newPage();
  const page = await browser.newPage();

  await page.setViewport({ width: 1540, height: 700 });

  let scrappedData = [];

  for (let innerIndex = 0; innerIndex < urls.length; innerIndex++) {
    await page.goto(`https://www.mrs.org.uk${urls[innerIndex]}`, {
      waitUntil: "load",
      timeout: 0,
    });

    try {
      await page.waitForSelector("#ama-layout-29992", { timeout: 0 });
    } catch (error) {
      console.error("Selector not found");
    }
    let name = "";
    let website = "";
    try {
      name = await page.$eval("#company_header", (el) => el.innerText);
      console.log("companyName", name);
    } catch (err) {
      console.log("*************************");
      console.log("COMPANY NAME NOT FOUND");
      console.log("*************************");
    }
    try {
      website = await page.$eval(
        "#ama-field-75122 > div > div > p.address_block > span > a",
        (el) => el.getAttribute("href")
      );
      console.log("companyWebsite", website);
    } catch (err) {
      console.log("*************************");
      console.log("COMPANY WEBSITE NOT FOUND");
      console.log("*************************");
    }

    console.log("output", name, website);
    if (name && website) {
      scrappedData.push({ name: name, website: website });
    }
  }

  await sleep(1000);

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/mrs.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();

// Scroll page to get data

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      var totalHeight = 0;
      var distance = 100;
      var timer = setInterval(() => {
        var scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 1000);
    });
  });
}
