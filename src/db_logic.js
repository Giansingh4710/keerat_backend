const fs = require("fs");
const path = require("path");
const csvReader = require("csv-parser");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const dataCsvFilePath = path.join(__dirname, "../assets/data.csv");

const ALL_SHABADS = require("../assets/allShabads");

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
  const { description, shabadID, timestamp, trackType, artist, link } = bodyObj;

  const unixTime = Math.floor(Date.now() / 1000);
  const data = [
    {
      created: unixTime,
      type: trackType,
      artist: artist,
      timestamp: timestamp,
      shabadID: shabadID,
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
    data[i].ID = i + 1;
  }
  return data;
}

async function getTypeLinks(type) {
  const data = await readCSV();
  const links = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].type === type) {
      links.push({
        ...data[i],
        shabadArr: ALL_SHABADS[data[i].shabadID],
        ID: i + 1,
      });
    }
  }
  return links;
}

module.exports = {
  appendDataToFile,
  getIndexedTracks,
  getTypeLinks,
};
