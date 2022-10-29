import { isPreviewMode } from "@decentraland/EnvironmentAPI";
import { getUserData } from "@decentraland/Identity";
import { getParcel } from "@decentraland/ParcelIdentity";
import { signedFetch } from "@decentraland/SignedFetch";
import { ValidationSystem } from "./validationSystem";

let validated = false

let DEBUG = false
export let server = DEBUG ? 'http://localhost:8334/dcl/apis/' : "https://lkdcl.co/dcl/apis/"
export let auth = ""

export enum APIErorr {
    ALREADYOWNED,
    NOTNEWER,
    FETCH,
    API,
    JSON,
    NOTHUMAN,
    BOT,
    INVALIDAUTH,
    INVALIDSCENE,
    INVALIDPLAYER,
    INVALIDORIGIN,
    INVALIDIP,
    TOOMANYIP
}

export function validate(endpoint: string, apiData:any){
    validated = true
    apiData.auth = auth
    postAPI(endpoint, apiData)
}

export async function init(authorization:string){
    auth = authorization
    let socket:WebSocket
      //startAnalytics();
      const parcel = await getParcel();
      const baseParcel = parcel.land.sceneJsonData.scene.base;
    
        let baseUrl =  DEBUG ? "ws://localhost:8333" : "wss://lkdcl.co/dcl/apis/wss";

        let userData = await getUserData()
        log(userData)

       // if(userData?.hasConnectedWeb3){
        socket = new WebSocket(baseUrl + `?scene=${baseParcel}` + `&user=` + userData!.userId);
      
        if (!socket) {
          return;
        }
      
        socket.onopen = (ev) => { 
          log("connected to api web socket");
          socket.send(JSON.stringify({ action: "join", name: userData!.userId }));
        };
      
        socket.onclose = function (event) {
          log("api socket closed");
        };
      
        socket.onmessage = function (event) {
    
          if (event.data === '__ping__') {
            //log('pinging api server')
            socket.send(JSON.stringify({keepAlive: userData!.userId}));
        }
        else{
          const message = JSON.parse(event.data);
          //log(message)
          
          switch (message.action) {
            case "init":
              //initScene(message.sceneData);
              log('initalizing scene for api')
              break;
          }
        }
        };
    //}
}


export async function postAPI(endpoint:string, apiData?:any) {

    let res:any = {valid: false, msg:"", data:{}}

  
      if(auth == ""){
        if(!apiData!.auth){
          res.valid = false
          res.msg = APIErorr.INVALIDAUTH
          return res
        }
      }
      else{
        apiData.auth = auth
      }

      if(!validated && !await isPreviewMode()){
        engine.addSystem(new ValidationSystem(0,5, endpoint, apiData))
        return
      }

    const parcel = await getParcel();
    const baseParcel = parcel.land.sceneJsonData.scene.base;
    apiData.base = baseParcel

    //let ispreview = await isPreviewMode();

    let userData = await getUserData()
    apiData.name = userData!.displayName
  
    try{
      let response:any
          response = await signedFetch(server + endpoint,{
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(apiData)
          })
      let json
      if (response.text) {
        json = await JSON.parse(response.text)  
        if(json){
          res.valid = json.valid
          res.data = json.data
          res.msg = json.msg

          if(!json.valid){
            res.msg = returnError(json.msg)
          }
          return res
        }
        else{
          res.valid = json.valid
          res.msg = APIErorr.API
          return res
      }
      }
      else{
        res.valid = false
        res.msg = APIErorr.JSON
        return res
      }
    }
    catch(e){
        //log('error is => ', e)
        res.valid = false
        res.msg = APIErorr.FETCH
        return res
    }
  }

  function returnError(error:string){
    let msg = null
    switch(error.slice(7)){
        case 'ALREADY OWNED':
            msg = APIErorr.ALREADYOWNED
            break;

        case 'INVALID AUTH':
            msg = APIErorr.INVALIDAUTH
            break;

        case 'INVALID SCENE':
            msg = APIErorr.INVALIDSCENE
            break;

         case 'INVALID ORIGIN':
            msg = APIErorr.INVALIDORIGIN
            break;

         case 'INVALID IP':
            msg = APIErorr.INVALIDIP
            break;

        case 'Not Human':
            msg = APIErorr.NOTHUMAN
            break;

        case 'Bot Detected':
            msg = APIErorr.BOT
         break;

        case 'Invalid player position':
            msg = APIErorr.INVALIDPLAYER
            break;

        case 'Fetch Error':
            msg = APIErorr.FETCH
            break;

        case 'JSON Error':
            msg = APIErorr.JSON
            break;

         case 'API Error':
            msg = APIErorr.API
            break;

        case 'NOT NEWER':
            msg = APIErorr.NOTNEWER
            break;

        case 'TOO MANY IP':
            msg = APIErorr.TOOMANYIP
            break;
    }
    return error
  }