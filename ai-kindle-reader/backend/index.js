import dotenv from "dotenv";

dotenv.config({ path: "./.env.local" });

// import express from "express";
import app from './app.js'
const port = process.env.PORT || 8000;

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)}) 