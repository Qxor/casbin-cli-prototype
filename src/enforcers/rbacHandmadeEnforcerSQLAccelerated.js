async function enforce(db, user, group, type, act) {
  const permissions = await db.getUserPermissions({ user, group, type, act });
  return permissions.length > 0;
}

async function getAllowedTypes(db, user, group, act) {
  const permissions = await db.getUserPermissions({user, group, act});
  return permissions.map((rec) => rec.ObjectType);
}

export { enforce, getAllowedTypes };