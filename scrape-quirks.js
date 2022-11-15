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
  for (let index = 1; index <= 2; index++) {
    let url = "";
    if (index == 1) {
      url = `https://www.quirks.com/directories/sourcebook/industries/advertising-agencies`;
    } else {
      url = `https://www.quirks.com/directories/sourcebook/industries/advertising-agencies?page=${index}#results`;
    }
    await page.goto(url, { timeout: 0 });

    try {
      await page.waitForSelector("#results");
    } catch (error) {
      await page.reload();
      console.error(error);
    }

    let results = await page.$$(
      "#results > div > div.col-md-8.col-lg-9 > ul > li"
    );
    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      const element = results[innerIndex];

      // fetch address

      try {
        let address = await element.$eval(
          "#results > div > div.col-md-8.col-lg-9 > ul > li > div > div.col-md-4.side > address",
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
          console.log("Found company in region not allowed");
          console.log("Address: ", address);
          console.log("Page Number: ", index);
          console.log("Result Number: ", innerIndex);
          console.log("*************************");
        } else {
          let output = {};
          // fetching name
          try {
            var companyName = await element.$eval(
              "#results > div > div.col-md-8.col-lg-9 > ul > li > div > div.col-md-8.main > h3 > a",
              (el) => el.innerHTML
            );
            output.name = companyName;
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
              "#results > div > div.col-md-8.col-lg-9 > ul > li > div > div.col-md-8.main > div.buttons > a.text-btn.yellow",
              (el) => el.getAttribute("href")
            );
            output.website = companyWebsite;
          } catch (error) {
            console.log("-------------------------");
            console.log("COMPANY Website NOT FOUND!!!");
            console.log("Page Number: ", index);
            console.log("Result Number: ", innerIndex);
            console.log("-------------------------");
          }
          if (output.name && output.website) {
            // pushing into main var
            scrappedData.push({
              name: companyName,
              website: companyWebsite,
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
  await csv.toDisk("quriks.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
