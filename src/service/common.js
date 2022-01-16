const _ = require('lodash');
const axios = require('axios');

async function exec(methodObj, chat) {

    let command = _.get(methodObj, 'name');
    switch (command) {
        case 'selection':
            let chatLength = chat.split(" ").length;
            console.dir(chat);
            if (chat == "") {
                console.dir('여긴 get');
                let type = _.get(methodObj, 'params.type');
                let result = await axios.get(`http://localhost:30003/v0/${command}/${type}`);
                if (result.status != 200) {
                    return {};
                }

                let data = _.get(result, 'data');
                console.dir(data);
                return {
                    type: "sendChat",
                    result: data.payload.message
                }

            } else if (chatLength == 1) {
                console.dir('여긴 post');
            } else {
                console.dir('여긴 에러아니면 빈값');
            }
    }

}

module.exports = {
    exec
}