

export async function upgrade(database){
    console.log("userfeature",await database.getFeature("users"));
    if(await database.getFeature("users") < 1){
        console.warn("DATABASE UPGRADE: table users");
        await database.exec(`CREATE TABLE "users" (
            "id"	INTEGER NOT NULL,
            "displayName"	TEXT NOT NULL DEFAULT 'New User',
            "handle"	TEXT NOT NULL,
            "bio"	TEXT NOT NULL DEFAULT '',
            PRIMARY KEY("id" AUTOINCREMENT)
        );`);
        database.setFeature("users",1)
    }

    if(await database.getFeature("cookies") < 1){
        console.warn("DATABASE UPGRADE: table cookies");
        await database.exec(`
        CREATE TABLE "Cookies" (
            "cookie"	TEXT NOT NULL,
            "userid"	INTEGER,
            PRIMARY KEY("cookie"),
            FOREIGN KEY("userid") REFERENCES "users"("id")
        )
        `);
        database.setFeature("cookies",1)
    }
}