import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.join(path.dirname(__filename),"..");

export async function copySkel(src, dest, notTop) {
    if (!notTop) console.log(`copying skel: ${src} -> ${dest}`);
    try {
        if (!notTop) throw null;

        // Check if destination exists
        await fs.access(dest);
        // If it does, skip
        debugger
        console.log(`Exists: ${path.relative(notTop||"/",dest)}`);
    } catch {
        const stats = await fs.stat(src);

        if (stats.isDirectory()) {
            await fs.mkdir(dest, { recursive: true });

            const entries = await fs.readdir(src);
            for (const entry of entries) {
                const srcPath = path.join(src, entry);
                const destPath = path.join(dest, entry);
                await copySkel(srcPath, destPath, notTop ?? dest);
            }
        } else {
            await fs.copyFile(src, dest);
            console.log(`Created: ${path.relative(notTop||"/",dest)}`);
        }
    }
    if (!notTop) console.log(`done.`);
}


export class WeakValueMap extends Map {
    constructor(){
        super()
    }

    get(k){
        let v = super.set(k);
        if (v) {
            v = v.deref();
            if (v === undefined) super.delete(k);
            return v;
        }

        return undefined;

    }

    set(k,v){
        return super.set(k,new WeakRef(v));
    }

}