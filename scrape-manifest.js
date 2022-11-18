const puppeteer = require("puppeteer");
const fs = require("fs");
const ObjectsToCsv = require("objects-to-csv");

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
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({ width: 1540, height: 700 });

  let scrappedData = [];
  for (let index = 1; index < 17; index++) {
    let url = "";
    if (index == 1) {
      url = `https://themanifest.com/uk/market-research/agencies`;
    } else {
      url = `https://themanifest.com/uk/market-research/agencies?page=${index}`;
    }
    await page.goto(url);

    try {
      await page.waitForSelector("#directory-providers");
    } catch (error) {
      await page.reload();
      console.error(error);
    }

    let results = await page.$$("#directory-providers > div > ul > li");
    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      const element = results[innerIndex];

      // fetch address

      try {
        let address = await element.$eval(
          "div.provider-card__body > ul > li:nth-child(3) > span > span",
          (el) => el.innerText.toLowerCase()
        );
        let regionsNotAllowed = [
          "africa",
          "india",
          "pakistan",
          "bangladesh",
          "sri lanka",
        ];
        console.log("address", address);
        const notAllowed = regionsNotAllowed.some((el) => address.includes(el));
        if (address && notAllowed) {
          console.log("*************************");
          console.log("Found company in region not allowed", address);
          console.log("*************************");
        } else {
          let output = {};
          // fetching name
          try {
            var companyName = await element.$eval(
              "div.provider-card__header.provider-header > h3 > a",
              (el) => el.innerText
            );
            output.name = companyName;
            console.log("companyName", companyName);
          } catch (error) {
            console.log("-------------------------");
            console.log("COMPANY NAME NOT FOUND!!!");
            console.log("Page Number: ", index);
            console.log("Result Number: ", innerIndex);
            console.log("-------------------------");
          }

          // fetching website
          try {
            var companyWebsite = await element.$eval(
              "div.provider-card__intro > a.provider-card__visit-btn.provider-visit.track-website-visit",
              (el) => el.getAttribute("href")
            );
            output.website = companyWebsite;
            console.log("companyWebsite", companyWebsite);
          } catch (error) {
            console.log("-------------------------");
            console.log("COMPANY Website NOT FOUND!!!");
            console.log("Page Number: ", index);
            console.log("Result Number: ", innerIndex);
            console.log("-------------------------");
          }
          if (output.name && output.website) {
            // pushing into main var
            console.log("pushed output: ", output);
            scrappedData.push({
              name: companyName,
              website: companyWebsite,
              url,
            });
          }
        }
      } catch (error) {
        console.log("*************************");
        console.log("ADDRESS NOT FOUND, MOVING ON");
        console.log("*************************");
      }
    }

    await sleep(500);
  }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/manifest.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
