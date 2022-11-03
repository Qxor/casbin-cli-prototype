import { newEnforcer } from "casbin";

async function enforce(model, adapter, ...args) {
  const e = await newEnforcer(model, adapter);
  const result = await e.enforce(...args);

  return result;
}

export default enforce;