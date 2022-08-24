/*
 *autor: Phil
 *github link: tba
 *
 * username: xyz -> default user for pyatv scripts
 * pollingPowerState: 0 -> obj.getPowerStateByEvent(); is called for each device, get state in realtime but takes a lot of memory (~77MB for each device)
 *                   >0 -> obj.getPowerStatePolling() time in seconds to get the device state
 * pathToConfig: path where your config is stored in iobroker
 */

/*----------========== Einstellungen ==========----------*/

const username = 'iobroker';
const pollingPowerState = 0;

let pathToConfig = '0_userdata.0.apple_tv.config';

/*----------========== Eigener Teil ==========----------*/

function startSubscription(){
  console.log('start subscription...');

  on({id: 'alexa2.0.History.summary', change: 'gt'}, function(dp){
    let val = dp.state.val
    let alexaDevice = getState('alexa2.0.History.name').val;

    if(val.includes('wohnzimmer')){
      selectDevice('ATV Wohnzimmer', val);
    } else if (val.includes('schlafzimmer')){
      selectDevice('ATV Schlafzimmer', val);
    } else if (alexaDevice.includes('küche') || alexaDevice.includes('wohnzimmer')){
      selectDevice('ATV Wohnzimmer', val);
    } else if (alexaDevice.includes('schlafzimmer')){
      selectDevice('ATV Schlafzimmer', val);
    }
  });
}

/*----------========== Ende Eigener Teil ==========----------*/

/*----------========== Pfadkorrektur ==========----------*/

if(pathToConfig.charAt(pathToConfig.length - 1) == '.') pathToConfig = pathToConfig.slice(0, -1);

/*----------========== Geräteauswahl ==========----------*/

function selectDevice(deviceName, strIn){
  for(let i = 0; i < atvDevices.length; i++){
    if(deviceName == atvDevices[i].name) atvDevices[i].setChannel(strIn);
      console.log('selected device: ' + atvDevices[i].toString());
    break;
  }
}

/*----------========== Klasse AppleTv ==========----------*/
class AppleTv {

  constructor(username, id, name, arrApps, pathToState, airplayCredentials, companionCredentials){
    this.id = id;
    this.name = name;
    this.command = '';
    this.arrApps = arrApps;
    this.powerState = false;
    this.username = username;
    this.pathToState = pathToState;
    this.airplayCredentials = airplayCredentials;
    this.companionCredentials = companionCredentials;
    this.pathToPythonModule = {"remote":'', "script":''};
  }

  getPowerStateByEvent(enable){

    const spawn = require("child_process").spawn;
    const pyFile = this.pathToPythonModule.script;
    const arg1 = '--id';
    const arg2 = this.id;
    const arg3 = '--airplay-credentials';
    const arg4 = this.airplayCredentials;
    const arg5 = '--companion-credentials';
    const arg6 = this.companionCredentials;
    const arg7 = 'push_updates';

    const args = [pyFile, arg1, arg2, arg3, arg4, arg5, arg6, arg7];

    const pyspawn = spawn('python3', args);

    pyspawn.stdout.on('data', (data) => {
        let state = JSON.parse(data);
        if(state.hasOwnProperty('power_state')){
          switch(state.power_state){
            case 'on':
              this.setPowerState(true);
              break;
            case 'off':
              this.setPowerState(false);
          }
        }
      }
    );

    pyspawn.stderr.on('data', (data) => { console.error(`${this.name} -> stderr: ${data}`); });

    pyspawn.on('close', (code) => { console.log(`${this.name} -> child process for device exited with code ${code}`); });

    onStop(() => { pyspawn.kill('SIGINT'); });
    on({id: pathToConfig, change: 'ne'},() => { pyspawn.kill('SIGINT'); });
  }

  getPowerStatePolling(){

    const pyFile = this.pathToPythonModule.remote;
    const arg1 = '--id';
    const arg2 = this.id;
    const arg3 = '--airplay-credentials';
    const arg4 = this.airplayCredentials;
    const arg5 = '--companion-credentials';
    const arg6 = this.companionCredentials;
    const arg7 = 'power_state';

    const args = pyFile + ' ' + arg1 + ' ' + arg2 + ' ' + arg3 + ' ' + arg4 + ' ' + arg5 + ' ' + arg6  + ' ' + arg7;

    exec('python3 ' + args, async (error, stdout, stderr) => {
      if(error) {
          console.error(`${this.name} -> error: ${error}`);
          return;
      } else if (stderr) {
          console.error(`${this.name} -> stderr: ${stderr}`);
      } else {
          const state = stdout.trim();
          switch(state){
            case 'PowerState.On':
              this.setPowerState(true);
              break;
            case 'PowerState.Off':
              this.setPowerState(false);
          }
      }
    });
  }

  setPowerState(powerState){
    const id = this.pathToState + '.' + this.name + '.online'

    if(powerState != this.powerState){
      this.powerState = powerState;
      setStateDelayed(id, this.powerState, true, 2000, true, () => {
        if(powerState) console.log('Your device ' + this.name + ' is powered on.');
        else console.log('Your device ' + this.name + ' is powered off.');
      });
    }
  }

  setPathToPythonModule(){

    let runExecRemote = (cmd, callback) => {
      exec(cmd[0], async (error, result, stderr) => {
        let path = result.split('\n');
        if(path.length > 1) {
            this.pathToPythonModule.remote = path[0];
            callback(cmd[1]);
        }
        else console.error('Es konnte kein Skript gefunden werden.');
      });
    };

    let runExecScript = (cmd) => {
      exec(cmd, async (error, result, stderr) => {
        let path = result.split('\n');
        if(path.length > 1) {
            this.pathToPythonModule.script = path[0];
            console.log('created device: ' + this.toString());
        }
        else console.error('Es konnte kein Skript gefunden werden.');
      });
    };

    let findPathCmd = [];
    findPathCmd[0] = `find /home/${this.username}/.local/lib/ -name atvremote.py `;
    findPathCmd[1] = `find /home/${this.username}/.local/lib/ -name atvscript.py `;
	  runExecRemote(findPathCmd, runExecScript);

  }

  setChannel(strIn){

    let setDefaultCommand = () => {
      this.command = 'python3 ' + this.pathToPythonModule.remote + ' '
                   + '--id ' + this.id + ' '
                   + '--airplay-credentials ' + this.airplayCredentials + ' '
                   + '--companion-credentials ' + this.companionCredentials + ' ';
    };

    let setState = (state) => {
      switch(state){
        case 'ein':
        case 'an':
          this.command += 'turn_on '; break;
        case 'aus':
          this.command += 'turn_off '; break;
        case 'spiele':
          this.command += 'play '; break;
        case 'pausiere':
          this.command += 'pause '; break;
        case 'nächste':
          this.command += 'next ';
      }
    };

    const dictCmd = ['ein', 'an', 'aus', 'spiele', 'pausiere', 'nächste'];

    for(let i = 0; i < this.arrApps.length; i++){
      if(strIn.contains(this.arrApps[i].name)){
        for(let j = 0; j < dictCmd.length; j++) {
            if(strIn.conatains(dictCmd[j])) {
                setDefaultCommand();
                setState(dictCmd[j]);
                this.command += 'launch_app=' + this.arrApps[i].link;
					      break;
            }
        }
        break;
      }
    }
    console.log(this.command);
    exec(this.command, async function (){
      console.log('execute command: ' + this.command);
    });
  }

  toString(){
    return  '{' +
            '"name":"' + this.name +
            '", "id":"' + this.id +
            '", "airplayCredentials":"' + this.airplayCredentials +
            '", "companionCredentials":"' + this.companionCredentials +
            '", "apps":"' + JSON.stringify(this.arrApps) +
            '", "username":"' + this.username +
            '", "pathToPythonSkript":"' + JSON.stringify(this.pathToPythonModule) +
            '" }';
  }
}

/*----------========== Geräte erfassen ==========----------*/

let id, name, arrApps, airplayCredentials, companionCredentials;
let atvDevices, pathToState;
let polling, timeout;

createDevices(JSON.parse(getState(pathToConfig).val), createDataPoint);

async function createDevices(obj, callback){
  console.log('starting create devices...');
  pathToState = pathToConfig.replace('config', 'devices');

  atvDevices = [];
  for(let i = 0; i < obj.devices.length; i++){
    atvDevices[i] = new AppleTv(  username,
                                  obj.devices[i].id,
                                  obj.devices[i].name,
                                  obj.devices[i].apps,
                                  pathToState,
                                  obj.devices[i].airplayCredentials,
                                  obj.devices[i].companionCredentials);

    atvDevices[i].setPathToPythonModule();
  }
  timeout = setTimeout(() => { callback(startPolling); }, 200 * obj.devices.length);
}

function createDataPoint(callback){
  console.log('starting create DPs...');

  //createState(name, initialValue, forceCreation, common, native, callback);
  for(let i = 0; i < atvDevices.length; i++) {
    let nameOfDevice = pathToState + '.' + atvDevices[i].name + '.online'
    createStateAsync(nameOfDevice, false, false, {
        'name': 'online state',
        'role': 'state',
        'read': true,
        'write': false,
        'type': 'boolean'
      }, () => {
          console.log('Created Online State for device: ' + atvDevices[i].name);
          if(i == atvDevices.length - 1) callback(subscriptionConfigFile); });
  }
}


function startPolling(callback){
  console.log('start polling...');
  if(pollingPowerState > 0)
    polling = setInterval(async function(){
      for(let i = 0; i < atvDevices.length; i++) atvDevices[i].getPowerStatePolling();
    }, pollingPowerState * 1000);
  else for(let i = 0; i < atvDevices.length; i++) atvDevices[i].getPowerStateByEvent(true);

  callback(startSubscription);
}

function subscriptionConfigFile(callback){
  on({id: pathToConfig, change:'ne'}, function(dp){
    if(pollingPowerState > 0) clearInterval(polling);
    createDevices(JSON.parse(dp.state.val), createDataPoint);
  });
  callback();
}
