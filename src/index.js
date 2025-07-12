const express = require("express");
const app = express();
const cors = require("cors");
app.use(
  cors({
    origin: "*", // or specify domains like 'http://example.com'
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const bodyParser = require("body-parser");
app.use(express.json()); // needed to get body from POST request
app.use(bodyParser.json());

const { getShabads } = require("./gurbani_logic.js");
const {
  appendDataToFile,
  getIndexedTracks,
  getTypeLinks,
  getIndexedTracksByArtists,
} = require("./db_logic.js");

app.get("/", (_, res) => {
  res.send("Get all shabads data api");
});

app.get("/getShabads", (req, res) => {
  try {
    const results = getShabads(req.query.input);
    res.status(200).json({ results });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.get("/getIndexedTracks", async (_, res) => {
  try {
    const trksArr = await getIndexedTracks();
    res.status(200).json(trksArr);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

app.post("/addIndex", async (req, res) => {
  try {
    await appendDataToFile(req.body);
    res.status(200).json({ message: "Saved Successfully!!!" });
  } catch (e) {
    res.status(500).json({ message: "Error Saving: " + e.message });
  }
});

app.get("/getTypeLinks", async (req, res) => {
  try {
    if (!req.query.type) {
      throw new Error("type? is required");
    }
    const links = await getTypeLinks(req.query.type);
    res.status(200).json(links);
  } catch (e) {
    res.status(500).json({ message: "Error Saving: " + e.message });
  }
});

app.get("/getIndexedTracksByArtists", async (req, res) => {
  try {
    if (!req.query.artists) {
      throw new Error("artists?=[..] required");
    }
    const artists = JSON.parse(req.query.artists);
    const tracksByLinks = await getIndexedTracksByArtists(artists);
    res.status(200).json(tracksByLinks);
  } catch (e) {
    res.status(500).json({ message: "Error Saving: " + e.message });
  }
});


const PORT = 3002;
// const PORT = 3001;
app.listen(PORT, (error) => {
  if (!error) {
    console.log(
      "Server is Successfully Running, and App is listening on port " + PORT,
    );
  } else {
    console.log("Error occurred, server can't start", error);
  }
});
