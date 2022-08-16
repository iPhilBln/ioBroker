// device.0 : ATV Wohnzimmer
// device.1 : ATV Schlafzimmer

const pathToConfig = '0_userdata.0.apple_tv.config';
const username = 'iobroker';
const pathAtvRemoteModule = '';
const debug = true;

/*----------==========Ende der Einstellungen==========----------*/

class AppleTv {

  constructor(username, id, name, airplayCredentials, companionCredentials){
    this.id = id;
    this.name = name;
    this.arrApps = [];
    this.username = username;
    //this.pathToPythonModule = '';
    this.airplayCredentials = airplayCredentials;
    this.companionCredentials = companionCredentials;
  }

  #setDefaultCommand(){
    this.command = 'python 3 ' + this.pathToPythonModule + ' '
                 + '--id ' + this.id + ' '
                 + '--airplay-credentials ' + this.airplayCredentials + ' '
                 + '--companion-credentials ' + this.companionCredentials + ' ';
  }

  /** Mögliche Kommandos für das Apple TV **/
  #setState(state){
    switch(state){
      case 'ein':
      case 'an':
        this.command += 'turn_on '; break;
      case 'aus':
        this.command += 'turn_off'; break;
      case 'spiele':
        this.command += 'play'; break;
      case 'pausiere':
        this.command += 'pause'; break;
      case 'nächste':
        this.command += 'next';
    }
  }

  setUsername(username){ this.username = username; }

  setArrApps(objApp) { this.arrApps.push(objApp); }

  setPathToPythonSkript(update, path){
    if(update || path == ''){
      exec(`find /home/${this.username}/.local/lib/ -name atvremote.py`, async function(error, result, stderr){
  		    let path = result.split('\n');
          if(path.length > 0) this.pathToPythonModule = path[0];
          else console.log('Es konnte kein Skript gefunden werden.');
      });
    } else this.pathToPythonModule = path;
    if(this.debug) console.log(this.pathToPythonModule);
  }

  setChannel(strIn){
    const dictCmd = ['ein', 'an', 'aus', 'pausiere', 'nächste']
    for(let i = 0; i < this.arrApps.length; i++){
      if(strIn.contains(this.arrApps[i].name)){
        this.#setDefaultCommand();
        for(let i = 0; i < dictCmd.length; i++) if(strIn.conatains(dictCmd[i])) this.#setState(dictCmd[i]);
        this.command += 'launch_app=' + this.arrApps[i].link;
      }
    }
    console.log(this.command);
    exec(this.command);
  }

  toString(){
    return  '{' +
            '"name": "' + this.name +
            '", "id": "' + this.id +
            '", "airplayCredentials": "' + this.airplayCredentials +
            '", "companionCredentials": "' + this.companionCredentials +
            '", "apps": "' + this.arrApps +
            '", "username": "' + this.username +
            '", "pathToPythonSkript": "' + this.pathToPythonModule +
            '" }';
  }
}

/*----------========== Hauptprogramm ==========----------*/

let id, name, arrApps, airplayCredentials, companionCredentials;
let atvDevices;

function createDevices(obj){
  atvDevices = [];
  for(let i = 0; i < obj.devices.length; i++){
    atvDevices[i] = new AppleTv(  username,
                                  obj.devices[i].id,
                                  obj.devices[i].name,
                                  obj.devices[i].apps,
                                  obj.devices[i].airplay,
                                  obj.devices[i].companion);
    //for(let j = 0; j < obj.devices[i].apps.length; j++){ helper.setArrApps(JSON.parse(obj.devices[i].apps[j]));}
    atvDevices[i].setPathToPythonSkript(false, pathAtvRemoteModule);
    if(debug) console.log(obj.devices[i].apps);
    if(debug) console.log('created Device: ' + atvDevices[i].toString());
  }
}

function selectDevice(deviceName, strIn){
  for(let i = 0; i < atvDevices.length; i++){
    if(deviceName == atvDevices[i].name) device.setChannel(strIn);
    if (debug) console.log('selectDevice: ' + atvDevices[i].toString());
    break;
  }
}

createDevices(JSON.parse(getState(pathToConfig).val));

on({id: pathToConfig, change:'ne'}, function(dp){
  try{ createDevices(JSON.parse(dp.state.val)); }
  catch(err) { console.log('Objekte konnten nicht erstellt werden: ' + err);}
});

on({id: 'Alexa2.History.summary', change: 'ne'}, function(dp){
  selectDevice('ATV Schlafzimmer', dp.state.val); // only Demo

  /* only Demo
  if(strIn.includes('magenta')){
    if(strIn.includes('on')) atvWohnzimmer.setChannel('on', 'dazn');
    else if(strIn.includes('off')) atvWohnzimmer.setChannel('off');
  }
*/


});
