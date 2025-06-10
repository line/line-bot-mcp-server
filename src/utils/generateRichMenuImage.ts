import { Marp } from "@marp-team/marp-core";
import puppeteer from "puppeteer";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to generate a rich menu image from a Markdown template
export async function generateRichMenuImage(
  templeteNumber: number,
  texts: string[],
): Promise<string> {
  const richMenuImagePath = path.join(
    os.tmpdir(),
    `slide-0${templeteNumber}-${Date.now()}.png`,
  );
  const serverPath =
    process.env.SERVER_PATH || path.resolve(__dirname, "..", "..");
  // 1. Read the Markdown template
  const srcPath = path.join(
    serverPath,
    `richmenu-templetes/templete-0${templeteNumber}.md`,
  );
  let content = await fs.readFile(srcPath, "utf8");
  for (let index = 0; index < texts.length; index++) {
    const pattern = new RegExp(`<h3>item0${index + 1}</h3>`, "g");
    content = content.replace(pattern, `<h3>${texts[index]}</h3>`);
  }

  // 2. Convert Markdown to HTML using Marp
  const marp = new Marp();
  const { html, css } = marp.render(content);

  // 3. Save the HTML as a temporary file
  const htmlContent = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>${html}</body>
    </html>
  `;
  const tempHtmlPath = path.join(
    os.tmpdir(),
    `temp_marp_slide_${Date.now()}.html`,
  );
  await fs.writeFile(tempHtmlPath, htmlContent);

  // 4. Use puppeteer to convert HTML to PNG
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  await page.goto(`file://${tempHtmlPath}`, {
    waitUntil: "networkidle0",
  });
  await page.screenshot({
    path: richMenuImagePath as `${string}.png`,
    clip: { x: 0, y: 0, width: 1600, height: 910 },
  });
  await browser.close();

  // 5. Delete the temporary HTML file
  await fs.unlink(tempHtmlPath);

  return richMenuImagePath;
}

export const validateRichMenuImage = (
  templeteNumber: number,
  texts: string[],
): string | null => {
  if (templeteNumber < 1 || templeteNumber > 7) {
    return "Invalid templete number";
  }
  if (texts.length < 1 || texts.length > 6) {
    return "Invalid texts length";
  }
  return null;
};

export const initializeTempleteNumber = (
  templeteNumber: number,
  items: number,
): number => {
  if (!templeteNumber) {
    const templeteNumberMap = {
      // text length: templete number
      1: 7,
      2: 6,
      3: 4,
      4: 2,
    } as const;
    templeteNumber =
      templeteNumberMap[items as keyof typeof templeteNumberMap] || 1;
  }
  return templeteNumber;
};
