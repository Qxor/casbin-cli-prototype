import _ from "lodash";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { SequelizeAdapter } from "casbin-sequelize-adapter";

import CLI from "./CLI.js"
import enforce from "../enforcers/rbacCasbinEnforcerNoEnforcerInit.js";

class CliRbacCasbinNoEnforcerInit extends CLI {
  constructor(...args) {
    super(...args)

    this.commands = {
      prep: {
        data1: this.prepareDataRbacCasbin,
      },
      list: {
        obj: this.listObjects,
      },
    }
  }

  async init() {
    const dbName = this.prodMode ? 'casbin' : 'casbinTest'
    this.casbinAdapter = await SequelizeAdapter.newAdapter({
      username: "postgres",
      password: "password",
      database: dbName,
      dialect: "postgresql",
      logging: false,
    });

    const __filename = fileURLToPath(import.meta.url);
    this.__dirname = dirname(__filename);
  }

  async prepareDataRbacCasbin({ self, pools, usermulti, objmulti }) {
    await self.db.prepareDataRbacCasbin(pools, usermulti, objmulti);

    return { result: "Done" };
  }

  async listObjectsByType({ group, type, rep }) {
    const render = (el) =>
      `ID: ${el.Id}\tName: ${el.Name}\tGroup: ${el.Group}\tType: ${el.Type}`;

    const header = `Group:\t${_.capitalize(group)}\nType:\t${_.capitalize(
      type
    )}\n---\n`;

    const model = resolve(this.__dirname, "../config/rbac_model.conf");
    const adapter = this.casbinAdapter;

    const durations = [];

    let allowed;
    for (let i = 1; i <= parseInt(rep); i++) {
      const start = performance.now();
      
      allowed = await enforce(
        model,
        adapter,
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

    const model = resolve(this.__dirname, "../config/rbac_model.conf");
    const adapter = this.casbinAdapter;

    const durations = [];

    let allowedTypes;
    for (let i = 1; i <= parseInt(rep); i++) {
      const allTypes = await this.db.getGroupTypes(group);

      const start = performance.now();

      allowedTypes = await Promise.all(
        allTypes.map(async (type) => {
          const allowed = await enforce(
            model,
            adapter,
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

export default CliRbacCasbinNoEnforcerInit;
