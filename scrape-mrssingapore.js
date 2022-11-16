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
  let currentPage = 1;
  let pagesToScrape = 5;
  let scrappedData = [];
  //   for (let index = 1; index < 3; index++) {
  let url =
    "https://www.mrssingapore.org.sg/about-us-overview/about-us-member-directory";

  await page.goto(url, { timeout: 0 });

  try {
    await page.waitForSelector("#directory");
  } catch (error) {
    await page.reload();
    console.error(error);
  }

  for (let index = 1; index <= 4; index++) {
    await sleep(1000);
    const newResults = await page.evaluate(async () => {
      const data = [];
      const results = document.querySelectorAll("#directory > tbody > tr");

      results.forEach(async (el) => {
        if (el.getAttribute("class").includes("alphabet-group")) {
          console.log("skip");
        } else {
          const btn = el.querySelector("td:nth-child(2) > button");
          btn.click();
          console.log("clicked");
          let output = {};
          // fetching name
          var companyName = el.querySelector(
            "div > div > div.col-md-7 > p:nth-child(1) > strong"
          ).innerText;
          console.log("companyName ", companyName);
          output.name = companyName;

          // fetching website

          var companyWebsite = el.querySelectorAll(
            "div > div > div.col-md-7 a"
          );
          companyWebsite.forEach((item) => {
            console.log("website innerText", item.innerText);
            if (
              item.innerText.includes("http") ||
              item.innerText.includes("https") ||
              item.innerText.includes("www")
            ) {
              output.website = item.innerText;
            }
          });

          if (output.name && output.website) {
            // pushing into main var
            data.push({
              name: companyName,
              website: output.website,
            });
          }
        }
      });

      return data;
    });
    console.log("in scrapped Data", newResults);
    // Go to next page
    scrappedData.push(...newResults);
    await page.$eval("#directory_next", (el) => el.click());
    await sleep(1000);
  }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/mrssingapore.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  //   await browser.close();
})();
