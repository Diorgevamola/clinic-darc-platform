
async function testRealChats() {
    const token = '9d1e432a-6530-47ad-9cde-f15109051f68';
    const url = 'https://syxlabs.uazapi.com/chat/find';

    console.log(`Fetching chats from: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                limit: 10,
                sort: "-wa_lastMsgTimestamp"
            })
        });

        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Raw API Response:', JSON.stringify(data, null, 2));

            if (Array.isArray(data)) {
                console.log('Response is an array (Direct list?)');
            } else if (data.response && Array.isArray(data.response)) {
                console.log('Response has .response property (Standard wrapper?)');
            } else {
                console.log('Unknown response structure');
            }
        } else {
            console.log('Error Body:', await response.text());
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testRealChats();
