import { getLogger, i18nCoreCLILanguageDetector, LocalAppDataStorage, LogLevels } from "@aidc-toolkit/core";
import {
    GCPLength,
    GCPLengthCache,
    type GCPLengthData,
    type GCPLengthSourceJSON,
    i18nGS1Init,
    isGCPLengthSourceJSON
} from "@aidc-toolkit/gs1";
import i18next from "i18next";

const DATA_DIRECTORY = "docs";

const JSON_DATA_KEY = "gcp-length";

const gcpLengthCache = new class extends GCPLengthCache {
    #gcpLengthSourceJSON!: GCPLengthSourceJSON;

    /**
     * Log the date/time of the cache or source.
     *
     * @param type
     * Type (cache or source).
     *
     * @param dateTime
     * Date/time.
     */
    #logDateTime(type: string, dateTime: Date | undefined): void {
        console.log(`${type} date/time is ${dateTime?.toISOString()}.`);
    }

    /**
     * @inheritDoc
     */
    override get cacheDateTime(): Promise<Date | undefined> {
        return super.cacheDateTime.then((cacheDateTime) => {
            this.#logDateTime("Cache", cacheDateTime);

            return cacheDateTime;
        });
    }

    /**
     * @inheritDoc
     */
    override get sourceDateTime(): Promise<Date> {
        return this.appDataStorage.read(JSON_DATA_KEY).then((appData) => {
            if (!isGCPLengthSourceJSON(appData)) {
                throw new Error("Invalid GCP length source JSON");
            }

            return appData;
        }).then((gcpLengthSourceJSON) => {
            this.#gcpLengthSourceJSON = gcpLengthSourceJSON;

            const dateTime = new Date(gcpLengthSourceJSON.GCPPrefixFormatList.date);

            this.#logDateTime("Source", dateTime);

            return dateTime;
        });
    }

    /**
     * @inheritDoc
     */
    override get sourceData(): GCPLengthSourceJSON {
        return this.#gcpLengthSourceJSON;
    }

    /**
     * @inheritDoc
     */
    override async update(nextCheckDateTime: Date, cacheDateTime?: Date, cacheData?: GCPLengthData): Promise<void> {
        console.log(cacheData !== undefined ? "Cache updated." : "Cache unchanged.");

        return super.update(nextCheckDateTime, cacheDateTime, cacheData).then(async () =>
            this.appDataStorage.delete(GCPLengthCache.NEXT_CHECK_DATE_TIME_STORAGE_KEY)
        );
    }
}(new (await LocalAppDataStorage)(DATA_DIRECTORY));

const gcpLength = new GCPLength(gcpLengthCache);

i18nGS1Init(i18next.use(i18nCoreCLILanguageDetector)).then(async () =>
    LocalAppDataStorage.get(DATA_DIRECTORY)
).then(async localAppDataStorage =>
    new GCPLength(new UpdateGCPLengthCache(localAppDataStorage)).load()
).catch((e: unknown) => {
    console.error(e);
    process.exit(1);
});
