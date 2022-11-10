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
  delete from ${TABLE_CASBIN_RULES};`;

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

  //создаём роли
  const roles = []
  
  for (let id = 1; id <= preset.rolesPerSet * preset.setsPerPool * preset.pools; id++) {
    roles.push(`(${id}, 'role${id}')`)
  }
  
  const qCreateRoles = `
  insert into ${TABLE_ROLES} ("Id", "Name")
  values ${roles.join(",")};`

  await db.client.query(qCreateRoles)

  //создаём пемишены
  const permissions = [];
  for (
    let id = 1, roleId = 1, groupId = 1, setCounter = 1;
    setCounter <= preset.setsPerPool * preset.pools;
    groupId += 2, setCounter++
  ) {
    const push = (v) => {
      permissions.push(v);
      id++;
    };

    //1st role
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'read')`);

    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'update')`);

    roleId++;

    //2nd role
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'update')`);

    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'read')`);

    roleId++;

    //3rd role
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'update')`);

    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'delete')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'delete')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'delete')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'delete')`);

    roleId++;

    //4th role
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type1', 'delete')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type2', 'delete')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type3', 'delete')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId}', 'type4', 'delete')`);

    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type1', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type2', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type3', 'update')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'create')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'read')`);
    push(`(${id}, ${roleId}, 'group${groupId + 1}', 'type4', 'update')`);

    roleId++;
  }

  const qCreatePermissions = `
  insert into ${TABLE_PERMISSIONS} ("Id", "RoleId", "ObjectGroup", "ObjectType", "Permission")
  values ${permissions.join(",")}`;

  await db.client.query(qCreatePermissions);

  //назначаем роли на пользователей
  const userRoles = [];

  for (
    let id = 1, userId = 1, roleId = 1, poolCounter = 1;
    poolCounter <= preset.pools;
    poolCounter++, roleId += preset.rolesPerSet * preset.setsPerPool
  ) {
    const push = (v) => {
      userRoles.push(v);
      id++;
    };

    for (let i = 1; i <= preset.userGroup["1"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId})`);
    }

    for (let i = 1; i <= preset.userGroup["2"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId + 1})`);
      push(`(${id}, ${userId}, ${roleId + 4})`);
    }

    for (let i = 1; i <= preset.userGroup["3"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId + 2})`);
      push(`(${id}, ${userId}, ${roleId + 5})`);
      push(`(${id}, ${userId}, ${roleId + 8})`);
    }

    for (let i = 1; i <= preset.userGroup["4"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId + 3})`);
      push(`(${id}, ${userId}, ${roleId + 6})`);
      push(`(${id}, ${userId}, ${roleId + 9})`);
      push(`(${id}, ${userId}, ${roleId + 12})`);
    }

    for (let i = 1; i <= preset.userGroup["5"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId + 7})`);
      push(`(${id}, ${userId}, ${roleId + 10})`);
      push(`(${id}, ${userId}, ${roleId + 13})`);
    }

    for (let i = 1; i <= preset.userGroup["6"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId + 11})`);
      push(`(${id}, ${userId}, ${roleId + 14})`);
    }

    for (let i = 1; i <= preset.userGroup["7"]; i++, id++, userId++) {
      push(`(${id}, ${userId}, ${roleId + 15})`);
    }
  }

  const qCreateUserRoles = `
  insert into ${TABLE_USER_ROLES} ("Id", "UserId", "RoleId")
  values ${userRoles.join(",")}`;

  await db.client.query(qCreateUserRoles);
}


export default prepareData