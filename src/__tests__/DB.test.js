import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { open } from 'node:fs/promises';

import DB from '../infra/DB.js'

describe("DB", () => {
  const db = new DB(false);

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


  test("createObjectTables", async () => {
    const pools = 1
    const sets = 4
    const groups = 2
    const types = 4

    await db.createObjectTables(pools, sets, groups, types)

    const qGetObjectTablesList = `
    select * from information_schema.tables
    where table_schema = 'public'
    and table_name like 'Objects%'
    order by table_name`;

    const tables = await db.client.query(qGetObjectTablesList)
    const tableNames = tables.rows.map(table => table['table_name'])
    
    const extectedNames = [];
    for (let g = 1; g <= groups * sets; g++) {
      for (let t = 1; t <= types; t++) {
        extectedNames.push(`ObjectsGroup${g}Type${t}`)
      }
    }

    expect(tableNames).toEqual(extectedNames)
  });


  test("prepareDataRbacCasbin", async () => {
    const pools = 1
    const sets = 4
    const groups = 2
    const types = 4

    await db.prepareDataRbacCasbin(pools)
    
    const qGetObjectTablesList = `
    select * from information_schema.tables
    where table_schema = 'public'
    and table_name like 'Objects%'
    order by table_name`;

    const tables = await db.client.query(qGetObjectTablesList)
    const tableNames = tables.rows.map(table => table['table_name'])
    
    const extectedNames = [];
    for (let g = 1; g <= groups * sets; g++) {
      for (let t = 1; t <= types; t++) {
        extectedNames.push(`ObjectsGroup${g}Type${t}`)
      }
    }

    expect(tableNames).toEqual(extectedNames)

    const userRows = await db.client.query(`
      select * from public."Users"
      where "Id" = 1000;`
    )
    const root = userRows.rows[0]
    expect(root).toEqual({ Id: 1000, Name: 'Ivan' })

    const authRows = await db.client.query(`
      select * from public."Auth"
      where "UserId" = 1000;`
    )
    const rootAuth = authRows.rows[0]
    expect(rootAuth).toEqual({ UserId: 1000, Login: 'user999' })

    const ruleRows1 = await db.client.query(`
      select * from public."casbin_rule"
      where "id" = 194;`
    )

    const rule1 = ruleRows1.rows[0]
    expect(rule1).toEqual({
      id: 194,
      ptype: 'p',
      v0: 'role10',
      v1: 'group5',
      v2: 'type1',
      v3: 'read',
      v4: null,
      v5: null
    })

    const ruleRows2 = await db.client.query(`
      select * from public."casbin_rule"
      where "id" = 1558;`
    )

    const rule2 = ruleRows2.rows[0]
    expect(rule2).toEqual({
      id: 1558,
      ptype: 'g',
      v0: 'user569',
      v1: 'role5',
      v2: null,
      v3: null,
      v4: null,
      v5: null
    })
  });


  test("prepareDataRbacHandmade", async () => {
    const pools = 1
    const sets = 4
    const groups = 2
    const types = 4

    await db.prepareDataRbacHandmade(pools)
    
    const qGetObjectTablesList = `
    select * from information_schema.tables
    where table_schema = 'public'
    and table_name like 'Objects%'
    order by table_name`;

    const tables = await db.client.query(qGetObjectTablesList)
    const tableNames = tables.rows.map(table => table['table_name'])
    
    const extectedNames = [];
    for (let g = 1; g <= groups * sets; g++) {
      for (let t = 1; t <= types; t++) {
        extectedNames.push(`ObjectsGroup${g}Type${t}`)
      }
    }
    expect(tableNames).toEqual(extectedNames)

    
    const userRows = await db.client.query(`
      select * from public."Users"
      where "Id" = 1000;`
    )
    const root = userRows.rows[0]
    expect(root).toEqual({ Id: 1000, Name: 'Ivan' })
    
    
    const authRows = await db.client.query(`
      select * from public."Auth"
      where "UserId" = 1000;`
    )
    const rootAuth = authRows.rows[0]
    expect(rootAuth).toEqual({ UserId: 1000, Login: 'user999' })

    
    const roleRows = await db.client.query(`
      select * from public."Roles"
      where "Id" = 10;`
    )
    const role = roleRows.rows[0]
    expect(role).toEqual({
      Id: 10,
      Name: 'role10'
    })

    const permissionRows = await db.client.query(`
      select * from public."Permissions"
      where "Id" = 317;`
    )
    const permission = permissionRows.rows[0]
    expect(permission).toEqual({
      Id:317,
      RoleId: 15,
      ObjectGroup: 'group8',
      ObjectType: 'type3',
      Permission: 'create'
    })


    const userRoleRows = await db.client.query(`
      select * from public."UserRoles"
      where "Id" = 29;`
    )
    const userRole = userRoleRows.rows[0]
    expect(userRole).toEqual({
      Id: 29,
      UserId: 15,
      RoleId: 1
    })
  });


  test("getUserPermissions", async () => {
    const permissions = await db.getUserPermissions({
      user: 'user950',
      group: 'group6',
      type: 'type1',
      act: 'update'
    })
    expect(permissions).toEqual([
      {
        Id: 223,
        RoleId: 11,
        ObjectGroup: 'group6',
        ObjectType: 'type1',
        Permission: 'update'
      }
    ])
  });


  test("listObjectsByType", async () => {
    const group = 5
    const type = 2
    const obj = 10

    const objects = await db.listObjectsByType(`Group${group}`, `Type${type}`)

    const expectedObjects = []
    for (let i = 1; i <= obj; i++) {
      expectedObjects.push({ Id: i, Name: `object${i}`, Group: `Group${group}`, Type: `Type${type}` })
    }

    expect(objects).toEqual(expectedObjects)
  });


  test("getGroupTypes", async () => {
    const types = await db.getGroupTypes(`Group1`)
    expect(types).toEqual(['type1', 'type2', 'type3', 'type4'])
  });

  test("authUser", async () => {
    const result = await db.authUser('user1')
    expect(result).toBe(true)
  });
});
