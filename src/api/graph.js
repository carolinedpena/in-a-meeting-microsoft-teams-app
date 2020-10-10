import moment from 'moment';

const graph = require('@microsoft/microsoft-graph-client');

// helper function to authenticate client
const getAuthenticatedClient = (accessToken) => {
    // initalize graph client
    const client = graph.Client.init({
        authProvider: (done) => {
            done(null, accessToken);
        }
    });

    return client;
}

// get user details
export async function getUserDetails(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    const user = await client
        .api('/me')
        .select('displayName, mail, mailboxSettings, userPrincipalName')
        .get()

    return user;
}

// message subscription
export async function messageSubscription(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    const chats = await client.api('/me/chats').version('beta').get();
    const chatsArr = chats.value;

    const chatsIds = [];
    for (let chat of chatsArr) {
        chatsIds.push(chat['id'])
    }

    for (let id of chatsIds) {
        await client.api(`/chats/${id}/messages`).version('beta').get()
    }

    // const userTeams = await client
    //     .api('/me/joinedTeams')
    //     .get()
    
    // const teamId = userTeams.value[0]['id']

    // const userChannels = await client
    //     .api(`/teams/${teamId}/channels`)
    //     .get()

    // const userChannelsArr = userChannels.value;

    // const channelIds = []
    // for (let channel of userChannelsArr) {
    //     channelIds.push(channel['id'])
    // }

    const expire = new Date();
    expire.setHours(expire.getHours() + 1);
    const expireDT = expire.toISOString()

    for (let id of chatsIds) {
        const subscription = {
            changeType: 'created',
            notificationUrl: 'https://6fe94a072cfa.ngrok.io/api/subscription-listen',
            resource: `/chats/${id}/messages`,
            expirationDateTime: expireDT,
            includeResourceData: false
        }

       await client.api('/subscriptions').version('beta').post(subscription)
    }
}

// delete message subscription
export async function deleteMessageSubscription(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    // get subscriptions
    const subscriptions = await client.api('/subscriptions').get();
    console.log(subscriptions.value)
    const subscriptionsArr = subscriptions.value
    
    const subscriptionIds = [];
    for (let subscription of subscriptionsArr) {
        subscriptionIds.push(subscription['id'])
    } 

   for (let id of subscriptionIds) {
       await client.api(`/subscriptions/${id}`).version('beta').delete();
   }
}

// incoming message handler
export async function incomingMessageHandler() {
    const corsProxy = "https://cors-anywhere.herokuapp.com/"

    await fetch(corsProxy + '/39a5e3863c78.ngrok.io/api/subscription-listen')
    .then(res => {
        if (res.ok) {
            return res.json()
        }
    }).then(resJson => {
        console.log(resJson)
    })
}

// verify user in meeting
export async function verifyUserMeeting(accessToken) {
    const client = getAuthenticatedClient(accessToken);
    
    // grab user's events
    const userEvents = await client
        .api('/me/events')
        .header('Prefer', 'outlook.timezone="Eastern Standard Time"')
        .select('start,end')
        .get()

    
    const userEventsArr = userEvents.value;

    // modify event start and end times to be more readable
    for (let event of userEventsArr) {
        event['start'] = moment(event['start']['dateTime']).format('M/D/YY h:mm A')
        event['end'] = moment(event['end']['dateTime']).format('M/D/YY h:mm A')
    }

    // grab today's date and time
    const currentDate = new Date()
    const currentDateTime = currentDate.toLocaleString(undefined, { dateStyle: "short", timeStyle: "short"});
    const currentDateString = (currentDate.getMonth() + 1) + '/' + currentDate.getDate() + '/' +  currentDate.getFullYear().toString().substr(-2);
    
    // grab today's meetings
    const todaysMeetings = [];

    for (let event of userEventsArr) {
        if (event['start'].split(' ')[0] === currentDateString) {
            todaysMeetings.push(event)
        }
    }
    
    for (let meeting of todaysMeetings) {
        if (new Date(currentDateTime) > new Date(meeting['start']) && new Date(currentDateTime) < new Date(meeting['end'])) {
            return {
                meetingEnd: meeting['end']
            };
        } 
    }
}

// autoReply function
export async function replyHandler(accessToken, meetingEnd, body) {
    const client = getAuthenticatedClient(accessToken);

    console.log(body)

    const response = `Hello. I'm currently in a meeting that ends at ${meetingEnd}. I will respond to your message as soon as I can. Thanks!`;

    // await client.api(`/chats/${chatId}/messages`).version('beta').post(response);
}