import { makeRouteHandler } from "@keystatic/next/route-handler";
import { connection } from "next/server";
import config from "../../../../../keystatic.config";

// Cache Components uses the Node.js runtime; explicit runtime config is unsupported.
export async function GET(request: Request) {
  await connection();
  if (process.env.NODE_ENV === "production" &&
      (!process.env.KEYSTATIC_GITHUB_CLIENT_ID || !process.env.KEYSTATIC_GITHUB_CLIENT_SECRET || !process.env.KEYSTATIC_SECRET)) {
    return new Response("The content editor is not configured. Complete the GitHub App setup in docs/keystatic.md.", { status: 503 });
  }
  return makeRouteHandler({ config }).GET(request);
}

export const POST = GET;
