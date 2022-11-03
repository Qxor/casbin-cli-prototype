import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { open } from 'node:fs/promises';

import CLI from "../cli/CLI.js";

describe("CLI", () => {
  const cli = new CLI("user1", false);
  const db = cli.db;

  beforeAll(async () => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const file = await open(resolve(__dirname, "./__fixtures__/prepareTablesToTest.sql"))
    
    const query = await file.readFile({ encoding: 'utf-8'})
    await db.client.query(query);
  });

  afterAll(async () => {
    await db.close();
  });

  test("Parsing", async () => {
    const cmdListUsers = `list objects`;
    expect(cli.parseInput(cmdListUsers)).toEqual({
      cmd: "list",
      obj: "objects",
      args: null,
    });

    const cmdCreateObject = `create object name='Box' type=0 company='Company1'`;
    expect(cli.parseInput(cmdCreateObject)).toEqual({
      cmd: "create",
      obj: "object",
      args: {
        name: "Box",
        type: "0",
        company: "Company1",
      },
    });
  });
});
