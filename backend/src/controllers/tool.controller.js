import * as tools from '../services/tool.service.js';

export async function list(req, res) {
  res.json(await tools.listTools(req.validated.query));
}

export async function get(req, res) {
  res.json({ data: await tools.getTool(req.validated.params.id) });
}

export async function create(req, res) {
  res.status(201).json({ data: await tools.createTool(req.validated.body) });
}

export async function updateStatus(req, res) {
  res.json({ data: await tools.updateToolStatus(req.validated.params.id, req.validated.body.status) });
}
