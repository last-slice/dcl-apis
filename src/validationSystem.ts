import { getUserData } from "@decentraland/Identity"
import { getParcel } from "@decentraland/ParcelIdentity"
import { signedFetch } from "@decentraland/SignedFetch"
import { auth, server, validate } from "./publicAPI"


export var STOP_ANIMATE = "stopanimate"
export var CLEAR_UI = "clearUI"
export var CLEAR_PRESS = "clearpress"
export var CHECK_VALID = 'checkvalid'

export var showing = false
export var invalidCounter = 0

export type PeerResponse = {
  ok: boolean
  peers: {
    id: string
    address: string
    lastPing: number
    parcel: [number, number]
    position: [number, number, number]
  }[]
}

export class ValidationSystem {
    base:number
    timer:number
    entity:any
    endpoint:string
    apiData:any

    constructor(time:number, base:number, endpoint:string, apiData:any){
        this.base = base
        this.timer = time
        this.endpoint = endpoint
        this.apiData = apiData
    }
    async update(dt: number) {
        if (this.timer > 0) {
          this.timer -= dt
        } else {
          this.timer = this.base
                try {
                  let userdata = await getUserData()
                  //if(userdata?.hasConnectedWeb3){
                    if(invalidCounter < 10){
                        const parcel = await getParcel();
                        const baseParcel = parcel.land.sceneJsonData.scene.base;
                        let response:any
                        response = await signedFetch(server + 'validate',{
                          method: 'POST',
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({auth:auth, base:baseParcel})
                        })
                        
                        let json
                        if (response.text) {
                            json = await JSON.parse(response.text)
                            log(json)
                        }
                        if (json && json.valid) {
                            log("we have valid request", json)
                            engine.removeSystem(this)
                            validate(this.endpoint, this.apiData)
                        }
                        else{
                            log('invalid request =>', json.reason)
                            invalidCounter++
                        }
                  }
                  else{
                    engine.removeSystem(this)
                  }
                // }
                // else{
                //   engine.removeSystem(this)
                // }
                } catch (error) {
                  log(error)
                }
      }
    }
}