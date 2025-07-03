self.onmessage = async function (e) {
    const { group, file, token, siteUrl } = e.data;

    try {
        const prompt = `
        Your task is to provide a detailed pre-analysis of a student's paper based on the following inputs:
        1. Assignment Name: ${group.title}
        2. Assignment Description: ${group.about_assignment}
        3. Rubric: ${group.criteria}
        4. "Look Out For": ${group.look_out}
        5. The ${group.grade_year} student's paper: **paper start** ${file.content} **paper end**
        6. Total Point Scale: 0 to ${group.total_points}
        Your goal is to conduct a strict and critical analysis of the paper...
        `;

        const response = await fetch(`${siteUrl}/api/create/pre-analysis`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                file_id: file.id
            })
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