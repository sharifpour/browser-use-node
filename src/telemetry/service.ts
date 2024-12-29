// Python source reference:
// """
// Telemetry service.
// """
//
// import logging
// from typing import Any, Dict, Optional
//
// from browser_use.telemetry.views import (
//     AgentEndTelemetryEvent,
//     AgentRunTelemetryEvent,
//     AgentStepErrorTelemetryEvent,
// )
//
// logger = logging.getLogger(__name__)
//
//
// class ProductTelemetry:
//     """Product telemetry."""
//
//     def __init__(self, enabled: bool = True):
//         """Initialize telemetry."""
//         self.enabled = enabled
//
//     def track_agent_run(
//         self,
//         agent_id: str,
//         task: str,
//         use_vision: bool,
//         llm_name: str,
//         llm_config: Dict[str, Any],
//         browser_config: Dict[str, Any],
//         browser_context_config: Dict[str, Any],
//         start_time: float,
//         end_time: float,
//         n_steps: int,
//         n_actions: int,
//         n_errors: int,
//         success: bool,
//         error: Optional[str] = None,
//     ) -> None:
//         """Track agent run."""
//         if not self.enabled:
//             return
//
//         event = AgentRunTelemetryEvent(
//             agent_id=agent_id,
//             task=task,
//             use_vision=use_vision,
//             llm_name=llm_name,
//             llm_config=llm_config,
//             browser_config=browser_config,
//             browser_context_config=browser_context_config,
//             start_time=start_time,
//             end_time=end_time,
//             n_steps=n_steps,
//             n_actions=n_actions,
//             n_errors=n_errors,
//             success=success,
//             error=error,
//         )
//         logger.info(f'Telemetry event: {event}')
//
//     def track_agent_step_error(
//         self,
//         agent_id: str,
//         step: int,
//         error: str,
//         error_type: str,
//         error_trace: str,
//     ) -> None:
//         """Track agent step error."""
//         if not self.enabled:
//             return
//
//         event = AgentStepErrorTelemetryEvent(
//             agent_id=agent_id,
//             step=step,
//             error=error,
//             error_type=error_type,
//             error_trace=error_trace,
//         )
//         logger.info(f'Telemetry event: {event}')
//
//     def track_agent_end(
//         self,
//         agent_id: str,
//         success: bool,
//         error: Optional[str] = None,
//     ) -> None:
//         """Track agent end."""
//         if not self.enabled:
//             return
//
//         event = AgentEndTelemetryEvent(
//             agent_id=agent_id,
//             success=success,
//             error=error,
//         )
//         logger.info(f'Telemetry event: {event}')

import { logger } from '../utils/logging';
import type {
  AgentEndTelemetryEvent,
  AgentRunTelemetryEvent,
  AgentStepErrorTelemetryEvent
} from './views';

export class ProductTelemetry {
  constructor(private enabled = true) { }

  trackAgentRun(event: AgentRunTelemetryEvent): void {
    if (!this.enabled) return;
    logger.info(`Telemetry event: ${JSON.stringify(event)}`);
  }

  trackAgentStepError(event: AgentStepErrorTelemetryEvent): void {
    if (!this.enabled) return;
    logger.info(`Telemetry event: ${JSON.stringify(event)}`);
  }

  trackAgentEnd(event: AgentEndTelemetryEvent): void {
    if (!this.enabled) return;
    logger.info(`Telemetry event: ${JSON.stringify(event)}`);
  }
}
