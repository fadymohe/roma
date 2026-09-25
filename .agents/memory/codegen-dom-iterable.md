---
name: TypeScript DOM iterable support
description: The generated React API client uses Headers.entries and needs DOM iterable typings.
---

Generated client code can call `Headers.entries()`, so the API client library must include both `dom` and `dom.iterable` in its TypeScript `lib` settings.

**Why:** The generated code otherwise fails the workspace typecheck even though Orval generation itself succeeds.

**How to apply:** If codegen starts failing on standard browser collection methods, inspect the library tsconfig before changing generated output.