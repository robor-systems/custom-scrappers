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
  for (let index = 1; index <= 13; index++) {
    let url = `https://directory.esomar.org/results.php?markets=1&alpha=1&page=${index}`;

    await page.goto(url, { waitUntil: "load", timeout: 0 });

    try {
      await page.waitForSelector("#main");
    } catch (error) {
      await page.reload();
      console.error(error);
    }

    let results = await page.$$(
      "#main > div > div.bg-grey-light > div > div:nth-child(1) > div.bg-white.p1-5.mb1.onmobile-mb0-5"
    );
    console.log("result length", results.length);

    for (let innerIndex = 0; innerIndex < results.length; innerIndex++) {
      await sleep(3000);
      const element = results[innerIndex];
      try {
        await element.$eval(
          "div.col.pr1.automobile.onmobile-pr0 > h2 > a",
          (el) => {
            el.setAttribute("target", "_blank");
            return el.click();
          }
        );

        await await sleep(3000);
        const [tab1, tab2, tab3] = await browser.pages();

        try {
          await tab3.waitForSelector("#main", {
            timeout: 0,
          });
        } catch (error) {
          console.error("tab3 Error", error);
        }

        try {
          let address = await tab3.$eval(
            "#main > div:nth-child(2) > div > div.col.pr1.automobile.alignmiddle.onmobile-pr0.onmobile-pt2.onmobile-aligncenter.pb1 > p.p0.mt0.mb0-5",
            (el) => el.innerText.toLowerCase()
          );
          let regionsNotAllowed = [
            "africa",
            "india",
            "pakistan",
            "bangladesh",
            "sri lanka",
          ];

          console.log("Address", address);
          const notAllowed = regionsNotAllowed.some((el) =>
            address.includes(el)
          );
          if (notAllowed) {
            console.log("*************************");
            console.log("Found company in region not allowed", address);
            console.log("*************************");
          } else {
            let name = "";
            let website = "";
            try {
              name = await tab3.$eval(
                "#main > div:nth-child(2) > div > div.col.pr1.automobile.alignmiddle.onmobile-pr0.onmobile-pt2.onmobile-aligncenter.pb1 > h1",
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
                "#main > div.bg-grey-light > div > div > div:nth-child(2) > div > div.col.automedium.automobile.w20e > div > div.col.w13e.automedium.automobile > p > a:nth-child(1)",
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
          }
        } catch (err) {
          console.log("*************************");
          console.log("ADDRESS NOT FOUND, MOVING ON");
          console.log("*************************");
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
  }

  const endTime = new Date().getTime();
  console.log("Scrapped Data: ", scrappedData);
  const csv = new ObjectsToCsv(scrappedData);
  await csv.toDisk("./scrappedData/esomar.csv", { append: true });
  console.log("Script completed in", (endTime - startTime) / 1000, "seconds");
  await browser.close();
})();
