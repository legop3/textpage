import { __dirname,copySkel } from "./utils.mjs";
import { AppDatabase } from './database.mjs';
import Path from 'path';
import fs from 'fs';


async function initConfig(){
    if(global.Config) {
        console.warn("config inited twice");
        return global.Config;
    }

    const config_path = Path.join(__dirname,"data/config.json");
    console.debug("config path: ",config_path);
    let Config = JSON.parse( fs.readFileSync( config_path ) );

    if(Config.use_skel_config) {
        console.warn("YOUR 'config.json' FILE IS BEING IGNORED! ENABLE IT BY CHANGING 'use_skel_config' TO false");
        Config = JSON.parse( fs.readFileSync( Path.join(__dirname,"data_skel/config.json") ) );
    };
    global.Config = Config;
    console.debug("got config!")
    return Config;
}

export async function start(){

    const SKEL_PATH = Path.join(__dirname,"data_skel");
    const DATA_PATH = Path.join(__dirname,"data");

    await copySkel(SKEL_PATH,DATA_PATH);

    const Config = await initConfig();
    const Database = await new AppDatabase(Path.join(__dirname,Config.filepaths.database || "/data/database.db"));



}