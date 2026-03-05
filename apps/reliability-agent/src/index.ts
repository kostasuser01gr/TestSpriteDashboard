import express from 'express';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DASHBOARD_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';

// Budgets and Caps
const MAX_MONTHLY_SPEND = 50.0;
const MAX_INCIDENT_SPEND = 5.0;

// A1. Collector Webhook (Receives Datadog/Sentry alerts)
app.post('/webhook/alert', async (req, res) => {
  const alert = req.body;
  console.log(`[Collector] Received alert: ${alert.title}`);

  // A2. Triage Engine
  const incident = {
    severity: alert.severity || 'S2',
    source: alert.source || 'Datadog',
    summary: alert.title,
    correlationId: alert.id,
    timeline: [{ event: 'Alert received', timestamp: new Date() }]
  };

  // Sync with Admin Dashboard
  try {
    const dashboardRes = await axios.post(`${DASHBOARD_URL}/incidents`, incident, {
      headers: { 'x-api-key': process.env.INTERNAL_AGENT_KEY }
    });
    const dbIncident = dashboardRes.data;

    // A4. Fix Generator (If policy allows)
    if (incident.severity === 'S1' || incident.severity === 'S0') {
      await generateFix(dbIncident);
    }
    
    res.status(200).json({ status: 'Triaged', incident: dbIncident });
  } catch (error) {
    console.error('Error syncing with dashboard', error);
    res.status(500).json({ error: 'Failed to process alert' });
  }
});

async function generateFix(incident: any) {
  console.log(`[FixGenerator] Starting analysis for incident ${incident.id}`);
  // Cost check simulated here
  // Call OpenAI API for hypothesis
  /*
  const completion = await openai.chat.completions.create({
    messages: [{ role: 'system', content: `Diagnose and patch: ${incident.summary}` }],
    model: 'gpt-4-turbo-preview',
  });
  */
  
  // A6. Approval Gate
  // Creates an ApprovalRequest in the Dashboard DB waiting for OWNER response via Mobile App.
  console.log('[ApprovalGate] PR generated. Waiting for OWNER approval.');
}

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Reliability Agent running on port ${PORT}`);
});
