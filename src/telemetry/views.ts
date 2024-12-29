// Python source reference:
// """
// Telemetry views.
// """
//
// from dataclasses import dataclass
// from typing import Any, Dict, List, Optional
//
// @dataclass
// class AgentRunTelemetryEvent:
//     """Agent run telemetry event."""
//
//     agent_id: str
//     task: str
//     use_vision: bool
//     llm_name: str
//     llm_config: Dict[str, Any]
//     browser_config: Dict[str, Any]
//     browser_context_config: Dict[str, Any]
//     start_time: float
//     end_time: float
//     n_steps: int
//     n_actions: int
//     n_errors: int
//     success: bool
//     error: Optional[str] = None
//
// @dataclass
// class AgentStepErrorTelemetryEvent:
//     """Agent step error telemetry event."""
//
//     agent_id: str
//     step: int
//     error: str
//     error_type: str
//     error_trace: str
//
// @dataclass
// class AgentEndTelemetryEvent:
//     """Agent end telemetry event."""
//
//     agent_id: str
//     success: bool
//     error: Optional[str] = None

export interface AgentRunTelemetryEvent {
  agentId: string;
  task: string;
  useVision: boolean;
  llmName: string;
  llmConfig: Record<string, any>;
  browserConfig: Record<string, any>;
  browserContextConfig: Record<string, any>;
  startTime: number;
  endTime: number;
  nSteps: number;
  nActions: number;
  nErrors: number;
  success: boolean;
  error?: string;
}

export interface AgentStepErrorTelemetryEvent {
  agentId: string;
  step: number;
  error: string;
  errorType: string;
  errorTrace: string;
}

export interface AgentEndTelemetryEvent {
  agentId: string;
  success: boolean;
  error?: string;
}
