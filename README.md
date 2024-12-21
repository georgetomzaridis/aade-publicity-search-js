
# AADE Publicity Search

Request publicity records (street, city, name, type, status etc.) from AADE (Independent Public Revenue Authority) about a company using their VAT number (AFM), powered by Javascript.





## Installation

Install aade-publicity-search with npm

```bash
  npm install aade-publicity-search
```

[Find the package on NPM Registry](https://www.npmjs.com/package/aade-publicity-search)
## Usage/Examples

```javascript
const getCompanyPublicityByAADE = require('aade-publicity-search')

// Pass only the VATID of the company that your want to search and the username/password for the authentication
getCompanyPublicityByAADE("vatid","user", "pass").then((data) => {
    // Do something with the data
});

// or pass the VATID that the request called by
getCompanyPublicityByAADE("vatid","user", "pass", "vatidcalledby").then((data) => {
    // Do something with the data
});


// or pass the VATID that the request called by
getCompanyPublicityByAADE("vatid","user", "pass", "vatidcalledby").then((data) => {
    // Do something with the data
});

// or maybe you want some debugging/logging each step
getCompanyPublicityByAADE("vatid","user", "pass", "vatidcalledby", true).then((data) => {
    // Do something with the data
});

```


## Parameters

| Name  | Type | Required | Description
| ------------- | ------------- | ------------- | ------------- |
| search_vatid  | string  | Yes  | Company VATID that you want to request publicity records  | 
| aade_publicity_username  | string  | Yes  | AADE Publicity username that used for API call  |
| aade_publicity_password  | string  | Yes  | AADE Publicity password that used for API call  |
| searched_by_vatid  | string  | No  | Publicity records requested by VATID |
| debug  | boolean  | No  | Logging steps until finish, if you enable this  |

## Data Return

| Name  | Type |  Description |
| ------------- | ------------- | ------------- | 
| call_seq_id  | string  | AADE Call/Request ID  |  
| have_errors  | boolean  | This indicates if your request have any errors  | 
| errors_info.code  | string  | AADE Code error (can be null if no errors)  | 
| errors_info.descr  | string  | AADE Description error (can be null if no errors)  | 
| search_info.afm_searching | string | Company VATID that you are searching for publicity records |
| search_info.afm_called_by | string, null | Publicity records requested by VATID (can be null if not provided in search, cause is optinal) |
| data  | object  | Results (can be null if we have errors)  | 


## Response Examples
```javascript
// Success
[
  call_seq_id: '120746974',
  have_errors: false,
  errors_info: [ code: null, descr: null ],
  search_info: [ afm_searching: '123456789', afm_called_by: null ],
  data: {
    afm: '123456789   ',
    doy: '1234',
    doy_descr: 'ΘΕΣΣΑΛΟΝΙΚΗΣ',
    i_ni_flag_descr: 'ΜΗ ΦΠ',
    deactivation_flag: '1',
    deactivation_flag_descr: 'ΕΝΕΡΓΟΣ ΑΦΜ          ',
    firm_flag_descr: 'ΕΠΙΤΗΔΕΥΜΑΤΙΑΣ      ',
    onomasia: 'ΔΟΚΙΜΑΣΤΙΚΗ ΕΤΑΙΡΕΙΑ ΑΝΩΝΥΜΗ ΕΤΑΙΡΕΙΑ',
    commer_title: 'ΔΟΚΙΜΑΣΤΙΚΗ ΕΤΑΙΡΕΙΑ',
    legal_status_descr: 'ΑΝΩΝΥΜΗ ΕΤΑΙΡΕΙΑ',
    postal_address: 'ΛΕΩΦΟΡΟΣ ΝΙΚΗΣ',
    postal_address_no: '55        ',
    postal_zip_code: '12345',
    postal_area_description: 'ΘΕΣΣΑΛΟΝΙΚΗ',
    regist_date: '2022-11-22',
    stop_date: null,
    normal_vat_system_flag: 'Y'
  }
]

// Errors

[
  call_seq_id: '120745719',
  have_errors: true,
  errors_info: [
    code: 'RG_WS_PUBLIC_TOKEN_USERNAME_NOT_AUTHENTICATED',
    descr: 'Ο συνδυασμός χρήστη/κωδικού πρόσβασης που δόθηκε δεν είναι έγκυρος.'
  ],
  search_info: [ afm_searching: '123456789', afm_called_by: null ],
  data: null
]
```


## Error Codes
| Code  | Description |
| ------------- | ------------- |
| RG_WS_PUBLIC_TOKEN_USERNAME_NOT_AUTHENTICATED | Wrong username/password |
| RG_WS_PUBLIC_WRONG_AFM | Invalid VATID |
| RG_WS_PUBLIC_EPIT_NF | VATID Searched, no business activity (before/now) |


## FAQ

### How this library works?

It's very simple. The library just make a regular HTTP SOAP (XML) Request to AADE publicity endpoint, passing the required data, gather the response and parse it for easier usage.

#### How i can obtain an AADE publicity username / password?

You need to login with your taxisnet and obtain your username / password from [this link](https://www1.aade.gr/sgsisapps/tokenservices/protected/displayConsole.htm)

#### Who can use this library?

Everybody can use this library! But from the AADE side, access have only people that have/has income from business activities. More information you can find [here](https://www.aade.gr/epiheiriseis/forologikes-ypiresies/mitroo/anazitisi-basikon-stoiheion-mitrooy-epiheiriseon) 

### It's safe to put my credentials and use the library?

Of course it's safe and legal to use this library. For the credentials part, you can store it as enviromental values (.env file) and pass it through here for maximum security.
## Support / Questions

For support, email georgetomzaridis@gmail.com.
Also you can [buy me a coffee](https://www.buymeacoffee.com/georgetomzP) to thank me, i will not say no.


## Bugs/Suggestions

For bugs/suggestions please open an issue so we can see it in more detail. Please put the necessary issue tags that describe your request before open an issue. Forking is free and cool for everyone too!





## Tech Stack

**Libraries:** Axios

**AADE Request Type:** XML (SOAP)


## License

You can use this library for personal or business usage and improve it freely.
## Authors

- [@georgetomzaridis](https://github.com/georgetomzaridis)

