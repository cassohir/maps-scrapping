import puppeteer, { Page } from "puppeteer";
import fs from "node:fs";
import * as cheerio from "cheerio";

const filename = "schools.csv";
const link =
  "https://www.google.com/maps/search/Escola+Particular+Justin%C3%B3polis/@-19.7978836,-44.0294353,2725m/data=!3m2!1e3!4b1?entry=ttu&g_ep=EgoyMDI0MTEyNC4xIKXMDSoASAFQAw%3D%3D";
let record: string[][] = [];
let e: string[] = [];
let le: number = 0;

async function SeleniumExtractor(page: Page) {
  const action = page.keyboard;

  let a = await page.$$(".hfpxzc");

  // a.length  < 10
  while (le < 10) {
    console.log("View Size: " + a.length);
    const varLen = a.length;

    await page.evaluate(() => window.scrollBy(0, 1000));

    // Use await to properly wait for the delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    a = await page.$$(".hfpxzc");

    if (a.length === varLen) {
      le++;
      if (le > 20) {
        break;
      }
    } else {
      le = 0;
    }
  }

  let el;
  console.log("Iniciando a extração de dados");

  for (let i = 0; i < a.length; i++) {
    console.log("Extraindo dados da escola: " + (i + 1));

    el = a[i];

    // Wait for the element to be attached to the DOM and be clickable
    await el?.hover(); // Make sure the element is hovered or interacted with
    await page.waitForSelector("div.fontHeadlineSmall", {
      visible: true,
      timeout: 5000,
    });

    // Wait until the element exists before clicking
    if (await el.isIntersectingViewport()) {
      // await el.click();
    } else {
      console.log("Elemento não visível, pulando...");
      continue;
    }

    // await page.waitForNavigation();

    // await page.waitForSelector("h1.DUwDvf", { visible: true, timeout: 5000 })
    const content = await page.content();
    const $ = cheerio.load(content);

    try {
      // Extraindo o nome da escola
      const nameHtml = $("div.qBF1Pd.fontHeadlineSmall").text().trim();
      console.log(nameHtml);

      // Condição para verificar se o nome já foi extraído
      if (nameHtml && !e.includes(nameHtml)) {
        e.push(nameHtml);

        // Extraindo o endereço
        let address: string = "";
        const addressElement = $("span:contains('·')").first().prev();
        if (addressElement.length) {
          address = addressElement.text().trim();
        }

        // Extraindo o telefone
        let phone: string | undefined;
        const phoneElement = $("span.UsdlK");
        if (phoneElement.length) {
          phone = phoneElement.text().trim();
        }

        // Website (não disponível neste caso)
        let website: string = "Not available";

        console.log("\n-------------------\n");

        console.log([nameHtml, phone, address, website]);

        // Salvando em formato CSV
        record.push([nameHtml, phone || "Not available", address, website]);
        const csvData = record.map((row) => row.join(",")).join("\n");

        const filePath = `/home/cassio-izidorio/Desktop/${filename}`;

        fs.writeFileSync(
          filePath,
          "Name,Phone number,Address,Website\n" + csvData,
          { encoding: "utf-8" }
        );
      }
    } catch (error) {
      console.log("Error: ", error);
      continue;
    }
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/google-chrome-stable",
  });
  const page = await browser.newPage();
  await page.goto(link);
  page.setDefaultTimeout(3000);

  await SeleniumExtractor(page);

  await browser.close();
})();
