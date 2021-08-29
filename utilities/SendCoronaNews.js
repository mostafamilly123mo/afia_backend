const request = require('request');
const axios = require('axios')

let pushNotification = require('../utilities/PushNotification')


let sendNews = async function () {

    console.log('now in send news');
    let Today = new Date();
    let Yesterday = new Date();
    Yesterday.setDate(Today.getDate() - 1);

    //Get syrian cases
    const urlForSyria = `https://api.covid19api.com/total/country/syria/status/confirmed?from=${Yesterday}T00:00:00Z&to=${Today}T00:00:00Z`
    let syriaResponse = await axios.get(urlForSyria)
    let syrianCases = syriaResponse.data[0].Cases
    //console.log(syrianCases);

    //Get world cases
    const urlForWorld = `https://api.covid19api.com/world/total`
    let worldResponse = await axios.get(urlForWorld)
    let worldCases = worldResponse.data.TotalConfirmed
    //console.log(worldCases);
console.log(`The number of coronavirus infections in syria:${syrianCases} \nThe number of coronavirus infections in world:${worldCases}`);

    let patientMessage = {
        app_id: "b6d0c74b-5ab7-41ff-9752-908d58c03261",
        headings: { "en": "Afia Clinics" },
        contents: {
            "en": `The number of coronavirus infections in syria:${syrianCases} \n The number of coronavirus infections in world:${worldCases}`
        },
        filters: [
            {
                "field": "tag",
                "key": "dest",
                "relation": "=",
                "value": "patient"
            }
        ],
        data: { "type": "general", "id": "0" }
    };
    pushNotification(patientMessage);


}
module.exports = { sendNews }



/*
const urlForSyria = `https://api.covid19api.com/total/country/syria/status/confirmed?from=${Yesterday}T00:00:00Z&to=${Today}T00:00:00Z`
var syrianCases
request({ url: urlForSyria, json: true }, (err, response) => {
    syrianCases = response.body[0].Cases
    console.log(syrianCases);
    console.log(response.body[0].Cases);
    // syrianData = JSON.parse(response.body)
})
console.log(syrianCases);




// let inSyria = syrianData
// console.log(inSyria);
// let inWorld
*/