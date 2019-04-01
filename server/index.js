const express = require("express");
const moment = require("moment");
const path = require("path");
var fs = require("fs"),
    es = require("event-stream");
var app = express();
var http = require("http");
var cors = require("cors");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);
var elasticsearch = require("elasticsearch");
const uuidv1 = require("uuid/v1");
const port = process.env.PORT || 4001;
var router = express.Router();
const axios = require("axios");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
app.use(express.static(path.join(__dirname, "public")));
const CircularJSON = require("circular-json");
app.use(cors());
// Use Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
// Init Variables
let currentLine = 1,
    readLine = 0,
    logsThresholdCount = 200,
    alertEmailAddress = "logs@codingmart.com",
    alertRules = [];
const logFileLocation = "/var/log/syslog";
let alertEmailAddressArray,
    intervalObject = {},
    responseTimeThreshold = 5000;

// Pattern Init
var patterns = require("node-grok").loadDefaultSync();
var p =
    '%{IP:client} - - %{DATA:timestamp} "%{WORD:method} %{URIPATHPARAM:url} %{WORD:http}/%{INT:ver}.%{INT:ver2}" %{INT:response} %{INT:responseTime} "%{DATA:mtag}" "%{DATA:agent}"';
var pattern = patterns.createPattern(p);

//To Get Initial settings config
intiLogsSettings();

function intiLogsSettings() {
    var text = fs.readFileSync("public/logssettings.txt", "utf8");
    if (text) {
        console.log("48", text);
        var settingsConfig = JSON.parse(text);
    }
    if (settingsConfig && settingsConfig.readLine) {
        readLine = settingsConfig.readLine;
    }
}

function updateLogsSettings() {
    var json = {
        readLine: readLine,
        lastReadLineTimestamp: moment().format()
    };

    fs.writeFile("public/logssettings.txt", JSON.stringify(json), err => {
        if (err) throw err;
        console.log("Logs Settings updated");
    });
}

// Init Elastic Search
var client = new elasticsearch.Client({
    host: "localhost:9200",
    log: "trace"
});

client.ping(
    {
        // ping usually has a 3000ms timeout
        requestTimeout: 1000
    },
    function(error) {
        if (error) {
            console.trace("elasticsearch cluster is down!");
        } else {
            // console.log("All is well");
        }
    }
);

// Init Stream Data

streamData();
watchFile();

// Stream Logs
function streamData() {
    currentLine = 1;
    var s = fs
        .createReadStream(logFileLocation)
        .pipe(es.split())
        .pipe(
            es
                .mapSync(function(line) {
                    if (currentLine >= readLine) {
                        if (/^\s*$/.test(line)) {
                            // console.log("Line is Blank");
                        } else {
                            regexGROKTest(line);
                        }
                    }
                    currentLine += 1;
                })

                .on("error", function(err) {
                    console.log("Error while reading file.", err);
                })
                .on("end", function() {
                    // console.log("Read entire file. No of Lines Read are ", readLine);
                    readLine = currentLine - 1;
                    updateLogsSettings();
                })
        );
}

// regexGrokPattern
function regexGROKTest(str) {
    var newJSON = pattern.parseSync(str);
    if (newJSON) {
        let timestampFormatted = moment(
            newJSON.timestamp,
            "DD/MMM/YYYY:HH:mm:ss z"
        );
        newJSON.uid = uuidv1();
        newJSON.timestamp = timestampFormatted;
        const spiderBot = checkSpiderBot(newJSON.agent);
        if (spiderBot) {
            newJSON.spiderBot = spiderBot;
        }
        // Parse URL
        let parsedURL = regexURL(newJSON.url);
        if (parsedURL) newJSON = Object.assign(newJSON, parsedURL);

        // Change Response Time to Integer
        if (newJSON.responseTime)
            newJSON.responseTime = parseInt(newJSON.responseTime);

        // Add to Index (If Parsed URL True)
        if (parsedURL) {
            addToIndex(newJSON, "logsindex");
        }
    } else {
        // console.log("No Object Created");
    }
}

// Regex URL
function regexURL(url) {
    // console.log("Going to Regex");
    var UrlPattern = require("url-pattern");
    let newURL,
        parsedURL = {},
        isArabic = false;

    // Checking If Arabic or Not
    if (url.substr(0, 3) == "/ar") {
        newURL = url.replace(url.substr(0, 3), "");
        isArabic = true;
    } else {
        newURL = url;
    }
    // Splitting .html in the End
    const newURLWithoutHTML = newURL.split(".html");
    const newURLFinal = newURLWithoutHTML[0];
    // console.log(newURLFinal);
    // Pattern Match for URL
    var pattern = new UrlPattern("/:flight-:type/:airlineInfo");
    parsedURL = pattern.match(newURLFinal);

    // If URL Contains AMP/Widget
    if (!parsedURL) {
        var pattern = new UrlPattern(
            "/:flight-:type/:webpageType/:airlineInfo"
        );
        parsedURL = pattern.match(newURLFinal);
        // console.log(parsedURL);
    }
    // console.log("Parsed URL ", parsedURL);

    if (parsedURL) {
        if (parsedURL.airlineInfo) {
            // Console.log
            // console.log("Going to AirlineInfo ", parsedURL.airlineInfo);

            // Airline Information (Ex: Flight Name, Destination, Arrival City)
            const airlineInfo = parsedURL.airlineInfo;

            // Assign Airline Info to Object
            const airlineName = airlineInfo.split("-airlines");
            parsedURL.airlineName = airlineName[0];
            // console.log(airlineInfo);

            // Checking the Type of the URL
            switch (parsedURL.type) {
                case "booking": {
                    const actionType = checkActionType(airlineInfo);
                    if (actionType) {
                        parsedURL.actionType = actionType;
                    } else {
                        // For Airline Routes
                        parsedURL.actionType = "route";
                    }
                    break;
                }

                case "schedule":
                    const actionType = checkActionType(airlineInfo);
                    // console.log("Schedule");
                    break;
                case "tickets":
                    // console.log("Tickets");
                    break;

                default:
                    console.log("No Type");
            }
        }
        // If Arabic or Not
        parsedURL.isArabic = isArabic;
        return parsedURL;
    }
}

// Check Action Type (i.e Route, PNR STATUS, Check-in)
function checkActionType(airlineInfo) {
    let actionType = "route";

    if (airlineInfo.includes("pnr-status")) {
        actionType = "pnrStatus";
    }
    // For Web Check In
    else if (airlineInfo.includes("check-in")) {
        actionType = "checkIn";
    }
    // For Customer Support
    else if (airlineInfo.includes("customer-support")) {
        actionType = "customerSupport";
    }
    // For Baggages
    else if (airlineInfo.includes("baggages")) {
        actionType = "baggages";
    }
    // For Domestic Airlines
    else if (airlineInfo.includes("domestic-airlines")) {
        actionType = "domesticAirlines";
    }
    // For Internation Airlines
    else if (airlineInfo.includes("international-airlines")) {
        actionType = "internationalAirlines";
    }
    // For Domestic
    else if (airlineInfo.includes("domestic")) {
        actionType = "domestic";
    } // For International
    else if (airlineInfo.includes("international")) {
        actionType = "international";
    }
    // For Domestic Airports
    else if (airlineInfo.includes("domestic-airports")) {
        actionType = "domesticAirports";
    } // For International Airports
    else if (airlineInfo.includes("international-airports")) {
        actionType = "internationalAirports";
    }

    return actionType;
}

// Detect Spider Bots
function checkSpiderBot(agent) {
    let spiderBot;
    // If Google Bot
    if (agent.includes("Googlebot")) {
        spiderBot = "Googlebot";
    }
    // If bingbot Bot
    if (agent.includes("bingbot")) {
        spiderBot = "bingbot";
    }
    // If DuckDuckBot Bot
    if (agent.includes("DuckDuckBot")) {
        spiderBot = "DuckDuckBot";
    }
    // If Baiduspider Bot
    if (agent.includes("Baiduspider")) {
        spiderBot = "Baiduspider";
    }
    // If YandexBot Bot
    if (agent.includes("YandexBot")) {
        spiderBot = "YandexBot";
    }
    // If facebookexternalhit Bot
    if (agent.includes("facebookexternalhit")) {
        spiderBot = "facebookexternalhit";
    }
    // If DotBot Bot
    if (agent.includes("DotBot")) {
        spiderBot = "DotBot";
    }
    // If SemrushBot Bot
    if (agent.includes("SemrushBot")) {
        spiderBot = "SemrushBot";
    }
    // If AhrefsBot Bot
    if (agent.includes("AhrefsBot")) {
        spiderBot = "AhrefsBot";
    }

    // If AdsBot-Google Bot
    if (agent.includes("AdsBot-Google")) {
        spiderBot = "AdsBotGoogle";
    }

    return spiderBot;
}

// Watch File for Changes
function watchFile() {
    fs.watchFile(logFileLocation, {interval: 1000}, (curr, prev) => {
        // console.log(`${logFileLocation} file Changed`);
        streamData();
    });
}

async function addToIndex(data, index) {
    await client.create({
        index: index,
        type: "log",
        id: data.uid,
        body: data
    });
}
