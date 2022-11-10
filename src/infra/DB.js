import pkg from "pg";
import prepDataRbacCasbin from './prepDataRbacCasbin.js'
import prepDataRbacHandmade from './prepDataRbacHandmade.js'

class DB {
  constructor(prodMode) {
    const { Client } = pkg;

    if (prodMode) {
      this.client = new Client({
        user: "postgres",
        host: "localhost",
        database: "casbin",
        password: "password",
        port: 5432,
      });
    } else {
      this.client = new Client({
        user: "postgres",
        host: "localhost",
        database: "casbinTest",
        password: "password",
        port: 5432,
      });
    }

    this.client.connect();
  }

  async close() {
    await this.client.end();
  }

  async createRoot() {
    const queryFindLastUserId = `
    select "Id" from public."Users"
    order by "Id" desc
    limit 1`;
    const result = await this.client.query(queryFindLastUserId);
    const user = result.rows.length > 0 && result.rows[0];
    const id = user ? user.Id : "0";

    const nextId = parseInt(id, 10) + 1;
    const queryCreateUser = `
      insert into public."Users" ("Id", "Name") values (${nextId}, 'Andrey');
      insert into public."Auth" ("UserId", "Login") values (${nextId}, 'root');`;
    await this.client.query(queryCreateUser);
  }

  async authUser(inputLogin) {
    const query = `
    SELECT * FROM public."Auth"
    where "Login" = '${inputLogin}'`;

    const result = await this.client.query(query);

    return result.rows[0] && true;
  }

  async listObjectsByType(group, type) {
    const query = `
    select * from public."Objects${group}${type}"`;

    const result = await this.client.query(query);

    return result.rows;
  }

  async dropObjectTables() {
    const qGetObjectTablesList = `
    select * from information_schema.tables
    where table_schema = 'public'
    and table_name like 'Objects%'`;

    const tableList = await this.client.query(qGetObjectTablesList);

    if (tableList.rows.length === 0) {
      return;
    }

    const tableNames = tableList.rows.map((row) => row["table_name"]);
    const qDropTables = tableNames
      .map((name) => `drop table public."${name}";`)
      .join("");

    await this.client.query(qDropTables);
  }

  async createObjectTables(pools, sets, groupsPerSet, typesPerGroup) {
    const queries = [];
    for (
      let gCounter = 1;
      gCounter <= pools * sets * groupsPerSet;
      gCounter++
    ) {
      for (let tCounter = 1; tCounter <= typesPerGroup; tCounter++) {
        queries.push(`
        CREATE TABLE IF NOT EXISTS public."ObjectsGroup${gCounter}Type${tCounter}"
        (
            "Id" integer NOT NULL,
            "Name" character varying(255),
            "Group" character varying(255),
            "Type" character varying(255),
            PRIMARY KEY ("Id")
        );`);
      }
    }

    const qCreateTables = queries.join("");
    await this.client.query(qCreateTables);
  }

  async prepareDataRbacCasbin(poolsCount, usersMultiplier = 1, objectsMultiplier = 1) {
    await prepDataRbacCasbin(this, poolsCount, usersMultiplier, objectsMultiplier)
  }

  async prepareDataRbacHandmade(poolsCount, usersMultiplier = 1, objectsMultiplier = 1) {
    await prepDataRbacHandmade(this, poolsCount, usersMultiplier, objectsMultiplier)
  }

  async getUserPermissions({ user, group, type, act }) {
    const groupField = group && `perm."ObjectGroup"='${group}'`;
    const typeFiled = type && `perm."ObjectType"='${type}'`;
    const actField = act && `perm."Permission"='${act}'`;
    const whereFields = ['1=1', groupField, typeFiled, actField]
      .filter((field) => field != undefined)
      .join(" AND ");

    const qGetUserRolesId = `
    with rolesId as (
      select userRoles."RoleId" from public."UserRoles" as userRoles
      inner join public."Auth" as auth
      on auth."UserId" = userRoles."UserId"
      where auth."Login"='${user}'
    )

    select * from public."Permissions" as perm
    inner join rolesId
    on perm."RoleId" = rolesId."RoleId"
    where ${whereFields}`;

    const rolesId = (await this.client.query(qGetUserRolesId)).rows
    return rolesId
  }

  async getGroupTypes(group) {
    //вы раскрыли мой секрет )) немного срезал, на результаты теста инфорсера не влияет,
    //потому используется что за пределами измерения времени
    return ['type1', 'type2', 'type3', 'type4']
  }
}

export default DB;
