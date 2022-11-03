import { DataTypes, Sequelize } from "sequelize";

class ORMDB {
  constructor(prodMode) {
    if (prodMode) {
      this.sequelize = new Sequelize({
        username: "postgres",
        password: "password",
        database: "casbin",
        dialect: "postgresql",
        logging: false,
      });
    } else {
      this.sequelize = new Sequelize({
        username: "postgres",
        password: "password",
        database: "casbinTest",
        dialect: "postgresql",
        logging: false,
      });
    }

    this.Auth = this.sequelize.define(
      "Auth",
      {
        UserId: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
        },
        Login: {
          type: DataTypes.STRING(20),
          allowNull: false,
        },
        Password: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
      },
      {
        tableName: "Auth",
        timestamps: false,
      }
    );

    this.UserRoles = this.sequelize.define(
      "UserRoles",
      {
        Id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
        },
        UserId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        RoleId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
      },
      {
        tableName: "UserRoles",
        timestamps: false,
      }
    );

    this.Permissions = this.sequelize.define(
      "Permissions",
      {
        Id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          allowNull: false,
        },
        RoleId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        ObjectGroup: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        ObjectType: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        Permission: {
          type: DataTypes.STRING,
          allowNull: false,
        },
      },
      {
        tableName: "Permissions",
        timestamps: false,
      }
    );
  }
}

export default ORMDB;
