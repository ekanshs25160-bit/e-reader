# Concepts

Record durable understanding, not every definition encountered.

## 2026-09-13: JavaScript `this` Binding in Mongoose Hooks & Methods

- **Learner's explanation:** When defining `userSchema.pre("save")` or `userSchema.methods`, using an arrow function causes `this` to be undefined.
- **Corrected understanding:** Arrow functions (`() => {}`) do not have their own `this` binding; they capture `this` from the enclosing lexical scope (which is `undefined` in ES modules). Mongoose dynamically binds `this` to the document instance being validated/saved or calling the method, so regular `async function()` syntax is mandatory.
- **Example:**
  ```javascript
  // Correct
  userSchema.pre("save", async function() {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
  });
  ```
- **Related concepts:** Lexical scoping, Mongoose middleware, Execution context.

---

## 2026-09-13: Mongoose `findByIdAndUpdate` vs `findOneAndUpdate`

- **Learner's explanation:** Passing a search object `{ user, project }` into `findByIdAndUpdate` failed or was confusing.
- **Corrected understanding:** `findByIdAndUpdate(id, update, options)` strictly expects a single document `_id` (string or ObjectId) as its first argument. If searching or upserting by composite keys or custom fields, `findOneAndUpdate(filter, update, options)` must be used.
- **Example:**
  ```javascript
  // Querying by composite fields
  await ProjectMember.findOneAndUpdate(
    { user: userId, project: projectId },
    { role: role },
    { new: true, upsert: true }
  );
  ```
- **Related concepts:** MongoDB query operators, Compound keys, Upserts.

---

## 2026-09-13: Mongoose Population (`.populate()`)

- **Learner's explanation:** Storing an `ObjectId` reference in MongoDB only returns the raw ID string by default.
- **Corrected understanding:** Mongoose `.populate("field", "selected keys")` performs an automatic lookup to replace the referenced `ObjectId` with the actual document data from the referenced collection, allowing the API to return human-readable user details without manual join queries.
- **Example:**
  ```javascript
  const members = await ProjectMember.find({ project: projectId })
    .populate("user", "name email username");
  ```
- **Related concepts:** Referenced relationships vs embedded subdocuments, REST API payload convenience.

---

## 2026-09-13: Node.js ES Modules Relative Import Requirements

- **Learner's explanation:** When `"type": "module"` is set in `package.json`, imports without `.js` fail.
- **Corrected understanding:** Node.js native ESM does not perform automatic file extension resolution like CommonJS (`require`). All relative imports must include the explicit file extension (`.js`).
- **Example:** `import connectDB from "./db/index.js";`
- **Related concepts:** CommonJS vs ESM, Module resolution.

---

## 2026-09-16: `findById` vs `findOne` in Mongoose

- **Learner's explanation:** Unclear why both methods exist when looking up documents.
- **Corrected understanding:** `findById(id)` is syntactic sugar for `findOne({ _id: id })` strictly when querying by a single `_id`. When querying by multiple fields (e.g. `{ _id: taskId, project: projectId }`), fields other than `_id`, or operators (`$or`), `findOne(filter)` must be used.
- **Example:**
  ```javascript
  // Single ID:
  const task = await Task.findById(taskId);

  // Composite security filter (must use findOne):
  const task = await Task.findOne({ _id: taskId, project: projectId });
  ```
- **Related concepts:** Query filters, Document identity, Composite queries.

---

## 2026-09-16: Conditional Object Spreading & The Boolean Falsy Trap

- **Learner's explanation:** Unclear how `...(condition && { key })` updates only provided fields, and why booleans need `!== undefined`.
- **Corrected understanding:** In JavaScript, spreading falsy values (`undefined`, `false`) into an object does nothing. This allows conditional `$set` entries without overwriting missing fields with `null`. For booleans like `isCompleted`, `false` is a valid payload value but falsy in JavaScript; checking `isCompleted !== undefined` ensures `false` is properly included while absent fields are omitted.
- **Example:**
  ```javascript
  $set: {
    ...(title && { title }),
    ...(isCompleted !== undefined && { isCompleted }),
  }
  ```
- **Related concepts:** Short-circuit evaluation, Object spread, Falsy values, Partial updates (PATCH/PUT).

---

## 2026-09-16: Cascade Deletion in Relational Document References

- **Learner's explanation:** Deleting a parent document (like a Task) could leave child documents (Subtasks) orphaned in the database.
- **Corrected understanding:** Because MongoDB does not have built-in foreign key ON DELETE CASCADE constraints by default, backend controllers must explicitly clean up dependent children documents when the parent is deleted.
- **Example:**
  ```javascript
  await Task.findOneAndDelete({ _id: taskId, project: projectId });
  await SubTask.deleteMany({ task: taskId }); // Cascade clean up
  ```
- **Related concepts:** Referential integrity, Orphaned records, Data consistency.

---

## 2026-09-17: File Uploads with Multer & `diskStorage`

- **Learner's explanation:** Unclear what `multer.diskStorage` actually does, why it requires a callback (`cb`) instead of `return`, and whether `async` can be used.
- **Corrected understanding:**
  1. **Purpose of `diskStorage`:** Express (`express.json()`) only parses text/JSON payloads. Binary file streams sent as `multipart/form-data` require a streaming parser (Multer). `diskStorage` acts as an instruction manual specifying *where* to save files (`destination`) and *what* to name them (`filename` with unique timestamps to prevent name collisions).
  2. **Why Callbacks (`cb`):** Multer was designed with Node.js error-first callbacks (`cb(err, result)`). This allows asynchronous checks (e.g. checking directory existence via `fs` or checking quotas in DB) before finalizing the file path. Multer pauses file streaming until `cb` is executed.
  3. **The `async` Trap:** You can use `async/await` inside `destination` or `filename`, but you **must still call `cb(null, path)`**. Multer ignores returned Promises (`return path`) and waits specifically for the `cb` argument. If `cb` is never called, the HTTP request hangs and times out.
- **Example:**
  ```javascript
  import multer from "multer";

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // cb(error, destinationPath)
      cb(null, "./public/images");
    },
    filename: (req, file, cb) => {
      // Unique suffix prevents file overwrite collisions
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
  });

  export const upload = multer({ storage });
  ```
- **Related concepts:** `multipart/form-data`, Error-first callbacks, Storage engines, Asynchronous stream handling, Static asset serving (`express.static`).
