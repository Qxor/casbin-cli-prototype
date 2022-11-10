import DB from "./infra/DB.js";
import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

async function auth() {
  const db = new DB(true);
  const rl = readline.createInterface({ input, output });

  console.clear();
  const login = await rl.question("login: ");
  rl.close();

  const passed = await db.authUser(login);
  
  if (!passed) {
    console.log()
    console.log("Login is incorrect");
    process.exit()
  }
  
  await db.close();
  return login;
}

export default auth;
