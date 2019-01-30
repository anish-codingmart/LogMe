import React, { Component } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Switch from "react-switch";

class AlertSystem extends Component {
  state = {
    submitOK: true,
    formErrors: [],
    fieldTypesList: [
      {
        fieldTypeName: "Route Type",
        fieldTypeValue: "type",
        fieldNames: [
          { fieldName: "Booking", fieldValue: "booking" },
          { fieldName: "Schedule", fieldValue: "schedule" },
          { fieldName: "Tickets", fieldValue: "tickets" }
        ]
      },
      {
        fieldTypeName: "Action Type",
        fieldTypeValue: "actionType",
        fieldNames: [
          { fieldName: "Route", fieldValue: "route" },
          { fieldName: "PNR Status", fieldValue: "pnrStatus" },
          { fieldName: "Check In", fieldValue: "checkIn" },
          { fieldName: "Customer Support", fieldValue: "customerSupport" },
          { fieldName: "Baggages", fieldValue: "baggages" },
          { fieldName: "Domestic Airlines", fieldValue: "domesticAirlines" },
          {
            fieldName: "International Airlines",
            fieldValue: "internationalAirlines"
          },
          { fieldName: "Domestic Airports", fieldValue: "domesticAirports" },
          {
            fieldName: "International Airports",
            fieldValue: "internationalAirports"
          }
        ]
      },
      {
        fieldTypeName: "Spider Bot",
        fieldTypeValue: "spiderBot",
        fieldNames: [
          { fieldName: "Google Bot", fieldValue: "Googlebot" },
          { fieldName: "Bingbot", fieldValue: "bingbot" },
          { fieldName: "Duck Duck Bot", fieldValue: "DuckDuckBot" },
          { fieldName: "Baiduspider", fieldValue: "Baiduspider" },
          { fieldName: "YandexBot", fieldValue: "YandexBot" },
          { fieldName: "Facebook Hit", fieldValue: "facebookexternalhit" },
          { fieldName: "DotBot", fieldValue: "DotBot" },
          { fieldName: "SemrushBot", fieldValue: "SemrushBot" },
          { fieldName: "AhrefsBot", fieldValue: "AhrefsBot" },
          { fieldName: "AdsBotGoogle", fieldValue: "AdsBotGoogle" }
        ]
      }
    ],
    alertOperators: [
      { operatorName: "Greater Than", operatorValue: ">" },
      { operatorName: "Lesser Than", operatorValue: "<" },
      { operatorName: "Equal", operatorValue: "==" }
    ],

    alertRange: [
      { rangeName: "Second", rangeMetric: "seconds" },
      { rangeName: "Minute", rangeMetric: "minutes" },
      { rangeName: "Hour", rangeMetric: "hours" },
      { rangeName: "Day", rangeMetric: "days" },
      { rangeName: "Month", rangeMetric: "months" },
      { rangeName: "Year", rangeMetric: "Years" }
    ],

    fieldNames: [],
    newAlert: {
      alertEmailAddressArray: [{ email: "logs@codingmart.com" }],
      alertMobileNumberArray: [{ mobile: "" }],
      alertMobileNumberFlag: true,
      alertName: "",
      alertFrequency: "1000",
      alertFieldType: "type",
      alertFieldName: "booking",
      alertOperator: ">",
      alertThresholdLimit: "",
      alertRangeValue: "5",
      alertRangeMetric: "seconds",
      alertState: true
    },
    alertRules: []
  };

  componentDidMount() {
    this.getAlertRules();
    this.setFieldNames();
  }

  setFieldNames() {
    const event = {
      target: {
        value: "type"
      }
    };
    this.handleFieldTypeChange(event);
  }

  handleFieldTypeChange(event) {
    console.log(event.target.value);
    const fieldTypeValue = event.target.value;
    const fieldTypeObj = this.state.fieldTypesList.find(
      x => x.fieldTypeValue === fieldTypeValue
    );
    this.setState({
      newAlert: { ...this.state.newAlert, alertFieldType: fieldTypeValue },
      fieldNames: fieldTypeObj.fieldNames
    });
    setTimeout(() => {
      console.log(this.state.fieldNames);
    });
  }

  handleChange = event => {
    let { newAlert } = this.state;
    newAlert[event.target.name] = event.target.value;
    this.setState({ newAlert });
    console.log(this.state.newAlert);
  };

  handleShareholderNameChange = idx => evt => {
    const alertEmailAddressArray = this.state.newAlert.alertEmailAddressArray.map(
      (shareholder, sidx) => {
        if (idx !== sidx) return shareholder;
        return { ...shareholder, email: evt.target.value };
      }
    );
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertEmailAddressArray: alertEmailAddressArray
      }
    });
  };

  handleAddShareholder() {
    const alertEmailAddressArray = this.state.newAlert.alertEmailAddressArray.concat(
      [{ email: "" }]
    );
    console.log(alertEmailAddressArray);
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertEmailAddressArray: alertEmailAddressArray
      }
    });
  }

  handleRemoveShareholder = idx => () => {
    const alertEmailAddressArray = this.state.newAlert.alertEmailAddressArray.filter(
      (s, sidx) => idx !== sidx
    );
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertEmailAddressArray: alertEmailAddressArray
      }
    });
  };

  handleMobileNumberFlag(flag) {
    console.log(flag);
    if (!flag) {
      this.setState({
        newAlert: {
          ...this.state.newAlert,
          alertMobileNumberFlag: false
        }
      });
    } else {
      this.setState({
        newAlert: {
          ...this.state.newAlert,
          alertMobileNumberFlag: true
        }
      });
    }
  }

  handleShareholderNameChangeNumber = idx => evt => {
    const alertMobileNumberArray = this.state.newAlert.alertMobileNumberArray.map(
      (shareholder, sidx) => {
        if (idx !== sidx) return shareholder;
        return { ...shareholder, mobile: evt.target.value };
      }
    );
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertMobileNumberArray: alertMobileNumberArray
      }
    });
  };

  handleAddShareholderNumber() {
    const alertMobileNumberArray = this.state.newAlert.alertMobileNumberArray.concat(
      [{ mobile: "" }]
    );
    console.log(alertMobileNumberArray);
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertMobileNumberArray: alertMobileNumberArray
      }
    });
  }

  handleRemoveShareholderNumber = idx => () => {
    const alertMobileNumberArray = this.state.newAlert.alertMobileNumberArray.filter(
      (s, sidx) => idx !== sidx
    );
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertMobileNumberArray: alertMobileNumberArray
      }
    });
  };

  getAlertRules() {
    axios.get("http://localhost:3300/get-alert-rules").then(response => {
      const alertRules = response.data.alertRules;
      console.log(alertRules);
      this.setState({ alertRules: alertRules });
    });
  }

  formValidation = () => {
    console.log("Form Validation");
    var alertName = this.state.newAlert.alertName;
    var threshold = this.state.newAlert.alertThresholdLimit;
    var mobile = this.state.newAlert.alertMobileNumberArray;
    var range = this.state.newAlert.alertRangeValue;
    let { formErrors } = this.state;
    if (alertName == "") {
      formErrors.push("Enter the Name of the Alert");
      this.setState({ formErrors });
      this.setState({ submitOK: false });
    }
    if (threshold == "") {
      formErrors.push("Enter the Threshold Value");
      this.setState({ formErrors });
      this.setState({ submitOK: false });
    }
    if (range == "") {
      formErrors.push("Enter the Range Value");
      this.setState({ formErrors });
      this.setState({ submitOK: false });
    }
    mobile.forEach(element => {
      console.log(element.mobile);
      if (
        isNaN(element.mobile) ||
        element.mobile < 1000000000 ||
        element.mobile > 9999999999
      ) {
        formErrors.push("Mobile Number is Not Valid");
        this.setState({ formErrors });
        this.setState({ submitOK: false });
      }
    });
    setTimeout(() => {
      console.log(this.state.submitOK);
      console.log(this.state.formErrors);
    }, 1000);
  };

  addNewAlert() {
    let { formErrors } = this.state;
    formErrors.splice(0, formErrors.length);
    this.setState({ submitOK: true, formErrors });
    console.log(this.state.formErrors);
    this.formValidation();

    console.log(this.state.newAlert);
    const alertFrequency = this.state.newAlert.alertFrequency;
    const alertRangeValue = this.state.newAlert.alertRangeValue;
    this.setState({
      newAlert: {
        ...this.state.newAlert,
        alertFrequency: parseInt(alertFrequency),
        alertRangeValue: parseInt(alertRangeValue),
        alertState: true
      }
    });

    setTimeout(() => {
      if (this.state.submitOK) {
        axios
          .post("http://localhost:3300/add-alert-rules", this.state.newAlert)
          .then(response => {
            console.log(response.data);
            this.getAlertRules();
            this.clearFields();
            Swal.fire(
              "Job Added Succesfully",
              "Your job has been started",
              "success"
            );
            // this.alertToast();
          });
      }
    }, 1000);
  }

  clearFields() {
    this.setState({
      newAlert: {
        alertEmailAddressArray: [{ email: "logs@codingmart.com" }],
        alertName: "",
        alertFrequency: "",
        alertFieldType: "",
        alertFieldName: "",
        alertOperator: "",
        alertThresholdLimit: "",
        alertState: true,
        alertMobileNumberArray: [{ mobile: "" }]
      }
    });
  }

  updateAlertState(alert) {
    console.log(alert.alertName);
    let obj = { alertUid: alert.alertUid, alertState: alert.alertState };
    axios
      .post("http://localhost:3300/update-alert-state", obj)
      .then(response => {
        console.log(response.data);
        this.getAlertRules();
      });
    console.log(obj);
  }

  deleteAlertState(alert) {
    let obj = { alertUid: alert.alertUid };
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    }).then(result => {
      if (result.value) {
        axios
          .post("http://localhost:3300/delete-alert-state", obj)
          .then(response => {
            console.log(response.data);
            Swal.fire("Deleted!", "Job has been deleted.", "success");
            this.getAlertRules();
          });
        console.log(obj);
      }
    });
    console.log(alert.alertName);
  }

  render() {
    return (
      <div className="stat-section">
        <h5 className="text-left">Alert System</h5>
        <br />
        <div className="alert-section">
          <h6>Alert Jobs</h6>
          <br />
          <div className="row">
            <div className="col-md-12">
              <div class="table-responsive">
                <table class="table">
                  <thead class="thead-dark">
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Field Name</th>
                      <th scope="col">Operator</th>
                      <th scope="col">Threshold</th>
                      <th scope="col">Frequency</th>
                      <th scope="col">State</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.alertRules.map((alert, idx) => (
                      <tr>
                        <td>{idx + 1}</td>
                        <td>{alert.alertName}</td>
                        <td>{alert.alertFieldName}</td>
                        <td>{alert.alertOperator}</td>
                        <td>{alert.alertThresholdLimit}</td>
                        <td>{alert.alertFrequency}</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => this.updateAlertState(alert)}
                            className={
                              "btn margin-right " +
                              (alert.alertState
                                ? " btn-success"
                                : "btn-warning")
                            }
                          >
                            {alert.alertState ? "Active" : "Not Active"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => this.deleteAlertState(alert)}
                            className="btn margin-right btn-danger"
                          >
                            Delete Job
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <br />
        <div className="alert-section">
          <h6>Add a New Alert System</h6>
          <br />
          <div className="row">
            <div className="form-group row col-6">
              <label for="logsThresholdLimit" className="col-6 col-form-label">
                Name of the Alert System
              </label>
              <div class="col-6">
                <input
                  type="text"
                  className="form-control"
                  id="logsThresholdLimit"
                  placeholder="Name of the Alert System"
                  name="alertName"
                  value={this.state.newAlert.alertName}
                  onChange={event => this.handleChange(event)}
                />
              </div>
            </div>

            <div className="form-group row col-6">
              <label for="logsThresholdLimit" className="col-6 col-form-label">
                Frequency
              </label>
              <div class="col-6">
                <select
                  value="5"
                  name="alertFrequency"
                  value={this.state.newAlert.alertFrequency}
                  onChange={event => this.handleChange(event)}
                  class="custom-select"
                >
                  <option value="1000">Every Second</option>
                  <option value="300000">5 Minutes</option>
                  <option value="1800000">30 Minutes</option>
                  <option value="3600000">1 Hour</option>
                  <option value="86400000">1 Day</option>
                </select>
              </div>
            </div>
            <div className="col-md-12 alert-box">
              <hr />
              <h6 className="text-left">Match the Following Condition</h6>
              <br />
              <div className="row text-left">
                <div className="col-6">
                  <div class="form-group">
                    <label for="formGroupExampleInput">Select Field Type</label>
                    <select
                      value={this.state.newAlert.alertFieldType}
                      onChange={event => this.handleFieldTypeChange(event)}
                      class="custom-select"
                    >
                      {this.state.fieldTypesList.map(field => (
                        <option value={field.fieldTypeValue}>
                          {field.fieldTypeName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <br />
                <div className="col-6">
                  <div class="form-group">
                    <label for="formGroupExampleInput">Select Field Name</label>
                    <select
                      value="5"
                      class="custom-select"
                      name="alertFieldName"
                      value={this.state.newAlert.alertFieldName}
                      onChange={event => this.handleChange(event)}
                    >
                      {this.state.fieldNames.map(field => (
                        <option value={field.fieldValue}>
                          {field.fieldName}
                        </option>
                      ))}
                      event
                    </select>
                  </div>
                </div>

                <div className="col-4">
                  <div class="form-group">
                    <label for="formGroupExampleInput">Compare</label>
                    <select
                      value="5"
                      class="custom-select"
                      name="alertOperator"
                      value={this.state.newAlert.alertOperator}
                      onChange={event => this.handleChange(event)}
                    >
                      {this.state.alertOperators.map(operator => (
                        <option value={operator.operatorValue}>
                          {operator.operatorName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="col-4">
                  <div class="form-group">
                    <label for="formGroupExampleInput">Threshold Value</label>
                    <input
                      type="number"
                      className="form-control"
                      id="logsThresholdLimit"
                      name="alertThresholdLimit"
                      value={this.state.newAlert.alertThresholdLimit}
                      onChange={event => this.handleChange(event)}
                      placeholder="Threshold Value"

                      //   onChange={event => this.logsThresholdCountInput(event)}
                    />
                  </div>
                </div>

                <div className="col-4">
                  <label for="formGroupExampleInput">
                    Range (i.e Last 5 Minutes)
                  </label>
                  <div className="row">
                    <input
                      type="number"
                      className="form-control col-6"
                      id="logsThresholdLimit"
                      placeholder="Value"
                      name="alertRangeValue"
                      value={this.state.newAlert.alertRangeValue}
                      onChange={event => this.handleChange(event)}
                    />
                    <div className="col-6">
                      <select
                        value="5"
                        name="alertRangeMetric"
                        value={this.state.newAlert.alertRangeMetric}
                        onChange={event => this.handleChange(event)}
                        class="custom-select"
                      >
                        {this.state.alertRange.map(range => (
                          <option value={range.rangeMetric}>
                            {range.rangeName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Email Address Box */}
            <div className="col-md-12 alert-box">
              <hr />
              <h6 className="text-left">Alert Notifications</h6>
              <br />
              <div className="form-group row text-left">
                <label for="emailAddress" className="col-4 col-form-label">
                  Email Addresss
                </label>
                <div class="col-8">
                  {this.state.newAlert.alertEmailAddressArray.map(
                    (emailAddress, idx) => (
                      <div className="d-flex flex-row align-items-center">
                        <input
                          type="text"
                          placeholder={`Enter #${idx + 1} Email Address`}
                          value={emailAddress.email}
                          onChange={this.handleShareholderNameChange(idx)}
                          className="form-control"
                          id="emailAddress"
                        />
                        <button
                          type="button"
                          onClick={this.handleRemoveShareholder(idx)}
                          className="btn-danger btn margin-left"
                        >
                          -
                        </button>
                        <br /> <br />
                      </div>
                    )
                  )}
                  <br />
                  <button
                    type="button"
                    onClick={() => this.handleAddShareholder()}
                    className="btn-primary btn"
                  >
                    Add New Email Address
                  </button>
                </div>
              </div>

              <hr />
              <br />

              <div className="form-group row text-left">
                <div className="col-4">
                  <label for="mobileNumber" className="col-form-label">
                    Mobile Number
                  </label>
                  <br />
                  <Switch
                    onChange={event => this.handleMobileNumberFlag(event)}
                    name="alertMobileNumberFlag"
                    checked={this.state.newAlert.alertMobileNumberFlag}
                    id="normal-switch"
                  />
                </div>

                <div
                  style={
                    this.state.newAlert.alertMobileNumberFlag
                      ? {}
                      : { display: "none" }
                  }
                  class="col-8"
                >
                  {this.state.newAlert.alertMobileNumberArray.map(
                    (mobileNumber, idx) => (
                      <div className="d-flex flex-row align-items-center">
                        <input
                          type="number"
                          placeholder={`Enter #${idx + 1} Mobile Number`}
                          value={mobileNumber.mobile}
                          onChange={this.handleShareholderNameChangeNumber(idx)}
                          className="form-control"
                          id="mobileNumber"
                        />
                        <button
                          type="button"
                          onClick={this.handleRemoveShareholderNumber(idx)}
                          className="btn-danger btn margin-left"
                        >
                          -
                        </button>
                        <br /> <br />
                      </div>
                    )
                  )}
                  <br />
                  <button
                    type="button"
                    onClick={() => this.handleAddShareholderNumber()}
                    className="btn-primary btn"
                  >
                    Add New Mobile Number
                  </button>
                </div>
              </div>
            </div>
            <hr />

            <div className="text-center col-md-12">
              <div
                style={
                  this.state.formErrors.length > 0 ? {} : { display: "none" }
                }
                className="form-errors-box"
              >
                {this.state.formErrors.map(error => (
                  <p>{error}</p>
                ))}
              </div>
              <button
                type="button"
                onClick={() => this.addNewAlert()}
                className="btn btn-primary update-btn bg-grey "
              >
                Add New Alert
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default AlertSystem;
