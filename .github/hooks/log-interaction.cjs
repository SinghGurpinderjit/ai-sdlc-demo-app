const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const sensitiveKeyPattern = /password|passwd|secret|token|api[_-]?key|authorization|cookie/i;
const sensitiveTextPattern = /(password|passwd|secret|token|api[_-]?key|authorization)\s*[:=]\s*["']?[^\s,"'}]+/gi;
const unavailableMetadata = ["model", "mode", "skills_used", "human_decision"];
const logPath = process.env.AI_INTERACTION_LOG_PATH
  ? path.resolve(process.env.AI_INTERACTION_LOG_PATH)
  : path.resolve(__dirname, "../../ai-interactions.jsonl");

function sanitize(value, key = "") {
  if (sensitiveKeyPattern.test(key)) {
    return "[REDACTED]";
  }

  if (typeof value === "string") {
    return value
      .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [REDACTED]")
      .replace(sensitiveTextPattern, "$1=[REDACTED]");
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitize(entryValue, entryKey),
      ]),
    );
  }

  return value;
}

function toIsoTimestamp(value) {
  const parsed = value === undefined ? new Date() : new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function parseJsonEnvironmentVariable(name, fallback) {
  if (!process.env[name]) {
    return fallback;
  }

  try {
    return JSON.parse(process.env[name]);
  } catch {
    return fallback;
  }
}

function getEventName(hookEvent) {
  return hookEvent.hook_event_name
    ?? hookEvent.eventName
    ?? hookEvent.event_name
    ?? hookEvent.event
    ?? "unknown";
}

function getStatus(eventName, hookEvent) {
  switch (eventName) {
    case "SessionStart":
      return "started";
    case "UserPromptSubmit":
      return "submitted";
    case "PreToolUse":
      return "pending";
    case "PostToolUse":
      return "succeeded";
    case "PostToolUseFailure":
      return "failed";
    case "SubagentStart":
      return "partial";
    case "SubagentStop":
      return hookEvent.error ? "failed" : "completed";
    case "Stop":
      return "completed";
    case "SessionEnd":
      return hookEvent.reason ?? "ended";
    default:
      return "captured";
  }
}

function getActionVerification(eventName, hookEvent) {
  const toolName = hookEvent.tool_name ?? hookEvent.toolName;
  if (eventName === "PostToolUse") {
    return `${toolName ?? "Tool"} completed successfully.`;
  }
  if (eventName === "PostToolUseFailure") {
    return `${toolName ?? "Tool"} failed: ${hookEvent.error ?? "No error detail provided."}`;
  }
  if (eventName === "UserPromptSubmit") {
    return "Prompt captured; completion is recorded by a later event.";
  }
  if (eventName === "Stop") {
    return "Agent turn ended; see the transcript reference in the event payload.";
  }
  return hookEvent.action_verification ?? null;
}

function getArtifacts(hookEvent) {
  const artifacts = new Set();
  const artifactKeyPattern = /^(file_?path|target_?path|artifact_?path|file)$/i;

  function visit(value, key = "") {
    if (artifactKeyPattern.test(key) && typeof value === "string") {
      artifacts.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item));
      return;
    }
    if (value && typeof value === "object") {
      Object.entries(value).forEach(([childKey, childValue]) => visit(childValue, childKey));
    }
  }

  visit(hookEvent);
  return [...artifacts];
}

function getRelatedSubagentInvocation(hookEvent) {
  const agentId = hookEvent.agent_id ?? hookEvent.agentId;
  if (!agentId || !fs.existsSync(logPath)) {
    return null;
  }

  const lines = fs.readFileSync(logPath, "utf8").split(/\r?\n/).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const priorRecord = JSON.parse(lines[index]);
      if (priorRecord.event !== "PreToolUse") {
        continue;
      }

      const toolName = priorRecord.tool_name ?? priorRecord.payload?.tool_name;
      const toolUseId = priorRecord.payload?.tool_use_id;
      if (!/^(runSubagent|task)$/i.test(toolName ?? "") || !toolUseId?.startsWith(agentId)) {
        continue;
      }

      return priorRecord.payload?.tool_input ?? null;
    } catch {
      continue;
    }
  }

  return null;
}

function getSubagents(eventName, hookEvent, relatedInvocation) {
  if (eventName !== "SubagentStart" && eventName !== "SubagentStop") {
    return [];
  }

  const task = hookEvent.task
    ?? hookEvent.delegated_task
    ?? relatedInvocation?.description
    ?? relatedInvocation?.prompt
    ?? relatedInvocation?.query
    ?? null;

  return [{
    name: hookEvent.agent_name
      ?? hookEvent.agentName
      ?? hookEvent.agent_display_name
      ?? hookEvent.agentDisplayName
      ?? relatedInvocation?.agentName
      ?? hookEvent.agent_type
      ?? hookEvent.agentType
      ?? "unknown",
    type: "sub-agent",
    task: sanitize(task),
    status: getStatus(eventName, hookEvent),
    agent_id: hookEvent.agent_id ?? hookEvent.agentId ?? null,
    transcript_path: hookEvent.transcript_path ?? hookEvent.transcriptPath ?? null,
  }];
}

function getMcpTools(eventName, hookEvent) {
  const toolName = hookEvent.tool_name ?? hookEvent.toolName ?? "";
  const match = toolName.match(/^mcp__([^_]+)__(.+)$/i);
  if (!match) {
    return Array.isArray(hookEvent.mcp_tools_used) ? hookEvent.mcp_tools_used : [];
  }

  return [{
    server: match[1],
    tool: match[2],
    purpose: hookEvent.purpose ?? null,
  }];
}

function getRequest(eventName, hookEvent) {
  if (eventName === "UserPromptSubmit") {
    return hookEvent.prompt ?? null;
  }
  if (eventName === "SessionStart") {
    return hookEvent.initial_prompt ?? hookEvent.initialPrompt ?? null;
  }
  if (eventName === "PreToolUse") {
    return {
      tool: hookEvent.tool_name ?? hookEvent.toolName ?? null,
      input: hookEvent.tool_input ?? hookEvent.toolArgs ?? null,
    };
  }
  return hookEvent.request ?? null;
}

let event;
try {
  event = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  process.stderr.write("Hook input was not valid JSON.\n");
  process.stdout.write("{}\n");
  process.exit(0);
}

const eventName = getEventName(event);
const timestamp = toIsoTimestamp(event.timestamp);
const relatedSubagentInvocation = eventName === "SubagentStart" || eventName === "SubagentStop"
  ? getRelatedSubagentInvocation(event)
  : null;
const missingMetadata = unavailableMetadata.filter((field) => {
  if (field === "model") {
    return event.model == null && process.env.AI_MODEL_NAME == null;
  }
  if (field === "mode") {
    return event.mode == null && process.env.AI_MODE == null;
  }
  if (field === "skills_used") {
    return event.skills_used == null && parseJsonEnvironmentVariable("AI_SKILLS_USED", null) == null;
  }
  return event.human_decision == null;
});
const record = {
  id: event.id ?? `${timestamp.replace(/[-:.]/g, "")}-${crypto.randomUUID()}`,
  timestamp,
  stage: event.stage ?? process.env.AI_SDLCA_STAGE ?? "unknown",
  agent: event.agent ?? event.agent_type ?? event.agentType ?? null,
  agent_name: event.agent_name ?? event.agentName ?? process.env.AI_AGENT_NAME ?? null,
  agent_type: event.agent_type ?? event.agentType ?? process.env.AI_AGENT_TYPE ?? null,
  ai_tool: event.ai_tool ?? process.env.AI_TOOL_NAME ?? "github-copilot",
  model: event.model ?? process.env.AI_MODEL_NAME ?? null,
  mode: event.mode ?? process.env.AI_MODE ?? null,
  related_ids: Array.isArray(event.related_ids) ? event.related_ids : [],
  parent_task: event.parent_task
    ?? event.parentTask
    ?? relatedSubagentInvocation?.description
    ?? relatedSubagentInvocation?.prompt
    ?? relatedSubagentInvocation?.query
    ?? process.env.AI_PARENT_TASK
    ?? null,
  context: event.context ?? process.env.AI_INTERACTION_CONTEXT ?? "AI in SDLC Assignment",
  request: sanitize(getRequest(eventName, event)),
  response: sanitize(event.last_assistant_message
    ?? event.response
    ?? event.tool_response
    ?? event.tool_result?.text_result_for_llm
    ?? event.toolResult?.textResultForLlm
    ?? event.toolResult
    ?? null),
  skills_used: sanitize(event.skills_used ?? parseJsonEnvironmentVariable("AI_SKILLS_USED", [])),
  subagents_used: sanitize(getSubagents(eventName, event, relatedSubagentInvocation)),
  mcp_tools_used: sanitize(getMcpTools(eventName, event)),
  tools_used: event.tool_name ?? event.toolName ? [event.tool_name ?? event.toolName] : [],
  suggestion: sanitize(event.suggestion ?? null),
  human_decision: event.human_decision ?? null,
  action_verification: sanitize(getActionVerification(eventName, event)),
  limitation: missingMetadata.length > 0
    ? `Hook payload does not supply all metadata fields (${missingMetadata.join(", ")}); set environment overrides or annotate manually.`
    : null,
  status: getStatus(eventName, event),
  artifacts: getArtifacts(event),
  event: eventName,
  session_id: event.session_id ?? event.sessionId ?? null,
  agent_id: event.agent_id ?? event.agentId ?? null,
  parent_agent_id: event.parent_agent_id ?? event.parentAgentId ?? null,
  tool_name: event.tool_name ?? event.toolName ?? null,
  payload: sanitize(event),
};

try {
  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(record)}\n`, { encoding: "utf8" });
} catch (error) {
  process.stderr.write(`Could not append interaction log: ${error.message}\n`);
}

process.stdout.write("{}\n");