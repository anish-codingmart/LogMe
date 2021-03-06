import React, { Component } from "react";
import axios from "axios";
import { Pie, Bar, Polar } from "react-chartjs-2";
import socketIOClient from "socket.io-client";
import { DateRangePicker } from "react-dates";
import moment from "moment";

class MainContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:4001",
      hits: [],
      hitsCount: 0,
      totalHits: 0,
      ticketsCount: 0,
      lastWeekTotalHits: 0,
      lastWeekBookingCount: 0,
      lastWeekScheduleCount: 0,
      lastWeekTicketsCount: 0,
      liveStatus: false,
      agentData: { datasets: [{ data: [] }], labels: [] },
      urlData: { datasets: [{ data: [] }], labels: [] },
      actionTypeData: { datasets: [{ data: [] }], labels: [] },
      startDate: moment("2018-12-10"),
      endDate: moment("2018-12-18"),
      response: [],
      refreshData: false
    };
  }

  componentDidMount() {
    const { endpoint } = this.state;
    // const socket = socketIOClient(endpoint);
    this.fetchQuery();
    // socket.on("FromAPI", data => {
    //   this.setState({ response: [...this.state.response, data] });
    // });

    let pie = [1, 2, 3, 4, 5];
    this.setState({
      agentData: {
        datasets: [
          {
            data: pie,
            backgroundColor: [
              "#e74c3c",
              "#2980b9",
              "#f1c40f",
              "#8e44ad",
              "#2c3e50"
            ]
          }
        ],
        labels: []
      },
      urlData: {
        datasets: [
          {
            data: pie,
            backgroundColor: [
              "#e74c3c",
              "#2980b9",
              "#f1c40f",
              "#8e44ad",
              "#2c3e50"
            ]
          }
        ],
        labels: []
      },
      actionTypeData: {
        datasets: [
          {
            data: pie,
            backgroundColor: [
              "#e74c3c",
              "#2980b9",
              "#f1c40f",
              "#8e44ad",
              "#2c3e50"
            ]
          }
        ],
        labels: []
      }
    });
    this.clearArray();
    this.refreshData();
    // console.log(this.state);
  }

  refreshData() {
    setInterval(() => {
      if (this.state.refreshData) this.fetchQuery();
    }, 1000);
  }

  clearArray() {
    setInterval(() => {
      this.state.response.splice(0, 20);
    }, 30000);
  }

  goToDate() {
    console.log("New Date");
    // const startDate = moment(this.state.startDate).startOf("day");
    // const endDate = moment(this.state.endDate).endOf("day");

    // this.setState({
    //   startDate: startDate,
    //   endDate: endDate
    // });
    this.fetchQuery();
  }

  goLive() {
    if (this.state.liveStatus) {
      console.log("No Live");
      this.setState({ liveStatus: false, refreshData: false });
    } else {
      console.log("Going Live");
      this.setState({
        liveStatus: true,
        startDate: moment(),
        endDate: moment(),
        refreshData: true
      });
      setTimeout(() => {
        this.fetchQuery();
      }, 300);
    }
  }

  fetchQuery() {
    let startDate = moment(this.state.startDate)
      .startOf("day")
      .format();
    let endDate = moment(this.state.endDate)
      .endOf("")
      .format();
    console.log(startDate, endDate);
    const apiURL = "/logsindexnew/_search";
    const query = {
      query: {
        bool: {
          filter: [
            {
              range: {
                timestamp: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          ]
        }
      },
      aggs: {
        spiderBotCount: {
          terms: {
            field: "spiderBot"
          }
        },
        urlCount: {
          terms: {
            field: "type"
          }
        },
        actionTypeCount: {
          terms: {
            field: "actionType"
          }
        }
      }
    };

    this.getLastWeeKLogs();
    axios.post(apiURL, query).then(response => {
      console.log(response);
      let agents = response.data.aggregations.spiderBotCount.buckets;
      let url = response.data.aggregations.urlCount.buckets;
      let actionType = response.data.aggregations.actionTypeCount.buckets;
      console.log(actionType);
      // console.log(agents);
      let agentCount = [];
      let agentLabels = [];
      agents.map(doc => {
        agentCount.push(doc.doc_count);
        agentLabels.push(doc.key);
      });

      // Action Type for Chart
      let actionTypeCount = [];
      let actionTypeLabels = [];
      actionType.map(doc => {
        actionTypeCount.push(doc.doc_count);
        actionTypeLabels.push(doc.key);
      });
      console.log(actionTypeLabels);
      let urlCount = [];
      let urlLabels = [];
      let scheduleCount = 0;
      let bookingCount = 0;
      url.map(doc => {
        if (doc.key == "schedule") {
          scheduleCount = doc.doc_count;
        }
        if (doc.key == "booking") {
          bookingCount = doc.doc_count;
        }
        urlCount.push(doc.doc_count);
        urlLabels.push(doc.key);
      });

      let totalHits = response.data.hits.total;
      this.setState({
        totalHits: totalHits,
        scheduleCount: scheduleCount,
        bookingCount: bookingCount
      });
      // console.log(agentCount, agentLabels);
      this.getChartData(
        agentCount,
        agentLabels,
        urlCount,
        urlLabels,
        actionTypeCount,
        actionTypeLabels
      );
    });
  }

  getLastWeeKLogs() {
    let startDate = moment()
      .subtract(1, "weeks")
      .startOf("week")
      .startOf("day")
      .format();
    let endDate = moment()
      .subtract(1, "weeks")
      .endOf("week")
      .endOf("day")
      .format();
    console.log(startDate, endDate);
    this.setState({
      lastWeekStartDate: startDate,
      lastWeekEndDate: endDate
    });
    const apiURL = "/logsindexnew/_search";
    const query = {
      query: {
        bool: {
          filter: [
            {
              range: {
                timestamp: {
                  gte: startDate,
                  lte: endDate
                }
              }
            }
          ]
        }
      },
      aggs: {
        spiderBotCount: {
          terms: {
            field: "spiderBot"
          }
        },
        urlCount: {
          terms: {
            field: "type"
          }
        },
        actionTypeCount: {
          terms: {
            field: "actionType"
          }
        }
      }
    };
    axios.post(apiURL, query).then(response => {
      const lastWeekTotalHits = response.data.hits.total;
      let url = response.data.aggregations.urlCount.buckets;
      let scheduleCount = 0,
        bookingCount = 0,
        ticketsCount = 0;
      url.map(doc => {
        if (doc.key == "schedule") {
          scheduleCount = doc.doc_count;
        }
        if (doc.key == "booking") {
          bookingCount = doc.doc_count;
        }
        if (doc.key == "tickets") {
          ticketsCount = doc.doc_count;
        }
      });
      this.setState({
        lastWeekTotalHits: lastWeekTotalHits,
        lastWeekScheduleCount: scheduleCount,
        lastWeekBookingCount: bookingCount,
        lastWeekTicketsCount: ticketsCount
      });
    });
  }

  getChartData(
    agentCount,
    agentLabels,
    urlCount,
    urlLabels,
    actionTypeCount,
    actionTypeLabels
  ) {
    this.setState({
      agentData: {
        datasets: [
          {
            data: agentCount
          }
        ],
        labels: agentLabels
      },
      urlData: {
        datasets: [
          {
            data: urlCount
          }
        ],
        labels: urlLabels
      },
      actionTypeData: {
        datasets: [
          {
            data: actionTypeCount
          }
        ],
        labels: actionTypeLabels
      }
    });
    // console.log(this.state);
  }

  render() {
    const options = {
      annotation: {
        annotations: [
          {
            drawTime: "afterDatasetsDraw",
            borderColor: "red",
            borderDash: [2, 2],
            borderWidth: 2,
            mode: "vertical",
            type: "line",
            value: 10,
            scaleID: "x-axis-0"
          }
        ]
      },
      maintainAspectRation: false
    };

    return (
      <div className="main-admin-container container-fluid">
        <div className="row">
          <div className="col-md-12 stat-section">
            <div className="date-picker d-flex align-items-center justify-content-between">
              <h3 className="text-left">Dashboard</h3>
              <div className="date-picker">
                <button
                  type="button"
                  onClick={() => this.goLive()}
                  className={
                    "btn margin-right " +
                    (this.state.liveStatus ? " btn-danger" : "btn-secondary")
                  }
                >
                  Live
                </button>

                <DateRangePicker
                  startDate={this.state.startDate} // momentPropTypes.momentObj or null,
                  startDateId="your_unique_start_date_id" // PropTypes.string.isRequired,
                  endDate={this.state.endDate} // momentPropTypes.momentObj or null,
                  endDateId="your_unique_end_date_id" // PropTypes.string.isRequired,
                  onDatesChange={({ startDate, endDate }) =>
                    this.setState({ startDate, endDate })
                  }
                  // PropTypes.func.isRequired,
                  focusedInput={this.state.focusedInput} // PropTypes.oneOf([START_DATE, END_DATE]) or null,
                  onFocusChange={focusedInput =>
                    this.setState({ focusedInput })
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
            <hr />
            <h4 className="text-left">Live Counter</h4>

            <div className="row d-flex justify-content-center">
              <div className="col-md-2 live-counter-box bg-blue">
                <span>Total Logs</span>
                <h4>{this.state.totalHits}</h4>
              </div>

              <div className="col-md-2 live-counter-box bg-red">
                <span>Schedule Count</span>
                <h4>{this.state.scheduleCount}</h4>
              </div>

              <div className="col-md-2 live-counter-box bg-orange">
                <span>Booking Count</span>
                <h4>{this.state.bookingCount}</h4>
              </div>
              <div className="col-md-2 live-counter-box bg-green">
                <span>Tickets Count</span>
                <h4>{this.state.ticketsCount}</h4>
              </div>
              <div className="col-md-10">
                <hr />
                <h5 className="text-center">
                  Last Week{" "}
                  <span className="text-x-small">
                    (
                    {moment(this.state.lastWeekStartDate).format("DD MMM YYYY")}{" "}
                    - {moment(this.state.lastWeekEndDate).format("DD MMM YYYY")}
                    )
                  </span>
                </h5>
              </div>

              <div className="col-md-2 live-counter-box bg-grey">
                <span>Last Week Logs</span>
                <h4>{this.state.lastWeekTotalHits}</h4>
              </div>
              <div className="col-md-2 live-counter-box bg-purple">
                <span>Booking Count</span>
                <h4>{this.state.lastWeekBookingCount}</h4>
              </div>
              <div className="col-md-2 live-counter-box bg-turquoise">
                <span>Schedule Count</span>
                <h4>{this.state.lastWeekScheduleCount}</h4>
              </div>
              <div className="col-md-2 live-counter-box bg-komaru">
                <span>Tickets Count</span>
                <h4>{this.state.lastWeekTicketsCount}</h4>
              </div>
            </div>
          </div>
          <div className="col-md-12 stat-section">
            <hr />
            <h4 className="text-left">Visualize - Chart</h4>
            <div className="row">
              <div className="col-md-4 stat-section ">
                <h5>Spider Bot Stats</h5>
                <br />
                <Pie
                  data={this.state.agentData}
                  width={250}
                  height={250}
                  options={options}
                />
              </div>
              <div className="col-md-4 stat-section ">
                <h5>URL Route Stats</h5>
                <br />
                <Bar
                  data={this.state.urlData}
                  width={250}
                  height={250}
                  options={options}
                />
              </div>
              <div className="col-md-4 stat-section ">
                <h5>Action Type Stats</h5>
                <br />
                <Pie
                  data={this.state.actionTypeData}
                  width={250}
                  height={250}
                  options={options}
                />
              </div>
            </div>
          </div>
          <br />
        </div>
      </div>
    );
  }
}

export default MainContainer;
