import dotenv from 'dotenv';

const properties = dotenv.config().parsed;
export default {
    user: properties.DB_USER,
    password: properties.DB_PASS,
    database: properties.DB_NAME,
    server: properties.DB_SERVER,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 1.5E4
    },
    options: {
        encrypt: true,
        trustServerCertificate: true // change to true for local dev / self-signed certs
    }
};;