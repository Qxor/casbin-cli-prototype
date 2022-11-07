async function enforce(adapter, user, group, type, act) {
  const userId = (
    await adapter.Auth.findAll({
      where: {
        Login: user,
      },
    })
  )[0]["UserId"];

  const roles = (
    await adapter.UserRoles.findAll({
      where: {
        UserId: userId,
      },
    })
  ).map((rec) => rec["RoleId"]);

  const permissions = await adapter.Permissions.findAll({
    where: {
      RoleId: roles,
      ObjectGroup: group,
      ObjectType: type,
      Permission: act,
    },
  });

  return permissions.length > 0
}

async function getAllowedTypes(adapter, user, group, act) {
  const userId = (
    await adapter.Auth.findAll({
      where: {
        Login: user,
      },
    })
  )[0]["UserId"];

  const roles = (
    await adapter.UserRoles.findAll({
      where: {
        UserId: userId,
      },
    })
  ).map((rec) => rec["RoleId"]);

  const permissions = await adapter.Permissions.findAll({
    where: {
      RoleId: roles,
      ObjectGroup: group,
      Permission: act,
    },
  });

  const allowedTypes = permissions.map(rec => rec['ObjectType'])

  return allowedTypes
}

export { enforce, getAllowedTypes };