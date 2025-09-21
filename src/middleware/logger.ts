import { NextFunction, Request, Response } from "express";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const requestTime = new Date(Date.now()).toString();
  console.log(req.method, req.hostname, req.path, requestTime);
  next();
};
