self.onmessage = async function (e) {
    const { fileId, paper, isSydneyEnabled, isGold, siteUrl, token } = e.data;

    try {
        // Simulate API call - replace with your actual API calls
        const response = await fetch(`${siteUrl}/api/evaluate/paper/${fileId}/${isSydneyEnabled ? 1 : 0}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        self.postMessage({
            type: 'SUCCESS',
            fileId,
            data: result
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            fileId,
            error: error.message
        });
    }
};