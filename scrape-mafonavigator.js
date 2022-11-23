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

  let url = `https://www.mafonavigator.de/unternehmensliste/marktforschung-deutschland`;

  await page.goto(url, { waitUntil: "load", timeout: 0 });

  try {
    await page.waitForSelector("#article");
  } catch (error) {
    await page.reload();
    console.error(error);
  }

  let results = await page.$$("#article > div > div.row");
  console.log("result length", results.length);

  for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
    await sleep(3000);
    const element = results[innerIndex];
    try {
      await element.$eval("#article > div > div.row > div > a", (el) => {
        el.setAttribute("target", "_blank");
        return el.click();
      });

      await await sleep(3000);
      const [tab1, tab2, tab3] = await browser.pages();

      try {
        await tab3.waitForSelector("#content", {
          timeout: 0,
        });
      } catch (error) {
        console.error("tab3 Error", error);
      }

      let name = "";
      let website = "";
      try {
        name = await tab3.$eval(
          "#headercompany > div > div.col-xs-5 > div.ue10",
          (el) => el.innerText.split("\n")[0]
        );
        console.log("name", name);
      } catch (err) {
        console.log("*************************");
        console.log("COMPANY NAME NOT FOUND");
        console.log("*************************");
      }
      try {
        website = await tab3.$eval(
          "#headercompany > div > div.col-xs-5 > div.row:last-child > div.txt10.col-xs-10 > a",
          (el) => {
            const data = el.getAttribute("href");
            if (
              data.includes("http") ||
              data.includes("www") ||
              data.includes("https")
            ) {
              return data;
            } else {
              console.log("website not found");
            }
          }
        );
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

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/mafonavigator.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
