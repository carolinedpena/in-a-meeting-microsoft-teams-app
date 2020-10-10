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
            meetingTime: null,
            messagingOn: true
        }

    }

    async componentDidMount() {
        try {
            // get user's access token
            const accessToken = await this.props.getAccessToken(config.scopes);
            
            await messageSubscription(accessToken);

            const userInMeeting = await verifyUserMeeting(accessToken);

            if (userInMeeting) {
                const meetingEndTime = userInMeeting.split(' ').slice(1,3).join(' ');

                incomingMessageHandler(accessToken, meetingEndTime)

                this.interval = setInterval(() => {
                    incomingMessageHandler(accessToken, meetingEndTime)
                }, 1000)

                this.setState({
                    isLoaded: true,
                    inAMeeting: true,
                })   
            }

        } catch(err) {
            this.props.setError('ERROR', JSON.stringify(err));
        }
    }

    async componentWillUnmount() {
        try {
            const accessToken = await this.props.getAccessToken(config.scopes);

            await deleteMessageSubscription(accessToken);

            clearInterval(this.interval)
        } catch(err) {
            throw new Error(err)
        }
    }
    
    render() {
        return (
            <Container className={classes.root} maxWidth="sm">
            <Typography variant="h4">In a Meeting Auto Response</Typography>
            <br></br>
            <Typography color="textSecondary">This app sends an auto reply to your coworker's chat message or mention when you are in a meeting.</Typography>
            <br></br>
            <br></br>
            <Typography variant="h5">Your auto reply message is on!</Typography>
            <br></br>
            <Typography variant="h6">Please click the button below if you'd like to turn it off</Typography>
            <br></br>
            <RouterNavLink to="/">
                <Button variant="outlined" color="primary"> Turn off Auto Reply </Button>
            </RouterNavLink>
        </Container>
        )
    }
}

export default withAuthProvider(AutoMessageOn);