/*
hotels = [{
    name
    list of providers 
}]

*/

const puppeteer = require("puppeteer");
const prompt = require("prompt-sync")();

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false,
    });
    const page = await browser.newPage();
    var city = prompt("Please enter a city: ");

    //google.com
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US" });
    await page.goto("https://google.com");
    await page.type("input.gLFyf.gsfi", "hotels in " + city);
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
      let names = [];
      let elements = document.querySelectorAll(
        "#yDmH0d > c-wiz.zQTmif.SSPGKf > div > div.lteUWc > div > c-wiz > div > div.gpcwnc > div.cGQUT > main > div > div.Hkwcrd.Sy8xcb.XBQ4u > c-wiz > div.l5cSPd > c-wiz:nth-child(5) > div > a"
      );

      elements.forEach(function (element) {
        names.push(element.getAttribute("aria-label"));
      });
      return names;
    });

    let buttons = await page.$x("//button[contains(., 'View prices')]");

    console.log("Number of hotels: " + buttons.length);
    for (var i = 0; i < buttons.length; i++) {
      console.log("Hotel: " + i);
      console.log(hotelNames[i]);

      /***************************************************************************************************/
      // I think the error is because of lines 61-64. Without them, the program runs into a timeout error
      await page.setDefaultNavigationTimeout(0);
      await Promise.all([
        page.waitForNavigation({ waitUntil: "load", timeout: 0 }),
        buttons[i].click(),
      ]);
      /***************************************************************************************************/
      const pages = await browser.pages();
      const page2 = pages[pages.length - 1];
      console.log(pages.length);
      await page2
        .waitForSelector(
          "#prices > c-wiz > div > div.G86l0b > div > div > div > div > div > section > div.Hkwcrd.q9W60.A5WLXb.fLClSe > c-wiz > div > div > span > div > div > div > div > div > a > div > div.cFdfnb > div > span.mK0tQb > span",
          { timeout: 30000 }
        )
        .catch(() => console.log("Class doesn't exist!"));

      console.log("going to start collecting providers");
      let providers = await page2.evaluate(() => {
        let data = [];
        /* let elements = document.querySelectorAll(
           "#prices > c-wiz > div > div.G86l0b > div > div > div > div > div > section > div.Hkwcrd.q9W60.A5WLXb.fLClSe > c-wiz > div > div > span > div > div > div > div > div > a > div > div.cFdfnb > div > span.mK0tQb > span"
         );*/
        let elements = document.querySelectorAll("span[data-click-type='268']");
        for (var element of elements) data.push(element.textContent);
        return data;
      });
      console.log(providers.length);
      console.log("all done");
      console.log(providers);
      hotels.push({
        name: hotelNames[i],
        providerList: providers,
      });
      console.log("Finished - " + hotels[i].name);
      page2.close();
    }

    await browser.close();
    return hotels;
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
