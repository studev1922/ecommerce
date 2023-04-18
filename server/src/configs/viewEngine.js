import fs from 'fs'
import dotenv from 'dotenv'
import express from "express";

const properties = dotenv.config().parsed;
const {SOURCE, STATIC_FOLDER} = properties;


function viewEngine(app) {
    const staticPack = `${SOURCE}/${STATIC_FOLDER}`;
    if (!fs.existsSync(staticPack)) fs.mkdirSync(staticPack, { recursive: true });

    app.use(express.static(staticPack));
};

export default viewEngine;