async function prepareData(db, poolsCount, usersMultiplier, objectsMultiplier) {
  const TABLE_AUTH = `public."Auth"`;
  const TABLE_USERS = `public."Users"`;
  const TABLE_USER_ROLES = `public."UserRoles"`;
  const TABLE_ROLES = `public."Roles"`;
  const TABLE_PERMISSIONS = `public."Permissions"`;
  const TABLE_CASBIN_RULES = `public."casbin_rule"`;

  //НЕ ИЗМЕНЯТЬ
  const preset = {
    pools: poolsCount,
    setsPerPool: 4,
    groupsPerSet: 2,
    typesPerGroup: 4,
    objectsPerType: 10 * objectsMultiplier,
    rolesPerSet: 4,
    userGroup: {
      1: 500 * usersMultiplier,
      2: 300 * usersMultiplier,
      3: 100 * usersMultiplier,
      4: 50 * usersMultiplier,
      5: 30 * usersMultiplier,
      6: 10 * usersMultiplier,
      7: 10 * usersMultiplier,
    },
  };

  //чистим таблицы, создаём таблицы с объектами
  await db.dropObjectTables();

  const qCleanTables = `
  delete from ${TABLE_AUTH};
  delete from ${TABLE_PERMISSIONS};
  delete from ${TABLE_USER_ROLES};
  delete from ${TABLE_ROLES};
  delete from ${TABLE_USERS};
  delete from ${TABLE_CASBIN_RULES};
  ALTER SEQUENCE casbin_rule_id_seq RESTART WITH 1;`;

  await db.client.query(qCleanTables);

  await db.createObjectTables(
    preset.pools,
    preset.setsPerPool,
    preset.groupsPerSet,
    preset.typesPerGroup
  );

  //создаём объекты
  const objects = [];
  for (
    let gCounter = 1;
    gCounter <= preset.groupsPerSet * preset.setsPerPool * preset.pools;
    gCounter++
  ) {
    for (let tCounter = 1; tCounter <= preset.typesPerGroup; tCounter++) {
      for (let oCounter = 1; oCounter <= preset.objectsPerType; oCounter++) {
        objects.push(`
        insert into public."ObjectsGroup${gCounter}Type${tCounter}" ("Id", "Name", "Group", "Type")
        values (${oCounter}, 'object${oCounter}', 'Group${gCounter}', 'Type${tCounter}');`);
      }
    }
  }
  const qCreateObjects = objects.join("");

  await db.client.query(qCreateObjects);

  //создаём пользователей
  const totalUsers = Object.values(preset.userGroup).reduce(
    (acc, v) => acc + v,
    0
  );
  const users = [];
  for (let i = 1; i <= totalUsers * preset.pools; i++) {
    users.push(`(${i}, 'Ivan')`);
  }

  const usersAuth = [];
  for (let i = 1; i <= totalUsers * preset.pools; i++) {
    usersAuth.push(`(${i}, 'user${i - 1}')`);
  }

  const qCreateUsers = `
  insert into ${TABLE_USERS} ("Id", "Name")
  values ${users.join(",")};

  insert into ${TABLE_AUTH} ("UserId", "Login")
  values ${usersAuth.join(",")};`;

  await db.client.query(qCreateUsers);

  //создаём политики
  const policies = [];
  for (
    let roleId = 1, groupId = 1, setCounter = 1;
    setCounter <= preset.setsPerPool * preset.pools;
    groupId += 2, setCounter++
  ) {
    const push = (v) => {
      policies.push(v);
    };

    //1st role
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'read')`);

    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'update')`);

    roleId++;

    //2nd role
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'update')`);

    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'read')`);

    roleId++;

    //3rd role
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'update')`);

    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'delete')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'delete')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'delete')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'delete')`);

    roleId++;

    //4th role
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type1', 'delete')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type2', 'delete')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type3', 'delete')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId}', 'type4', 'delete')`);

    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type1', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type2', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type3', 'update')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'create')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'read')`);
    push(`('p', 'role${roleId}', 'group${groupId + 1}', 'type4', 'update')`);

    roleId++;
  }

  const qCreatePolicies = `
  insert into ${TABLE_CASBIN_RULES} ("ptype", "v0", "v1", "v2", "v3")
  values ${policies.join(",")}`;

  await db.client.query(qCreatePolicies);

  //назначаем роли на пользователей
  const roles = [];

  for (
    let id = policies.length + 1, userId = 1, roleId = 1, poolCounter = 1;
    poolCounter <= preset.pools;
    poolCounter++, roleId += preset.rolesPerSet * preset.setsPerPool
  ) {
    const push = (v) => {
      roles.push(v);
      id++;
    };

    for (let i = 1; i <= preset.userGroup["1"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId}')`);
    }

    for (let i = 1; i <= preset.userGroup["2"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId + 1}')`);
      push(`('g', 'user${userId}', 'role${roleId + 4}')`);
    }

    for (let i = 1; i <= preset.userGroup["3"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId + 2}')`);
      push(`('g', 'user${userId}', 'role${roleId + 5}')`);
      push(`('g', 'user${userId}', 'role${roleId + 8}')`);
    }

    for (let i = 1; i <= preset.userGroup["4"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId + 3}')`);
      push(`('g', 'user${userId}', 'role${roleId + 6}')`);
      push(`('g', 'user${userId}', 'role${roleId + 9}')`);
      push(`('g', 'user${userId}', 'role${roleId + 12}')`);
    }

    for (let i = 1; i <= preset.userGroup["5"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId + 7}')`);
      push(`('g', 'user${userId}', 'role${roleId + 10}')`);
      push(`('g', 'user${userId}', 'role${roleId + 13}')`);
    }

    for (let i = 1; i <= preset.userGroup["6"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId + 11}')`);
      push(`('g', 'user${userId}', 'role${roleId + 14}')`);
    }

    for (let i = 1; i <= preset.userGroup["7"]; i++, id++, userId++) {
      push(`('g', 'user${userId}', 'role${roleId + 15}')`);
    }
  }

  const qCreateRoles = `
  insert into ${TABLE_CASBIN_RULES} ("ptype", "v0", "v1")
  values ${roles.join(",")}`;

  await db.client.query(qCreateRoles);/**/
}


export default prepareData