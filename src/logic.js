const ALL_SHABADS = require("../assets/allShabads");

function convertToGurmukhi(input) {
  const mapping = {
    a: "ੳ",
    A: "ਅ",
    s: "ਸ",
    S: "ਸ਼",
    d: "ਦ",
    D: "ਧ",
    f: "ਡ",
    F: "ਢ",
    g: "ਗ",
    G: "ਘ",
    h: "ਹ",
    H: "੍ਹ",
    j: "ਜ",
    J: "ਝ",
    k: "ਕ",
    K: "ਖ",
    l: "ਲ",
    L: "ਲ਼",
    q: "ਤ",
    Q: "ਥ",
    w: "ਾ",
    W: "ਾਂ",
    e: "ੲ",
    E: "ਓ",
    r: "ਰ",
    R: "੍ਰ",
    "®": "੍ਰ",
    t: "ਟ",
    T: "ਠ",
    y: "ੇ",
    Y: "ੈ",
    u: "ੁ",
    ü: "ੁ",
    U: "ੂ",
    "¨": "ੂ",
    i: "ਿ",
    I: "ੀ",
    o: "ੋ",
    O: "ੌ",
    p: "ਪ",
    P: "ਫ",
    z: "ਜ਼",
    Z: "ਗ਼",
    x: "ਣ",
    X: "ਯ",
    c: "ਚ",
    C: "ਛ",
    v: "ਵ",
    V: "ੜ",
    b: "ਬ",
    B: "ਭ",
    n: "ਨ",
    ƒ: "ਨੂੰ",
    N: "ਂ",
    ˆ: "ਂ",
    m: "ਮ",
    M: "ੰ",
    µ: "ੰ",
    "`": "ੱ",
    "~": "ੱ",
    "¤": "ੱ",
    Í: "੍ਵ",
    ç: "੍ਚ",
    "†": "੍ਟ",
    œ: "੍ਤ",
    "˜": "੍ਨ",
    "´": "ੵ",
    Ï: "ੵ",
    æ: "਼",
    Î: "੍ਯ",
    ì: "ਯ",
    í: "੍ਯ",
    // 1: '੧',
    // 2: '੨',
    // 3: '੩',
    // 4: '੪',
    // 5: '੫',
    // 6: '੬',
    // '^': 'ਖ਼',
    // 7: '੭',
    // '&': 'ਫ਼',
    // 8: '੮',
    // 9: '੯',
    // 0: '੦',
    "\\": "ਞ",
    "|": "ਙ",
    "[": "।",
    "]": "॥",
    "<": "ੴ",
    "¡": "ੴ",
    Å: "ੴ",
    Ú: "ਃ",
    Ç: "☬",
    "@": "ੑ",
    "‚": "❁",
    "•": "੶",
    " ": " ",
  };
  const gurmukhi_input = input
    .split("")
    .map((char) => mapping[char] || char)
    .join("");
  return gurmukhi_input;
}

function get_sbds_first_letters(gurmukhi_input) {
  function first_letters_gurmukhi(words) {
    if (typeof words !== "string") return words;

    let newWords = words;

    const reverseMapping = {
      ਉ: "ੳ",
      ਊ: "ੳ",
      ਆ: "ਅ",
      ਆਂ: "ਅ",
      ਐ: "ਅ",
      ਔ: "ਅ",
      ਇ: "ੲ",
      ਈ: "ੲ",
      ਏ: "ੲ",
      // 'ੋੁ': 'uo',
    };

    const simplifications = [
      ["E", "a"],
      ["ਓ", "ੳ"],
      ["L", "l"],
      ["ਲ਼", "ਲ"],
      ["S", "s"],
      ["ਸ਼", "ਸ"],
      ["z", "j"],
      ["ਜ਼", "ਜ"],
      ["Z", "g"],
      ["ਗ਼", "ਗ"],
      ["\\^", "K"],
      ["ਖ਼", "ਖ"],
      ["ƒ", "n"],
      ["ਨੂੰ", "ਨ"],
      ["&", "P"],
      ["ਫ਼", "ਫ"],
    ];
    simplifications.forEach((e) => {
      newWords = newWords.replace(new RegExp(e[0], "g"), e[1]);
    });

    newWords = newWords
      .replace(/\]/g, "")
      .replace(/\[/g, "")
      .replace(/॥/g, "")
      .replace(/।/g, "")
      .replace(/rhwau dUjw/g, "")
      .replace(/rhwau/g, "")
      .replace(/[0-9]/g, "")
      .replace(/[;,.]/g, "");

    function firstLetter(word) {
      let letter = word[0];
      if (letter in reverseMapping) {
        letter = reverseMapping[letter];
      }
      return letter;
    }

    const letters = newWords.split(" ").map(firstLetter).join("");
    return letters;
  }

  for (let i = 0; i < gurmukhi_input.length; i++) {
    const char = gurmukhi_input[i];
    if (char >= "0" && char <= "9") {
      return [];
    }
  }

  const all_matched_shabad_keys = [];
  for (const key in ALL_SHABADS) {
    const shabadArray = ALL_SHABADS[key];

    for (let pu_ln_idx = 0; pu_ln_idx < shabadArray.length; pu_ln_idx += 3) {
      const line = shabadArray[pu_ln_idx];
      const first_letters = first_letters_gurmukhi(line);

      let line_matched = true;
      for (let i = 0; i < gurmukhi_input.length; i++) {
        if (
          first_letters.length === i ||
          first_letters[i] !== gurmukhi_input[i]
        ) {
          line_matched = false;
          break;
        }
      }

      if (line_matched) {
        all_matched_shabad_keys.push({
          shabadId: key,
          lineInd: pu_ln_idx,
          shabadArray: shabadArray,
        });
        break;
      }
    }
  }
  return all_matched_shabad_keys;
}

function getShabads(input) {
  if (!input) {
    throw new Error("Input is required");
  }
  const gurmukhi_input = convertToGurmukhi(input);
  return get_sbds_first_letters(gurmukhi_input);
}

const fs = require("fs");
const path = require("path");
const csvReader = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dataCsvFilePath = path.join(__dirname, "../assets/data.csv");

function getCsvWriter() {
  return createCsvWriter({
    path: dataCsvFilePath,
    // created,type,artist,timestamp,shabadID,description,link
    header: [
      { id: "created", title: "created" },
      { id: "type", title: "type" },
      { id: "artist", title: "artist" },
      { id: "timestamp", title: "timestamp" },
      { id: "shabadID", title: "shabadID" },
      { id: "description", title: "description" },
      { id: "link", title: "link" },
    ],
    append: true, // Append to the file
  });
}

async function appendDataToFile(bodyObj) {
  const { description, shabadId, timestamp, trackType, artist, link } = bodyObj;

  const unixTime = Math.floor(Date.now() / 1000);
  const data = [
    {
      created: unixTime,
      type: trackType,
      artist: artist,
      timestamp: timestamp,
      shabadID: shabadId,
      description: description,
      link: link,
    },
  ];
  const csvWriter = getCsvWriter();
  await csvWriter.writeRecords(data);
}

function readCSV() {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(dataCsvFilePath)
      .pipe(csvReader())
      .on("data", (data) => results.push(data))
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

async function getIndexedTracks() {
  const data = await readCSV();
  for (let i = 0; i < data.length; i++) {
    data[i].shabadArr = ALL_SHABADS[data[i].shabadID];
  }
  return data;
}

async function getTypeLinks(type) {
  const data = await readCSV();
  const links = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === type) {
      links.push({ ...data[i], shabadArr: ALL_SHABADS[data[i].shabadID] });
    }
  }
  return links;
}

// getTypeLinks("SDO_MGA_1");

module.exports = {
  getShabads,
  appendDataToFile,
  getIndexedTracks,
  getTypeLinks,
};
