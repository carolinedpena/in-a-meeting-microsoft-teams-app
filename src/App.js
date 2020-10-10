import React, { Component } from 'react';
import { BrowserRouter, Route, Redirect } from 'react-router-dom'
import { Container } from 'reactstrap';

import ErrorMessage from './utils/Error';
import Home from './components/Home';
import AutoMessageOn from './components/AutoMessageOn';
import withAuthProvider from './authprovider';

class App extends Component {
  render() {
    let error = null;

    if (this.props.error) {
      error = <ErrorMessage
        message={this.props.error.message}
        debug={this.props.error.debug} />
    }

    return (
      <BrowserRouter>
        <div>
          <Container>
            {error}
            <Route exact path="/"
              render={(props) =>
                <Home {...props}
                  isAuthenticated={this.props.isAuthenticated}
                  user={this.props.user}
                  authButtonMethod={this.props.login} />
              } />
              <Route path="/auto-reply"
                render={(props) => 
                  this.props.isAuthenticated ?
                <AutoMessageOn {...props} /> :
                <Redirect to="/" />
              } />
          </Container>
        </div>
      </BrowserRouter>
    )
  }
}

export default withAuthProvider(App);