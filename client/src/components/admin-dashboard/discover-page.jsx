import React, { Component } from "react";
import axios from "axios";

class Discover extends Component {
  constructor(props) {
    super(props);
    this.onUpdateSearch = this.onUpdateSearch.bind(this);
    this.state = {
      hits: []
    };
  }

  onUpdateSearch(event) {
    let value = event.target.value;
    let apiURL = "http://localhost:9200/logsindex/_search?q=" + value;
    axios.get(apiURL).then(response => {
      let hits = response.data.hits.hits;
      console.log(response.data);
      console.log(hits);
      if (hits) {
        this.setState({ hits: hits, hitsCount: hits.length });
      }
    });
  }
  render() {
    return (
      <div className="main-admin-container container-fluid">
        <div className="row">
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
                  <tr className="animated bounceInUp" key={item._id}>
                    <td>{item._source.timestamp}</td>
                    <td>{item._source.client}</td>
                    <td className="word-break">{item._source.agent}</td>
                    <td>{item._source.method}</td>
                    <td className="word-break">{item._source.url}</td>
                    <td>{item._source.request}</td>
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
