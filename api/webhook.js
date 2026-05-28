export default async function handler(req, res) {
  // 1. Meta 인증 처리 (GET)
  if (req.method === 'GET') {
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).send('Forbidden');
  }

  // 2. 이벤트 수신 및 GitHub Actions 트리거 (POST)
  if (req.method === 'POST') {
    const payload = req.body;

    try {
      const response = await fetch(`https://api.github.com/repos/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME/dispatches`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${process.env.GITHUB_PAT}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event_type: 'facebook-event', // GitHub Actions에서 감지할 이벤트 이름
          client_payload: { 
            data: payload // Meta로부터 받은 전체 데이터를 전달
          }
        }),
      });

      if (response.ok) {
        return res.status(200).send('EVENT_FORWARDED_TO_GITHUB');
      } else {
        throw new Error('Failed to trigger GitHub Actions');
      }
    } catch (error) {
      return res.status(500).send(error.message);
    }
  }
}
