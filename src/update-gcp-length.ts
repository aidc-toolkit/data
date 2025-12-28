import { I18nEnvironments } from "@aidc-toolkit/core";
import { GCPLengthCache, i18nGS1Init, PrefixManager } from "@aidc-toolkit/gs1";
import * as fs from "node:fs";
import * as path from "node:path";

const DATA_DIRECTORY = "docs";

const BINARY_DATE_TIME_PATH = path.resolve(DATA_DIRECTORY, "gcp-length-date-time.txt");

const BINARY_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.bin");

const JSON_DATA_PATH = path.resolve(DATA_DIRECTORY, "gcp-length.json");

const gcpLengthCache = new class extends GCPLengthCache {
    /**
     * @inheritDoc
     */
    get nextCheckDateTime(): undefined {
        return undefined;
    }

    /**
     * @inheritDoc
     */
    get cacheDateTime(): Date | undefined {
        let dateTime: Date | undefined;

        try {
            dateTime = new Date(fs.readFileSync(BINARY_DATE_TIME_PATH).toString());
        } catch {
            dateTime = undefined;
        }

        return dateTime;
    }

    /**
     * @inheritDoc
     */
    get cacheData(): Uint8Array {
        return fs.readFileSync(BINARY_DATA_PATH);
    }

    /**
     * @inheritDoc
     */
    get sourceDateTime(): Date {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- File format is known.
        return new Date((JSON.parse(fs.readFileSync(JSON_DATA_PATH).toString()) as {
            GCPPrefixFormatList: {
                date: string;
            };
        }).GCPPrefixFormatList.date);
    }

    /**
     * @inheritDoc
     */
    get sourceData(): string {
        return fs.readFileSync(JSON_DATA_PATH).toString();
    }

    /**
     * @inheritDoc
     */
    update(_nextCheckDateTime: Date, cacheDateTime?: Date, cacheData?: Uint8Array): void {
        if (cacheDateTime !== undefined) {
            fs.writeFileSync(BINARY_DATE_TIME_PATH, cacheDateTime.toISOString());
        }

        if (cacheData !== undefined) {
            fs.writeFileSync(BINARY_DATA_PATH, cacheData);
        }
    }
}();

i18nGS1Init(I18nEnvironments.CLI).then(async () => {
    await PrefixManager.loadGCPLengthData(gcpLengthCache);
}).catch((e: unknown) => {
    // eslint-disable-next-line no-console -- Console application.
    console.error(e);
});
