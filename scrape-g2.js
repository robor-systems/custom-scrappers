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
    headless: false,
    args: ["--start-maximized"],
  });
  //   const context = await browser.createIncognitoBrowserContext();
  //   const page = await context.newPage();
  const page = await browser.newPage();

  await page.setViewport({ width: 1540, height: 700 });

  let scrappedData = [];
  for (let index = 1; index <= 5; index++) {
    if (index === 1) {
      url = "https://www.g2.com/categories/market-research-services";
    } else {
      url = `https://www.g2.com/categories/market-research-services?order=g2_score&page=${index}#product-list`;
    }

    await page.goto(url, { waitUntil: "load", timeout: 0 });

    try {
      await page.waitForSelector("#ajax-container > div:nth-child(7)");
    } catch (error) {
      await page.reload();
      console.error(error);
    }

    //    "#lists > div:nth-child(1) > div.s5vfw7v > div:nth-child(5) > div:nth-child(3)";

    await page.$$eval(
      "#product-cards > div[data-baby-grid-trigger]",
      (el) => el.length
    );
    let results = await page.$$("#product-cards > div[data-baby-grid-trigger]");

    console.log("results", results.length);
    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      const element = results[innerIndex];
      await sleep(3000);
      try {
        await element.$eval(".d-ib.c-midnight-100.js-log-click", (el) => {
          el.setAttribute("target", "_blank");
          return el.click();
        });
        await sleep(3000);
        const [tab1, tab2, tab3] = await browser.pages();
        try {
          await tab3.waitForSelector(".page");
        } catch (error) {
          console.error("tab3 Error", error);
        }

        let output = {};
        try {
          const companyName = await tab3.$eval(
            "div.product-head__title__wrap > div > div.l2.mb-4th > a",
            (el) => el.innerText
          );
          if (companyName.includes("india")) {
            console.log("skip");
          } else {
            output.name = companyName;
          }
          console.log("companyName", companyName);
        } catch (err) {
          console.log("*************************");
          console.log("COMPANY NAME NOT FOUND");
          console.log("*************************");
        }
        try {
          const companyWebsite = await tab3.$eval(
            "div.paper.paper--nestable.border-top > div.grid-x > div:nth-child(1) > div:nth-child(1) > div > div > a",
            (el) => {
              console.log(
                "website",
                el.getAttribute("href"),
                el,
                el.innerHTML,
                el.innerText
              );

              return el.getAttribute("href");
            }
          );
          output.website = companyWebsite;
          console.log("companyWebsite", companyWebsite);
        } catch (err) {
          console.log("*************************");
          console.log("COMPANY WEBSITE NOT FOUND");
          console.log("*************************");
        }

        console.log("output", output);
        if (output.name && output.website) {
          scrappedData.push({
            companyName: output.name,
            website: output.website,
          });
        }

        await sleep(3000);
        await tab3.close();
        await tab2.bringToFront();
        continue;
      } catch (err) {
        console.log("moving on...");
      }
    }

    await sleep(1000);
  }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/g2.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
