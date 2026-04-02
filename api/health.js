export default async function handler(_req, res) {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
}
