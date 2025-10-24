export const logger = (req, res, next) => {
  const requestTime = new Date(Date.now()).toString();
  console.log(req.method, req.hostname, req.path, requestTime);
  next();
};
