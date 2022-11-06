import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { open } from 'node:fs/promises';

import CliRbacHandmadeORMAccelerated from '../cli/CliRbacHandmadeORMAccelerated.js'

describe("CliRbacHandmadeORMAccelerated", () => {
  const cli = new CliRbacHandmadeORMAccelerated("user950", false);
  const db = cli.db;

  beforeAll(async () => {
    await cli.init()

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const file = await open(resolve(__dirname, "./__fixtures__/prepareTablesToTest.sql"))

    const query = await file.readFile({ encoding: 'utf-8'})
    await db.client.query(query);

    const pools = 1
    await db.prepareDataRbacHandmade(pools)
  });

  afterAll(async () => {
    await db.close();
    await cli.sequelizeAdapter.sequelize.close()
  });

  test("listObjectsByType", async () => {
    const group = 5
    const type = 1
    const obj = 10

    const data = await cli.listObjects({ self: cli, group, type, rep: 1 })

    const expectedObjects = []
    for (let i = 1; i <= obj; i++) {
      expectedObjects.push(`ID: ${i}\tName: object${i}\tGroup: Group${group}\tType: Type${type}`)
    }
    const expectedResult = `Group:\t${group}\nType:\t${type}\n---\n` + expectedObjects.join('\n')
    
    expect(data.result).toBe(expectedResult)
  });

  test("listObjectsByGroup", async () => {
    const group = 5
    const types = 4
    const obj = 10

    const data = await cli.listObjects({ self: cli, group, rep: 1 })

    const expectedObjects = []
    for (let i = 1; i <= types; i++) {
      expectedObjects.push(`Table: type${i}\tObjects: ${obj}`)
    }
    const expectedResult = `Group:\t${group}\n---\n` + expectedObjects.join('\n')
    
    expect(data.result).toBe(expectedResult)
  });
});