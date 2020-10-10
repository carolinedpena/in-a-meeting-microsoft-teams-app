import moment from 'moment';
import axios from 'axios';

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

    // query chats and grab all chat ids
    const chats = await client.api('/me/chats').version('beta').get();
    const chatsArr = chats.value;

    const chatsIds = [];
    for (let chat of chatsArr) {
        chatsIds.push(chat['id'])
    }

    // set up expirationDateTime for subscription
    const expire = new Date();
    expire.setHours(expire.getHours() + 1);
    const expireDT = expire.toISOString()

    // creating subscription for each chat thread
    for (let id of chatsIds) {
        const subscription = {
            changeType: 'created',
            notificationUrl: 'https://55fa687a79cc.ngrok.io/api/subscription-listen',
            resource: `/chats/${id}/messages`,
            expirationDateTime: expireDT,
            includeResourceData: false
        }

       await client.api('/subscriptions').version('beta').post(subscription)
    }
}

// initalizing chatId and messageId that will be returned from server
let chatId = null;
let messageId = null;

// incoming message handler
export async function incomingMessageHandler(accessToken, meetingEnd) {

    // ping server to look for new messages
    await axios.get('http://localhost:5000/api/subscription-send')
    .then(res => {
        return res.data
    }).then(resData => {
        // if new resource = new message
        if (resData['data'][0]) {
            // grab chatID and messageId from response
            const newChatId = resData['data'][0]['resource'].split('/')[0].split("'")[1]
            const newMessageId = resData['data'][0]['resource'].split('/')[1].split("'")[1]

            // if newChatID does not equal current chatID, new chat updates
            if (newChatId !== chatId) {
                // set chatID to new chat ID
                chatId = newChatId

                // if newMessageId does not equal current messageId -> there's a new message to respond to
                if (newMessageId !== messageId) {
                    // call replyHandler to send reply
                    replyHandler(accessToken, chatId, meetingEnd);
                }
            }
        }
    })
}

// replyHandler
export async function replyHandler(accessToken, chatId, meetingEnd) {
    const client = getAuthenticatedClient(accessToken);

    // Message to send 
    const bodyString = `Hello. I'm currently in a meeting that ends at ${meetingEnd}. I will respond to your message as soon as I can. Thanks!`;

    const chatMessage = {
        body: {
            "content": bodyString
        }
    }

    // Send message to chat that a new message was sent to
    await client.api(`/chats/${chatId}/messages`).version('beta').post(chatMessage);
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
            return meeting['end']
        } else {
            return false
        }
    }
}

// delete message subscription
export async function deleteMessageSubscription(accessToken) {
    const client = getAuthenticatedClient(accessToken);

    // get subscriptions and subscription ids
    const subscriptions = await client.api('/subscriptions').get();
    const subscriptionsArr = subscriptions.value
    
    const subscriptionIds = [];
    for (let subscription of subscriptionsArr) {
        subscriptionIds.push(subscription['id'])
    } 

    // delete all subscriptions
   for (let id of subscriptionIds) {
       await client.api(`/subscriptions/${id}`).version('beta').delete();
   }
}