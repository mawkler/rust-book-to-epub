# Rust Book To EPUB Converter

CLI tool to conveert a Rust book to EPUB based on the book's URL.

## Usage

```
Usage: Rust Book Converter [options] <url>

Convert Rust book to EPUB format

Arguments:
  url                        URL of the Rust book

Options:
  -V, --version              output the version number
  -o, --output <outputFile>  Output EPUB filename
  -h, --help                 display help for command

Example usage:
  ./convert.js https://doc.rust-lang.org/stable/book/ -o rust-book.epub
```

## Credit

I built this script from [this Gist](https://gist.github.com/peterbartha/54708ae739478a45b52612311d49717c) and a lot of proompting. Compared to the original gist, this version also downloads images and embeds them into the EPUB as well.