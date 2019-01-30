import React, { Component } from "react";
import Sidebar from "../sidebar/sidebar";
import MainContainer from "./main-container-admin-dashboard";

import { BrowserRouter, Route } from "react-router-dom";

class AdminDashboard extends Component {
  state = {};
  render() {
    return (
      <BrowserRouter>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-2 padding-none">
              <Sidebar />
            </div>
            <div className="col-md-10 main-container">
              <Route path="/main" Component={MainContainer} />
            </div>
          </div>
        </div>
      </BrowserRouter>
    );
  }
}

export default AdminDashboard;
