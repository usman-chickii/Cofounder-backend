import dotenv from "dotenv";
import path from "path";

const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3001,
  DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER || "groq",
  LLM_MAX_TOKENS: process.env.LLM_MAX_TOKENS || 200,
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  MCP_SERVER_URL: process.env.MCP_SERVER_URL,
  MCP_SESSION_ID: process.env.MCP_SESSION_ID,
  ATLASSIAN_CLIENT_ID: process.env.ATLASSIAN_CLIENT_ID,
  ATLASSIAN_CLIENT_SECRET: process.env.ATLASSIAN_CLIENT_SECRET,
  ATLASSIAN_REDIRECT_URI: process.env.ATLASSIAN_REDIRECT_URI,
};
