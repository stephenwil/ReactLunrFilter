import * as React from "react";
import { times, map, find, sortBy } from "lodash";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
const faker = require("faker");
const lunrLib = require("lunr");

const styles = theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing.unit * 3,
    overflowX: "auto"
  },
  table: {
    minWidth: 700
  }
});

enum FilterType {
  name,
  postcode
}

class Filter extends React.Component<any, {}> {
  constructor(props) {
    super(props);

    this.state = {
      lunr: {
        index: null
      },
      clients: [],
      filteredClients: []
    };
  }

  createFakeData() {
    // Create fake data using faker
    // Create an index for Lunr to search on using faker
    // data
    const now = new Date();
    faker.locale = "en_GB";

    const fakeClients = [];
    times(25, () => {
      const dobRange = Math.floor(Math.random() * (50 - 25)) + 25;
      const fakeClient = {
        id: faker.random.uuid(),
        name: faker.name.findName(),
        dob: faker.date.past(dobRange, now).toDateString(),
        postcode: faker.address.zipCode(),
        accountNum: faker.finance.account()
      };
      fakeClients.push(fakeClient);
    });

    return sortBy(fakeClients, "name");
  }

  createSearchIndex(clients) {
    var idx = lunrLib(function() {
      this.ref("accountNum");
      this.field("name", {
        boost: 10
      });
      this.field("dob");
      this.field("postcode");
      this.field("accountNum");

      clients.forEach(function(client) {
        this.add(client);
      }, this);
    });

    return idx;
  }

  componentDidMount() {
    const clients = this.createFakeData();

    this.setState({
      ...this.state,
      clients,
      lunr: {
        ...this.state.lunr,
        index: this.createSearchIndex(clients)
      }
    });
  }

  handleSearch(e: any, filter) {
    if (!e) return;
    const { target: { value } } = e;
    const { lunr: { index }, clients } = this.state;

    if (!index || !value) {
      this.setState({
        ...this.state,
        filteredClients: null
      });
      return;
    }

    let searchTerm;
    switch (filter) {
      case FilterType.name:
        searchTerm = `name:*${value}*`;
        break;
      case FilterType.postcode:
        searchTerm = `postcode:*${value}*`;
        break;
    }

    const results = sortBy(this.search(clients, index, searchTerm), "name");
    this.setState({
      ...this.state,
      filteredClients: results
    });
  }

  search(clients, index, query) {
    return index.search(query.trim()).map(match => {
      const client = find(clients, { accountNum: match.ref });
      return client;
    });
  }

  renderTable() {
    const { classes } = this.props;
    const { filteredClients, clients } = this.state;

    const clients =
      filteredClients && filteredClients.length > 0 ? filteredClients : clients;

    return (
      <Table className={classes.table}>
        <TableHead>
          <TableRow>
            <TableCell>Client name</TableCell>
            <TableCell>Date of birth</TableCell>
            <TableCell>PostCode</TableCell>
            <TableCell>Account Num</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {map(clients, (client, index) => {
            return (
              <TableRow key={index}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{client.dob}</TableCell>
                <TableCell>{client.postcode}</TableCell>
                <TableCell>{client.accountNum}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    );
  }

  render() {
    const { classes } = this.props;

    return (
      <div className="app-container">
        <Paper className={classes.root}>
          <div className="search-container">
            <TextField
              id="filtername"
              label="Filter by client name"
              className={classes.textField}
              value={this.state.name}
              onChange={e => this.handleSearch(e, FilterType.name)}
              onBlur={e => this.handleSearch(e, FilterType.name)}
              margin="normal"
            />
            <TextField
              id="filterPostcode"
              label="Filter by post code"
              className={classes.textField}
              value={this.state.name}
              onChange={e => this.handleSearch(e, FilterType.postcode)}
              onBlur={e => this.handleSearch(e, FilterType.postcode)}
              margin="normal"
            />
          </div>
          <div className="results-container">{this.renderTable()}</div>
        </Paper>
      </div>
    );
  }
}
export default withStyles(styles)(Filter);
