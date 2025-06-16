import { upgrade as upgradeDatabase } from './database_upgrade.mjs';
import Path from 'node:path';
import sqlite3 from 'sqlite3';
import { } from './utils.mjs';
const { Database } = sqlite3;

/// NOTE: this class returns a promise!
/// NOTE: even tho the database is sync, async hooks are required
export class AppDatabase {
    constructor(path){

        return (async ()=>{
            this.db = new Database(path);

            await this.exec(`
            CREATE TABLE IF NOT EXISTS "database_features" (
                "name"	TEXT NOT NULL UNIQUE,
                "version"	INTEGER NOT NULL,
                PRIMARY KEY("name")
            );`);

            await upgradeDatabase(this);

            const autocreator = Config.users.auto_create;
            for (const handle in autocreator){
                let loginData = await this.getSingle('SELECT id from Users where handle = ? limit 1',handle);
                if (loginData){
                    console.log(`user.auto_create: exists: (${loginData.id}) ${handle}`);
                } else {
                    console.log(`user.auto_create: creating: ${handle}`);
                    let {bio,displayName} = autocreator[handle];
                    bio = bio || "";
                    displayName = displayName || handle;
                    await this.getSingle('insert into users(handle,bio,displayName) values(?,?,?)',handle,bio,displayName);
                }
            }

            let loginData = await this.getSingle('SELECT id,displayName,handle,bio from Users where handle = ? limit 1',Config.users.default_user);
            if (loginData){
                console.log(`the deafult user is: (${loginData.id}) ${loginData.handle}, ${loginData.displayName}`);
                Config.users.default_user_id = loginData.id;
            } else {
                console.error(`the deafult user does not exist\ncannot start server!`);
                process.exit(1);
            }

            return this;
        })();
    }

    async getSingle(querry,...args){
        const {promise,resolve,reject} = Promise.withResolvers();
        this.db.get(querry, args, (err,col)=>{
            if(err) return reject(err);
            resolve(col);
        });
        return promise;
    }

    /// in case we move database langs, this will catch us a lot of headaches.
    /// it's just a simple "run this and wait, no output" function
    async exec(querry,...args){
        const {promise,resolve,reject} = Promise.withResolvers();
        this.db.run(querry, args, (err)=> err ? reject(err) : resolve() );
        return promise;
    }

    async getFeature(name){
        let version = await this.getSingle(`
        SELECT version from database_features where name = ?;
        `,name);
        if(version) version = version.version || version;
        return version || 0;
    }

    /*async*/ setFeature(name,version){
        version = parseInt(version);
        if (isNaN(version)) throw new Error("setFeature: invalid version");

        return /*await*/ this.exec(`
        INSERT OR REPLACE INTO database_features (version,name) VALUES (?,?);
        `,version,name);
    }

    /*async*/ cookieToUID(cookieStr) {
        return /*await*/ this.getSingle(`SELECT userid from cookies where cookie = ?`,cookieStr);
    }

    /*async*/ handleToUID(name) {
        return /*await*/ this.getSingle(`SELECT id from users where name = ?`,name)
    }

    /*async*/ UIDToHandle(name) {
        return /*await*/ this.getSingle(`SELECT id from users where name = ?`,name);
    }
}
