// device.0 : ATV Wohnzimmer
// device.1 : ATV Schlafzimmer

const pathToConfig = '0_userdata.0.apple_tv.config';
const username = 'iobroker';
const pathAtvRemoteModule = 'default';
const debug = true;

/*----------==========Ende der Einstellungen==========----------*/

class AppleTv {

  constructor(username, id, name, arrApps, airplayCredentials, companionCredentials, pathToPythonModule){
    this.id = id;
    this.name = name;
    this.arrApps = arrApps;
    this.username = username;
    this.pathToPythonModule = pathToPythonModule;
    this.airplayCredentials = airplayCredentials;
    this.companionCredentials = companionCredentials;
  }

  setPathToPythonModule(update, path){

    let findPathCmd = `find /home/${this.username}/.local/lib/ -name atvremote.py `;

    const exec = require('child_process').exec;

    function os_func() {
        this.execCommand = function(cmd, callback) {
            exec(cmd, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    return;
                }

                callback(stdout);
            });
        }
    }

    var os = new os_func();

    let testPath = (cmd) => {
      os.execCommand(cmd, function (returnvalue) {
        let path = returnvalue.split('\n');
        console.log('testPath() path: ' + path[0]);
        //this.pathToPythonModule = path[0];        <- wieso funktioniert das nicht?
        return path[0];
      });
    }

    console.log('testPath(): ' + testPath(findPathCmd));

    let runExec = (cmd) => {
      exec(cmd, async function (error, result, stderr) {
        let path = result.split('\n');
          if(path.length > 0) {
            console.log('runExec() path: ' + path[0]);
            //this.pathToPythonModule = path[0];        <- wieso funktioniert das nicht?
            return path[0];
          }
          else console.log('Es konnte kein Skript gefunden werden.');
      });
    }

    console.log('runExec(): ' + runExec(findPathCmd));

    this.pathToPythonModule = testPath(findPathCmd);   //<- wieso funktioniert das nicht?
    //this.pathToPythonModule = runExec(findPathCmd);   //<- wieso funktioniert das nicht?
    //
    if(update || path == 'default'){



      /*
      let execResult;
      exec(cmd, function (error, result, stderr) {
  		  let path = result.split('\n');
          if(path.length > 0) {
            console.log('path: ' + path[0] + '; type: ' + typeof(path[0]));
            console.log('attPath type: ' + typeof(this.pathToPythonModule));
            execResult = path[0];
            //this.pathToPythonModule = test;
          }//this.pathToPythonModule = path[0]; }//wieso funktioniert diese Zeile nicht?
          else console.log('Es konnte kein Skript gefunden werden.');
      });
      this.pathToPythonModule = execResult;

      console.log('result was: ' + this.pathToPythonModule);*/
    } else this.pathToPythonModule = path;

  }

  setChannel(strIn){

    let setDefaultCommand = () => {
      this.command = 'python3 ' + this.pathToPythonModule + ' '
                   + '--id ' + this.id + ' '
                   + '--airplay-credentials ' + this.airplayCredentials + ' '
                   + '--companion-credentials ' + this.companionCredentials + ' ';
    }

    let setState = (state) => {
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

    const dictCmd = ['ein', 'an', 'aus', 'pausiere', 'nächste']

    for(let i = 0; i < this.arrApps.length; i++){
      if(strIn.contains(this.arrApps[i].name)){
        for(let j = 0; j < dictCmd.length; j++) {
            if(strIn.conatains(dictCmd[j])) {
                setDefaultCommand();
                setState(dictCmd[j]);
                this.command += 'launch_app=' + this.arrApps[i].link;
            }
        }
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
            '", "apps": "' + JSON.stringify(this.arrApps) +
            '", "username": "' + this.username +
            '", "pathToPythonSkript": "' + this.pathToPythonModule +
            '" }';
  }
}

/*----------========== Hauptprogramm ==========----------*/

let id, name, arrApps, airplayCredentials, companionCredentials;
let atvDevices;

async function createDevices(obj){
  atvDevices = [];
  for(let i = 0; i < obj.devices.length; i++){
    atvDevices[i] = new AppleTv(  username,
                                  obj.devices[i].id,
                                  obj.devices[i].name,
                                  obj.devices[i].apps,
                                  obj.devices[i].airplay,
                                  obj.devices[i].companion,
                                  pathAtvRemoteModule);
    //for(let j = 0; j < obj.devices[i].apps.length; j++){ helper.setArrApps(JSON.parse(obj.devices[i].apps[j]));}
    /*
    exec(`find /home/${username}/.local/lib/ -name atvremote.py `, function (error, result, stderr) {
        let path = result.split('\n');
        if(path.length > 0) { atvDevices[i].setPathToPythonModule(false, path[0]); console.log(atvDevices[i].pathToPythonModule); }
        else console.log('Es konnte kein Skript gefunden werden.');
    });
    */
    atvDevices[i].setPathToPythonModule(false, pathAtvRemoteModule);
    const showObjects = () => {
      if(debug) console.log('created Device: ' + atvDevices[i].toString());
      if(debug) console.log('app: ' + atvDevices[i].arrApps[0].name);
    }
    setTimeout(showObjects, 3000);
  }
}

function selectDevice(deviceName, strIn){
  for(let i = 0; i < atvDevices.length; i++){
    if(deviceName == atvDevices[i].name) atvDevices[i].setChannel(strIn);
    if (debug) console.log('selectDevice: ' + atvDevices[i].toString());
    break;
  }
}

createDevices(JSON.parse(getState(pathToConfig).val));

on({id: pathToConfig, change:'ne'}, function(dp){
  try{ createDevices(JSON.parse(dp.state.val)); }
  catch(err) { console.log('Objekte konnten nicht erstellt werden: ' + err);}
});

on({id: 'alexa2.0.History.summary', change: 'ne'}, function(dp){
  selectDevice('ATV Schlafzimmer', dp.state.val); // only Demo

  /* only Demo
  if(strIn.includes('magenta')){
    if(strIn.includes('on')) atvWohnzimmer.setChannel('on', 'dazn');
    else if(strIn.includes('off')) atvWohnzimmer.setChannel('off');
  }
*/


});
