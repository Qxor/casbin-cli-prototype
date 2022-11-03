import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import auth from "./Auth.js";

import CliRbacCasbin from "./cli/CliRbacCasbin.js";
import CliRbacHandmadeSQL from "./cli/CliRbacHandmadeSQL.js";
import CliRbacHandmadeSQLAccelerated from "./cli/CliRbacHandmadeSQLAccelerated.js"
import CliRbacHandmadeORM from "./cli/CliRbacHandmadeORM.js"
import CliRbacHandmadeORMAccelerated from "./cli/CliRbacHandmadeORMAccelerated.js"

const cliClasses = {
  rbacCasbin: CliRbacCasbin,
  rbacHandmadeSQL: CliRbacHandmadeSQL,
  rbacHandmadeSQLAccelerated: CliRbacHandmadeSQLAccelerated,
  rbacHandmadeORM: CliRbacHandmadeORM,
  rbacHandmadeORMAccelerated: CliRbacHandmadeORMAccelerated
}

const chooseMode = async () => {
  const rl = readline.createInterface({ input, output });

  const accessControlModes = {
    1: { name: "rbacCasbin", text: "RBAC casbin" },
    2: { name: "rbacHandmadeSQL", text: "RBAC handmade SQL" },
    3: { name: "rbacHandmadeSQLAccelerated", text: "RBAC handmade SQL with getAllowedTypes()" },
    4: { name: "rbacHandmadeORM", text: "RBAC handmade ORM Sequelize" },
    5: { name: "rbacHandmadeORMAccelerated", text: "RBAC handmade ORM with getAllowedTypes()" },
  };

  console.clear();

  const items = Object.entries(accessControlModes).map(
    ([key, item]) => `${key}. ${item.text}`
  );

  const menu = `Choose mode:\n${items.join("\n")}\n\n?> `;
  const key = await rl.question(menu);

  rl.close();

  const mode = accessControlModes[key];

  if (!mode) {
    console.log();
    console.log(`Unknown mode`);
    process.exit();
  }
    
  return mode
};

const login = await auth();
const mode = await chooseMode();

console.clear();
console.log(`Welcome, ${login}\nAccess control mode: ${mode.text}\n`);

const cliClass = cliClasses[mode.name]
const cli = new cliClass(login)
cli.startConsole();