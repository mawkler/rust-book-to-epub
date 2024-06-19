#!/usr/bin/env node

// This code is heavily based on the following gist:
// https://gist.github.com/peterbartha/54708ae739478a45b52612311d49717c
// Credit to https://github.com/peterbartha

const axios = require("axios");
const cheerio = require("cheerio");
const { exec } = require("shelljs");
const fs = require("fs");
const path = require("path");
const urlLib = require("url");
const { Command } = require("commander");
const program = new Command();

program
  .name("Rust Book Converter")
  .description("Convert Rust book to EPUB format")
  .version("1.0.0")
  .requiredOption("-o, --output <outputFile>", "EPUB filename")
  .argument("<url>", "URL of the Rust book")
  .addHelpText(
    "after",
    `
Example usage:
  ./convert.js https://doc.rust-lang.org/stable/book/ --output rust-book.epub`,
  )
  .action(async (url, options) => {
    const printUrl = url.endsWith("/")
      ? `${url}print.html`
      : `${url}/print.html`;
    const outputFile = options.output;
    const inputFile = "rust_book.html";

    try {
      // Step 1: Fetch the HTML content
      const response = await axios.get(printUrl);
      const html = response.data;

      // Step 2: Load HTML content into Cheerio for manipulation
      const $ = cheerio.load(html);

      // Step 3: Download images and update src attributes
      await downloadImages($, url);

      // Step 4: Apply transformations using Cheerio
      applyTransformations($);

      // Step 5: Save modified HTML content to a file
      fs.writeFileSync(inputFile, $.html());

      // Step 6: Convert HTML to EPUB using pandoc
      const pandocCommand = `pandoc ${inputFile} --to=epub --output=${outputFile}`;
      exec(pandocCommand);

      console.log(`Conversion completed. EPUB file saved as ${outputFile}`);
    } catch (error) {
      console.error("Error during conversion:", error);
    }
  });

async function downloadImages($, url) {
  // Ensure `./img/` directory exists
  const imagesFolder = "./img/";
  if (!fs.existsSync(imagesFolder)) {
    fs.mkdirSync(imagesFolder);
  }

  const promises = [];
  $("img").each((_, element) => {
    const imagePath = $(element).attr("src");
    const imageUrl = url.endsWith("/")
      ? `${url}${imagePath}`
      : `${url}/${imagePath}`;
    const filename = path.basename(urlLib.parse(imagePath).pathname);
    const localImagePath = path.join(imagesFolder, filename);

    promises.push(
      axios({
        url: imageUrl,
        responseType: "arraybuffer",
      })
        .then((response) => {
          const imageData = Buffer.from(response.data, "binary");
          fs.writeFileSync(localImagePath, imageData);
          // Update src attribute to include original URL
          $(element).attr("src", path.join(imagesFolder, filename));
        })
        .catch((error) => {
          console.error(`Failed to download image ${imagePath}:`, error);
        }),
    );
  });

  await Promise.all(promises);
}

function applyTransformations($) {
  // Insert your transformation logic here using Cheerio
  // Example transformations:
  // Remove elements by ID
  $(
    "#sidebar, #menu-bar-hover-placeholder, #menu-bar, #search-wrapper",
  ).remove();

  // Modify anchor tags
  $(":is(h1,h2,h3,h4,h5,h6) a").each((_, element) => {
    const $span = $("<span>").text($(element).text());
    $(element).replaceWith($span);
  });

  // Create Table of Contents
  const $secondSection = $("h1").eq(1);
  const $tableOfContents = $("<ol>");
  $secondSection.before($tableOfContents);

  $("h1, h2").each((_, heading) => {
    const $link = $("<a>")
      .attr("href", `#${heading.attribs.id}`)
      .text($(heading).text());
    const $li = $("<li>").addClass(heading.tagName.toLowerCase()).append($link);

    if ($(heading).is("h1") && $(heading).nextAll("h1").length === 0) {
      $tableOfContents.append($li);
    } else if ($(heading).is("h1")) {
      $tableOfContents.append($li);
      const $subParent = $("<ol>");
      $tableOfContents.append($subParent);
    } else {
      $tableOfContents.children("ol").last().append($li);
    }
  });

  // Remove buttons
  $(".buttons").remove();

  // Move Ferris images
  $("pre .ferris-container img.ferris").each((_, ferris) => {
    const $parentCodeBlock = $(ferris).closest("pre");
    $parentCodeBlock.before($(ferris));
  });

  // Flatten code blocks
  $("pre pre").each((_, pre) => {
    $(pre).replaceWith($(pre).html());
  });

  // Remove syntax highlighter
  $("pre code").each((_, code) => {
    const match = /language-([^ ]*)/gi.exec(code.attribs.class);
    if (match && match[1]) {
      $(code).removeAttr("class");
      $(code)
        .parent()
        .attr("class", match[1] === "console" ? "bash" : match[1]);
    }
    $(code).text($(code).text());
  });

  // Remove scripts
  $("script").remove();

  // Unfold details element
  $("details summary").remove();
  $("details").each((_, details) => {
    $(details).replaceWith($(details).html());
  });

  // Reset wrapper styles
  $("#page-wrapper").removeClass("page-wrapper");
  $("main").css("max-width", "none");
  $(".page").css("margin-top", "0");
}

program.parse(process.argv);
