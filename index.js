const axios = require('axios');
const xml2js = require('xml2js');
const isXML = require('is-xml');
const zlib = require("zlib");
const util = require('util');
const gunzip = util.promisify(zlib.gunzip);

/**
 * Request publicity records from AADE for a specific company VATID [https://www.aade.gr/epiheiriseis/forologikes-ypiresies/mitroo/anazitisi-basikon-stoiheion-mitrooy-epiheiriseon]
 * @param {string} search_vatid - Company VATID that you want to request publicity records (Required)
 * @param {string} aade_publicity_username - AADE Publicity username that used for API call (Required) [https://www1.aade.gr/sgsisapps/tokenservices/protected/displayConsole.htm]
 * @param {string} aade_publicity_password - AADE Publicity password that used for API call (Required) [https://www1.aade.gr/sgsisapps/tokenservices/protected/displayConsole.htm]
 * @param {string} searched_by_vatid - Publicity records requested by VATID (Optional)
 * @param {boolean} debug - Logging steps until finish, if you enable this (Optional)
 */

function convertArrayValues(object) {
    Object.entries(Object.keys(object)).forEach(entry => {
        const [key, value] = entry;
        if (typeof object[value][0] === "object") {
            object[value] = null;
        } else {
            object[value] = object[value][0];
            object[value] = object[value].trim();
        }
    });
}

function parseXml(xml, searching_afm = null, called_by_afm = null, debug = false) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, (err, result) => {
            if (err) {
                reject(err);
            } else {
                let finalArrReturn = [];
                const finalJsonText = JSON.stringify(result, null, 4);
                const finalJson = JSON.parse(finalJsonText);
                const callSeqId = finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['call_seq_id'][0];

                let errorCode = null;
                let errorDescr = null;

                if (!finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_code'][0]['$']) {
                    errorCode = finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_code'][0];
                }
                if (!finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_descr'][0]['$']) {
                    errorDescr = finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_descr'][0];
                }

                let companyData = null;
                let companySectors = null;

                if (!errorCode && !errorDescr) {
                    companyData = finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['basic_rec'][0];
                    convertArrayValues(companyData);

                    if (finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['firm_act_tab']) {
                        companySectors = finalJson['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['firm_act_tab'][0]['item'];
                        companySectors.forEach(e => convertArrayValues(e));
                    }

                    companyData.company_sectors = companySectors;
                }

                finalArrReturn['call_seq_id'] = callSeqId;
                if (!errorCode && !errorDescr && companyData) {
                    finalArrReturn['have_errors'] = false;
                    finalArrReturn['search_info'] = [];
                    finalArrReturn['search_info']['afm_searching'] = searching_afm;
                    finalArrReturn['search_info']['afm_called_by'] = called_by_afm;
                    finalArrReturn['data'] = companyData;
                } else {
                    finalArrReturn['have_errors'] = true;
                    finalArrReturn['errors_info'] = [];
                    finalArrReturn['errors_info']['code'] = errorCode;
                    finalArrReturn['errors_info']['descr'] = errorDescr;
                    finalArrReturn['search_info'] = [];
                    finalArrReturn['search_info']['afm_searching'] = searching_afm;
                    finalArrReturn['search_info']['afm_called_by'] = called_by_afm;
                    finalArrReturn['data'] = null;
                }

                if (debug) {
                    console.log("[*][aade-publicity-search] Parsing AADE Response");
                }

                resolve(finalArrReturn);
            }
        });
    });
}

async function getCompanyPublicityByAADE(search_vatid, aade_publicity_username, aade_publicity_password, searched_by_vatid = null, debug = false) {
    try {
        let dataXml = "";

        if (debug) {
            console.log("[*][aade-publicity-search] Starting...");
        }

        if (!search_vatid) {
            throw new Error('You need to pass a VATID for publicity search');
        }

        if (!aade_publicity_username || !aade_publicity_password) {
            throw new Error('You need to provide special credentials to call AADE API.');
        }

        if (typeof search_vatid !== "string") {
            throw new Error('Parameter search_vatid must be string');
        }

        if (typeof debug !== "boolean") {
            throw new Error('Parameter debug must be boolean');
        }

        dataXml = searched_by_vatid 
            ? `<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:ns2="http://rgwspublic2/RgWsPublic2Service" xmlns:ns3="http://rgwspublic2/RgWsPublic2"><env:Header><ns1:Security><ns1:UsernameToken><ns1:Username>${aade_publicity_username}</ns1:Username><ns1:Password>${aade_publicity_password}</ns1:Password></ns1:UsernameToken></ns1:Security></env:Header><env:Body><ns2:rgWsPublic2AfmMethod><ns2:INPUT_REC><ns3:afm_called_by>${searched_by_vatid}</ns3:afm_called_by><ns3:afm_called_for>${search_vatid}</ns3:afm_called_for></ns2:INPUT_REC></ns2:rgWsPublic2AfmMethod></env:Body></env:Envelope>`
            : `<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:ns2="http://rgwspublic2/RgWsPublic2Service" xmlns:ns3="http://rgwspublic2/RgWsPublic2"><env:Header><ns1:Security><ns1:UsernameToken><ns1:Username>${aade_publicity_username}</ns1:Username><ns1:Password>${aade_publicity_password}</ns1:Password></ns1:UsernameToken></ns1:Security></env:Header><env:Body><ns2:rgWsPublic2AfmMethod><ns2:INPUT_REC><ns3:afm_called_for>${search_vatid}</ns3:afm_called_for></ns2:INPUT_REC></ns2:rgWsPublic2AfmMethod></env:Body></env:Envelope>`;

        
        const config = {
            method: 'post',
            url: 'https://www1.gsis.gr/wsaade/RgWsPublic2/RgWsPublic2',
            headers: { 
                'Content-Type': 'application/soap+xml; charset=utf8',
                'User-Agent': '@georgetomzaridis/aade-publicity-search',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Accept': '*/*',
            },
            data: dataXml,
            responseType: "arraybuffer",
        };

        const { data: responseData, headers } = await axios.request(config);

        let decompressedData;
        if (headers['content-encoding'] === 'gzip') {
            decompressedData = await gunzip(responseData);
        } else {
            decompressedData = responseData;
        }

        const finalData = decompressedData.toString('utf8');

        if (!isXML(finalData)) {
            throw new Error("Invalid XML format in response");
        }

        const finalResult = await parseXml(finalData, search_vatid, searched_by_vatid, debug);
        return finalResult;

    } catch (error) {
        throw new Error('Something went wrong: ' + error.message);
    }
}

module.exports = getCompanyPublicityByAADE;
