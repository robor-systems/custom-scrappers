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
  let urls = [
    "https://www.greenbook.org/SearchBySpeciality/ViewMore?specialty=website-usability&page=1&pageSize=10&toSkip=12&seed=1800611479",
    "https://www.greenbook.org/SearchBySpeciality/ViewMore?specialty=website-usability&page=2&pageSize=10&toSkip=12&seed=1800611479",
    "https://www.greenbook.org/SearchBySpeciality/ViewMore?specialty=website-usability&page=3&pageSize=10&toSkip=12&seed=1800611479",
    "https://www.greenbook.org/SearchBySpeciality/ViewMore?specialty=website-usability&page=4&pageSize=10&toSkip=12&seed=1800611479",
  ];
  for (let index = 0; index < urls.length; index++) {
    let url = urls[index];

    await page.goto(url);

    // try {
    //   await page.waitForSelector("#VendorResults");
    // } catch (error) {
    //   await page.reload();
    //   console.error(error);
    // }

    let results = await page.$$(".gb-result-item.gb-result-item-even");

    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      const element = results[innerIndex];

      // fetch address

      try {
        let address = await element.$eval(
          "div > div > div.gb-col-content.col-md-9.col-sm-12 > div.gb-result-item-heading-container > div.gb-result-item-heading.pt-2 > div > dl > dd",
          (el) => el.innerText.toLowerCase()
        );
        console.log("address", address);
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
          console.log("*************************");
        } else {
          let output = {};
          // fetching name
          try {
            var companyName = await element.$eval(
              "div > div > div.gb-col-content.col-md-9.col-sm-12 > div.gb-result-item-heading-container > div.gb-result-item-heading.pt-2 > h2 > a > span > b",
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
              "div > div > div.gb-col-content.col-md-9.col-sm-12 > div.gb-result-item-heading-container > div.gb-content-tease-actions > a",
              (el) => el.getAttribute("href")
            );
            output.website = companyWebsite;
          } catch (error) {
            console.log("-------------------------");
            console.log("COMPANY Website NOT FOUND!!!", output.name);
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
  await csv.toDisk("greenbook.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
