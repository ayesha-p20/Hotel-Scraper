const puppeteer = require("puppeteer");
const prompt = require("prompt-sync")();

(async () => {
  try {
    let cityList = [
      "New York",
      "Miami",
      "San Francisco",
      "Los Angeles",
      "Chicago",
      "Las Vegas",
      "Orlando",
      "Washington DC",
      "Seattle",
      "Phoenix",
      "Dallas",
      "Boston",
      "Philadelphia",
      "Denver",
      "Houston",
      "Austin",
    ];
    //var city = prompt("Please enter a city: ");

    // text file handling
    const fs = require("fs");
    let today = new Date();
    let day = today.getDate();
    let month = today.getMonth() + 1;
    let year = today.getFullYear();
    let currentDate = month + "." + day + "." + year;
    let fileName = currentDate + ".txt";
    fs.writeFile(fileName, currentDate + "\n\n\n", (err) => {
      if (err) console.log(err);
    });
    console.log("File created!");

    for (city in cityList) {
      try {
        let cityName = cityList[city];
        console.log("Collecting results for " + cityList[city]);

        const browser = await puppeteer.launch({
          headless: true,
        });
        const page = await browser.newPage();

        //variable to count occurances of each travel agency
        var providerCount = {};

        //google.com
        await page.setExtraHTTPHeaders({ "Accept-Language": "en-US" });
        await page.goto("https://google.com");

        await page.type("input.gLFyf.gsfi", "hotels in " + cityList[city]);
        await page.keyboard.press("Enter");

        //search results
        await page.waitForXPath('//span[contains(text(),"View ")]');
        const btn1 = await page.$x('//span[contains(text(),"View ")]');
        await btn1[0].click();

        //list of hotels
        await page.waitForXPath('//span[contains(text(),"Learn more")]');

        //finding number of advertisements
        let ads = await page.$x("//button[contains(., 'Learn more')]");
        console.log("Number of advertisements: " + ads.length);

        //array to store information of each hotel
        let hotels = [];

        //scraping hotel names
        let hotelNames = await page.evaluate(() => {
          let names = [...document.getElementsByClassName("PVOOXe")].map((el) =>
            el.getAttribute("aria-label")
          );
          return names;
        });
        hotelNames.splice(0, ads.length);

        //getting a list of buttons (excluding ads)
        let buttons = await page.$x(
          "//button[contains(., 'View prices')]/parent::a"
        );
        let urls = await Promise.all(
          buttons.map(
            async (x) => await (await x.getProperty("href")).jsonValue()
          )
        );
        console.log(urls.length);

        console.log("Number of hotels: " + buttons.length);
        let outputData = [];

        for (var i = 0; i < buttons.length; i++) {
          console.log("Hotel: " + i);
          console.log(hotelNames[i]);

          const page2 = await browser.newPage();
          await page2.goto(urls[i]);

          console.log("going to start collecting providers");
          let providers = await page2.evaluate(() => {
            let data = [];

            /* let elements = document.querySelectorAll(
           "#prices > c-wiz > div > div.G86l0b > div > div > div > div > div > section > div.Hkwcrd.q9W60.A5WLXb.fLClSe > c-wiz > div > div > span > div > div > div > div > div > a > div > div.cFdfnb > div > span.mK0tQb > span"
         );*/
            let elements = document.querySelectorAll(
              "span[data-click-type='268']"
            );
            for (var element of elements) data.push(element.textContent);
            return data;
          });
          console.log(providers.length);
          console.log("all done");
          console.log(providers);
          let uniqueProviders = new Set(providers);
          hotels.push({
            name: hotelNames[i],
            providerList: uniqueProviders,
          });
          console.log("Finished - " + hotels[i].name);
          page2.close();
        }
        await browser.close();
        let uniqueHotels = new Set(hotels);
        let data = [];
        for (element of uniqueHotels) {
          let travelAgencies = Array.from(element.providerList);
          element.providerList = travelAgencies;
          data.push(JSON.stringify(element));
          for (agency of travelAgencies) {
            if (agency in providerCount) {
              providerCount[agency]++;
            } else {
              providerCount[agency] = 1;
            }
          }
        }

        data.push("Summary - " + cityName);
        data.push(JSON.stringify({ Hotels: buttons.length }));
        data.push(JSON.stringify({ Ads: ads.length }));
        data.push(JSON.stringify(providerCount));
        data.push("\n");
        fs.appendFile(fileName, data.join("\n\n"), (err) => {
          if (err) console.log(err);
        });
        throw data;
      } catch (err) {
        console.log(err);
      }
    }

    return 0;
  } catch (err) {
    console.error(err);
  }
})()
  .then((resolvedValue) => {
    console.log(resolvedValue);
  })
  .catch((rejectedValue) => {
    console.log(rejectedValue);
  });
