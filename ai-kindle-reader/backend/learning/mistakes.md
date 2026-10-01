# Mistakes

Record meaningful bugs or recurring misconceptions. Preserve the original reasoning.

## 2026-09-13: Passing entire `req.params` object to `findById()`

- **Problem:** Mongoose threw `Cast to ObjectId failed for value "{ projectId: '...' }" (type Object) at path "_id"`.
- **Mistake:** Writing `Project.findById(req.params)` instead of `Project.findById(projectId)`.
- **Original mental model:** Believed `req.params` could be passed directly because it came from the route parameter.
- **Correct mental model:** `req.params` is a dictionary object containing all route params (`{ projectId: '...' }`). `findById()` expects a single string/ObjectId value, not an object.
- **Category:** Runtime TypeError / API parameter extraction.
- **Prevention:** Destructure the specific parameter first (`const { projectId } = req.params;`) and always validate with `mongoose.Types.ObjectId.isValid(projectId)`.
- **Follow-up exercise:** Check route parameters across all controllers before calling database queries.

---

## 2026-09-13: Arrow function used for Mongoose `pre("save")` hook

- **Problem:** Attempting to hash password threw `TypeError: Cannot read properties of undefined (reading 'isModified')`.
- **Mistake:** Used arrow function syntax `userSchema.pre("save", async () => { ... })`.
- **Original mental model:** Thought arrow functions and regular function declarations were interchangeable in async callbacks.
- **Correct mental model:** Arrow functions inherit `this` from lexical scope (undefined in ESM). Mongoose sets `this` to the document instance, which requires standard `async function()` declaration.
- **Category:** JavaScript execution context / `this` binding.
- **Prevention:** Always use `async function()` syntax for Mongoose hooks and schema methods (`userSchema.methods.*`).
- **Follow-up exercise:** Review `this` behavior across all methods in `user.model.js` and other schemas.

---

## 2026-09-13: Self-referential variable used before initialization

- **Problem:** `ReferenceError: Cannot access 'user' before initialization`.
- **Mistake:** Wrote `const user = await User.create({ user, ... })` intended to pass `name`.
- **Original mental model:** Typing shorthand quickly without noticing the declared variable name shadowed the intended property key.
- **Correct mental model:** In `const user = await User.create({ user })`, JavaScript evaluates the right-hand side first where `user` is in the Temporal Dead Zone (TDZ).
- **Category:** Syntax / Scope error.
- **Prevention:** Verify that object shorthand matches already-destructured variables from `req.body`.

