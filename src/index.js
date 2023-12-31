"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const azure_devops_node_api_1 = require("azure-devops-node-api");
const settings = JSON.parse(fs_1.default.readFileSync('src/settings.json', 'utf8'));
class ReleaseProvider {
    constructor(releaseApi) {
        this.releaseApi = releaseApi;
    }
    listDeployments(project, definitionId) {
        return __awaiter(this, void 0, void 0, function* () {
            let continuationToken;
            const top = 5;
            let deployments = [];
            let hasMore = true;
            let requestCount = 0;
            while (hasMore) {
                const response = yield this.releaseApi.getDeployments(project, // project
                definitionId, // definitionId
                undefined, // definitionEnvironmentId
                undefined, // createdBy
                undefined, // minModifiedTime
                undefined, // maxModifiedTime
                undefined, // deploymentStatus
                undefined, // operationStatus
                undefined, // latestAttemptsOnly
                undefined, // queryOrder
                top, // top
                continuationToken, // continuationToken
                undefined, // createdFor
                undefined, // minStartedTime
                undefined, // maxStartedTime
                undefined // sourceBranch
                );
                requestCount++;
                if (response && response.length > 0) {
                    if (requestCount > 1) {
                        response.shift();
                    }
                    const mappedDeployments = response.map(deploymentData => {
                        var _a;
                        return ({
                            id: deploymentData.id,
                            completedOn: deploymentData.completedOn,
                            stageDisplayName: (_a = deploymentData.releaseEnvironment) === null || _a === void 0 ? void 0 : _a.name,
                            status: deploymentData.operationStatus,
                        });
                    });
                    deployments.push(...mappedDeployments);
                    if (response.length === top) {
                        const lastItem = response[response.length - 1];
                        continuationToken = lastItem.id;
                    }
                    else {
                        hasMore = false;
                    }
                }
                else {
                    hasMore = false;
                }
            }
            console.log(`requestCount: ${requestCount}`);
            return deployments;
        });
    }
}
class AzureDevOpsApiFactory {
    getApi(collectionUrl, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            return new azure_devops_node_api_1.WebApi(collectionUrl, (0, azure_devops_node_api_1.getPersonalAccessTokenHandler)(accessToken));
        });
    }
    getReleaseManager(collectionUrl, accessToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const webApi = yield this.getApi(collectionUrl, accessToken);
            const releaseApi = yield webApi.getReleaseApi();
            return new ReleaseProvider(releaseApi);
        });
    }
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    const factory = new AzureDevOpsApiFactory();
    const releaseManager = yield factory.getReleaseManager(settings.collectionUrl, settings.accessToken);
    const projectId = 'Webstaurantstore.com';
    const definitionId = 11;
    const deployments = yield releaseManager.listDeployments(projectId, definitionId);
    console.log(JSON.stringify(deployments, null, 2));
}))();
