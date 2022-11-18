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
  //   for (let index = 1; index <= 2; index++) {
  let url = "https://99firms.com/market-research-companies/#gref";

  await page.goto(url, { timeout: 0 });

  try {
    await page.waitForSelector(
      "#app > section > div.container > div.col-lg-10.offset-lg-1.p0 > div"
    );
  } catch (error) {
    await page.reload();
    console.error(error);
  }

  let results = await page.$$(
    "#app > section > div.container > div.col-lg-10.offset-lg-1.p0 > div > div"
  );
  for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
    const element = results[innerIndex];

    // fetch address

    try {
      let address = await element.$eval(
        "div:nth-child(2) > div:nth-child(2) > p:nth-child(5) > span",
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
            "div:nth-child(1) > div.d-flex.top-details.flex-wrap > h2 > a",
            (el) => el.innerHTML
          );
          output.name = companyName;
          console.log("company name", companyName);
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
            "div:nth-child(1) > div.actions > div > a",
            (el) => el.getAttribute("href")
          );
          output.website = companyWebsite;
          console.log("company website", companyWebsite);
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
  //   }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/99firms.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
