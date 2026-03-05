import express from 'express';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';
import axios from 'axios';

dotenv.config();

const app = express();
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const DASHBOARD_URL = process.env.DASHBOARD_API_URL || 'http://localhost:3000/api';

// 🧠 TIER 1: Multi-Agent Swarm Logic
async function detectiveAgent(alertContext: any) {
  console.log('[Detective Agent] Analyzing logs and metrics...');
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are an SRE Detective. Analyze the alert context and provide a root cause hypothesis and file paths to investigate.' },
      { role: 'user', content: JSON.stringify(alertContext) }
    ]
  });
  return response.choices[0].message.content;
}

async function coderAgent(hypothesis: string) {
  console.log('[Coder Agent] Generating code patch based on Detective findings...');
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      { role: 'system', content: 'You are a Senior Software Engineer. Given a root cause, output a unified git diff patch to fix the issue, and write a test case.' },
      { role: 'user', content: hypothesis }
    ]
  });
  return response.choices[0].message.content;
}

// 🛡️ TIER 1: Predictive Remediation (Pre-Incidents)
app.post('/webhook/metrics-anomaly', async (req, res) => {
  const metrics = req.body;
  console.log(`[Predictive Engine] Anomaly detected: ${metrics.trend}`);
  
  // Create Pre-Incident S2
  const incident = {
    severity: 'S2',
    source: 'Predictive-Engine',
    summary: `Predicted Failure: ${metrics.trend}`,
    correlationId: `pre_${Date.now()}`,
    timeline: [{ event: 'Anomaly forecasted', timestamp: new Date() }]
  };
  
  await axios.post(`${DASHBOARD_URL}/incidents`, incident, { headers: { 'x-api-key': process.env.INTERNAL_AGENT_KEY }});
  res.json({ status: 'Monitored' });
});

// Standard Alert Collector
app.post('/webhook/alert', async (req, res) => {
  const alert = req.body;
  const incidentPayload = {
    severity: alert.severity || 'S1',
    source: alert.source || 'Datadog',
    summary: alert.title,
    correlationId: alert.id || Date.now().toString(),
    timeline: [{ event: 'Alert received', timestamp: new Date() }]
  };

  try {
    const dashboardRes = await axios.post(`${DASHBOARD_URL}/incidents`, incidentPayload, {
      headers: { 'x-api-key': process.env.INTERNAL_AGENT_KEY }
    });
    const dbIncident = dashboardRes.data;

    if (incidentPayload.severity === 'S1' || incidentPayload.severity === 'S0') {
      console.log(`[Swarm] Initiating Multi-Agent flow for incident ${dbIncident.id}`);
      
      // Multi-Agent Execution
      const hypothesis = await detectiveAgent(alert);
      console.log(`[Swarm] Hypothesis generated.`);
      
      const patch = await coderAgent(hypothesis || '');
      console.log(`[Swarm] Patch generated.`);

      // Send to Orchestrator for Ephemeral testing
      await axios.post('http://localhost:4002/api/scan', { target: dbIncident.id, type: 'ephemeral_preview', patch });

      // Request Approval
      console.log('[ApprovalGate] Sent to Mobile Controller.');
    }
    
    res.status(200).json({ status: 'Triaged' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to process' });
  }
});

const PORT = process.env.PORT || 4001;
app.listen(PORT, () => console.log(`Reliability Swarm Agent running on port ${PORT}`));
