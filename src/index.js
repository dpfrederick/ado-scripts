const fs = require('fs');
const { WebApi, getPersonalAccessTokenHandler } = require("azure-devops-node-api");

const settings = JSON.parse(fs.readFileSync('src/settings.json', 'utf8'));

class ReleaseProvider {
  constructor(releaseApi, logger) {
    this.releaseApi = releaseApi;
    this.logger = logger;
  }

  async listDeployments(projectId, definitionId) {
    return this.fetchDeployments(projectId, definitionId);
  }

  async fetchDeployments(projectId, definitionId, continuationToken = 0, deployments = []) {
    const response = await this.releaseApi.getDeployments(projectId, definitionId, continuationToken);

    if (response) {
      const mappedDeployments = response.map(deploymentData => ({
        id: deploymentData.id,
        completedOn: deploymentData.completedOn,
        stageDisplayName: deploymentData.releaseEnvironment,
        status: deploymentData.operationStatus,
      }));

      deployments.push(...mappedDeployments);

      if (response.length === 100) {
        return this.fetchDeployments(projectId, definitionId, continuationToken + 100, deployments);
      }
    }

    return deployments;
  }
}

class AzureDevOpsApiFactory {
  constructor(logger) {
    this.logger = logger;
  }

  async getApi(collectionUrl, accessToken) {
    return new WebApi(collectionUrl, getPersonalAccessTokenHandler(accessToken));
  }

  async getReleaseManager(collectionUrl, accessToken) {
    // const releaseApi = await this.getApi(collectionUrl, accessToken).getReleaseApi();
    const webApi = await this.getApi(collectionUrl, accessToken);
    const releaseApi = await webApi.getReleaseApi();
    return new ReleaseProvider(releaseApi, this.logger);
  }
}

(async () => {
  const logger = {};
  const factory = new AzureDevOpsApiFactory(logger);
  const releaseManager = await factory.getReleaseManager(settings.collectionUrl, settings.accessToken);

  const projectId = 'Webstaurantstore.com';
  const definitionId = 11;

  const deployments = await releaseManager.listDeployments(projectId, definitionId);
  console.log(deployments);
})();

