export type LiveRegionPoliteness = 'polite' | 'assertive'

interface LiveRegionProps {
  /** Text to announce to screen readers. `null` renders an empty (silent) region. */
  message: string | null
  /**
   * A11Y-03: 'polite' waits for the screen reader to finish its current
   * announcement (loading states, route changes); 'assertive' interrupts
   * immediately (validation errors, failed requests).
   */
  politeness?: LiveRegionPoliteness
}

// A11Y-03: a single reusable `aria-live` region — screen readers only
// announce *changes* to the text content of a region that's already present
// in the DOM at mount time, so callers render this unconditionally and just
// update `message` (never conditionally mount/unmount it around the message).
// Visually hidden (`sr-only`, a Tailwind core utility) since the state
// changes it announces are already shown visually elsewhere (inline field
// errors, banners, skeletons) — this only carries the screen-reader
// announcement.
export function LiveRegion({ message, politeness = 'polite' }: LiveRegionProps) {
  return (
    <div aria-live={politeness} role={politeness === 'assertive' ? 'alert' : 'status'} className="sr-only">
      {message}
    </div>
  )
}
