"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseId = void 0;
function parseId(req, res, next) {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID provided." });
  }
  req.id = id;
  next();
}
exports.parseId = parseId;
