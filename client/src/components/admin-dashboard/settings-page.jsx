import React, { Component } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import AlertSystem from "./components/alert-system";
import { BrowserRouter, Route, Switch } from "react-router-dom";

class Settings extends Component {
  state = { alertEmailAddressArray: [{ email: "logs@codingmart.com" }] };
  constructor() {
    super();
    this.getSettingsData();
  }

  alertEmailAddressInput(event) {
    this.setState({ alertEmailAddress: event.target.value });
  }

  logsThresholdCountInput(event) {
    this.setState({ logsThresholdCount: parseInt(event.target.value) });
  }

  updateSettings() {
    console.log(this.state);
    axios
      .post("http://localhost:3300/update-settings", this.state)
      .then(response => {
        console.log(response);
        this.alertToast();
      });
  }

  alertToast() {
    console.log("Alerting Toast");
    toast.success("🦄 Settings Updated", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }

  getSettingsData() {
    axios.get("http://localhost:3300/settings").then(response => {
      console.log(response.data);
      let obj = response.data;
      console.log(obj);
      this.setState(obj);
    });
  }

  handleShareholderNameChange = idx => evt => {
    const alertEmailAddressArray = this.state.alertEmailAddressArray.map(
      (shareholder, sidx) => {
        if (idx !== sidx) return shareholder;
        return { ...shareholder, email: evt.target.value };
      }
    );
    this.setState({ alertEmailAddressArray: alertEmailAddressArray });
  };

  handleAddShareholder() {
    const alertEmailAddressArray = this.state.alertEmailAddressArray.concat([
      { email: "" }
    ]);
    console.log(alertEmailAddressArray);
    this.setState({
      alertEmailAddressArray: alertEmailAddressArray
    });
  }

  handleRemoveShareholder = idx => () => {
    this.setState({
      alertEmailAddressArray: this.state.alertEmailAddressArray.filter(
        (s, sidx) => idx !== sidx
      )
    });
  };

  render() {
    return (
      <div className="main-admin-container container-fluid">
        <div className="row">
          <div className="col-md-12 stat-section">
            <h3 className="text-left">Settings</h3>
            {/* <hr />
            <h5 className="text-left">Logs Alert System</h5>
            <div className="settings-box ">
              <br />
              <div className="form-group row">
                <label
                  for="logsThresholdLimit"
                  className="col-4 col-form-label"
                >
                  Logs Threshold Limit
                </label>
                <div class="col-8">
                  <input
                    type="text"
                    className="form-control"
                    id="logsThresholdLimit"
                    value={
                      this.state.logsThresholdCount
                        ? this.state.logsThresholdCount
                        : 200
                    }
                    onChange={event => this.logsThresholdCountInput(event)}
                  />
                </div>
              </div>

              <div className="form-group row">
                <label for="emailAddress" className="col-4 col-form-label">
                  Email Addresss
                </label>
                <div class="col-8">
                  {this.state.alertEmailAddressArray.map(
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

              <button
                type="button"
                onClick={() => this.updateSettings()}
                className="btn btn-primary update-btn bg-grey "
              >
                Update Settings
              </button>
            </div>

            <hr /> */}

            <AlertSystem />
          </div>
        </div>
      </div>
    );
  }
}

export default Settings;
