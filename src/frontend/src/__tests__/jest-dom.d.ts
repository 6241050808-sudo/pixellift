// Registers the `@testing-library/jest-dom` matchers (`toBeInTheDocument`,
// `toHaveTextContent`, `toBeEnabled`, …) with Vitest's `Assertion` interface for
// `tsc`.
//
// The runtime registration lives in `vitest.setup.ts`, which sits outside the
// `src` directory this project's `tsconfig.json` includes, so `tsc` never loads
// its type augmentation. This file is inside `src` and pulls the same
// augmentation into the type-check scope.
import "@testing-library/jest-dom/vitest";
