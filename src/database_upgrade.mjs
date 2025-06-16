

export async function upgrade(database){
    console.log("userfeature",await database.getFeature("users"));
    if(await database.getFeature("users") < 1){
        console.warn("DATABASE UPGRADE: table users");
        await database.exec(`CREATE TABLE "Users" (
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
    if(await database.getFeature("pages") < 1){
        console.warn("DATABASE UPGRADE: table pages");
        await database.exec(`
        CREATE TABLE "Pages" (
            "id"	INTEGER NOT NULL,
            "title"	TEXT NOT NULL DEFAULT 'Page',
            "document"	LONGTEXT,
            PRIMARY KEY("id" AUTOINCREMENT)
        );
        `);

        await database.exec(`
        CREATE TABLE "PageDeltas" (
            "pageid"	INTEGER NOT NULL,
            "index"	INTEGER NOT NULL,
            "contents"	TEXT NOT NULL,
            PRIMARY KEY("index" AUTOINCREMENT)
        );
        `);
        database.setFeature("pages",1)
    }
}