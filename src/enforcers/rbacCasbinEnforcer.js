import { newEnforcer } from "casbin";

async function enforce(model, source, ...args) {
  const e = await newEnforcer(model,source);
  const result = await e.enforce(...args);

  return result;
}

export default enforce;