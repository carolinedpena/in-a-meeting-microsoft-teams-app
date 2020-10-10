import React, { Component } from 'react';
import { Button, Container, Typography } from '@material-ui/core';
import { NavLink as RouterNavLink } from 'react-router-dom';

import classes from '../styles/Home.module.css';


const HomeContent = (props) => {
    // if authenticated, give user instructions on how to use app
    if (props.isAuthenticated) {
        return (
            <div>
                <Typography variant='h5'> Hi {props.user.displayName}!</Typography>
                <Typography variant='h5'>Please click the button below to turn on your in a meeting auto response.</Typography>

                <RouterNavLink to="/auto-reply">
                    <Button variant="outlined" color="secondary"> Turn on Auto Reply </Button>
                </RouterNavLink>
            </div>
        )
    }

    // if not authenticated, give sign in button
    return (
            <Button variant="outlined" color="primary" onClick={props.authButtonMethod}>
                Sign In
            </Button> 
    )
}

export default class Home extends Component {
    render() {
        return (
            <Container className={classes.root} maxWidth="sm">
                <Typography className={classes.title} color="textSecondary">In a Meeting Auto Response</Typography>
                <Typography variant="h6" color="textSecondary">This app sends an auto reply to your coworker's chat message or mention when you are in a meeting.</Typography>

                <HomeContent 
                isAuthenticated={this.props.isAuthenticated}
                user={this.props.user}
                accessToken={this.props.accessToken}
                authButtonMethod={this.props.authButtonMethod}
                autoReplyMethod={this.props.autoReplyMethod}
                deleteMethod={this.props.deleteMethod}
                />
            </Container>
        )
    }
}