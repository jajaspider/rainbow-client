const axios = require("axios");
const _ = require("lodash");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");

let configPath = path.join(process.cwd(), "config", "rainbow.develop.yaml");
let config = yaml.load(fs.readFileSync(configPath));

class ImageService {
  constructor() {
    this.allowType = ["maplestory", "muto", "lostark"];
    this.imageCache = {};
    this.init();
  }

  async init() {
    let response = await axios.get(
      `${_.get(config, "site.domain")}:${_.get(
        config,
        "site.port"
      )}/api/v0/images`
    );
    let responseData = _.get(response, "data");
    let images = _.get(responseData, "payload.images");

    for (let allowType of this.allowType) {
      this.imageCache[allowType] = _.filter(images, {
        type: allowType,
      });
    }
  }

  addImage(type, image) {
    this.imageCache[type].push(image);
  }

  getImage(type) {
    return this.imageCache[type];
  }

  deleteImage(image) {
    this.imageCache[image.type] = _.filter(
      this.imageCache[image.type],
      (target) => {
        return target.name != image.name;
      }
    );
  }
}

const imageService = new ImageService();

module.exports = imageService;
