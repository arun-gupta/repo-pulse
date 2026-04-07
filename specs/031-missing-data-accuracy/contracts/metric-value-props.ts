/**
 * Contract: MetricValue component
 *
 * Renders a formatted metric string with consistent unavailability treatment.
 * When value is "—" (em-dash), renders with muted slate styling to communicate
 * data absence. All other values render with standard metric styling.
 *
 * Used everywhere a formatted metric string is displayed: MetricCard summary
 * stats, detail rows, Activity tab values, Responsiveness tab values.
 */
export interface MetricValueProps {
  /** Formatted metric string — either a real value (e.g. "1,234") or "—" for unavailable */
  value: string
  /** Optional additional Tailwind classes for the rendered element */
  className?: string
}
