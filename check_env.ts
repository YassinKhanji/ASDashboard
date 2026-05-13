import { config } from 'dotenv';
import path from 'path';

config();
console.log("DATABASE_URL from .env:", process.env.DATABASE_URL);
