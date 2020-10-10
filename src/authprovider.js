import React, { Component } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

import { config } from './utils/Config';
import { getUserDetails } from './api/graph';

const withAuthProvider = (WrappedCompnent) => {
    class AuthProvider extends Component {
        constructor(props) {
            super(props);

            this.state = {
                error: null,
                isAuthenticated: false,
                isMounted: false,
                user: {},
                accessToken: null,
            }


            this.publicClientApplication = new PublicClientApplication({
                auth: {
                    clientId: config.appId,
                    redirectUri: config.redirectUri
                },
                cache: {
                    cacheLocation: "sessionStorage",
                    storeAuthStateInCookie: true
                }
            })
        }

        componentDidMount() {
            this.setState({
                ...this.state,
                isMounted: true
            })

            // check if user is already logged in
            const accounts = this.publicClientApplication.getAllAccounts();

            if (accounts && accounts.length > 0) {
                this.getUserProfile();
            }

        }

        componentWillUnmount() {
            this.setState({
                ...this.state,
                isMounted: false
            })
        }

        async login() {
            try {
                // login via popup
                await this.publicClientApplication.loginPopup({
                    scopes: config.scopes,
                    prompt: "select_account"
                })

                await this.getUserProfile()
            } catch(err) {
                if (this.state.isMounted) {
                    this.setState({
                        isAuthenticated: false,
                        user: {},
                        error: this.normalizeError(err)
                    })
                }
            }
        }

        logout() {
            this.publicClientApplication.logout()
        }

        async getAccessToken(scopes) {
            try {
                const accounts = this.publicClientApplication.getAllAccounts();

                if (accounts.length <= 0) {
                    throw new Error('login_required')
                }

                // get access token silently
                const silentResult = await this.publicClientApplication.acquireTokenSilent({
                        scopes: scopes,
                        account: accounts[0]
                })
                
                return silentResult.accessToken;
            } catch(err) {
                if (this.isInteractionRequired(err)) {
                    const interactiveResult = await this.publicClientApplication.acquireTokenPopup({
                        scopes: scopes
                    })

                    return interactiveResult.accessToken
                } else {
                    throw err;
                }
            }
        }

        async getUserProfile() {
            try {
                const accessToken = await this.getAccessToken(config.scopes);

                if (accessToken) {
                    // get user profile

                    const user = await getUserDetails(accessToken);
                    
                    if (this.state.isMounted) {
                        this.setState({
                            isAuthenticated: true,
                            user: {
                                displayName: user.displayName,
                                email: user.email || user.userPrincipalName,
                                timeZone: user.mailboxSettings.timeZone,
                                timeFormat: user.mailboxSettings.timeFormat
                            },
                            error: null
                        })
                    }
                }
            } catch(err) {
                if (this.state.isMounted) {
                    this.setState({
                        isAuthenticated: false,
                        user: {},
                        error: this.normalizeError(err)
                    })
                }
            }
        }

        setErrorMessage(message, debug) {
            if (this.state.isMounted) {
                this.setState({
                    error: { message, debug }
                })
            }
        }

        normalizeError(error) {
            let normalizedError = {};

            if (typeof(error) === 'string') {
                const errParts = error.split('|');
                normalizedError = errParts.length > 1 ?
                    { message: errParts[1], debug: errParts[0] } :
                    { message: error }
            } else {
                normalizedError = {
                    message: error.message,
                    debug: JSON.stringify(error)
                }
            }

            return normalizedError
        }

        isInteractionRequired(error) {
            if (!error.message || error.message.length <=0) {
                return false;
            }

            return (
                error.message.indexOf('consent_required') > - 1 ||
                error.message.indexOf('interaction_required') > -1 ||
                error.message.indexOf('login_required') > -1 ||
                error.message.indexOf('no_account_in_silent_request') > -1
            )
        }

        render() {
            return <WrappedCompnent
                error = { this.state.error }
                isAuthenticated = { this.state.isAuthenticated }
                user = { this.state.user }
                login = { () => this.login() }
                logout = { () => this.logout() }
                getAccessToken = { (scopes) => this.getAccessToken(scopes) }
                setError = { (message, debug) => this.setErrorMessage(message, debug) }
                {...this.props}
                {...this.state} />
        }
    }

    return AuthProvider
}

export default withAuthProvider