import { auth } from "@repo/authentication/auth";
import { Request,Response,NextFunction } from "express";


export async function requireUser(req:Request, res:Response, next:NextFunction) {
  try {
    const response = await fetch("http://localhost:3000/api/auth/get-session", {
      headers: {
        cookie: req.headers.cookie ?? "",
      },
    });

    const session = await response.json();

    if (!session?.user) {
      return res.status(401).json({ error: "UNAUTHORIZED" });
    }

    req.user = session.user;
    req.session = session;

    next();
  } catch (err) {
    return res.status(500).json({ error: "AUTH_ERROR" });
  }
}