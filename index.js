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

function convertArrayValues(object){
    Object.entries(Object.keys(object)).forEach(entry => {
        const [key, value] = entry;
        if(typeof object[value][0] === "object"){
            object[value] = null;
        }else{
            object[value] = object[value][0];
            object[value] = object[value].trim();
        }
    });
}

function parseXml(xml, debug = false) {
    return new Promise((resolve, reject) => {
        xml2js.parseString(xml, (err, result) => {
            if (err) {
                reject(err);
            } else {
                let final_arr_return = [];
                if(err != null){
                    return (Error ('Error parsing XML Response from AADE (if you believe is this a bug, open a issue)'))
                }
                const final_json_text = JSON.stringify(result, null, 4);
                const final_json = JSON.parse(final_json_text);
                const call_seq_id = final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['call_seq_id'][0];
                let error_code = null;
                if(final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_code'][0]['$'] === undefined){
                    error_code = final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_code'][0]
                }
                let error_descr = null;
                if(final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_descr'][0]['$'] === undefined){
                    error_descr = final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['error_rec'][0]['error_descr'][0]
                }
        
                let company_data = null;
                let company_sectors = null
                if(error_code == null && error_descr == null){
                     company_data = final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['basic_rec'][0];
                     convertArrayValues(company_data)
                                   
                      if(final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['firm_act_tab'] !== undefined){
                            company_sectors = final_json['env:Envelope']['env:Body'][0]['srvc:rgWsPublic2AfmMethodResponse'][0]['srvc:result'][0]['rg_ws_public2_result_rtType'][0]['firm_act_tab'][0]['item'];
                             company_sectors.forEach(e => {
                                 convertArrayValues(e)
                             });
                       }
                                   
                 company_data.company_sectors = company_sectors;
               }
        
                
                final_arr_return['call_seq_id'] = call_seq_id;
                if((error_code == null && error_descr == null) && company_data != null){
                    final_arr_return['have_errors'] = false;
                    final_arr_return['errors_info'] = [];
                    final_arr_return['errors_info']['code'] = null;
                    final_arr_return['errors_info']['descr'] = null;
                    final_arr_return['data'] = company_data;
                }else{
                    final_arr_return['have_errors'] = true;
                    final_arr_return['errors_info'] = [];
                    final_arr_return['errors_info']['code'] = error_code;
                    final_arr_return['errors_info']['descr'] = error_descr;
                    final_arr_return['data'] = null;
                }

                if(debug){
                    console.log("[*][aade-publicity-search] Parsing AADE Response");
                }

                resolve(final_arr_return);
            }
        });
    });
}






async function getCompanyPublicityByAADE(search_vatid, aade_publicity_username, aade_publicity_password, searched_by_vatid = null, debug = false){
    try {
        let data_xml = "";
        let final_arr_return = [];
        let final_result = [];
            
        if(debug){
            console.log("[*][aade-publicity-search] Starting...");
        }

        if(search_vatid == null || search_vatid == ""){
            return (Error ('You need to pass a VATID for publicity search'))
        }

        if((aade_publicity_username == null || aade_publicity_username == "") || (aade_publicity_password == null || aade_publicity_password == "")){
            return (Error ('You need to provide special credentials to call AADE API. More info: https://www.aade.gr/epiheiriseis/forologikes-ypiresies/mitroo/anazitisi-basikon-stoiheion-mitrooy-epiheiriseon'))
        }

        if(typeof search_vatid != "string"){
            return (Error ('Parameter search_vatid must be string'))
        }

        if(typeof aade_publicity_username != "string"){
            return (Error ('Parameter aade_publicity_username must be string'))
        }

        if(typeof aade_publicity_password != "string"){
            return (Error ('Parameter aade_publicity_password must be string'))
        }

        if(typeof searched_by_vatid != "string" && searched_by_vatid != null){
            return (Error ('Parameter searched_by_vatid must be string'))
        }

        if(typeof debug != "boolean"){
            return (Error ('Parameter debug must be boolean'))
        }

        if(debug){
            console.log("[*][aade-publicity-search] Validation check for all params ...");
        }

        if(searched_by_vatid == null || searched_by_vatid == ""){
            if(debug){
                console.log("[*][aade-publicity-search] Structure XML Data without vatid called_by");
            }
            data_xml = '<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:ns2="http://rgwspublic2/RgWsPublic2Service" xmlns:ns3="http://rgwspublic2/RgWsPublic2"><env:Header><ns1:Security><ns1:UsernameToken><ns1:Username>'+ aade_publicity_username +'</ns1:Username><ns1:Password>'+ aade_publicity_password +'</ns1:Password></ns1:UsernameToken></ns1:Security></env:Header><env:Body><ns2:rgWsPublic2AfmMethod><ns2:INPUT_REC><ns3:afm_called_by/><ns3:afm_called_for>'+ search_vatid +'</ns3:afm_called_for></ns2:INPUT_REC></ns2:rgWsPublic2AfmMethod></env:Body></env:Envelope>';
        
        }else{
            if(debug){
                console.log("[*][aade-publicity-search] Structure XML Data with vatid called_by");
            }
            data_xml = '<env:Envelope xmlns:env="http://www.w3.org/2003/05/soap-envelope" xmlns:ns1="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:ns2="http://rgwspublic2/RgWsPublic2Service" xmlns:ns3="http://rgwspublic2/RgWsPublic2"><env:Header><ns1:Security><ns1:UsernameToken><ns1:Username>'+ aade_publicity_username +'</ns1:Username><ns1:Password>'+ aade_publicity_password +'</ns1:Password></ns1:UsernameToken></ns1:Security></env:Header><env:Body><ns2:rgWsPublic2AfmMethod><ns2:INPUT_REC><ns3:afm_called_by>'+ searched_by_vatid +'<ns3:afm_called_by/><ns3:afm_called_for>'+ search_vatid +'</ns3:afm_called_for></ns2:INPUT_REC></ns2:rgWsPublic2AfmMethod></env:Body></env:Envelope>';
        }


        if(debug){
            console.log("[*][aade-publicity-search] Preparing AADE Request");
        }

        let config = {
            method: 'post',
            url: 'https://www1.gsis.gr/wsaade/RgWsPublic2/RgWsPublic2',
            headers: { 
                'Content-Type': 'application/soap+xml; charset=utf8',
                'User-Agent': '@georgetomzaridis/aade-publicity-search',
                'Accept-Encoding': 'gzip',
                'Connection': 'keep-alive',
                'Accept': '*/*',
            },
            data : data_xml,
            responseType: "arraybuffer",
            decompress: true,

        };

   
        const {data, error} = await axios.request(config);
        const decompress_data = await gunzip(data);
        const final_dec_data = decompress_data.toString('utf8');
        final_result = parseXml(final_dec_data, debug);
        return final_result;
             
    }catch (error){
        return (Error ('Something went wrong: ' + error + ' (if you believe is this a bug, open a issue)'))
    } 
    
}

module.exports = getCompanyPublicityByAADE;