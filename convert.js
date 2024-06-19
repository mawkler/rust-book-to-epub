#!/usr/bin/env node

// This code is heavily based on the following gist:
// https://gist.github.com/peterbartha/54708ae739478a45b52612311d49717c
// Credit to https://gist.github.com/peterbartha

const axios = require("axios");
const cheerio = require("cheerio");
const { exec } = require("shelljs");
const fs = require("fs");

const args = process.argv.slice(2);
if (args.length !== 1) {
  console.error("Please provide the URL as the first argument.");
  process.exit(1);
}

const url = args[0];
const printUrl = url.endsWith("/") ? `${url}print.html` : `${url}/print.html`;
const inputFile = "rust_book.html";
const outputFile = "rust_book.epub";

async function main() {
  try {
    // Step 1: Fetch the HTML content
    const response = await axios.get(printUrl);
    const html = response.data;

    // Step 2: Load HTML content into Cheerio for manipulation
    const $ = cheerio.load(html);

    // Step 3: Apply transformations using Cheerio
    applyTransformations($);

    // Step 4: Save modified HTML content to a file
    fs.writeFileSync(inputFile, $.html());

    // Step 5: Convert HTML to EPUB using pandoc
    const pandocCommand = `pandoc ${inputFile} --to=epub --output=${outputFile}`;
    exec(pandocCommand);

    console.log(`Conversion completed. EPUB file saved as ${outputFile}`);
  } catch (error) {
    console.error("Error during conversion:", error);
  }
}

function applyTransformations($) {
  // Insert your transformation logic here using Cheerio
  // Example transformations:
  // Remove elements by ID
  $(
    "#sidebar, #menu-bar-hover-placeholder, #menu-bar, #search-wrapper",
  ).remove();

  // Modify anchor tags
  $(":is(h1,h2,h3,h4,h5,h6) a").each((index, element) => {
    const $span = $("<span>").text($(element).text());
    $(element).replaceWith($span);
  });

  // Create Table of Contents
  const $secondSection = $("h1").eq(1);
  const $tableOfContents = $("<ol>");
  $secondSection.before($tableOfContents);

  $("h1, h2").each((index, heading) => {
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

  // Modify image URLs
  $("img").each((index, img) => {
    const src = $(img).attr("src");
    if (src && src.startsWith("/")) {
      $(img).attr("src", `${url}${src}`);
    }
  });

  // Move Ferris images
  $("pre .ferris-container img.ferris").each((index, ferris) => {
    const $parentCodeBlock = $(ferris).closest("pre");
    $parentCodeBlock.before($(ferris));
  });

  // Flatten code blocks
  $("pre pre").each((index, pre) => {
    $(pre).replaceWith($(pre).html());
  });

  // Remove syntax highlighter
  $("pre code").each((index, code) => {
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
  $("details").each((index, details) => {
    $(details).replaceWith($(details).html());
  });

  // Reset wrapper styles
  $("#page-wrapper").removeClass("page-wrapper");
  $("main").css("max-width", "none");
  $(".page").css("margin-top", "0");
}

main();
