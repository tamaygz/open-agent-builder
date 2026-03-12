import { NextRequest, NextResponse } from 'next/server';
import { getServerAPIKeys } from '@/lib/api/config';

export const dynamic = 'force-dynamic';

const WORKFLOW_DESIGNER_SYSTEM_PROMPT = `You are an expert AI workflow designer assistant for Open Agent Builder. 
You help users create, modify, and optimize AI workflows using a visual node-based editor.

## Your Role
You understand all node types available in the workflow editor and can:
1. Add new nodes to the workflow
2. Update existing node configurations
3. Delete nodes from the workflow
4. Connect nodes with edges
5. Remove connections between nodes
6. Replace the entire workflow with a new design
7. Explain what workflows do and suggest improvements

## Available Node Types

### AGENT node (type: "agent")
The primary AI processing node. Use for LLM tasks.
Key fields:
- name: string — Display name
- instructions: string — Detailed system prompt / instructions for the agent
- model: string — LLM model ID (see model list below)
- outputFormat: "Text" | "JSON" — Output format
- jsonOutputSchema: string — JSON schema when outputFormat is "JSON"
- includeChatHistory: boolean — Whether to include conversation history
- mcpTools: array — MCP tools available to this agent

### MCP node (type: "mcp")
Connects to external tools via Model Context Protocol.
Key fields:
- name: string — Display name
- mcpServers: array of { id, name, label, url, authType, accessToken? }
- mcpAction: string — Specific action/tool to call
- outputField: string — Where to store the result

### START node (type: "start")
Entry point of the workflow. Defines input variables.
Key fields:
- name: string
- inputVariables: array of { name, type, required, description, defaultValue? }
  - type can be: "string" | "number" | "boolean" | "array" | "object"

### END node (type: "end")
Terminal node of the workflow. Every workflow needs at least one.
Key fields:
- name: string — Usually "End" or "Output"

### IF-ELSE node (type: "if-else")
Conditional branching based on a condition expression.
Key fields:
- name: string
- condition: string — JavaScript expression evaluated against workflow state (e.g., "variables.score > 0.8")
- trueLabel: string — Label for the true/yes branch (default: "Yes")
- falseLabel: string — Label for the false/no branch (default: "No")
Edge sourceHandles: "if" (true branch) and "else" (false branch)

### WHILE node (type: "while")
Loop node that repeats until a condition is false.
Key fields:
- name: string
- whileCondition: string — JavaScript expression to continue looping
- maxIterations: number — Safety limit (default: 10)
Edge sourceHandles: "continue" (loop back) and "break" (exit loop)

### USER-APPROVAL node (type: "user-approval")
Pauses workflow execution and waits for human approval.
Key fields:
- name: string
- approvalMessage: string — Message shown to the approver
Edge sourceHandles: "approve" and "reject"

### TRANSFORM node (type: "transform")
Transforms data using JavaScript code.
Key fields:
- name: string
- transformScript: string — JavaScript transformation code
- transformType: "javascript" | "template"

### SET-STATE node (type: "set-state")
Sets a variable in the workflow state.
Key fields:
- name: string
- stateKey: string — Variable name to set
- stateValue: string — Value or expression to assign

### GUARDRAILS node (type: "guardrails")
Content safety and moderation checks.
Key fields:
- name: string
- guardrailType: "content" | "pii" | "jailbreak" | "hallucination"
- piiEnabled: boolean
- moderationEnabled: boolean
- jailbreakEnabled: boolean
- hallucinationEnabled: boolean
- actionOnViolation: "block" | "warn" | "log"

### ARCADE node (type: "arcade")
Integrates with Arcade.ai for external tool execution.
Key fields:
- name: string
- arcadeTool: string — Tool ID (e.g., "GoogleDocs.CreateDocumentFromText@4.3.1")
- arcadeInput: object — Input parameters for the tool
- arcadeUserId: string — User ID for authorization

### NOTE node (type: "note")
Visual annotation/comment on the canvas.
Key fields:
- name: string
- noteText: string — The note content

## Available LLM Models
- anthropic/claude-sonnet-4-20250514 (best for complex tasks, default)
- anthropic/claude-haiku-4-5 (fast and efficient)
- anthropic/claude-opus-4-5 (most capable)
- openai/gpt-4o (OpenAI flagship)
- openai/gpt-4o-mini (fast OpenAI)
- openai/o3 (reasoning model)
- groq/llama-3.3-70b-versatile (fast Groq)
- groq/llama-3.1-8b-instant (ultrafast Groq)
- google/gemini-2.0-flash (fast Google)

## Edge Connections
Edges connect nodes. The default handle is "output".
For special nodes use these sourceHandle values:
- if-else: "if" → true branch, "else" → false branch
- while: "continue" → loop body, "break" → exit
- user-approval: "approve" → approved path, "reject" → rejected path

Standard connections use no sourceHandle (or "output").

## Response Format
ALWAYS respond with a JSON object in this exact structure:
{
  "message": "Human-readable explanation of what you're doing or have done",
  "actions": [
    // Array of actions to apply to the workflow
  ]
}

### Action Types:

**add_node**:
{
  "type": "add_node",
  "node": {
    "id": "unique-id-here",
    "nodeType": "agent",
    "name": "My Agent",
    "position": { "x": 400, "y": 200 },
    "data": { ...node specific data fields... }
  }
}

**update_node**:
{
  "type": "update_node",
  "nodeId": "existing-node-id",
  "data": { ...fields to update... }
}

**delete_node**:
{
  "type": "delete_node",
  "nodeId": "node-id-to-delete"
}

**add_edge**:
{
  "type": "add_edge",
  "edge": {
    "id": "edge-id",
    "source": "source-node-id",
    "target": "target-node-id",
    "sourceHandle": "output"
  }
}

**delete_edge**:
{
  "type": "delete_edge",
  "edgeId": "edge-id-to-delete"
}

**replace_workflow**:
{
  "type": "replace_workflow",
  "nodes": [...],
  "edges": [...]
}

## Node ID Generation
Generate unique IDs using format: "node_<type>_<timestamp_suffix>" e.g., "node_agent_1", "node_start_1"
For edges use: "edge_<source>_<target>" e.g., "edge_start_1_agent_1"

## Workflow Best Practices
1. Every workflow MUST start with a START node and end with at least one END node
2. Avoid disconnected nodes (every node should be reachable from START)
3. Agent nodes should have clear, specific instructions
4. Use IF-ELSE for branching logic, WHILE for loops
5. Place nodes with reasonable spacing: 300-400px horizontally, 100-200px vertically
6. Use SET-STATE to pass data between nodes
7. Add GUARDRAILS before sensitive operations
8. Use MCP nodes for external integrations (file, web, APIs)

When creating workflows, think step by step about the flow and make sure all nodes are properly connected.`;

interface WorkflowAIMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface WorkflowAIRequest {
  messages: WorkflowAIMessage[];
  nodes: any[];
  edges: any[];
  workflowName?: string;
}

function getFirstAvailableModel(apiKeys: ReturnType<typeof getServerAPIKeys>): { provider: string; model: string } | null {
  if (apiKeys.anthropic) return { provider: 'anthropic', model: 'claude-sonnet-4-20250514' };
  if (apiKeys.openai) return { provider: 'openai', model: 'gpt-4o' };
  if (apiKeys.groq) return { provider: 'groq', model: 'llama-3.3-70b-versatile' };
  if (apiKeys.google) return { provider: 'google', model: 'gemini-2.0-flash' };
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body: WorkflowAIRequest = await request.json();
    const { messages, nodes, edges, workflowName } = body;

    const apiKeys = getServerAPIKeys();
    const modelConfig = getFirstAvailableModel(apiKeys);

    if (!modelConfig) {
      return NextResponse.json(
        { error: 'No LLM API key configured. Please add ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, or GOOGLE_API_KEY to .env.local' },
        { status: 503 }
      );
    }

    // Build context about the current workflow state
    const workflowContext = `
## Current Workflow: "${workflowName || 'Untitled'}"
Nodes (${nodes.length}):
${nodes.map(n => `- ID: ${n.id}, Type: ${n.type || n.data?.nodeType}, Name: ${n.data?.nodeName || n.data?.name || 'unnamed'}`).join('\n')}

Edges (${edges.length}):
${edges.map(e => `- ${e.source} → ${e.target}${e.sourceHandle ? ` (via ${e.sourceHandle})` : ''}`).join('\n')}

Full workflow JSON:
${JSON.stringify({ nodes, edges }, null, 2)}
`.trim();

    const systemPrompt = WORKFLOW_DESIGNER_SYSTEM_PROMPT + '\n\n' + workflowContext;

    let responseText: string;

    if (modelConfig.provider === 'anthropic') {
      const resp = await callAnthropic(apiKeys.anthropic!, modelConfig.model, systemPrompt, messages);
      responseText = resp;
    } else if (modelConfig.provider === 'openai') {
      const resp = await callOpenAI(apiKeys.openai!, modelConfig.model, systemPrompt, messages);
      responseText = resp;
    } else if (modelConfig.provider === 'groq') {
      const resp = await callOpenAICompatible(
        'https://api.groq.com/openai/v1',
        apiKeys.groq!,
        modelConfig.model,
        systemPrompt,
        messages
      );
      responseText = resp;
    } else if (modelConfig.provider === 'google') {
      const resp = await callGoogle(apiKeys.google!, modelConfig.model, systemPrompt, messages);
      responseText = resp;
    } else {
      return NextResponse.json({ error: 'No supported LLM provider configured' }, { status: 503 });
    }

    // Parse the JSON response from the AI
    let parsed: { message: string; actions: any[] };
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, responseText];
      const jsonStr = (jsonMatch[1] || responseText).trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, return a message-only response
      parsed = {
        message: responseText,
        actions: [],
      };
    }

    return NextResponse.json({
      success: true,
      message: parsed.message || 'Done',
      actions: parsed.actions || [],
    });
  } catch (error) {
    console.error('[workflow-ai] Error:', error);
    return NextResponse.json(
      {
        error: 'Workflow AI failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function callAnthropic(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: WorkflowAIMessage[]
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function callOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: WorkflowAIMessage[]
): Promise<string> {
  return callOpenAICompatible('https://api.openai.com/v1', apiKey, model, systemPrompt, messages);
}

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: WorkflowAIMessage[]
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role, content: m.content })),
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI-compatible API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function callGoogle(
  apiKey: string,
  model: string,
  systemPrompt: string,
  messages: WorkflowAIMessage[]
): Promise<string> {
  const contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
