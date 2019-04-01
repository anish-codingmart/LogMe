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
// Cron
var cron = require("node-cron");
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

initialSettingsConfig();
initCron();
// React Path Public
app.get(["/", "/settings", "/discover", "/admin"], function(req, res) {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Get Alert Rules

app.get("/get-alert-rules", function(req, res, next) {
    let obj = {alertRules: alertRules};
    res.json(obj);
});

// Axios to Elastic Search

app.post("/get-elastic-search", (req, res) => {
    const elastic = req.body;
    axios.post(elastic.apiURL, elastic.query).then(response => {
        res.json(response.data);
    });
});

app.post("/get-elastic-results", (req, res) => {
    let apiURL = req.body.apiURL;
    axios.get(apiURL).then(response => {
        res.json(response.data);
    });
});

// Download CSV

app.post("/download-csv", (req, res) => {
    const elastic = req.body;
    axios.post(elastic.apiURL, elastic.query).then(async response => {
        const obj = response.data.hits.hits;
        console.log("No of Responses ", obj.length);
        let parsedObj = await obj.map(item => {
            item._source.timestamp = moment(item._source.timestamp)
                .utcOffset("+05:30")
                .format("DD-MM-YYYY | hh:mm A");
            return item;
        });
        const Json2csvParser = require("json2csv").Parser;
        var fields = [
            {label: "Client", value: "_source.client"},
            {label: "Timestamp", value: "_source.timestamp"},
            {label: "URL", value: "_source.url"},
            {label: "Response Code", value: "_source.response"},
            {label: "Response Time", value: "_source.responseTime"}
        ];
        const json2csvParser = new Json2csvParser({fields});
        const csv = json2csvParser.parse(parsedObj);
        res.writeHead(200, {
            "Content-Type": "text/csv",
            "Content-Disposition": "attachment; filename=some_file.csv",
            "Content-Length": csv.length
        });
        res.end(csv);
    });
});

// To Add Alert Rules Config
app.post("/add-alert-rules", (req, res) => {
    const alert = req.body;
    alert.alertUid = uuidv1();
    alertRules.push(req.body);
    runAlert(alert);
    updateSettingsConfig();
    res.send("Successfully Added");
});

// To Update Alert Rules Config
app.post("/update-alert-state", (req, res) => {
    let obj = req.body;
    alertRules.forEach(doc => {
        if (doc.alertUid == obj.alertUid) {
            if (obj.alertState) {
                unSubscribeTimeInterval(obj.alertUid);
                doc.alertState = false;
            } else {
                runAlert(doc);
                doc.alertState = true;
            }
        }
    });
    updateSettingsConfig();
    res.send("Successfully Updated");
});

// To Update Alert Rules Config
app.post("/delete-alert-state", (req, res) => {
    let obj = req.body;
    const newAlertRules = alertRules.filter(x => x.alertUid != obj.alertUid);
    alertRules = newAlertRules;
    unSubscribeTimeInterval(obj.alertUid);
    updateSettingsConfig();
    res.send("Successfully Updated");
});

function unSubscribeTimeInterval(uid) {
    clearInterval(intervalObject[uid]);
}

function initialSettingsConfig() {
    var text = fs.readFileSync("public/settings.txt", "utf8");
    var settingsConfig = JSON.parse(text);
    alertRules = settingsConfig.alertRules;
    callAlertRules(alertRules);
}

function callAlertRules(alertRules) {
    alertRules.map(alert => {
        if (alert.alertState) {
            runAlert(alert);
        }
    });
}

function runAlert(alert) {
    console.log("Running New Alert - ", alert.alertName);
    // Set Interval
    let interval = setInterval(() => {
        // If State Active
        if (alert.alertState) {
            alert.alertGTE = moment()
                .subtract(alert.alertRangeValue, alert.alertRangeMetric)
                .format();
            alert.alertLTE = moment().format();
            console.log(alert.alertGTE, alert.alertLTE);
            fetchQuery(alert);
        } else {
            console.log("Job Stopped", alert.alertName);
        }
    }, alert.alertFrequency);
    intervalObject[alert.alertUid] = interval;
}

// Fetch Data with Query

function fetchQuery(alert) {
    // Query
    const apiURL = "http://localhost:9200/logsindex/_search";
    let query;
    if (alert.alertFieldType == "allLogs") {
        query = {
            query: {
                bool: {
                    filter: [
                        {
                            range: {
                                timestamp: {
                                    gte: alert.alertGTE,
                                    lte: alert.alertLTE
                                }
                            }
                        }
                    ]
                }
            }
        };
    } // If All Logs
    else {
        query = {
            query: {
                bool: {
                    must: [
                        {match: {[alert.alertFieldType]: alert.alertFieldName}}
                    ],
                    filter: [
                        {
                            range: {
                                timestamp: {
                                    gte: alert.alertGTE,
                                    lte: alert.alertLTE
                                }
                            }
                        }
                    ]
                }
            }
        };
    } // For Other Fields

    // console.log(query);

    console.log("Calling", alert.alertName);
    axios.post(apiURL, query).then(response => {
        obtainedHits = response.data.hits.total;
        compareHitsToThreshold(alert, obtainedHits);
    });
}

//compare Obtained Hits With Threshold
function compareHitsToThreshold(alert, obtainedHits) {
    console.log("ObtainedHits for ", alert.alertName, " - ", obtainedHits);

    if (alert.alertOperator == ">") {
        if (obtainedHits > alert.alertThresholdLimit) {
            alertMail(alert.alertEmailAddressArray);
            if (alert.alertMobileNumberFlag)
                alertSMS(alert.alertMobileNumberArray);
        }
    } else if (alert.alertOperator == "<") {
        if (obtainedHits < alert.alertThresholdLimit) {
            alertMail(alert.alertEmailAddressArray);
            if (alert.alertMobileNumberFlag)
                alertSMS(alert.alertMobileNumberArray);
        }
    } else if (alert.alertOperator == "==") {
        if (obtainedHits == alert.alertThresholdLimit) {
            alertMail(alert.alertEmailAddressArray);
            if (alert.alertMobileNumberFlag)
                alertSMS(alert.alertMobileNumberArray);
        }
    }
}

function updateSettingsConfig() {
    var json = {
        logsThresholdCount: logsThresholdCount,
        alertEmailAddress: alertEmailAddress,
        alertEmailAddressArray: alertEmailAddressArray,
        alertRules: alertRules
    };

    fs.writeFile("public/settings.txt", JSON.stringify(json), err => {
        if (err) throw err;
        console.log("settings updated");
    });
}

// Send SMS (Alert)

function alertSMS(mobileNumberArray) {
    var http = require("http");
    var urlencode = require("urlencode");
    console.log("Sending SMS", mobileNumberArray);
    if (mobileNumberArray)
        mobileNumberArray.map(doc => {
            console.log("Sending Message");
            var msg = urlencode("HEYYY! ERROOOR! HELP ME XD");
            var toNumber = doc.mobile; //number
            var username = "saghana@codingmart.com"; //user-email id
            var hash =
                "dd2ab429a40630a24df31c52f61ddc181662ba022493465fcb06546e7dc28130"; //hash key
            var sender = "txtlcl";
            var data =
                "username=" +
                username +
                "&hash=" +
                hash +
                "&sender=" +
                sender +
                "&numbers=" +
                toNumber +
                "&message=" +
                msg;
            var options = {
                host: "api.textlocal.in",
                path: "/send?" + data
            };

            callback = function(response) {
                var str = "";
                response.on("data", function(chunk) {
                    str += chunk;
                });
                response.on("end", function() {
                    console.log(str);
                });
            };
            http.request(options, callback).end();
        });
}

// Send Email (Alert)
function alertMail(alertEmailAddressArray) {
    console.log("Email is Sending");
    var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "testemailcodingmart@gmail.com",
            pass: "testemail123!"
        }
    });

    alertEmailAddressArray.map(emailTo => {
        var mailOptions = {
            from: "testemailcodingmart@gmail.com",
            to: emailTo.email,
            subject: "Alert! Logs are Exceeding!",
            text: "Alert! Logs are Exceeding. Let's scale up!"
        };

        transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log("Email sent: " + info.response);
            }
        });
    });
}

function initCron() {
    console.log("Crons Initiated");
    var task = cron.schedule("0 2 * * *", () => {
        console.log("will execute every day until stopped");
        deleteOldRecords();
    });
}

function deleteOldRecords() {
    const startDate = moment()
        .subtract(1, "month")
        .startOf("day");
    const endDate = moment()
        .subtract(1, "month")
        .endOf("day");
    const query = {
        query: {
            range: {
                timestamp: {
                    gte: startDate,
                    lte: endDate
                }
            }
        }
    };

    console.log(startDate, endDate);

    // axios
    //   .post("http://localhost:9200/logsindex/_delete_by_query", query)
    //   .then(response => {
    //     console.log(response);
    //   });
}

app.listen(3300, () => console.log("Server is Listening at 3300"));
