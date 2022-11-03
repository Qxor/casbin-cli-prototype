async function enforce(adapter, user, group, type, act) {
  const responseAuth = await adapter.Auth.findAll({
    where: {
      Login: user
    }
  })
  const userId = responseAuth[0]['UserId']

  const responseUserRoles = await adapter.UserRoles.findAll({
    where: {
      UserId: userId
    }
  })

  const roles = responseUserRoles.map(rec => rec['RoleId'])

  const responsePermissionsWithType = await adapter.Permissions.findAll({
    where: {
      RoleId: roles,
      ObjectGroup: group,
      ObjectType: type,
      Permission: act
    }
  })

  const permissionsWithType = responsePermissionsWithType
  return permissionsWithType.length > 0
}

export default enforce;
