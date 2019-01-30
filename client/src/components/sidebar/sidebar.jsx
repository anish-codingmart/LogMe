import React, { Component } from "react";
import { Link } from "react-router-dom";

class Sidebar extends Component {
  state = {};
  render() {
    return (
      <div className="sidebar-container text-left">
        <Link className="route-links" to="/admin">
          <p className="sidebar-link">Visualize</p>
        </Link>
        <Link className="route-links" to="/discover">
          <p className="sidebar-link">Discover</p>
        </Link>
        <Link className="route-links" to="/settings">
          <p className="sidebar-link">Settings</p>
        </Link>
      </div>
    );
  }
}

export default Sidebar;
