// const puppeteer = require("puppeteer");
const fs = require("fs");
const puppeteer = require("puppeteer-extra");
const randUserAgent = require("rand-user-agent");
const ObjectsToCsv = require("objects-to-csv");

const agent = randUserAgent("desktop");
console.log(agent);

// add stealth plugin and use defaults (all evasion techniques)
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

// sleep function
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  // record script completion time
  const startTime = new Date().getTime();
  const browser = await puppeteer.launch({
    devtools: false,
    headless: true,
    args: ["--start-maximized"],
  });
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1540, height: 700 });

  await page.setUserAgent(agent);

  let scrappedData = [];

  //Scrape pages i = no of pages
  for (let index = 0; index <= 408; index++) {
    let url = "";
    if (!index) {
      url = `https://clutch.co/agencies`;
    } else {
      url = `https://clutch.co/agencies?page=${index}`;
    }

    await page.goto(url);

    try {
      await page.waitForSelector("section#providers");
    } catch (error) {
      await page.reload();
      console.error(error);
    }

    let results = await page.$$(".directory-list .provider-row");
    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      const element = results[innerIndex];

      // fetch address

      try {
        let address = await element.$eval(
          "div.col-md-3.provider-info__details > div > div:nth-child(4) > span",
          (el) => el.innerText.toLowerCase()
        );
        let regionsNotAllowed = [
          "africa",
          "india",
          "pakistan",
          "bangladesh",
          "sri lanka",
        ];

        const notAllowed = regionsNotAllowed.some((el) => address.includes(el));
        if (address && notAllowed) {
          console.log("*************************");
          console.log(
            "Found company in region not allowed",
            address,
            index,
            innerIndex
          );
          console.log("*************************");
        } else {
          // if country is allowed scrap data
          const companyName = await element.$eval(
            "div.row.provider-info--header > div > h3 > a",
            (el) => el.innerText
          );

          const website = await element.$eval(
            "ul > li.website-link.website-link-a > a",
            (el) => el.getAttribute("href")
          );
          if (website && companyName) {
            scrappedData.push({ companyName, website });
          }
          console.log("compnay website + name", companyName, website);
        }
      } catch (error) {
        console.log("in error");
        console.log("*************************");
        console.log("ADDRESS NOT FOUND, MOVING ON");
        console.log("*************************");
      }
    }

    await sleep(1000);
  }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/agencies.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
