
async function testUazapi() {
    const instanceId = '61985154043';
    const token = '8d1a0acf-89d5-45ad-859f-8c83e6d4bb7d';
    const url = `https://${instanceId}.uazapi.com/chat/find`;

    console.log(`Testing URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'token': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                limit: 5
            })
        });

        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Success! Data sample:', JSON.stringify(data).substring(0, 200));
        } else {
            console.log('Error:', await response.text());
        }
    } catch (e) {
        console.error('Fetch error:', e);
    }
}

testUazapi();
