
async function testRealMessages() {
    const token = '9d1e432a-6530-47ad-9cde-f15109051f68';
    const url = 'https://syxlabs.uazapi.com/message/find';
    const chatId = '554874005156@s.whatsapp.net';

    console.log(`Fetching messages for: ${chatId}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chatid: chatId,
                limit: 5,
                sort: "-wa_timestamp"
            })
        });

        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Raw Message Response:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error Body:', await response.text());
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testRealMessages();
