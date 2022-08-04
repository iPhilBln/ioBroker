//Entfernt 0_userdata.0. aus der directory, falls sie fälschlicherweise mit angegeben wurde
if (directory.indexOf('0_userdata.0.' ) + 1 > 0) directory = directory.replace('0_userdata.0.', '');

const settingsDirectory = '0_userdata.0.' + directory + '.0_Settings.' + Group_ID;
const groupDirectory = '0_userdata.0.' + directory + '.1_Scenes.' + Group_ID;
const selectorDirectory = 'state[id=*](dynamic_lightscenes=' + Group_ID + ')';
const weblinkJsonFile = 'https://raw.githubusercontent.com/iPhilBln/dynamicHueScenes/beta/Sourcecode/sceneSettings.json';
var implementedReady = false;

try {
  //legt Datenpunkt für minimale Duration an, falls er nicht existiert
  //sonst werden Standardwerte hinzugefügt
  await createStateAsync(settingsDirectory + '.Duration.duration_min', 0, true, {
    name: 'min duration',
    role: 'state',
    read: true,
    write: true,
    type: 'number'
  }); console.log("Der Datenpunkt für die minimale Dauer des Farbwechsels wurde angelegt.");

  //legt Datenpunkt für maximale Duration an, falls er nicht existiert
  //sonst werden Standardwerte hinzugefügt
  await createStateAsync(settingsDirectory + '.Duration.duration_max', 0, true, {
    name: 'max duration',
    read: true,
    write: true,
    type: 'number'
  }); console.log("Der Datenpunkt für die maximale Dauer des Farbwechsels wurde angelegt.");

  //legt Datenpunkt für minimale Brightness an, falls er nicht existiert
  //sonst werden Standardwerte hinzugefügt
  await createStateAsync(settingsDirectory + '.Brightness.brightness_min', 0, true, {
      name: 'min brightness',
      role: 'state',
      read: true,
      write: true,
      type: 'number'
    }); console.log("Der Datenpunkt für die minimale Helligkeit der Lampengruppe wurde angelegt.");

  //legt Datenpunkt für maximale Brightness an, falls er nicht existiert
  //sonst werden Standardwerte hinzugefügt
  await createStateAsync(settingsDirectory + '.Brightness.brightness_max', 0, true, {
      name: 'max brightness',
      role: 'state',
      read: true,
      write: true,
      type: 'number'
    }); console.log("Der Datenpunkt für die maximale Helligkeit der Lampengruppe wurde angelegt.");

  //löscht, falls vorhanden, Backupordner
  //bereinigt damit nicht mehr vorhandene Geräte
  await deleteObjectAsync(settingsDirectory + '.Backup', {recursive:true});
  console.log("Der Backupordner wurde erfolgreich gelöscht.");

  //löscht, falls vorhanden, Changeordner
  //bereinigt damit nicht mehr vorhandene Geräte
  await deleteObjectAsync(settingsDirectory + '.Change', {recursive:true});
  console.log("Der Changeordner wurde erfolgreich gelöscht.");

  //löscht, falls vorhanden, Commandsordner
  //bereinigt damit nicht mehr vorhandene Geräte
  await deleteObjectAsync(settingsDirectory + '.Commands', {recursive:true});
  console.log("Der Commandsordner wurde erfolgreich gelöscht.");

  //erstellen Backup-, Change- & Commanddatenpunkt
  //für jedes Device aus der Gruppe
  var device_list2 = Array.prototype.slice.apply($(selectorDirectory));
  for (var device_index2 in device_list2) {
      device = device_list2[device_index2];
      deviceName = device.split('.').slice(-2)[0];

      //erstellt einen Backupdatenpunkt für jede Lampe der Gruppe
      await createStateAsync(settingsDirectory + '.Backup.backup_' + deviceName, '{}', true, {
          name: 'backup ' + deviceName,
          role: 'state',
          read: true,
          write: true,
          type: 'json'
      }); console.log("Der Backupdatenpunkt für die Lampe " + deviceName + " wurde angelegt.");

      //erstellt einen Changedatenpunkt für jede Lampe der Gruppe
      await createStateAsync(settingsDirectory + '.Change.change_' + deviceName, false, true, {
          name: 'change ' + deviceName,
          role: 'state',
          read: true,
          write: true,
          type: 'boolean'
      }); console.log("Der Changedatenpunkt für die Lampe " + deviceName + " wurde angelegt.");

      //erstellt einen Commanddatenpunkt für jede Lampe der Gruppe
      await createStateAsync(settingsDirectory + '.Commands.command_' + deviceName, '{}', true, {
          name: 'command ' + deviceName,
          role: 'state',
          read: true,
          write: true,
          type: 'json'
      }); console.log("Der Commanddatenpunkt für die Lampe " + deviceName + " wurde angelegt.");
  }

  if (download_scenes) {
    //lädt das JSON File mit den Einstellungen der verschiedenen Szenen von GitHub heruntergeladen
    //kopiert es in die Zwischenablage
    //löscht das erstellte File vom Dateisystem
    exec('wget ' + weblinkJsonFile + ' ; cat sceneSettings.json ; rm sceneSettings.json', async function (error, result, stderr) {
      //erstellt Datenpunkt mit dein Einstellungen der Szenen aus der Zwischenablage
      await createStateAsync(settingsDirectory + '.scene settings', result, true, {
          name: 'scene settings',
          role: 'state',
          read: true,
          write: true,
          type: 'json'
        }); console.log("Das JSON File mit dein Einstellungen der Szenen wurde erfolgreich angelegt.");

      //löscht, falls vorhanden, Szenenordner der Gruppe
      //bereinigt damit nicht mehr vorhandene Szenen
      await deleteObjectAsync(groupDirectory, {recursive:true});
      console.log("Der Szenenordner der Gruppe " + Group_ID + " wurde erfolgreich gelöscht.");

      //erzeugt für jede Szene aus der dem JSON File eine Datenpunkt zum Starten der Szene
      var scene;
      var sceneName_list = (function () { try {return JSON.parse(result);} catch(e) {return {};}})();
      for (var sceneName_index in sceneName_list) {
        sceneName = sceneName_list[sceneName_index];
        scene = getAttr(sceneName, 'name');

        //Datenpunkt für jeweilige Szene anlegen
        await createStateAsync(groupDirectory + '.' + scene, false, true, {
            name: scene,
            role: 'state',
            read: true,
            write: true,
            type: 'boolean'
          }); console.log("Die Szene " + scene + " wurde erfolgreich angelegt.");
      }
      console.log("Fertig!");
      console.log("IDs vom Selektor: state[id=" + groupDirectory + "]");
    });
  } else {
    console.log("Fertig!");
    console.log("IDs vom Selektor: state[id=" + groupDirectory + "]");
  }
} catch (error) {
  console.log("Unerwarteter Fehler: " + error);
}
