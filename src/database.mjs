import { upgrade as upgradeDatabase } from './database_upgrade.mjs';
import Path from 'node:path';
import sqlite3 from 'sqlite3';
const { Database } = sqlite3;

// NOTE: this class returns a promise!
// NOTE: even tho the database is sync, async hooks are required
export class AppDatabase {
    constructor(path){
        return (async ()=>{
            this.db = new Database(path);

            await this.oneshotExec(`
            CREATE TABLE IF NOT EXISTS "database_features" (
                "name"	TEXT NOT NULL UNIQUE,
                "version"	INTEGER NOT NULL,
                PRIMARY KEY("name")
            );`);

            await upgradeDatabase(this);
            return this;
        })();
    }

    async get1value(querry,...args){
        const {promise,resolve,reject} = Promise.withResolvers();
        this.db.get(querry, args, (err,col)=>{
            if(err) return reject(err);
            resolve(col);
        });
        return promise;
    }

    /// in case we move database langs, this will catch us a lot of headaches.
    /// it's just a simple "run this and wait, no output" function
    async oneshotExec(querry,...args){
        const {promise,resolve,reject} = Promise.withResolvers();
        this.db.run(querry, args, (err)=> err ? reject(err) : resolve() );
        return promise;
    }

    /*async*/ getFeature(name){
        return /*await*/ this.get1value(`
        SELECT version from database_features where name = ?;
        `,name);
    }

    /*async*/ setFeature(name,version){
        version = parseInt(version);
        if (isNaN(version)) throw new Error("setFeature: invalid version");

        return /*await*/ this.oneshotExec(`
        UPDATE OR REPLACE database_features SET version = ? WHERE name = ?;
        `,version,name);
    }
}
