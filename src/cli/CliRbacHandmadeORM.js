import _ from "lodash";

import CLI from "./CLI.js"
import ORMDB from "../infra/ORMDB.js"
import enforce from "../enforcers/rbacHandmadeEnforcerORM.js"

class CliRbacHandmadeORM extends CLI {
  constructor(...args) {
    super(...args)

    this.commands = {
      prep: {
        data2: this.prepareDataRbacHandmade,
      },
      list: {
        obj: this.listObjects,
      },
    }
    
    this.sequelizeAdapter = new ORMDB(this.prodMode)
  }

  async prepareDataRbacHandmade({ self, pools, usermulti, objmulti }) {
    await self.db.prepareDataRbacHandmade(pools, usermulti, objmulti);

    return { result: "Done" };
  }

  async listObjectsByType({ group, type, rep }) {
    const render = (el) =>
      `ID: ${el.Id}\tName: ${el.Name}\tGroup: ${el.Group}\tType: ${el.Type}`;

    const header = `Group:\t${_.capitalize(group)}\nType:\t${_.capitalize(
      type
    )}\n---\n`;

    const durations = [];

    let allowed;
    for (let i = 1; i <= parseInt(rep); i++) {
      const start = performance.now();
      allowed = await enforce(
        this.sequelizeAdapter,
        this.userLogin,
        `group${group}`,
        `type${type}`,
        "read"
      );
      const end = performance.now();
      durations.push(end - start);
    }

    if (allowed) {
      const objects = await this.db.listObjectsByType(
        `Group${group}`,
        `Type${type}`
      );
      const rows = objects.map(render).join("\n");
      return { result: header + rows, enforceTime: _.mean(durations) };
    } else {
      return {
        result: this.denyMessage,
        enforceTime: _.mean(durations),
      };
    }
  }

  async listObjectsByGroup({ group, rep }) {
    const render = (el) => `Table: ${el.table}\tObjects: ${el.rows.length}`;

    const header = `Group:\t${_.capitalize(group)}\n---\n`;

    const durations = [];

    let allowedTypes;
    for (let i = 1; i <= parseInt(rep); i++) {
      const allTypes = await this.db.getGroupTypes(group);

      const start = performance.now();
      
      allowedTypes = await Promise.all(
        allTypes.map(async (type) => {
          const allowed = await enforce(
            this.sequelizeAdapter,
            this.userLogin,
            `group${group}`,
            type,
            "read"
          );
          return allowed ? type : false;
        })
      );
      
      const end = performance.now();
      durations.push(end - start);
    }

    allowedTypes = allowedTypes.filter((el) => el);

    if (allowedTypes.length === 0) {
      return {
        result: this.denyMessage,
        enforceTime: _.mean(durations),
      };
    }

    const tables = await Promise.all(
      allowedTypes.map(async (type) => {
        return {
          table: type,
          rows: await this.db.listObjectsByType(
            `Group${group}`,
            `${_.capitalize(type)}`
          ),
        };
      })
    );

    const rows = tables.flat().map(render).join("\n");

    return {
      result: header + rows,
      enforceTime: _.mean(durations),
    };
  }

  async listObjects({ self, group, type, rep = 1 }) {
    return await (type
      ? self.listObjectsByType({ group, type, rep })
      : self.listObjectsByGroup({ group, rep }));
  }
}

export default CliRbacHandmadeORM;
