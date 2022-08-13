// device.0 : ATV Wohnzimmer
// device.1 : ATV Schlafzimmer

class AppleTv {

  constructor(name, id, airplayCredentials, companionCredentials){
    this.id = id;
    this.name = name;
    this.airplayCredentials = airplayCredentials;
    this.companionCredentials = companionCredentials;
  }

  /** Mögliche Kommandos für das Apple TV **/
  #setState(state){
    switch(state){
      case 'on':
        this.command += 'turn_on '; break;
      case 'off':
        this.command += 'turn_off'; break;
      case 'play':
        this.command += 'play'; break;
      case 'pause':
        this.command += 'pause'; break;
      case 'next':
        this.command += 'next';
    }
  }

  /** Hier alle möglichen Apps mit zugehörigen Link eintragen **/
  #setApp(app){
    this.command += 'launch_app=';
    switch(app){
      case 'magenta':
        this.command += 'de.telekom.entertaintv-iphone'; break;
      case 'dazn':
        this.command += 'com.dazn.theApp'; break;
      case 'disney plus':
        this.command += 'com.disney.disneyplus'; break;
      case 'sky':
        this.command += 'com.bskyb.skyqms'; break;
      case 'prime':
        this.command += 'com.amazon.aiv.AIVApp'; break;
      case 'netflix':
        this.command += 'com.netflix.Netflix'; break;
      case 'youtube':
        this.command += 'com.google.ios.youtube'; break;
      case 'spotify':
        this.command += 'com.spotify.client'
    }
  }

  #generateDefaultCommand(){
    this.command = 'atvremote '
                 + '--id ' + this.id + ' '
                 + '--airplay-credentials ' + this.airplayCredentials + ' '
                 + '--companion-credentials ' + this.companionCredentials + ' ';
  }

  setChannel(state, app){
    this.#generateDefaultCommand();

    if(state == 'on') this.#setState('on');
    else this.#setState('off');

    if(app != undefined) this.#setApp(app);

    exec(this.command);
  }

  toString(){
    return  '{' +
            'name: ' + this.name +
            ', id: ' + this.id +
            ', airplayCredentials: ' + this.airplayCredentials +
            ', companionCredentials: 'this.companionCredentials +
            '}';
  }
}

const pathToConfig = '0_userdata.0.apple_tv.config';

let id, name, airplayCredentials, companionCredentials;
let configJson = JSON.parse(getState(pathToConfig).val);

id = configJson.devices[0].id;
name = configJson.devices[0].name;
airplayCredentials = configJson.devices[0].airplay;
companionCredentials = configJson.devices[0].companion;
let atvWohnzimmer = new AppleTv(id, name, airplayCredentials, companionCredentials);

id = configJson.devices[1].id;
name = configJson.devices[1].name;
airplayCredentials = configJson.devices[1].airplay;
companionCredentials = configJson.devices[1].companion;
let atvSchlafzimmer = new AppleTv(id, name, airplayCredentials, companionCredentials);

console.log(atvSchlafzimmer);
atvSchlafzimmer.setChannel('off');

on({id: 'Alexa2.History.summary', change: 'ne'}, function(dp){
  let strIn = dp.state.val;
})
