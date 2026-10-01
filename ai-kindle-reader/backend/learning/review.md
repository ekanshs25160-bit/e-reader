# Review

Keep short retrieval prompts or review metadata for meaningful topics.

## 2026-09-13: `this` Context in Mongoose Middleware

- **Recall prompt:** Why does writing `userSchema.pre("save", async () => {})` fail when accessing `this.password` or `this.isModified()`, and what syntax fixes it?
- **Last reviewed:** 2026-09-13
- **Confidence:** Medium
- **Next review or exercise:** Write an instance method on a schema from memory using `async function()`.

---

## 2026-09-13: `findByIdAndUpdate` vs `findOneAndUpdate`

- **Recall prompt:** Under what circumstances will `findByIdAndUpdate()` fail when searching by composite conditions like `{ project: projectId, user: userId }`, and what should be used instead?
- **Last reviewed:** 2026-09-13
- **Confidence:** High
- **Next review or exercise:** Test upsert behavior with `findOneAndUpdate({ ... }, { ... }, { upsert: true, new: true })`.

---

## 2026-09-13: Mongoose `.populate()`

- **Recall prompt:** When query results return raw `ObjectId` strings for referenced documents, what Mongoose query modifier pulls in actual fields (like name, email) from the target collection?
- **Last reviewed:** 2026-09-13
- **Confidence:** High
- **Next review or exercise:** Populate multiple fields or nested populate in a task controller.

