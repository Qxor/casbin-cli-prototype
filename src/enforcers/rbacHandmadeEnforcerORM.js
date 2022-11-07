async function enforce(adapter, user, group, type, act) {
  const permissions = await adapter.Permissions.findAll({
    where: {
      RoleId: (await adapter.UserRoles.findAll({
        where: {
          UserId: (await adapter.Auth.findAll({
            where: {
              Login: user,
            },
          }))[0]['UserId'],
        },
      })).map(rec => rec['RoleId']),
      ObjectGroup: group,
      ObjectType: type,
      Permission: act,
    },
  });

  return permissions.length > 0
}

export default enforce;
