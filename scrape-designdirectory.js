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
  for (let index = 1; index <= 1; index++) {
    let url = "";
    url = `https://www.designdirectory.com/search?tag=281&page_no=${index}`;

    await page.goto(url, { waitUntil: "load", timeout: 0 });

    try {
      await page.waitForSelector("#searchResults > section");
    } catch (error) {
      await page.reload();
      console.error(error);
    }

    let results = await page.$$eval("#searchResults > section > a", (el) =>
      el.map((x) => x.getAttribute("href"))
    );

    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      await page.waitForTimeout(3000);
      await page.focus('a[href="' + results[innerIndex] + '"]');
      await page.click('a[href="' + results[innerIndex] + '"]', {
        button: "middle",
      });
      await page.waitForTimeout(3000);
      const [tab1, tab2, tab3] = await browser.pages();

      try {
        await tab3.waitForSelector("#firmPage");
      } catch (error) {
        console.error("tab3 Error", error);
      }

      try {
        let address = await tab3.$eval(
          "#complimentary > section.additional > section",
          (el) => el.innerText
        );

        console.log("Address", address);
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
          continue;
        } else {
          let name = "";
          let website = "";
          try {
            name = await tab3.$eval(
              "#firmHeadMain > h1 > a",
              (el) => el.innerText
            );
          } catch (err) {
            console.log("*************************");
            console.log("COMPANY NAME NOT FOUND");
            console.log("*************************");
          }
          try {
            website = await tab3.$eval(
              "#primary > section > section > p > a",
              (el) => el.innerText
            );
          } catch (err) {
            console.log("*************************");
            console.log("COMPANY WEBSITE NOT FOUND");
            console.log("*************************");
          }

          if (name && website) {
            scrappedData.push({ companyName: name, website: website });
          }
        }
      } catch (error) {
        console.log("*************************");
        console.log("ADDRESS NOT FOUND, MOVING ON");
        console.log("*************************");
      }
      await page.waitForTimeout(3000);
      await tab3.close();
      await tab2.bringToFront();
      continue;
    }

    await sleep(1000);
  }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("design-directory.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
