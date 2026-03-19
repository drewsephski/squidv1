import { auth } from "auth/server";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST, PUT, DELETE, PATCH } = toNextJsHandler(auth.handler);
