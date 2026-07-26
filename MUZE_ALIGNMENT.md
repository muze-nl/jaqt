# Muze alignment: jaqt

> Initial alignment roadmap. It is intended as a practical maintenance document, not as a complete code audit.

## Muze design principles

Muze builds web software for technically curious non-professional programmers, without making the tools unattractive to professionals.

We prefer:

- simplicity over completeness
- small, decoupled, single-concern libraries
- correct abstractions that do not cross conceptual boundaries
- browser-native standards where possible
- lightweight abstractions only when they make developer code simpler
- stable, long-term APIs
- components and frameworks that are easy to adapt or replace
- standards-based or open-source hosting stacks that avoid lock-in
- software small enough to work well on slow devices and connections
- a view-source philosophy: invite developers to look under the hood and learn

When making tradeoffs, prefer composability, replaceability, web-platform alignment, and long-term simplicity over convenience, popularity, or feature completeness.


## Muze package namespace policy

The `@muze-nl` npm namespace should be a trust signal. Packages published there should be close to production-ready: the public API is expected to be stable, the package can be installed and used by a fresh project, and the README should be clear about supported usage.

Experimental libraries should use the `@muze-labs` namespace until they are mature enough to carry the main Muze production-readiness signal. Moving from `@muze-labs` into `@muze-nl` should be treated as a release-readiness decision, not only a naming cleanup.

## Current assessment

JAQT is a small and interesting attempt to keep querying “in JavaScript country” instead of introducing a separate query language. The main alignment risk is cleverness: the README itself mentions JavaScript trickery, so the docs must make the mental model and plain-JavaScript equivalent extremely clear.

## Strengths

- Avoids a separate SQL/GraphQL-like language and keeps users in JavaScript.
- Focuses on arrays and objects, which are familiar to the target audience.
- Explicitly says there are no speed improvements or indexes, avoiding false promises.
- Small query/select API can be useful for view-source examples and data transformation.

## Alignment issues

### 1. Explain the “trickery” plainly

**Principle:** View-source philosophy.

**Problem:** The README says the library uses JavaScript trickery to add syntactic sugar.

**Why it matters:** Cleverness is acceptable only if users can understand and debug it.

**Suggested direction:** Add a “How JAQT works” section that explains placeholders/proxies/selectors in simple terms, including what is intercepted and what is ordinary JavaScript.

**Status:** Open

### 2. Show plain JavaScript equivalents for every core feature

**Principle:** Replaceability and browser-native alignment.

**Problem:** Users should be able to stop using JAQT and write normal `map`, `filter`, and object transforms.

**Why it matters:** This makes the abstraction less magical and teaches JavaScript rather than replacing it.

**Suggested direction:** For each README example, add an equivalent plain JS version. Make this a documentation pattern.

**Status:** Open

### 3. Clarify limits and failure modes

**Principle:** Stable APIs and correct abstractions.

**Problem:** Proxy/syntax-sugar libraries often have surprising limits around method calls, missing fields, nested arrays, `this`, async data, or mutation.

**Why it matters:** A stable API depends as much on known limitations as on supported examples.

**Suggested direction:** Add a “What does not work” section with examples and guidance.

**Status:** Open

### 4. Avoid growing into a full query engine

**Principle:** Simplicity over completeness.

**Problem:** The project is inspired by GraphQL and SQL, but adding joins, indexes, remote queries, caching, or schema features would change the nature of the abstraction.

**Why it matters:** The current strength is that it is a small helper over JavaScript arrays.

**Suggested direction:** Write non-goals into the README and keep advanced data features in separate packages, if ever needed.

**Status:** Open

### 5. Decide when JAQT should move into the `@muze-nl` namespace

**Principle:** Stable APIs and user trust.

**Problem:** JAQT appears close to being a mature Muze-style utility, but its package naming does not currently use the main Muze npm namespace.

**Why it matters:** Package names are part of the public API. If `@muze-nl` is the production-ready namespace, mature packages should eventually move there, while experimental packages should stay outside it.

**Suggested direction:** Treat a move to `@muze-nl/jaqt` as a release-readiness milestone. Before doing so, confirm the stable API surface, update examples, add plain-JavaScript equivalents, and provide a migration path from the current package name.

**Status:** Open

## Open questions

- Is JAQT still a strategic Muze package, or mainly a mature older utility?
- Should the package name/import path move under `@muze-nl/jaqt` for consistency?
- What is the smallest stable surface worth supporting long-term?

## Non-goals

- Do not become GraphQL-in-JavaScript.
- Do not hide performance characteristics.
- Do not make data transformation harder to inspect than plain JavaScript.

## Review cadence

Review this document before feature work, before releases, and whenever the public API or dependency surface changes. Close issues by changing their status to `Done` and leaving a short note about the decision.
