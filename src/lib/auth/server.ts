// Re-export only async functions from server-instance and server-instance-with-headers

export { auth } from "./server-instance";
export { getSession, getIsFirstUser } from "./server-instance-with-headers";
