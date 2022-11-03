async function enforce(db, user, group, type, act) {
  const permissions = await db.getUserPermissions({ user, group, type, act });
  return permissions.length > 0;
}

export default enforce;
