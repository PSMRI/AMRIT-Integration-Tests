import * as fs from 'fs';

export function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf-8'));
}

export function writeJson(path, obj) {
  fs.writeFileSync(path, JSON.stringify(obj, null, 2));
}