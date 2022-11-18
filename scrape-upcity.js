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
  //   const context = await browser.createIncognitoBrowserContext();
  //   const page = await context.newPage();
  const page = await browser.newPage();

  await page.setViewport({ width: 1540, height: 700 });

  let scrappedData = [];
  // for (let index = 1; index <= 1; index++) {
  let url =
    "https://upcity.com/uk/market-research?page=2&list_sort_by=sponsorship_score&list_sort_order=desc";

  await page.goto(url, { waitUntil: "load", timeout: 0 });

  try {
    await page.waitForSelector("#providers");
  } catch (error) {
    await page.reload();
    console.error(error);
  }

  //    "#lists > div:nth-child(1) > div.s5vfw7v > div:nth-child(5) > div:nth-child(3)";
  let results = await page.$$("#lists .c1tpl7u4.s1cv79vu.thd531z.gc1m0df");

  console.log("results", results.length);
  for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
    const element = results[innerIndex];
    await sleep(3000);
    await element.$eval(".t164o0ez.wwnygx3.standalone.b1otow1k", (el) =>
      el.click()
    );
    await sleep(3000);
    const [tab1, tab2, tab3] = await browser.pages();
    try {
      await tab3.waitForSelector("#sticky-header-threshold");
    } catch (error) {
      console.error("tab3 Error", error);
    }

    let output = {};
    try {
      const companyName = await tab3.$eval(
        "#gtm-profile-box-name",
        (el) => el.innerText
      );
      output.name = companyName;
      console.log("companyName", companyName);
    } catch (err) {
      console.log("*************************");
      console.log("COMPANY NAME NOT FOUND");
      console.log("*************************");
    }
    try {
      const companyWebsite = await tab3.$eval(
        ".pnewwq0.b19mbsb0.b1otow1k",
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
  }

  await sleep(1000);
  // }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/upcity.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
