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
  //   for (let index = 1; index <= 1; index++) {
  let url =
    "https://researchsociety.com.au/research-company-directory/search/?command=getresults&Filter::ResearchFields::SelectMany=74";

  await page.goto(url, { waitUntil: "load", timeout: 0 });

  try {
    await page.waitForSelector("div.wrapper > div > section");
  } catch (error) {
    await page.reload();
    console.error(error);
  }

  let results = await page.$$("#cdresults > li");
  console.log("result length", results.length);

  for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
    await sleep(3000);
    const element = results[innerIndex];
    try {
      await element.$eval("h3 > a", (el) => {
        el.setAttribute("target", "_blank");
        return el.click();
      });

      await await sleep(3000);
      const [tab1, tab2, tab3] = await browser.pages();

      try {
        await tab3.waitForSelector("div.wrapper > div > section", {
          timeout: 0,
        });
      } catch (error) {
        console.error("tab3 Error", error);
      }

      let name = "";
      let website = "";
      try {
        name = await tab3.$eval(
          "section > div > div > div.viewEntity > div > h2",
          (el) => el.innerText.split("\n")[0]
        );
        console.log("name", name);
      } catch (err) {
        console.log("*************************");
        console.log("COMPANY NAME NOT FOUND");
        console.log("*************************");
      }
      try {
        website = await tab3.$eval("#contactDetails a", (el) => {
          if (
            el.innerText.includes("http") ||
            el.innerText.includes("www") ||
            el.innerText.includes("https")
          ) {
            return el.innerText;
          } else {
            console.log("website not found");
          }
        });
        console.log("website", website);
      } catch (err) {
        console.log("*************************");
        console.log("COMPANY WEBSITE NOT FOUND");
        console.log("*************************");
      }

      console.log("output data", website, name);

      if (name && website) {
        scrappedData.push({ name: name, website: website });
      }

      await sleep(3000);
      await tab3.close();
      await tab2.bringToFront();
      continue;
    } catch (err) {
      console.log("On click error", err);
    }
  }

  await sleep(1000);
  //   }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/researchsociety.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
