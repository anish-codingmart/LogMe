import React, {Component} from "react";
import axios from "axios";
import {DateRangePicker} from "react-dates";
import moment from "moment";
import download from "downloadjs";
class Discover extends Component {
    constructor(props) {
        super(props);
        this.onUpdateSearch = this.onUpdateSearch.bind(this);
        this.state = {
            hits: [],
            lateResponseHits: [],
            lateResponseThresholdLimit: 5000,
            paginationLength: 0,
            currentPage: 1,
            startDate: moment(),
            endDate: moment()
        };
        this.getLateResponseData(this.state.currentPage);
    }

    onUpdateSearch(event) {
        let value = event.target.value;
        let apiURL = "http://localhost:9200/logsindex/_search?q=" + value;
        const obj = {
            apiURL: apiURL
        };
        axios.post("/get-elastic-results", obj).then(response => {
            let hits = response.data.hits.hits;
            console.log(response.data);
            console.log(hits);
            if (hits) {
                this.setState({hits: hits, hitsCount: hits.length});
            }
        });
    }

    handleChange = event => {
        console.log(event.target.value);
        const lateResponseThresholdLimit = event.target.value;
        this.setState({
            lateResponseThresholdLimit: lateResponseThresholdLimit,
            currentPage: 1
        });
        setTimeout(() => {
            this.getLateResponseData(1);
        });
    };

    goToNextPage() {
        console.log("Next Page");
        let currentPage = this.state.currentPage;
        if (currentPage < this.state.paginationLength) currentPage += 1;
        this.getLateResponseData(currentPage);
        this.setState({
            currentPage: currentPage
        });
    }

    goToPrevPage() {
        console.log("Prev Page");
        let currentPage = this.state.currentPage;
        if (currentPage > 1) currentPage -= 1;
        this.getLateResponseData(currentPage);
        this.setState({
            currentPage: currentPage
        });
    }

    goToDate() {
        console.log(this.state);
        this.getLateResponseData(1);
    }

    downloadCSV() {
        if (this.state.lateResponseHitsCount > 1) {
            console.log("Downloading CSV");
            let startDate = moment(this.state.startDate)
                .startOf("day")
                .utc()
                .format();
            let endDate = moment(this.state.endDate)
                .endOf("day")
                .utc()
                .format();
            let apiURL = "http://localhost:9200/logsindex/_search";
            const query = {
                sort: {
                    timestamp: "asc"
                },
                query: {
                    bool: {
                        filter: {
                            bool: {
                                must: {
                                    range: {
                                        responseTime: {
                                            gte: this.state
                                                .lateResponseThresholdLimit
                                        }
                                    }
                                },
                                should: {
                                    range: {
                                        timestamp: {
                                            gte: startDate,
                                            lte: endDate
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                size: 10000
            };
            const obj = {
                apiURL: apiURL,
                query: query
            };
            axios.post("/download-csv", obj).then(response => {
                let csvContent = response.data;
                const fileName =
                    "Logs - " +
                    moment().format("hh:mm A | DD-MM-YYYY") +
                    ".csv";
                download(csvContent, fileName, "text/csv");
            });
        } else {
            alert("No Hits Found");
        }
    }

    getLateResponseData(currentPage) {
        let startDate = moment(this.state.startDate)
            .startOf("day")
            .utc()
            .format();
        let endDate = moment(this.state.endDate)
            .endOf("day")
            .utc()
            .format();
        const from = currentPage * 10;
        let apiURL = "http://localhost:9200/logsindex/_search";
        const query = {
            sort: {
                timestamp: "asc"
            },
            query: {
                bool: {
                    filter: {
                        bool: {
                            must: {
                                range: {
                                    responseTime: {
                                        gte: this.state
                                            .lateResponseThresholdLimit
                                    }
                                }
                            },
                            should: {
                                range: {
                                    timestamp: {
                                        gte: startDate,
                                        lte: endDate
                                    }
                                }
                            }
                        }
                    }
                }
            },
            size: 10,
            from: from
        };
        const obj = {
            apiURL: apiURL,
            query: query
        };
        axios.post("/get-elastic-search", obj).then(response => {
            let hits = response.data.hits.hits;
            let totalHits = response.data.hits.total;
            const paginationLength = Math.round(totalHits / 10);
            console.log("Total", totalHits, paginationLength);
            console.log(response.data);
            console.log(hits);
            if (hits) {
                this.setState({
                    lateResponseHits: hits,
                    lateResponseHitsCount: totalHits,
                    paginationLength: paginationLength
                });
            }
        });
    }

    render() {
        return (
            <div className="main-admin-container container-fluid">
                <div className="row">
                    <div className="col-md-12 stat-section">
                        <div className="d-flex align-items-center justify-content-between">
                            <h3 className="text-left">Late Responses</h3>

                            <div className="date-picker">
                                <DateRangePicker
                                    startDate={this.state.startDate} // momentPropTypes.momentObj or null,
                                    startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
                                    endDate={this.state.endDate} // momentPropTypes.momentObj or null,
                                    endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
                                    onDatesChange={({startDate, endDate}) =>
                                        this.setState({startDate, endDate})
                                    }
                                    // PropTypes.func.isRequired,
                                    focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
                                    onFocusChange={focusedInput =>
                                        this.setState({focusedInput})
                                    } // PropTypes.func.isRequired,
                                    isOutsideRange={() => false}
                                    minimumNights={0}
                                    displayFormat={() => "DD/MM/YYYY"}
                                />
                                <button
                                    type="button"
                                    onClick={() => this.goToDate()}
                                    class="btn btn-primary margin-left"
                                >
                                    Go
                                </button>
                            </div>
                        </div>
                        <br />
                        <br />
                        <div class="form-group d-flex flex-row align-items-center">
                            <label
                                for="inputPassword"
                                class="col-4 col-form-label"
                            >
                                Late Response Limit
                            </label>
                            <div class="col-4 d-flex align-items-center">
                                <input
                                    class="form-control"
                                    name="lateResponseThresholdLimit"
                                    placeholder="lateResponseThresholdLimit"
                                    value={
                                        this.state.lateResponseThresholdLimit
                                    }
                                    onChange={this.handleChange}
                                    type="number"
                                />
                            </div>
                            <div className="button-div col-4">
                                <button
                                    type="button"
                                    onClick={() => this.downloadCSV()}
                                    class="btn btn-primary margin-left "
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>
                        <br />
                        <table className="table ">
                            <thead className="thead-dark">
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Client</th>
                                    <th>Response Code</th>
                                    <th>Response Time</th>

                                    <th>URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.lateResponseHits.map(
                                    (item, key) => (
                                        <tr
                                            className="animated bounceInUp"
                                            key={item._id}
                                        >
                                            <td>
                                                {moment(item._source.timestamp)
                                                    .utcOffset("+05:30")
                                                    .format(
                                                        "DD-MM-YYYY | hh:mm A"
                                                    )}
                                            </td>
                                            <td>{item._source.client}</td>
                                            <td>{item._source.response}</td>
                                            <td>
                                                {item._source.responseTime
                                                    ? item._source.responseTime
                                                    : item._source.request}
                                            </td>

                                            <td className="word-break">
                                                {item._source.url}
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>

                        <div
                            className={
                                "pagination d-flex justify-content-center " +
                                (this.state.paginationLength > 1
                                    ? ""
                                    : "hidden")
                            }
                        >
                            <nav aria-label="Page navigation example ">
                                <ul class="pagination ">
                                    <li class="page-item">
                                        <a
                                            class="page-link"
                                            onClick={() => this.goToPrevPage()}
                                        >
                                            Previous
                                        </a>
                                    </li>{" "}
                                    <li class="page-item">
                                        <a class="page-link">
                                            {this.state.currentPage} /{" "}
                                            {this.state.paginationLength}
                                        </a>
                                    </li>
                                    <li class="page-item">
                                        <a
                                            class="page-link"
                                            onClick={() => this.goToNextPage()}
                                        >
                                            Next
                                        </a>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                    <div className="col-md-12 stat-section">
                        <h3 className="text-left">Discover</h3>
                        <br />

                        <div class="form-group">
                            <input
                                name="search"
                                placeholder="Search Now"
                                onChange={this.onUpdateSearch}
                                type="text"
                                className="form-control"
                            />
                        </div>

                        <br />
                        <br />
                        <p>{this.state.hitsCount} Hits</p>
                        <table className="table ">
                            <thead className="thead-dark">
                                <tr>
                                    <th>Timestamp</th>
                                    <th>Client</th>
                                    <th>Agent</th>
                                    <th>Method</th>
                                    <th>URL</th>
                                    <th>Response Code</th>
                                </tr>
                            </thead>
                            <tbody>
                                {this.state.hits.map((item, key) => (
                                    <tr
                                        className="animated bounceInUp"
                                        key={item._id}
                                    >
                                        <td>
                                            {moment(item._source.timestamp)
                                                .utcOffset("+05:30")
                                                .format("hh:mm A | DD-MM-YYYY")}
                                        </td>
                                        <td>{item._source.client}</td>
                                        <td className="word-break">
                                            {item._source.agent}
                                        </td>
                                        <td>{item._source.method}</td>
                                        <td className="word-break">
                                            {item._source.url}
                                        </td>
                                        <td>{item._source.response}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>{" "}
                </div>
            </div>
        );
    }
}

export default Discover;
