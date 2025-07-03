self.onmessage = async function (e) {
    const { fileIds, siteUrl, token } = e.data;

    try {
        const response = await fetch(`${siteUrl}/api/evaluate/multiple`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ file_ids: fileIds })
        });

        const result = await response.json();

        self.postMessage({
            type: 'SUCCESS',
            data: result
        });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            error: error.message
        });
    }
};