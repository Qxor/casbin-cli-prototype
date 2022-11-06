import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { performance } from "node:perf_hooks";

import DB from "../infra/DB.js";

class CLI {
  constructor(userLogin, prodMode = true) {
    this.userLogin = userLogin;
    this.prodMode = prodMode;

    this.db = new DB(prodMode);

    this.denyMessage = `Operation denied: no permission`;
  }

  async init() {}

  parseArgs(args) {
    return args.reduce((acc, arg) => {
      const reKey = /^\w+/s;
      const reValue = /=.+$/s;

      const key = arg.match(reKey)[0];
      const rawValue = arg.match(reValue)[0].slice(1);

      let value;
      if (rawValue.charAt(0) === "[") {
        value = rawValue
          .slice(1, -1)
          .split(",")
          .map((el) => parseInt(el, 10));
      } else {
        value = Array.from(rawValue)
          .filter((c) => !"'\"".includes(c))
          .join("");
      }

      return { ...acc, [key]: value };
    }, {});
  }

  parseInput(input) {
    const inputFull = input;
    const reCommand = /^\w+/s;
    const cmd = inputFull.match(reCommand)[0];

    const inputWithoutCommand = inputFull.slice(cmd.length + 1);
    const reObject = /^\w+/su;
    const obj = inputWithoutCommand.match(reObject)[0];

    const inputWithoutCommandAndObject = inputFull.slice(
      cmd.length + 1 + (obj.length + 1)
    );
    const reArguments = /\w+=[\w',_\[\]]+/gsu; //\w+=[\w']+
    const rawArgs = inputWithoutCommandAndObject.match(reArguments);

    const args = rawArgs && this.parseArgs(rawArgs);

    return {
      cmd,
      obj,
      args,
    };
  }

  async runCommand(command) {
    const { cmd, obj, args } = this.parseInput(command);
    const exec = this.commands[cmd][obj];
    
    const startTime = performance.now();
    const { result, enforceTime } = await exec({ ...args, self: this });
    const endTime = performance.now();
    console.log(result);

    console.log("---");
    console.log(
      `Enforce time: ${enforceTime ? Math.round(enforceTime) / 1000 : "--"} sec`
    );
    console.log(`Exec time: ${Math.round(endTime - startTime) / 1000} sec`);
    console.log("");
  }

  startConsole() {
    const rl = readline.createInterface({ input, output, prompt: "?> " });

    rl.prompt();

    rl.on("line", async (cmd) => {
      try {
        await this.runCommand(cmd);
      } catch (e) {
        console.log(e);
      }
      rl.prompt();
    }).on("close", () => {
      this.db.close()
      console.clear();
      console.log("Horosho delay, horosho budet");
      process.exit();
    });
  }
}

export default CLI;