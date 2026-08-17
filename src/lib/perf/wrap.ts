import "server-only";
import { inProfile, span, withProfile, PROFILING } from "@/lib/perf/profiler";

/**
 * The two entry points app code uses. Both collapse to a direct call when
 * `PROFILE=1` is absent, so leaving them in place costs nothing.
 */

/**
 * Wraps a page's render. Opens the request-scoped profile that every
 * downstream query, auth check, and decrypt reports into.
 */
export function profilePage<Props, R>(
  label: string,
  render: (props: Props) => Promise<R>,
): (props: Props) => Promise<R> {
  if (!PROFILING) return render;
  return (props: Props) => withProfile(`page ${label}`, "page", () => render(props));
}

/**
 * Wraps a Server Action body. When the action runs during a page render it
 * nests inside that page's profile; when it's called directly from the
 * browser (a form submit, a `startTransition`) it opens its own, because
 * that POST is its own request with its own latency the user feels.
 */
export function profileAction<R>(name: string, run: () => Promise<R>): Promise<R> {
  if (!PROFILING) return run();
  if (inProfile()) return span(name, "action", run);
  return withProfile(`action ${name}`, "action", run);
}
