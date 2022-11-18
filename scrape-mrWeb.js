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
  //   for (let index = 1; index < 3; index++) {
  let url = "https://www.mrweb.com/results/agsrch1221015104042.htm";
  await page.goto(url);

  try {
    await page.waitForSelector("#main_content_row_2_agcy_srch");
  } catch (error) {
    await page.reload();
    console.error(error);
  }

  let results = await page.$$(
    "#main_content_row_2_agcy_srch > div.agency_direc_body > table > tbody > tr > td > table"
  );
  for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
    const element = results[innerIndex];
    console.log("element", element);
    // fetch address

    try {
      let address = await element.$eval(
        "#main_content_row_2_agcy_srch > div.agency_direc_body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(10)",
        (el) => {
          console.log("el", el, el.innerHTML, el.innerText);
          return el.innerText.toLowerCase();
        }
      );
      let regionsNotAllowed = [
        "africa",
        "india",
        "pakistan",
        "bangladesh",
        "sri lanka",
      ];

      console.log("Address", address);

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
        let output = {};
        // fetching name
        try {
          var companyName = await element.$eval(
            "#main_content_row_2_agcy_srch > div.agency_direc_body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > span:nth-child(4)",
            (el) => el.innerHTML
          );
          console.log("companyName", companyName);
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
            "#main_content_row_2_agcy_srch > div.agency_direc_body > table > tbody > tr > td > table > tbody > tr:nth-child(2) > td:nth-child(2) > a:nth-child(16)",
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

          scrappedData.push({ name: companyName, website: companyWebsite });
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
  await csv.toDisk("./scrappedData/mrWeb.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
