import { I18nEnvironments } from "@aidc-toolkit/core";
import { type GCPLengthCache, i18nGS1Init, PrefixManager } from "@aidc-toolkit/gs1";
import * as fs from "node:fs";
import * as path from "node:path";

const DATA_DIRECTORY = "docs";

const BINARY_DATE_TIME_PATH = path.resolve(DATA_DIRECTORY, "gcp-length-date-time.txt");

const BINARY_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.bin");

const JSON_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.json");

const gcpLengthCache: GCPLengthCache = {
    getNextCheckDateTime(): undefined {
        return undefined;
    },
    
    setNextCheckDateTime(): void {
    },
    
    getCacheDateTime(): Date | undefined {
        let dateTime: Date | undefined;

        try {
            dateTime = new Date(fs.readFileSync(BINARY_DATE_TIME_PATH).toString());
        } catch {
            dateTime = undefined;
        }

        return dateTime;
    },
    
    setCacheDateTime(cacheDateTime: Date): void {
        fs.writeFileSync(BINARY_DATE_TIME_PATH, cacheDateTime.toISOString());
    },
    
    getCacheData(): Uint8Array | undefined {
        let data: Uint8Array | undefined;

        try {
            data = fs.readFileSync(BINARY_DATA_PATH);
        } catch {
            data = undefined;
        }

        return data;
    },

    setCacheData(cacheData: Uint8Array): void {
        fs.writeFileSync(BINARY_DATA_PATH, cacheData);
    },

    getSourceDateTime(): Date {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- File format is known.
        return new Date((JSON.parse(fs.readFileSync(JSON_DATA_PATH).toString()) as {
            GCPPrefixFormatList: {
                date: string;
            };
        }).GCPPrefixFormatList.date);
    },

    getSourceData(): string | Uint8Array {
        return fs.readFileSync(JSON_DATA_PATH).toString();
    }
};

i18nGS1Init(I18nEnvironments.CLI).then(async () => {
    await PrefixManager.loadGCPLengthData(gcpLengthCache);
}).catch((e: unknown) => {
    // eslint-disable-next-line no-console -- Console application.
    console.error(e);
});
