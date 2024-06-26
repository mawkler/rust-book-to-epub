# Rust Book To EPUB Converter

CLI tool to conveert a Rust book to EPUB based on the book's URL.

## Installation

Clone this repo, and then run `npm install` from inside the repo.

## Usage

```
Usage: convert [options] <url>

Convert Rust book to EPUB format

Arguments:
  url                        URL of the Rust book

Options:
  -V, --version              output the version number
  -o, --output <outputFile>  EPUB filename
  -h, --help                 display help for command

Example usage:
  ./convert.js https://doc.rust-lang.org/stable/book/
```

### To download multiple books at once

You can use the UNIX command [parallel](https://linux.die.net/man/1/parallel) to download multiple books at once:

```sh
echo 'https://rust-unofficial.github.io/patterns/
https://rust-hosted-langs.github.io/book
https://wubingzheng.github.io/build-lua-in-rust/en/' | parallel ./convert.js
```

Make sure to not have any blank lines. Note the placement of `'`s.

## Credit

I built this script from [this Gist](https://gist.github.com/peterbartha/54708ae739478a45b52612311d49717c) and a lot of proompting. Thanks to https://github.com/peterbartha for creating the original gist! Compared to the original, this version also downloads images and embeds them into the EPUB as well.
