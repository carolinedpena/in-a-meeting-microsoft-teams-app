import React, { Component } from 'react';
import { Button, Container, Typography } from '@material-ui/core';
import { NavLink as RouterNavLink } from 'react-router-dom';

import { config } from '../utils/Config';
import { verifyUserMeeting, messageSubscription, deleteMessageSubscription, incomingMessageHandler } from '../api/graph';
import withAuthProvider from '../authprovider';
import classes from '../styles/Home.module.css';

class AutoMessageOn extends Component {
    constructor(props) {
        super(props);
        
        this.state = {
            isLoaded: false,
            inAMeeting: false,
            messagingOn: true
        }
    }

    async componentDidMount() {
        try {
            // get user's access token
            const accessToken = await this.props.getAccessToken(config.scopes);

            const userInMeeting = await verifyUserMeeting(accessToken);
            await messageSubscription(accessToken);

            this.setState({
                isLoaded: true,
                inAMeeting: userInMeeting
            })

        } catch(err) {
            this.props.setError('ERROR', JSON.stringify(err));
        }
    }

    async componentDidUpdate() {
        const body = await incomingMessageHandler()

        console.log(body)
    }

    async componentWillUnmount() {
        try {
            const accessToken = await this.props.getAccessToken(config.scopes);

            await deleteMessageSubscription(accessToken);
        } catch(err) {
            throw new Error(err)
        }
    }
    render() {
        return (
            <Container className={classes.root} maxWidth="sm">
            <Typography className={classes.title} color="textSecondary">In a Meeting Auto Response</Typography>
            <Typography variant="h6" color="textSecondary">This app sends an auto reply to your coworker's chat message or mention when you are in a meeting.</Typography>

            <Typography variant="h5">Your auto reply message is on!</Typography>
            <Typography variant="h5">Please click the button below if you'd like to turn it off</Typography>

            <RouterNavLink to="/">
                <Button variant="outlined" color="secondary"> Turn off Auto Reply </Button>
            </RouterNavLink>
        </Container>
        )
    }
}

export default withAuthProvider(AutoMessageOn);