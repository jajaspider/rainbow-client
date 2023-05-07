const mongoose = require("mongoose");

const roomSchema = require("./room");
const commonSchema = require("./common");
const permissionSchema = require("./permission");
const manageSchema = require("./manage");
const maplestorySchema = require("./maplestory");
const lostarkSchema = require("./lostark");
const deviceSchema = require("./device");

// const Selection = mongoose.model('Selection', selectionSchema);

module.exports = {
  Room: roomSchema,
  Common: commonSchema,
  Permission: permissionSchema,
  Manage: manageSchema,
  Maplestory: maplestorySchema,
  Lostark: lostarkSchema,
  Device: deviceSchema,
};
