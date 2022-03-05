const axios = require("axios");
const _ = require('lodash');

class ImageService {
    constructor() {
        this.allowType = ['maplestory', 'muto', 'lostark'];
        this.imageCache = {};
        this.init();
    }

    async init() {
        let response = await axios.get('http://localhost:30003/v0/images');
        let responseData = _.get(response, 'data');
        let images = _.get(responseData, 'payload.images');

        for (let allowType of this.allowType) {
            this.imageCache[allowType] = _.filter(images, { "type": allowType });
        }
    }

    addImage(type, image) {
        this.imageCache[type].push(image);
    }

    getImage(type) {
        return this.imageCache[type];
    }
}

const imageService = new ImageService();

module.exports = imageService;