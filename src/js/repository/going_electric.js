class GoingElectric {

  constructor() {
    this.apiKey = "16faec520ed8c3f6a1c73ed4801a57d2";
    this.url = "https://api.goingelectric.de/chargepoints";
  }

  async getStations(northEast, southWest,options) {
    const body = {
      key: this.apiKey,
      ne_lat: northEast.latitude,
      ne_lng: northEast.longitude,
      sw_lat: southWest.latitude,
      sw_lng: southWest.longitude
    }

    if(options.onlyHPC) body["min_power"]=43;
    if(options.onlyFree){
      body["freecharging"]=true;
      body["freeparking"]=true;
    } 
    if(options.openNow) body["open_now"]=true;

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: this.encodeBody(body),
    })

    return await this.parseStationsResponse(response);
  }

  async getStationDetails(stationId){
    const body = { key: this.apiKey, ge_id: stationId }

    const response = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: this.encodeBody(body),
    })

    return await this.parseStationResponse(response);
  }

  encodeBody(body){
    return Object.keys(body).map((k) => [k, body[k]].join("=")).join("&")
  }

  async parseStationsResponse(response) {
    const root = await response.json();
    return root.chargelocations.map(m => this.toLightModel(m))
  }

  async parseStationResponse(response) {
    const root = await response.json();
    return root.chargelocations.map(m => this.toDetailModel(m))[0]
  }

  toLightModel(data) {
    return {
      id: String(data.ge_id),
      longitude: data.coordinates.lng,
      latitude: data.coordinates.lat,
      connectors: data.chargepoints.map(cp=>{ return {speed: cp.power }})
    }
  }

  toDetailModel(data) {
    return {
      id:                 String(data.ge_id),
      name:               data.name,
      network:            this.valueOrFallback(data.network),
      longitude:          data.coordinates.lng,
      latitude:           data.coordinates.lat,
      isFreeCharging:     data.cost.freecharging,
      isFreeParking:      data.cost.freeparking,
      priceDescription:   this.valueOrFallback(data.cost.description_long),
      region:             this.mapRegion(data.address.country),
      chargeCardIds:      this.valueOrFallback(data.chargecards, []).map(cc => String(cc.id)),
      connectors:         data.chargepoints.map((cp,idx) => this.parseConnector(cp,idx)),
      goingElectricUrl:  "https:" + data.url
    }
  }

  mapRegion(longRegion) {
    const mapping = {
      "Österreich"  : "at",
      "Deutschland" : "de",
      "Italien"     : "it",
      "Niederlande" : "nl",
      "Schweiz"     : "ch",
      "Slowenien"   : "sl",
      "Kroatien"    : "hr"
    }

    return mapping[longRegion];
  }

  valueOrFallback(value, fallback=null){
    return value != false ? value : fallback
  }

  parseConnector(hash,idx){
    return {
      id: String(idx), 
      speed: hash.power,
      plug:  hash.type,
      count: hash.count,
      energy: this.energy(hash.type)
    }
  }

  energy(plug){
    return ["CCS", "CHAdeMO", "Tesla Supercharger", "Tesla HPC"].includes(plug) ? "dc" : "ac";
  }

}