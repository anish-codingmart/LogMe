import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import AdminDashboard from "./components/admin-dashboard/admin-dashboard";
import Navbar from "./components/navbar/navbar";
import "react-dates/initialize";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import Sidebar from "./components/sidebar/sidebar";
import MainContainer from "./components/admin-dashboard/main-container-admin-dashboard";
import Discover from "./components/admin-dashboard/discover-page";
import Settings from "./components/admin-dashboard/settings-page";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import socketIOClient from "socket.io-client";

class App extends Component {
  componentDidMount() {
    this.state = {
      response: false,
      endpoint: "http://127.0.0.1:4001"
    };
    // this.initSocketIO();
  }

  initSocketIO() {
    const { endpoint } = this.state;
    const socket = socketIOClient(endpoint);
    socket.on("alertThresholdLimit", data => {
      console.log(data);
      this.alertToast();
    });
  }

  alertToast() {
    console.log("Alerting Toast");
    toast.warn("🦄 Log Threshold Limit Alert!", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }
  render() {
    return (
      <div className="App">
        <Navbar />
        <BrowserRouter>
          <div className="container-fluid">
            <div className="row">
              <div className="col-md-2 padding-none">
                <Sidebar />
              </div>
              <div className="col-md-10 main-container">
                <Switch>
                  <Route exact path="/" component={MainContainer} />
                  <Route exact path="/admin" component={MainContainer} />
                  <Route exact path="/discover" component={Discover} />
                  <Route exact path="/settings" component={Settings} />
                </Switch>
                <ToastContainer />
              </div>
            </div>
          </div>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
