

export async function upgrade(database){
    if(database.getFeature("users") < 1){
        await database.oneshotExec(`CREATE TABLE "users" (
            "id"	INTEGER NOT NULL,
            "desplayName"	TEXT NOT NULL,
            PRIMARY KEY("id" AUTOINCREMENT)
        )`);
        database.setFeature("users",1)
    }
}